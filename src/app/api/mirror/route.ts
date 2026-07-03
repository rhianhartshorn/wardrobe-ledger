import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { STYLIST_PERSONA, STYLIST_2026_LENS } from '@/lib/stylist';

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
      return NextResponse.json({ error: 'Need at least 3 items for a meaningful analysis' }, { status: 400 });
    }

    const itemListText = items
      .map(
        (it, idx) =>
          `${idx + 1} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`
      )
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileLine = profileCtx ? `\nClient profile: ${profileCtx}\nFactor this into purchase recommendations — suggest pieces that work for their body shape and colouring, not generic filler pieces.\n` : '';

    const prompt = `${STYLIST_PERSONA} ${STYLIST_2026_LENS} Score each item's VALUE to this wardrobe using a nuanced rubric — NOT just frequency of wear. Be honest: a great stylist tells the truth about what is and isn't working.
${profileLine}
SCORING RUBRIC (0–10):
- Versatility within THIS wardrobe: how many outfits it unlocks with other items here (0–4 pts)
- Occasion necessity: even rarely-worn items score high if they fill an irreplaceable role (e.g. a wedding guest dress, a black-tie blazer, a smart interview suit = high necessity). Don't penalise occasion-specific pieces for being specialised. (0–3 pts)
- Wardrobe gaps filled: does this item cover a season, formality level, or color that would otherwise be missing? (0–2 pts)
- Condition/trend relevance: is this a timeless piece or something that dates quickly? (0–1 pt)

Wardrobe (number :: details):
${itemListText}

Also recommend exactly 3 items to purchase that would make this wardrobe work significantly harder — focusing on unlocking combinations that aren't currently possible, filling formality or season gaps, or acting as a versatile "bridge" piece.${profileCtx ? ' Each recommendation must specifically suit the client\'s body shape and colouring described above.' : ''}

Respond with ONLY valid JSON, no markdown fences, no other text:
{"rankings":[{"i":1,"score":7,"verdict":"one sentence, max 12 words, on why it earned this score"}],"mostValuable":[{"i":1,"reason":"max 12 words"}],"worthReconsidering":[{"i":1,"reason":"max 12 words"}],"purchases":[{"item":"specific item name e.g. Ivory silk slip dress","why":"max 15 words on what combinations it unlocks","pairsWith":[1,3]}]}

Include exactly one ranking entry per item. mostValuable and worthReconsidering: 3 items each. purchases: exactly 3.`;

    const raw = await callClaude({ prompt, maxTokens: 1500 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
