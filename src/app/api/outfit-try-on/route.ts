import { NextRequest, NextResponse } from 'next/server';
import { getImage, getSetting, redisGet } from '@/lib/db';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';

type SlimItem = {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
};

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Try-on not configured — add GOOGLE_API_KEY to environment variables.' }, { status: 503 });
  }

  try {
    const { items } = await req.json() as { items: SlimItem[] };
    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    // Get profile photo
    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    const profileImg = await getImage(profileFilename);
    if (!profileImg) return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });

    // Fetch garment images from Redis
    const garmentImages: { data: string; mimeType: string; name: string }[] = [];
    for (const item of items.slice(0, 4)) {
      const raw = await redisGet(`wardrobe:img:${item.id}`);
      if (raw && typeof raw === 'string' && raw.startsWith('data:')) {
        const match = /^data:([^;]+);base64,(.*)$/.exec(raw);
        if (match) garmentImages.push({ data: match[2], mimeType: match[1], name: item.name });
      }
    }

    if (garmentImages.length === 0) {
      return NextResponse.json({ error: 'No garment photos found — re-add the items to get higher quality images.' }, { status: 400 });
    }

    const outfitDesc = items.map((i) => `${i.name} (${i.category})`).join(', ');

    // Build Gemini request — person photo first, then garment photos, then prompt
    const parts: unknown[] = [
      {
        inline_data: {
          mime_type: profileImg.mimeType,
          data: profileImg.data,
        },
      },
      ...garmentImages.map((g) => ({
        inline_data: {
          mime_type: g.mimeType,
          data: g.data,
        },
      })),
      {
        text: `The first image is a photo of a person. The subsequent images are clothing items: ${outfitDesc}.

Generate a single photorealistic image showing this person wearing all of these clothing items together as a complete outfit. Preserve the person's face, hair, and body proportions exactly. Show the full outfit styled naturally, as if taken in editorial fashion photography lighting.`,
      },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    );

    const raw = await res.text();
    console.log('[outfit-try-on] Gemini status:', res.status, raw.slice(0, 300));

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try { const j = JSON.parse(raw); errMsg = j?.error?.message ?? errMsg; } catch { /* */ }
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const data = JSON.parse(raw) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }>;
        };
      }>;
      error?: { message: string };
    };

    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'Gemini did not return an image. ' + raw.slice(0, 200) }, { status: 502 });
    }

    const outputUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    return NextResponse.json({ outputUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
