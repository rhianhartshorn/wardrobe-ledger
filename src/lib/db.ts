import 'server-only';
import { query } from './pg';
import { putMedia, getMedia, deleteMedia, parseDataUrl, extFor } from './media';

// ---------------------------------------------------------------------------
// Storage layer — Postgres for data, R2 (media.ts) for photos.
//
// Replaces an Upstash Redis store that held every photo as base64 text and was
// the only copy of the wardrobe; when that database was deleted, everything
// went with it. Errors here always propagate — a failing database must never
// look like an empty wardrobe again.
// ---------------------------------------------------------------------------

export type ItemRow = {
  id: string;
  name: string;
  category: string;
  primary_color: string;
  secondary_color: string;
  pattern: string;
  formality: string;
  season: string;
  material?: string;
  fit?: string;
  length?: string;
  accessory_type?: string;
  image_filename: string;
  // Read: populated only by getItem() (single item), as a data URL, for the
  // callers that need the actual bytes (visual gate, try-on, enrichment).
  // Write: a data URL passed to insertItem/updateItem is stored in R2.
  image_data_url: string;
  thumb_data_url?: string; // write-only: small list thumbnail
  image_key?: string | null;
  thumb_key?: string | null;
  added_at: number;
  price?: number;
  wear_count?: number;
  rec_count?: number;
  last_recommended_at?: number | null;
  style_note?: string;
  visual_notes?: string;
};

export type SavedLook = {
  id: string;
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  savedAt: number;
  feedback?: 'worked' | 'didnt_work';
};

export type JournalEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  itemIds: string[];
  occasion?: string;
  weatherNote?: string;
  savedLookId?: string;
  loggedAt: number;
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

const ITEM_COLUMNS = `id, name, category, primary_color, secondary_color, pattern, formality, season,
  material, fit, length, accessory_type, image_key, thumb_key, image_filename, added_at, price,
  wear_count, rec_count, last_recommended_at, style_note, visual_notes`;

type DbItem = Omit<ItemRow, 'image_data_url' | 'thumb_data_url'> & {
  material: string | null; fit: string | null; length: string | null; accessory_type: string | null;
  price: number | null; style_note: string | null; visual_notes: string | null;
};

function fromDb(r: DbItem): ItemRow {
  return {
    ...r,
    material: r.material ?? undefined,
    fit: r.fit ?? undefined,
    length: r.length ?? undefined,
    accessory_type: r.accessory_type ?? undefined,
    price: r.price ?? undefined,
    style_note: r.style_note ?? undefined,
    visual_notes: r.visual_notes ?? undefined,
    image_data_url: '',
  };
}

// Versioned keys: a replaced photo gets a new key, so the immutable cache
// headers on /api/media can never serve a stale image.
async function storeItemPhoto(id: string, dataUrl: string, variant: 'full' | 'thumb'): Promise<string | null> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '');
  const key = `items/${safeId}/${Date.now()}-${variant}.${extFor(parsed.mimeType)}`;
  await putMedia(key, parsed.buffer, parsed.mimeType);
  return key;
}

async function photoAsDataUrl(key: string | null | undefined): Promise<string> {
  if (!key) return '';
  const media = await getMedia(key);
  return media ? `data:${media.contentType};base64,${media.body.toString('base64')}` : '';
}

export async function getAllItems(): Promise<ItemRow[]> {
  const rows = await query<DbItem>(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY added_at DESC`);
  return rows.map(fromDb);
}

// Metadata only — no photo download. Use this unless the bytes are needed.
export async function getItemMeta(id: string): Promise<ItemRow | undefined> {
  const [row] = await query<DbItem>(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $1`, [id]);
  return row ? fromDb(row) : undefined;
}

// Includes the full photo as a data URL, for callers that send it to a model.
export async function getItem(id: string): Promise<ItemRow | undefined> {
  const item = await getItemMeta(id);
  if (!item) return undefined;
  item.image_data_url = await photoAsDataUrl(item.image_key);
  return item;
}

