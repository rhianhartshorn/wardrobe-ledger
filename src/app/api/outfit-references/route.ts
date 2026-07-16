import { NextRequest, NextResponse } from 'next/server';
import { searchInspirationImages } from '@/lib/image-search';

// Real-world reference photos "close to" a proposed outfit — so the client can
// see the vibe the stylist is going for. Lazy / on-demand: only called when the
// user taps "Similar looks" on an outfit card, so it costs nothing per response.
// Returns thumbnails linking back to their source (never rehosts the image).
export async function POST(req: NextRequest) {
  try {
    const { styleReference, title, pieceSummary } = await req.json() as {
      styleReference?: string;
      title?: string;
      pieceSummary?: string; // e.g. "leopard blouse, black wide-leg trousers"
    };

    // Build a query from the most descriptive signal available. The aesthetic
    // reference ("Lemaire print-led ease") plus the actual pieces gives the
    // closest real-world match to what was recommended.
    const query = [styleReference, pieceSummary || title, 'outfit street style']
      .filter(Boolean)
      .join(' ')
      .slice(0, 120);

    if (!query.trim()) return NextResponse.json({ images: [] });

    const images = await searchInspirationImages(query, 4, 'outfit-references');
    return NextResponse.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not fetch references';
    return NextResponse.json({ error: message, images: [] }, { status: 500 });
  }
}
