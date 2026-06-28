import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getImage } from '@/lib/db';

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

    if (!items?.length) return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 });
    if (!weather) return NextResponse.json({ error: 'No weather data provided' }, { status: 400 });

    let profileImageBase64: string | undefined;
    let profileMediaType = 'image/jpeg';
    if (profileImageFilename) {
      const safeName = profileImageFilename.replace(/[^a-zA-Z0-9._-]/g, '');
      const img = await getImage(safeName);
      if (img) { profileImageBase64 = img.data; profileMediaType = img.mimeType; }
    }

    const itemListText = items
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", color ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}, ${i.formality}, ${i.season}`)
      .join('\n');

    const photoLine = profileImageBase64
      ? "The attached photo is of the client. In each rationale, weave in one brief, respectful, flattering observation about their colouring — never comment on body shape, weight, or size. "
      : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `You are a current, tasteful personal stylist working from a client's real wardrobe. Today is ${today}. ${photoLine}

Occasion: ${occasion}${note ? ' — additional context: ' + note : ''}
Current weather: ${weather.locationName}, ${weather.tempF}°F, ${weather.condition}. ${weather.summary}

Wardrobe (id :: details):
${itemListText}

Using ONLY items from this wardrobe list (reference by exact id), assemble exactly 3 distinct polished outfit combinations. For each, name the current 2026 style aesthetic and provide 1–2 real inspiration links from well-known fashion sources you know (Vogue, Net-a-Porter, Matches, Mr Porter, Who What Wear, Refinery29, The Outnet, SSENSE, editorials etc.) — use URLs you are confident exist.

Respond with ONLY valid JSON, no markdown:
{"outfits":[{"title":"max 5 words","itemIds":["id1","id2"],"styleReference":"specific 2026 aesthetic max 6 words","rationale":"max 20 words","accessorizing":["tip max 8 words","tip max 8 words"],"weatherNote":"max 15 words","inspirationLinks":[{"label":"source name + what it shows max 8 words","url":"real URL you know exists"}]}]}`;

    const raw = await callClaude({ prompt, imageBase64: profileImageBase64, mediaType: profileMediaType, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { outfits?: unknown[] };
    return NextResponse.json({ outfits: parsed.outfits ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outfit generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
