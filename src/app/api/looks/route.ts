import { NextRequest, NextResponse } from 'next/server';
import { getSavedLooks, addSavedLook, type SavedLook } from '@/lib/db';

export async function GET() {
  const looks = await getSavedLooks();
  return NextResponse.json(looks);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<SavedLook, 'id' | 'savedAt'>;
    const look: SavedLook = {
      ...body,
      id: crypto.randomUUID(),
      savedAt: Date.now(),
    };
    await addSavedLook(look);
    return NextResponse.json(look);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to save look' }, { status: 500 });
  }
}
