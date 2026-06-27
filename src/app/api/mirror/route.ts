import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

type WardrobeItem = {
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
    const { items } = await req.json() as { items: WardrobeItem[] };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Need at least 3 items for a meaningful analysis' }, { status: 400 });
    }

    // Items are referenced by 1-based position number — far cheaper token-wise
    // than sending full UUIDs, and we map back on the client.
    const itemListText = items
      .map(
        (it, idx) =>
          `${idx + 1} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`
      )
      .join('\n');

    const prompt = `You are assessing a real wardrobe's overall versatility — not for one occasion, but across casual, business, and going-out contexts in general. For each item, judge roughly how many genuinely tasteful outfit combinations it could form within this same wardrobe, weighing color/pattern compatibility, formality matching, and how reusable a piece like this tends to be across different looks. Score every single item from 0 (clashes with nearly everything here, or wrong formality for the rest) to 10 (pairs with almost anything here).

Wardrobe, numbered (number :: details):
${itemListText}

Respond with ONLY valid JSON, no markdown fences, no other text, in exactly this shape, using the item numbers above (not names):
{"rankings":[{"i":1,"score":7}],"mostVersatile":[{"i":1,"reason":"max 10 words"}],"leastVersatile":[{"i":1,"reason":"max 10 words"}]}
Include exactly one ranking entry per item number. mostVersatile and leastVersatile should each list the 3 most extreme items.`;

    const raw = await callClaude({ prompt, maxTokens: 1000 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
