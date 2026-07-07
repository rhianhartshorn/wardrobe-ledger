import { NextRequest, NextResponse } from 'next/server';
import { getImage, getSetting, getItem } from '@/lib/db';
import { STYLIST_PERSONA } from '@/lib/stylist';
import { logExternalCall } from '@/lib/usage';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

type SlimItem = { id: string; name: string; category: string; primaryColor: string };

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Try-on not configured — add GOOGLE_API_KEY to environment variables.' }, { status: 503 });
  }

  try {
    const body = await req.json() as { items?: SlimItem[] };
    const items = body.items ?? [];
    if (!items.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    const profileImg = await getImage(profileFilename);
    if (!profileImg) return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });

    // Collect garment images via getItem (fetches image_data_url from Redis)
    const garmentParts: { mime_type: string; data: string }[] = [];
    for (const slimItem of items.slice(0, 4)) {
      const item = await getItem(slimItem.id);
      const dataUrl = item?.image_data_url;
      if (dataUrl && dataUrl.startsWith('data:')) {
        const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
        if (match) garmentParts.push({ mime_type: match[1], data: match[2] });
      }
    }

    if (garmentParts.length === 0) {
      return NextResponse.json({ error: 'No garment photos found — re-add items to refresh their images.' }, { status: 400 });
    }

    const outfitDesc = items.map((i) => `${i.name} (${i.category})`).join(', ');

    const parts: unknown[] = [
      { inline_data: { mime_type: profileImg.mimeType, data: profileImg.data } },
      ...garmentParts.map((g) => ({ inline_data: g })),
      { text: `${STYLIST_PERSONA}\n\nThe first image is a photo of a person. The following images are clothing items curated for them: ${outfitDesc}. Generate a single photorealistic image showing this person wearing all of these items together as a complete, well-styled outfit. Preserve their face, hair colour, and body proportions exactly. Style the outfit with the precision of an editorial fashion shoot — clean composition, flattering natural light, the garments fitting and falling as they would on a real body.` },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );

    const raw = await res.text();
    console.log('[outfit-try-on] Gemini status:', res.status, raw.slice(0, 300));

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try { const j = JSON.parse(raw) as { error?: { message?: string } }; errMsg = j?.error?.message ?? errMsg; } catch { /**/ }
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const data = JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> } }> };
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'No image returned. ' + raw.slice(0, 200) }, { status: 502 });
    }

    logExternalCall({ ts: Date.now(), route: 'outfit-try-on', model: 'gemini-flash-image' }).catch(() => {});
    return NextResponse.json({ outputUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
