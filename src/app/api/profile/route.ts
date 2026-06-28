import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, deleteSetting, saveImage, deleteImage } from '@/lib/db';

const PROFILE_KEY = 'profile_photo';

export async function GET() {
  const filename = await getSetting(PROFILE_KEY);
  if (!filename) return NextResponse.json({ imageUrl: null, imageFilename: null });
  return NextResponse.json({
    imageUrl: `/api/uploads/${filename}`,
    imageFilename: filename,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json() as { imageBase64?: string };
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const match = /^data:([^;]+);base64,(.*)$/.exec(imageBase64);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `profile.${ext}`;

    await saveImage(filename, base64Data, mimeType);
    await setSetting(PROFILE_KEY, filename);

    return NextResponse.json({ imageUrl: `/api/uploads/${filename}`, imageFilename: filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const filename = await getSetting(PROFILE_KEY);
  if (filename) {
    await deleteImage(filename);
    await deleteSetting(PROFILE_KEY);
  }
  return NextResponse.json({ ok: true });
}
