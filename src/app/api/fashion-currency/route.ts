import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, FASHION_EDITOR_VOICE, getBrandVoiceContext } from '@/lib/stylist';
import { auditInBackground } from '@/lib/editorial';
import { getSetting, setSetting } from '@/lib/db';
import { getCurrentSeasonTag, type StoredFashionCurrency, type FashionCurrencyItem } from '@/lib/fashion-currency-types';

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
    const currentYear = new Date().getFullYear();

    // Process in batches of 15 to keep response size manageable
    const batch = items.slice(0, 30);
    const itemListText = batch
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}, ${i.formality}`)
      .join('\n');

    const [personaCtx, styleDirectives, brandVoice] = await Promise.all([getPersonaContext(), getStyleDirectives(), getBrandVoiceContext()]);
    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS}${styleDirectives} Rate the fashion currency of each wardrobe piece as of ${currentYear} with the honesty of an editor who calls things as they are.

Wardrobe:
${itemListText}

For every item, respond with ONLY valid JSON, no markdown:
{"fashionCurrency":[{"itemId":"exact id","era":"decade this peaked e.g. '2010s', or 'timeless'","status":"timeless|current|dated|coming-back","howNow":"REQUIRED — max 12 words, always provide a specific styling tip for right now regardless of status. For timeless/current pieces: how to style them in the current moment. For dated: how to rescue or rework them. For coming-back: exactly how to wear them now without looking costume."}]}

Be ruthlessly specific. Every item needs one entry with a concrete howNow tip — never leave it blank.`;

    const raw = await callClaude({ prompt, maxTokens: 3000, route: 'fashion-currency' });
    const parsed = parseJSON(raw) as { fashionCurrency?: FashionCurrencyItem[] };
    const fashionCurrency = parsed.fashionCurrency ?? [];

    const tipsText = fashionCurrency.map((f) => f.howNow).filter(Boolean).join('\n');
    if (tipsText) auditInBackground('fashion-currency', 'fashion currency tip', tipsText);

    const stored: StoredFashionCurrency = {
      season: getCurrentSeasonTag(),
      generatedAt: new Date().toISOString(),
      fashionCurrency,
    };
    setSetting('fashion_currency', JSON.stringify(stored)).catch(() => {});

    return NextResponse.json(stored);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fashion currency analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await getSetting('fashion_currency');
    if (!raw) return NextResponse.json({ fashionCurrency: null, season: null });
    const stored = JSON.parse(raw) as StoredFashionCurrency;
    return NextResponse.json(stored);
  } catch {
    return NextResponse.json({ fashionCurrency: null, season: null });
  }
}
