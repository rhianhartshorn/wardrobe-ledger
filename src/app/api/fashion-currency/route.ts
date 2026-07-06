import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, FASHION_EDITOR_VOICE } from '@/lib/stylist';

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: WardrobeItem[] };
    if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Process in batches of 15 to keep response size manageable
    const batch = items.slice(0, 30);
    const itemListText = batch
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}, ${i.formality}`)
      .join('\n');

    const [personaCtx, styleDirectives] = await Promise.all([getPersonaContext(), getStyleDirectives()]);
    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} Today is ${today}. ${STYLIST_2026_LENS}${styleDirectives} Rate the 2026 fashion currency of each wardrobe piece with the honesty of an editor who calls things as they are.

Wardrobe:
${itemListText}

For every item, respond with ONLY valid JSON, no markdown:
{"fashionCurrency":[{"itemId":"exact id","era":"decade this peaked e.g. '2010s', or 'timeless'","status":"timeless|current|dated|coming-back","how2026":"REQUIRED — max 12 words, always provide a specific styling tip for 2026 regardless of status. For timeless/current pieces: how to style them in the current moment. For dated: how to rescue or rework them. For coming-back: exactly how to wear them now without looking costume."}]}

Be ruthlessly specific. Every item needs one entry with a concrete how2026 tip — never leave it blank.`;

    const raw = await callClaude({ prompt, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { fashionCurrency?: unknown[] };
    return NextResponse.json({ fashionCurrency: parsed.fashionCurrency ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fashion currency analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
