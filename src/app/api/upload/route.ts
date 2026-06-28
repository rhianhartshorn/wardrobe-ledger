import { NextRequest, NextResponse } from 'next/server';
import { saveImage } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageId } = await req.json() as { imageBase64?: string; imageId?: string };

    if (!imageBase64 || !imageId) {
      return NextResponse.json({ error: 'imageBase64 and imageId are required' }, { status: 400 });
    }

    const match = /^data:([^;]+);base64,(.*)$/.exec(imageBase64);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const safeId = imageId.replace(/[^a-zA-Z0-9-]/g, '');
    const imageFilename = `${safeId}.${ext}`;

    saveImage(imageFilename, base64Data, mimeType);

    return NextResponse.json({ imageFilename, base64Data, mediaType: mimeType });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
