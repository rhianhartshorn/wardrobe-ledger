import 'server-only';
import { query } from './pg';
import { getAllItems, getSavedLooks, getJournalEntries, getAllSettings, type ItemRow } from './db';
import { getMedia, putMedia, mediaUrl } from './media';

export type WardrobeExport = {
  format: 'wardrobe-ledger-export';
  version: 1;
  exportedAt: string;
  items: Array<Omit<ItemRow, 'image_data_url' | 'thumb_data_url'> & { imageUrl: string | null; photoDataUrl?: string }>;
  looks: Awaited<ReturnType<typeof getSavedLooks>>;
  journal: Awaited<ReturnType<typeof getJournalEntries>>;
  settings: Record<string, string>;
};

export async function buildExport({ includePhotos }: { includePhotos: boolean }): Promise<WardrobeExport> {
  const [items, looks, journal, settings] = await Promise.all([
    getAllItems(), getSavedLooks(), getJournalEntries(), getAllSettings(),
  ]);
  const exportedItems = await Promise.all(items.map(async ({ image_data_url: _img, thumb_data_url: _thumb, ...meta }) => {
    const out: WardrobeExport['items'][number] = { ...meta, imageUrl: mediaUrl(meta.image_key) };
    if (includePhotos && meta.image_key) {
      const media = await getMedia(meta.image_key);
      if (media) out.photoDataUrl = `data:${media.contentType};base64,${media.body.toString('base64')}`;
    }
    return out;
  }));
  return {
    format: 'wardrobe-ledger-export', version: 1, exportedAt: new Date().toISOString(),
    items: exportedItems, looks, journal, settings,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
let running = false;

// Photos already live durably in R2; this snapshots everything else there
// once a day, triggered by ordinary writes so no scheduler is needed.
export async function writeBackup(): Promise<{ key: string; itemCount: number }> {
  const data = await buildExport({ includePhotos: false });
  const now = Date.now();
  const key = `backups/${new Date(now).toISOString().replace(/[:.]/g, '-')}.json`;
  await putMedia(key, Buffer.from(JSON.stringify(data)), 'application/json');
  await query('INSERT INTO backups (created_at, media_key, item_count) VALUES ($1, $2, $3)', [now, key, data.items.length]);
  return { key, itemCount: data.items.length };
}

export async function lastBackup(): Promise<{ created_at: number; media_key: string; item_count: number } | null> {
  const [row] = await query<{ created_at: number; media_key: string; item_count: number }>(
    'SELECT created_at, media_key, item_count FROM backups ORDER BY created_at DESC LIMIT 1');
  return row ?? null;
}

export function backupInBackgroundIfStale(): void {
  if (running) return;
  running = true;
  (async () => {
    const last = await lastBackup();
    if (!last || Date.now() - last.created_at > DAY_MS) await writeBackup();
  })().catch(() => {}).finally(() => { running = false; });
}