export async function insertItem(item: ItemRow): Promise<ItemRow> {
  const imageKey = item.image_data_url ? await storeItemPhoto(item.id, item.image_data_url, 'full') : null;
  const thumbKey = item.thumb_data_url ? await storeItemPhoto(item.id, item.thumb_data_url, 'thumb') : imageKey;
  await query(
    `INSERT INTO items (id, name, category, primary_color, secondary_color, pattern, formality, season,
       material, fit, length, accessory_type, image_key, thumb_key, image_filename, added_at, price,
       wear_count, rec_count, style_note, visual_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [item.id, item.name, item.category, item.primary_color ?? '', item.secondary_color ?? '', item.pattern ?? '',
      item.formality ?? '', item.season ?? '', item.material ?? null, item.fit ?? null, item.length ?? null,
      item.accessory_type ?? null, imageKey, thumbKey, item.image_filename ?? '', item.added_at,
      item.price ?? null, item.wear_count ?? 0, item.rec_count ?? 0, item.style_note ?? null, item.visual_notes ?? null],
  );
  return { ...item, image_key: imageKey, thumb_key: thumbKey, thumb_data_url: undefined };
}

export async function incrementWear(id: string): Promise<number> {
  const [row] = await query<{ wear_count: number }>(
    'UPDATE items SET wear_count = wear_count + 1 WHERE id = $1 RETURNING wear_count', [id]);
  return row?.wear_count ?? 0;
}

// How many times the team has proposed this piece — EXPOSURE, not preference.
export async function incrementRecommendation(id: string): Promise<number> {
  const [row] = await query<{ rec_count: number }>(
    'UPDATE items SET rec_count = rec_count + 1, last_recommended_at = $2 WHERE id = $1 RETURNING rec_count',
    [id, Date.now()]);
  return row?.rec_count ?? 0;
}

const UPDATABLE: Array<keyof ItemRow> = [
  'name', 'category', 'primary_color', 'secondary_color', 'pattern', 'formality', 'season',
  'material', 'fit', 'length', 'accessory_type', 'image_filename', 'price', 'style_note', 'visual_notes',
];

export async function updateItem(id: string, patch: Partial<ItemRow>): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const col of UPDATABLE) {
    if (patch[col] !== undefined) {
      params.push(patch[col]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (patch.image_data_url?.startsWith('data:')) {
    const key = await storeItemPhoto(id, patch.image_data_url, 'full');
    params.push(key);
    sets.push(`image_key = $${params.length}`);
    const thumb = patch.thumb_data_url ? await storeItemPhoto(id, patch.thumb_data_url, 'thumb') : key;
    params.push(thumb);
    sets.push(`thumb_key = $${params.length}`);
  }
  if (!sets.length) return;
  await query(`UPDATE items SET ${sets.join(', ')} WHERE id = $1`, params);
}

async function deleteItemPhotos(rows: Array<{ image_key: string | null; thumb_key: string | null }>): Promise<void> {
  const keys = new Set(rows.flatMap((r) => [r.image_key, r.thumb_key]).filter((k): k is string => !!k));
  await Promise.all(Array.from(keys).map((k) => deleteMedia(k).catch(() => {})));
}

export async function deleteItem(id: string): Promise<void> {
  const rows = await query<{ image_key: string | null; thumb_key: string | null }>(
    'DELETE FROM items WHERE id = $1 RETURNING image_key, thumb_key', [id]);
  await deleteItemPhotos(rows);
}

export async function clearAllItems(): Promise<void> {
  const rows = await query<{ image_key: string | null; thumb_key: string | null }>(
    'DELETE FROM items RETURNING image_key, thumb_key');
  await deleteItemPhotos(rows);
}

export async function nukeLegacyBlob(): Promise<void> {}

// ---------------------------------------------------------------------------
// Standalone images (profile photo etc.) — stored in R2 under files/
// ---------------------------------------------------------------------------

const fileKey = (filename: string) => `files/${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;

export async function getImage(filename: string): Promise<{ data: string; mimeType: string } | null> {
  const media = await getMedia(fileKey(filename));
  return media ? { data: media.body.toString('base64'), mimeType: media.contentType } : null;
}

export async function saveImage(filename: string, base64Data: string, mimeType: string): Promise<void> {
  await putMedia(fileKey(filename), Buffer.from(base64Data, 'base64'), mimeType);
}

export async function deleteImage(filename: string): Promise<void> {
  await deleteMedia(fileKey(filename));
}

// ---------------------------------------------------------------------------
// Settings — one row per key, so concurrent writes to different settings
// never clobber each other.
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | undefined> {
  const [row] = await query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [key, value, Date.now()]);
}

export async function deleteSetting(key: string): Promise<void> {
  await query('DELETE FROM settings WHERE key = $1', [key]);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ---------------------------------------------------------------------------
// Saved looks
// ---------------------------------------------------------------------------

type DbLook = {
  id: string; title: string; item_ids: string[]; style_reference: string | null; rationale: string | null;
  accessorizing: string[] | null; saved_at: number; feedback: SavedLook['feedback'] | null;
};

const lookFromDb = (r: DbLook): SavedLook => ({
  id: r.id, title: r.title, itemIds: r.item_ids ?? [],
  styleReference: r.style_reference ?? undefined, rationale: r.rationale ?? undefined,
  accessorizing: r.accessorizing ?? undefined, savedAt: r.saved_at, feedback: r.feedback ?? undefined,
});

export async function getSavedLooks(): Promise<SavedLook[]> {
  const rows = await query<DbLook>('SELECT * FROM looks ORDER BY saved_at DESC');
  return rows.map(lookFromDb);
}

export async function addSavedLook(look: SavedLook): Promise<void> {
  await query(
    `INSERT INTO looks (id, title, item_ids, style_reference, rationale, accessorizing, saved_at, feedback)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, item_ids = EXCLUDED.item_ids,
       style_reference = EXCLUDED.style_reference, rationale = EXCLUDED.rationale,
       accessorizing = EXCLUDED.accessorizing, feedback = EXCLUDED.feedback`,
    [look.id, look.title, look.itemIds ?? [], look.styleReference ?? null, look.rationale ?? null,
      look.accessorizing ? JSON.stringify(look.accessorizing) : null, look.savedAt, look.feedback ?? null]);
}

export async function updateSavedLook(id: string, patch: Partial<SavedLook>): Promise<void> {
  const [row] = await query<DbLook>('SELECT * FROM looks WHERE id = $1', [id]);
  if (!row) return;
  await addSavedLook({ ...lookFromDb(row), ...patch, id });
}

export async function deleteSavedLook(id: string): Promise<void> {
  await query('DELETE FROM looks WHERE id = $1', [id]);
}

// ---------------------------------------------------------------------------
// Outfit journal
// ---------------------------------------------------------------------------

type DbJournal = {
  id: string; date: string; item_ids: string[]; occasion: string | null; weather_note: string | null;
  saved_look_id: string | null; logged_at: number;
};

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const rows = await query<DbJournal>('SELECT * FROM journal ORDER BY logged_at DESC');
  return rows.map((r) => ({
    id: r.id, date: r.date, itemIds: r.item_ids ?? [], occasion: r.occasion ?? undefined,
    weatherNote: r.weather_note ?? undefined, savedLookId: r.saved_look_id ?? undefined, loggedAt: r.logged_at,
  }));
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await query(
    `INSERT INTO journal (id, date, item_ids, occasion, weather_note, saved_look_id, logged_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    [entry.id, entry.date, entry.itemIds ?? [], entry.occasion ?? null, entry.weatherNote ?? null,
      entry.savedLookId ?? null, entry.loggedAt]);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await query('DELETE FROM journal WHERE id = $1', [id]);
}
