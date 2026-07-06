import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import type { EditorialPatch } from '@/lib/editorial-types';

export async function GET() {
  try {
    const raw = await getSetting('editorial_patches');
    const patches: EditorialPatch[] = raw ? JSON.parse(raw) : [];
    return NextResponse.json({ patches });
  } catch {
    return NextResponse.json({ patches: [] });
  }
}
