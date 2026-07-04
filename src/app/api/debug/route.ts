import { NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function rawGet(key: string): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) return 'NO_CREDENTIALS';
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    });
    return await res.json();
  } catch (e) {
    return { fetchError: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const idsRaw = await rawGet('wardrobe:itemids');

  let ids: string[] = [];
  let idsError: string | null = null;
  try {
    const r = (idsRaw as { result?: string }).result ?? null;
    if (r) { const p = JSON.parse(r); ids = Array.isArray(p) ? p : []; }
  } catch (e) {
    idsError = e instanceof Error ? e.message : String(e);
  }

  const firstItemRaw = ids.length > 0 ? await rawGet(`wardrobe:item:${ids[0]}`) : null;
  const firstImgLength = ids.length > 0
    ? await rawGet(`wardrobe:img:${ids[0]}`).then((r) => {
        const v = (r as { result?: string | null }).result;
        return v ? v.length : 0;
      }).catch(() => -1)
    : null;

  return NextResponse.json({
    urlSet: !!REDIS_URL,
    tokenSet: !!REDIS_TOKEN,
    idsRaw,
    idsError,
    idCount: ids.length,
    ids,
    firstItemRaw: ids.length > 0 ? firstItemRaw : null,
    firstImgLength,
  });
}
