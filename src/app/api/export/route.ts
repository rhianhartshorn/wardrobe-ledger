import { NextRequest, NextResponse } from 'next/server';
import { buildExport } from '@/lib/backup';

// "Download my wardrobe" — everything, optionally with photos inlined, so a
// complete copy can always live outside the app.
export async function GET(req: NextRequest) {
  try {
    const includePhotos = req.nextUrl.searchParams.get('photos') === '1';
    const data = await buildExport({ includePhotos });
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="wardrobe-${date}${includePhotos ? '-with-photos' : ''}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
