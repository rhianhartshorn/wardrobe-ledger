import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { getSetting, setSetting, deleteSetting, UPLOADS_DIR } from '@/lib/db';

const PROFILE_KEY = 'profile_photo';

export async function GET() {
  const filename = getSetting(PROFILE_KEY);
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
    const mediaType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const ext = mediaType.includes('png') ? 'png' : 'jpg';
    const filename = `profile.${ext}`;

    await writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(base64Data, 'base64'));
    setSetting(PROFILE_KEY, filename);

    return NextResponse.json({ imageUrl: `/api/uploads/${filename}`, imageFilename: filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const filename = getSetting(PROFILE_KEY);
  if (filename) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    await unlink(path.join(UPLOADS_DIR, safeName)).catch(() => {});
    deleteSetting(PROFILE_KEY);
  }
  return NextResponse.json({ ok: true });
}
