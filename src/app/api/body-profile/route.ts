import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';
import { type BodyProfile, EMPTY_PROFILE } from '@/lib/body-profile';

export type { BodyProfile };
export { EMPTY_PROFILE };

export async function GET() {
  try {
    const raw = await getSetting('body_profile');
    const profile: BodyProfile = raw ? JSON.parse(raw) as BodyProfile : { ...EMPTY_PROFILE };
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ ...EMPTY_PROFILE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json() as BodyProfile;
    await setSetting('body_profile', JSON.stringify(profile));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to save' }, { status: 500 });
  }
}
