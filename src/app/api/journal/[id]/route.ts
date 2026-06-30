import { NextRequest, NextResponse } from 'next/server';
import { deleteJournalEntry } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await deleteJournalEntry(params.id);
  return NextResponse.json({ ok: true });
}
