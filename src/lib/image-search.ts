import 'server-only';
import type { InspirationImage } from './style-types';

const CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID;

// ---------------------------------------------------------------------------
// Real-photo inspiration search — Google Custom Search JSON API, image mode.
// Returns thumbnail + source link only (never rehosts or reproduces the
// original image), so results are always presented as a link back to the
// source, the same way a search engine results page would.
// ---------------------------------------------------------------------------

export async function searchInspirationImages(query: string, count = 3): Promise<InspirationImage[]> {
  if (!CSE_API_KEY || !CSE_ID) return [];
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${CSE_API_KEY}&cx=${CSE_ID}&searchType=image&num=${count}&safe=active&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json() as {
      items?: Array<{ link: string; image?: { thumbnailLink?: string; contextLink?: string } }>;
    };
    return (data.items ?? [])
      .map((item) => ({
        thumbnailUrl: item.image?.thumbnailLink || item.link,
        sourceUrl: item.image?.contextLink || item.link,
      }))
      .filter((img): img is InspirationImage => !!img.thumbnailUrl);
  } catch {
    return [];
  }
}
