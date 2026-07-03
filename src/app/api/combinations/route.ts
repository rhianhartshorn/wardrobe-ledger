import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile } = await req.json() as { items: WardrobeItem[]; bodyProfile?: BodyProfile };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to see outfit combinations.' }, { status: 400 });
    }

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`)
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx ? `\nCLIENT PROFILE: ${profileCtx}\nEvery combination must be assessed against this profile — think in terms of silhouette proportion, what elongates or balances this specific body shape, and which colours work with this undertone and hair tone. A combination that doesn't genuinely flatter this person does not make the list.\n` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const maxCombos = 20;

    const prompt = `You are a senior fashion stylist with the editorial eye of someone who works across Vogue, The Row, and Net-a-Porter. You have dressed clients at the level of a Parisian personal shopper — your taste is precise, current, and uncompromising. Today is ${today}.
${profileBlock}
Your client has shared their wardrobe with you. You are not here to list compatible pairings — you are here to do what a great stylist does: edit ruthlessly, think in full outfits, and identify the combinations that would make someone look genuinely well-dressed in 2026.

REJECT any combination that:
- A department store mannequin would wear (safe, predictable, forgettable)
- Is only compatible but not interesting — colours don't clashing is not enough
- Doesn't feel intentional — every piece must earn its place
- Is timeless in a boring way — "classic" is not a justification

ONLY include combinations where you can point to something specific: a proportion that works, a texture contrast that elevates, a colour story that feels current, a silhouette choice that flatters.

Think in terms of 2026 sensibility: relaxed tailoring, tonal dressing, unexpected texture mixing, quiet confidence over logo or trend dressing. What would a well-dressed person in London, Paris, or Copenhagen actually wear?

Wardrobe (id :: details):
${itemListText}

Select up to ${maxCombos} combinations, ranked from the single best outfit this wardrobe can produce down to still-excellent. Use ONLY the exact ids above. Minimum 2 items per combination. A shorter list of genuinely great outfits is far better than padding it out.

Respond with ONLY valid JSON, no markdown, no trailing commas:
{"combinations":[{"itemIds":["id1","id2"],"title":"max 5 words","category":"max 3 words","rationale":"one sharp sentence — name the specific reason this works: a proportion, a contrast, a colour story","formality":"Casual|Smart Casual|Business|Formal|Athletic","season":"All-season|Summer|Winter|Spring/Fall"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 6000 });
    const parsed = parseJSON(raw) as { combinations?: unknown[] };
    return NextResponse.json({ combinations: parsed.combinations ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not curate combinations right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
