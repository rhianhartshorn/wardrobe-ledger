import { NextRequest, NextResponse } from 'next/server';
import { deleteSavedLook } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await deleteSavedLook(params.id);
  return NextResponse.json({ ok: true });
}
