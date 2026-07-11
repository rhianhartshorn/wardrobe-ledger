import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'NOT SET',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET (hidden)' : 'NOT SET',
  });
}
