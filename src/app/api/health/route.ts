import { NextResponse } from 'next/server';
import { query } from '@/lib/pg';
import { mediaHealth } from '@/lib/media';
import { lastBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [database, media, backup] = await Promise.all([
    query<{ items: number }>('SELECT count(*)::int AS items FROM items')
      .then(([r]) => ({ ok: true as const, items: r?.items ?? 0 }))
      .catch((err: unknown) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) })),
    mediaHealth(),
    lastBackup().catch(() => null),
  ]);
  const ok = database.ok && media.ok;
  return NextResponse.json(
    {
      ok,
      database,
      media,
      lastBackup: backup ? { at: new Date(backup.created_at).toISOString(), items: backup.item_count } : null,
    },
    { status: ok ? 200 : 503 },
  );
}
