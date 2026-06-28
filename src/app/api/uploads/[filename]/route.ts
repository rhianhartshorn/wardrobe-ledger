import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeName) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const image = await getImage(safeName);
  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = Buffer.from(image.data, 'base64');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
