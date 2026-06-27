import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { callClaude, parseJSON } from '@/lib/claude';
import { UPLOADS_DIR } from '@/lib/db';

export async function POST(req: NextRequest) {
  let imageFilename: string | null = null;

  try {
    const body = await req.json() as { imageBase64?: string; imageId?: string };
    const { imageBase64, imageId } = body;

    if (!imageBase64 || !imageId) {
      return NextResponse.json({ error: 'imageBase64 and imageId are required' }, { status: 400 });
    }

    // Strip data URL prefix and detect format
    const match = /^data:([^;]+);base64,(.*)$/.exec(imageBase64);
    const mediaType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const ext = mediaType.includes('png') ? 'png' : 'jpg';

    // Sanitize the id before using it as a filename
    const safeId = imageId.replace(/[^a-zA-Z0-9-]/g, '');
    imageFilename = `${safeId}.${ext}`;

    await writeFile(path.join(UPLOADS_DIR, imageFilename), Buffer.from(base64Data, 'base64'));

    // Ask Claude to tag the garment
    const prompt = `You are tagging a clothing item photo for a digital wardrobe app. Look closely at the item in the photo and respond with ONLY valid JSON, no markdown fences, no other text, in exactly this shape: {"name":"short descriptive name, max 5 words","category":"one of Top, Bottom, Outerwear, Footwear, Accessory, Dress/One-piece","primaryColor":"one or two word color","secondaryColor":"one or two word color or empty string","pattern":"e.g. solid, striped, plaid, checked, floral, textured","formality":"one of Casual, Smart Casual, Business, Formal, Athletic","season":"one of All-season, Summer, Winter, Spring/Fall"}`;

    try {
      const raw = await callClaude({ prompt, imageBase64: base64Data, mediaType, maxTokens: 500 });
      const tags = parseJSON(raw);
      return NextResponse.json({ tags, imageFilename });
    } catch (claudeErr) {
      // File is saved; return it alongside the error so the client can still use it
      const message = claudeErr instanceof Error ? claudeErr.message : 'Auto-tagging failed';
      return NextResponse.json({ taggingError: message, imageFilename });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message, imageFilename }, { status: 500 });
  }
}
