import { NextRequest, NextResponse } from 'next/server';
import { getItem, getImage, getSetting } from '@/lib/db';

const FASHN_API_KEY = process.env.FASHN_API_KEY;
const FASHN_BASE = 'https://api.fashn.ai/v1';

function toFashnCategory(category: string): 'tops' | 'bottoms' | 'one-pieces' | null {
  const c = category.toLowerCase();
  if (c === 'top' || c === 'outerwear') return 'tops';
  if (c === 'bottom') return 'bottoms';
  if (c === 'dress/one-piece') return 'one-pieces';
  return null; // Footwear, Accessory — not supported
}

export async function POST(req: NextRequest) {
  if (!FASHN_API_KEY) {
    return NextResponse.json({ error: 'Try-on not configured — add FASHN_API_KEY to environment variables.' }, { status: 503 });
  }

  try {
    const { itemId } = await req.json() as { itemId: string };
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    // Get the clothing item
    const item = await getItem(itemId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const fashnCategory = toFashnCategory(item.category);
    if (!fashnCategory) {
      return NextResponse.json({ error: `Try-on is not supported for ${item.category} items.` }, { status: 400 });
    }

    // Get garment image — stored as base64 in imgKey
    let garmentImage: string | null = null;
    if (item.image_data_url && item.image_data_url.startsWith('data:')) {
      garmentImage = item.image_data_url;
    } else {
      // Try fetching from the img key directly
      const imgData = await getImage(item.image_filename || '');
      if (imgData) garmentImage = `data:${imgData.mimeType};base64,${imgData.data}`;
    }

    if (!garmentImage) {
      return NextResponse.json({ error: 'This item has no photo — add one first.' }, { status: 400 });
    }

    // Get profile photo
    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }
    const profileImg = await getImage(profileFilename);
    if (!profileImg) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }
    const personImage = `data:${profileImg.mimeType};base64,${profileImg.data}`;

    // Start the Fashn.ai try-on job
    const fashnRes = await fetch(`${FASHN_BASE}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FASHN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: personImage,
          garment_image: garmentImage,
          category: fashnCategory,
        },
      }),
    });

    const rawText = await fashnRes.text();
    console.error('[try-on] Fashn.ai raw response:', fashnRes.status, rawText.slice(0, 500));
    let fashnData: { id?: string; error?: string; detail?: string } = {};
    try { fashnData = JSON.parse(rawText); } catch { /* non-JSON */ }

    if (!fashnRes.ok || !fashnData.id) {
      const errMsg = fashnData.detail ?? fashnData.error ?? `HTTP ${fashnRes.status}: ${rawText.slice(0, 200)}`;
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    return NextResponse.json({ id: fashnData.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
