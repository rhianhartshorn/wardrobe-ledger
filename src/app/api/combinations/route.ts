import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, STYLIST_REJECTION_CRITERIA, FASHION_EDITOR_VOICE, FIT_SPECIALIST_VOICE, COLOUR_ANALYST_VOICE, ACCESSORIES_DIRECTOR_VOICE, getStyleBriefContext, getBrandVoiceContext } from '@/lib/stylist';
import { auditInBackground } from '@/lib/editorial';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
  material?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, topWorn, savedLookTitles } = await req.json() as { items: WardrobeItem[]; bodyProfile?: BodyProfile; topWorn?: string[]; savedLookTitles?: string[] };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to see outfit combinations.' }, { status: 400 });
    }

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice] = await Promise.all([getStyleBriefContext(), getPersonaContext(), getStyleDirectives(), getBrandVoiceContext()]);
    const tasteSignals = [
      ...(topWorn?.length ? [`Items this client reaches for most: ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Looks they've saved: ${savedLookTitles.join('; ')}`] : []),
    ].join('\n');

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}, ${it.formality}, ${it.season}`)
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx ? `\nCLIENT PROFILE: ${profileCtx}\nEvery combination must be assessed against this profile — think in terms of silhouette proportion, what elongates or balances this specific body shape, and which colours work with this undertone and hair tone. A combination that doesn't genuinely flatter this person does not make the list.\n` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const maxCombos = 10;

    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${FIT_SPECIALIST_VOICE} ${COLOUR_ANALYST_VOICE} ${ACCESSORIES_DIRECTOR_VOICE} ${brandVoice} Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${tasteSignals ? 'CLIENT TASTE SIGNALS:\n' + tasteSignals + '\n' : ''}
${profileBlock}
${STYLIST_2026_LENS}

Your client has shared their wardrobe. Every combination must pass review by the full styling team before it can be recommended. A combination only makes the list if ALL four experts approve it:

— Fashion Editor: is this genuinely editorial? Does the colour story and aesthetic hold up?
— Fit Specialist: does the silhouette work? Are the proportions right for this body shape? Is there a hem, tuck, or volume issue that would undermine it?
— Colour Analyst: do these colours work together and with the client's colouring? Is there a clash, a value conflict, or an undertone mismatch that kills the look?
— Accessories Director: can this combination be finished properly, or does it have an accessorising problem that can't be solved?

If any expert would reject it, it does not appear. Edit ruthlessly.

${STYLIST_REJECTION_CRITERIA}

ONLY include combinations where you can point to something specific: a proportion that works, a texture contrast that elevates, a colour story that feels current, a silhouette that flatters this person.

Wardrobe (id :: details):
${itemListText}

Select up to ${maxCombos} combinations, ranked from the single best outfit this wardrobe can produce down to still-excellent. Use ONLY the exact ids above.

CRITICAL — every combination must be PHYSICALLY WEARABLE and COMPLETE. These are hard rules, not style preferences:

PHYSICAL WEARABILITY — these combinations are impossible and must never appear:
- A dress or jumpsuit (Dress/One-piece) paired with a Top — a dress already covers the top half; you cannot also wear a separate top as if it replaces the dress's bodice
- A dress or jumpsuit paired with a Bottom (trousers, skirt, shorts) — a dress already covers the bottom half; it cannot be worn simultaneously with a separate bottom
- Exception: Outerwear (jackets, coats, blazers) CAN be layered over a dress — that is physically possible and often styled intentionally
- Two bottoms together (e.g., skirt + trousers) is not wearable — never combine two Bottom items
- Two tops of the same type are only valid if one is clearly outerwear layered over the other

COMPLETENESS — the outfit must cover the body top to bottom:
- Minimum: a Top AND a Bottom, OR a Dress/One-piece alone
- A top + cardigan with no bottom is not complete
- Footwear and accessories are optional additions, not substitutes for a top or bottom
- If the wardrobe cannot form any complete, physically wearable outfit, return an empty combinations array

A shorter list of genuinely complete, great outfits is far better than padding with partial looks.

Respond with ONLY valid JSON, no markdown, no trailing commas:
{"combinations":[{"itemIds":["id1","id2"],"title":"max 5 words","category":"max 3 words","rationale":"one sharp sentence — name the specific reason this works: a proportion, a contrast, a colour story","formality":"Casual|Smart Casual|Business|Formal|Athletic","season":"All-season|Summer|Winter|Spring/Fall","accessorizing":"specific accessory direction max 10 words — name the type, finish, and why"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 2000, model: 'claude-haiku-4-5-20251001' });
    const parsed = parseJSON(raw) as { combinations?: Array<{ rationale?: string }> };
    const combinations = parsed.combinations ?? [];

    const rationaleText = combinations.map((c) => c.rationale).filter(Boolean).join('\n');
    if (rationaleText) auditInBackground('combinations', 'combination rationale', rationaleText);

    return NextResponse.json({ combinations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not curate combinations right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
