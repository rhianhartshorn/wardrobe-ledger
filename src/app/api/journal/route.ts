import { NextRequest, NextResponse } from 'next/server';
import { getJournalEntries, addJournalEntry, type JournalEntry } from '@/lib/db';

export async function GET() {
  const entries = await getJournalEntries();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<JournalEntry, 'id' | 'loggedAt'>;
    const entry: JournalEntry = {
      ...body,
      id: crypto.randomUUID(),
      loggedAt: Date.now(),
    };
    await addJournalEntry(entry);
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to log entry' }, { status: 500 });
  }
}
