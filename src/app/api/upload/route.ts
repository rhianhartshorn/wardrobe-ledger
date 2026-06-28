import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageId } = await req.json() as { imageBase64?: string; imageId?: string };

    if (!imageBase64 || !imageId) {
      return NextResponse.json({ error: 'imageBase64 and imageId are required' }, { status: 400 });
    }

    const match = /^data:([^;]+);base64,(.*)$/.exec(imageBase64);
    const mediaType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const ext = mediaType.includes('png') ? 'png' : 'jpg';
    const safeId = imageId.replace(/[^a-zA-Z0-9-]/g, '');
    const imageFilename = `${safeId}.${ext}`;

    await writeFile(path.join(UPLOADS_DIR, imageFilename), Buffer.from(base64Data, 'base64'));

    return NextResponse.json({ imageFilename, mediaType, base64Data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
