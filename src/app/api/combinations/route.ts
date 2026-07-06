import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, STYLIST_REJECTION_CRITERIA, FASHION_EDITOR_VOICE, ACCESSORIES_DIRECTOR_VOICE, getStyleBriefContext } from '@/lib/stylist';

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

    const [styleBriefCtx, personaCtx, styleDirectives] = await Promise.all([getStyleBriefContext(), getPersonaContext(), getStyleDirectives()]);
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

    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${ACCESSORIES_DIRECTOR_VOICE} Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${tasteSignals ? 'CLIENT TASTE SIGNALS:\n' + tasteSignals + '\n' : ''}
${profileBlock}
${STYLIST_2026_LENS}

Your client has shared their wardrobe. Edit ruthlessly — only identify combinations that would make someone look genuinely well-dressed.

${STYLIST_REJECTION_CRITERIA}

ONLY include combinations where you can point to something specific: a proportion that works, a texture contrast that elevates, a colour story that feels current, a silhouette that flatters this person.

Wardrobe (id :: details):
${itemListText}

Select up to ${maxCombos} combinations, ranked from the single best outfit this wardrobe can produce down to still-excellent. Use ONLY the exact ids above.

CRITICAL — every combination must be a COMPLETE, wearable outfit. That means it must cover the body from top to bottom:
- It must include at minimum a top (or dress/jumpsuit) AND a bottom (trousers, skirt, shorts, or a dress that covers both)
- A top + cardigan with no bottom is NOT a complete outfit — do not include it
- Footwear and accessories are optional additions, not substitutes for a top or bottom
- A dress or jumpsuit alone counts as complete (it covers both)
- If the wardrobe does not have enough pieces to form a complete outfit, return an empty combinations array

A shorter list of genuinely complete, great outfits is far better than padding with partial looks.

Respond with ONLY valid JSON, no markdown, no trailing commas:
{"combinations":[{"itemIds":["id1","id2"],"title":"max 5 words","category":"max 3 words","rationale":"one sharp sentence — name the specific reason this works: a proportion, a contrast, a colour story","formality":"Casual|Smart Casual|Business|Formal|Athletic","season":"All-season|Summer|Winter|Spring/Fall","accessorizing":"specific accessory direction max 10 words — name the type, finish, and why"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 2000, model: 'claude-haiku-4-5-20251001' });
    const parsed = parseJSON(raw) as { combinations?: unknown[] };
    return NextResponse.json({ combinations: parsed.combinations ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not curate combinations right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
