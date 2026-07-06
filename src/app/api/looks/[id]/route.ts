import { NextRequest, NextResponse } from 'next/server';
import { deleteSavedLook, updateSavedLook } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const patch = await req.json() as { feedback?: 'worked' | 'didnt_work' | null };
  await updateSavedLook(params.id, patch.feedback === null ? { feedback: undefined } : { feedback: patch.feedback ?? undefined });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await deleteSavedLook(params.id);
  return NextResponse.json({ ok: true });
}
