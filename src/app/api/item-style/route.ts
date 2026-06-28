import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { item, wardrobe } = await req.json() as { item: WardrobeItem; wardrobe: WardrobeItem[] };
    if (!item) return NextResponse.json({ error: 'No item provided' }, { status: 400 });

    const others = wardrobe.filter((i) => i.id !== item.id);
    const wardrobeText = others
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.formality}`)
      .join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `You are a current, tasteful personal stylist. Today is ${today}.

The hero piece is: ${item.category}, "${item.name}", color ${item.primaryColor}${item.secondaryColor ? '/' + item.secondaryColor : ''}, ${item.pattern || 'solid'}, ${item.formality}, ${item.season}.

Other items in their wardrobe:
${wardrobeText || '(none yet)'}

Create 4 ways to style the hero piece:
- 3 looks using ONLY items from the wardrobe list above (reference by exact id). For each, provide 1 real inspiration link from a well-known fashion source you know (Vogue, Net-a-Porter, Who What Wear, SSENSE, Matches, MR PORTER etc.).
- 1 look that suggests 1–2 items NOT in the wardrobe to elevate the hero piece further. For this look, set wardrobeItemIds to [] and describe the suggested new pieces in suggestedPurchases.

For every look, give a specific 2026-relevant aesthetic name and a real inspiration link.

Respond ONLY with valid JSON, no markdown:
{"looks":[{"title":"max 5 words","aesthetic":"specific current 2026 aesthetic","wardrobeItemIds":["id1","id2"],"suggestedPurchases":["item description max 10 words"],"howToWear":"max 25 words styling direction","inspirationImageUrl":"direct image URL of person in similar look","inspirationLink":{"label":"source + what it shows max 8 words","url":"real URL"}}]}`;

    const raw = await callClaude({ prompt, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { looks?: unknown[] };
    return NextResponse.json({ looks: parsed.looks ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
