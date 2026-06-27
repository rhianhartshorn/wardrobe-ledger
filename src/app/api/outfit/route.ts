import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { callClaude, parseJSON } from '@/lib/claude';
import { UPLOADS_DIR } from '@/lib/db';

type WeatherSnapshot = {
  locationName: string;
  tempF: number;
  condition: string;
  summary: string;
};

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
    const body = await req.json() as {
      items: WardrobeItem[];
      weather: WeatherSnapshot;
      occasion: string;
      note?: string;
      profileImageFilename?: string;
    };
    const { items, weather, occasion, note, profileImageFilename } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 });
    }
    if (!weather) {
      return NextResponse.json({ error: 'No weather data provided' }, { status: 400 });
    }

    // Load profile photo from disk if one is saved
    let profileImageBase64: string | undefined;
    let profileMediaType = 'image/jpeg';
    if (profileImageFilename) {
      const safeName = profileImageFilename.replace(/[^a-zA-Z0-9._-]/g, '');
      const buf = await readFile(path.join(UPLOADS_DIR, safeName)).catch(() => null);
      if (buf) {
        profileImageBase64 = buf.toString('base64');
        profileMediaType = safeName.endsWith('.png') ? 'image/png' : 'image/jpeg';
      }
    }

    const itemListText = items
      .map(
        (i) =>
          `${i.id} :: ${i.category}, "${i.name}", color ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}, ${i.formality}, ${i.season}`
      )
      .join('\n');

    const photoLine = profileImageBase64
      ? "The attached photo is of the client who will wear these outfits. In each rationale, weave in one brief, respectful, flattering coloring or contrast observation tied to the photo (e.g. how a color reads against their skin tone or hair) — never comment on body shape, weight, or size. Skip it if there's nothing useful to say. "
      : '';

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const prompt = `You are a current, tasteful personal stylist working from a client's real wardrobe. Today is ${today}. ${photoLine}You may do ONE brief web search to confirm what's currently fashionable for this kind of occasion if helpful, then stop searching.

Occasion: ${occasion}${note ? ' — additional context: ' + note : ''}
Current weather: ${weather.locationName}, ${weather.tempF}°F, ${weather.condition}. ${weather.summary}

Wardrobe (id :: details):
${itemListText}

Using ONLY items from this wardrobe list (reference them by their exact id), assemble exactly 3 distinct, polished outfit combinations suited to the occasion and weather. For each, name the current style aesthetic or trend it most resembles — be specific, not generic (something a real style search would surface). Respond with ONLY valid JSON, no markdown fences, no other text, in exactly this shape:
{"outfits":[{"title":"max 5 words","itemIds":["id1","id2"],"styleReference":"max 6 words naming the specific current aesthetic/trend","rationale":"max 20 words on why it works for the occasion, current style, and weather","accessorizing":["tip 1 max 8 words","tip 2 max 8 words"],"weatherNote":"max 15 words"}]}`;

    const raw = await callClaude({
      prompt,
      imageBase64: profileImageBase64,
      mediaType: profileMediaType,
      useWebSearch: true,
      maxTokens: 1500,
    });

    const parsed = parseJSON(raw) as { outfits?: unknown[] };
    return NextResponse.json({ outfits: parsed.outfits ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outfit generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
