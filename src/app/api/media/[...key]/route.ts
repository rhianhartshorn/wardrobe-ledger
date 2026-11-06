import { NextRequest, NextResponse } from 'next/server';
import { getMedia } from '@/lib/media';

// Keys are versioned (a replaced photo gets a new key), so responses are
// safe to cache forever.
export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  try {
    const media = await getMedia(key);
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(new Uint8Array(media.body), {
      headers: {
        'Content-Type': media.contentType,
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Media unavailable';
    const status = message.startsWith('Invalid media key') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
