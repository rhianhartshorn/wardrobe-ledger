import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';
import type { LifestyleProfile } from '@/lib/lifestyle-types';

export async function GET() {
  const raw = await getSetting('lifestyle_profile');
  if (!raw) return NextResponse.json({});
  try {
    return NextResponse.json(JSON.parse(raw) as LifestyleProfile);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as LifestyleProfile;
  await setSetting('lifestyle_profile', JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
