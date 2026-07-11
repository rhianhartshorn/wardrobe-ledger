import { NextResponse } from 'next/server';

async function redisGetRaw(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json = await res.json() as { result: string | null };
    return json.result ?? null;
  } catch { return null; }
}

export async function GET() {
  const raw = await redisGetRaw('wl:usage:log');
  return NextResponse.json({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET (hidden)' : 'NOT SET',
    usageLogRawLength: raw?.length ?? null,
    usageLogRawPreview: raw ? raw.slice(0, 500) : null,
  });
}
