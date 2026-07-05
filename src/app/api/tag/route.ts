import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { base64Data, mediaType } = await req.json() as {
      base64Data?: string;
      mediaType?: string;
    };

    if (!base64Data) {
      return NextResponse.json({ error: 'base64Data is required' }, { status: 400 });
    }

    const prompt = `You are tagging a clothing item photo for a digital wardrobe app. Look closely at the item in the photo and respond with ONLY valid JSON, no markdown fences, no other text, in exactly this shape: {"name":"short descriptive name, max 5 words","category":"one of Top, Bottom, Outerwear, Footwear, Accessory, Dress/One-piece","primaryColor":"one or two word color","secondaryColor":"one or two word color or empty string","pattern":"e.g. solid, striped, plaid, checked, floral, textured","formality":"one of Casual, Smart Casual, Business, Formal, Athletic","season":"one of All-season, Summer, Winter, Spring/Fall","material":"one of Cotton, Linen, Wool, Silk, Denim, Leather, Knit, Synthetic, Velvet, Satin, Cashmere, Suede — best guess from the photo"}`;

    const raw = await callClaude({ prompt, imageBase64: base64Data, mediaType: mediaType ?? 'image/jpeg', maxTokens: 300, model: 'claude-haiku-4-5-20251001' });
    const tags = parseJSON(raw);
    return NextResponse.json({ tags });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-tagging failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
