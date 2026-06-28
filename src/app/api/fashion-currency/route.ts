import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

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

    const prompt = `You are a fashion editor. Today is ${today}. Rate the 2026 fashion currency of each wardrobe piece — be honest but constructive.

Wardrobe:
${itemListText}

For every item, respond with ONLY valid JSON, no markdown:
{"fashionCurrency":[{"itemId":"exact id","era":"decade this peaked e.g. '2010s'","status":"timeless|current|dated|coming-back","how2026":"max 15 words on how to style it for 2026, or null if timeless/current"}]}

Be concise. Every item needs one entry.`;

    const raw = await callClaude({ prompt, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { fashionCurrency?: unknown[] };
    return NextResponse.json({ fashionCurrency: parsed.fashionCurrency ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fashion currency analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
