import 'server-only';
import * as fs from 'fs';
import * as path from 'path';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ---------------------------------------------------------------------------
// File-based fallback store — used when Upstash env vars are not set.
// Persists across hot reloads in development.
// ---------------------------------------------------------------------------
const STORE_FILE = path.join(process.cwd(), '.local-store.json');

function loadStore(): Record<string, string> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as Record<string, string>;
    }
  } catch { /* ignore */ }
  return {};
}

function saveStore(store: Record<string, string>): void {
  try { fs.writeFileSync(STORE_FILE, JSON.stringify(store)); } catch { /* ignore */ }
}

function memGet(key: string): string | null {
  const store = loadStore();
  return store[key] ?? null;
}
function memSet(key: string, value: unknown): void {
  const store = loadStore();
  store[key] = JSON.stringify(value);
  saveStore(store);
}
function memIncr(key: string): number {
  const store = loadStore();
  const cur = parseInt(store[key] ?? '0', 10);
  const next = (isNaN(cur) ? 0 : cur) + 1;
  store[key] = String(next);
  saveStore(store);
  return next;
}

// ---------------------------------------------------------------------------
// Types
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
  image_data_url: string;
  added_at: number;
  price?: number;
  wear_count?: number;
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
// Redis REST helpers — GET and SET only (proven to work with Upstash REST).
// All hash-based operations have been replaced with GET/SET + an ID-list pattern.
//
// ENCODING NOTE: Upstash REST stores the raw POST body bytes. So we call
// JSON.stringify ONCE on the value inside redisSet — callers must NOT
// pre-stringify before passing a value here, or values end up double-encoded.
// ---------------------------------------------------------------------------

async function redisGet(key: string): Promise<string | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return memGet(key);
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    });
    const json = await res.json() as { result: string | null };
    return json.result ?? null;
  } catch {
    return null;
  }
}

// Atomically increment an integer key and return the new value.
async function redisIncr(key: string): Promise<number> {
  if (!REDIS_URL || !REDIS_TOKEN) return memIncr(key);
  const res = await fetch(`${REDIS_URL}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json() as { result: number };
  return json.result ?? 0;
}

// Accepts any JSON-serializable value and stores it with ONE level of encoding.
async function redisSet(key: string, value: unknown): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) { memSet(key, value); return; }
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
}

// Parse a raw Redis GET result back to its original value.
// Handles both correctly-encoded values AND legacy double-encoded values
// (stored before the encoding fix) so old items are still readable.
function parseVal<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const once = JSON.parse(raw) as unknown;
    // If the first parse gives a string, it was double-encoded (legacy storage).
    // Try a second parse to unwrap the original value.
    if (typeof once === 'string') {
      try { return JSON.parse(once) as T; } catch { return once as T; }
    }
    return once as T;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// ID-list helpers
// Each entity type (items, looks, journal) maintains a JSON array of its IDs.
// Clearing an entity type means writing [] — no DEL command needed.
// ---------------------------------------------------------------------------

async function getIds(listKey: string): Promise<string[]> {
  const raw = await redisGet(listKey);
  const parsed = parseVal<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  // Filter out corrupt single-character entries (caused by legacy spread-of-string bug)
  return (parsed as string[]).filter((id) => typeof id === 'string' && id.length > 10);
}

async function setIds(listKey: string, ids: string[]): Promise<void> {
  // Pass the array directly — redisSet will JSON.stringify once
  await redisSet(listKey, ids);
}

// ---------------------------------------------------------------------------
// Key constants
// ---------------------------------------------------------------------------

const ITEM_IDS_KEY    = 'wardrobe:itemids';
const LOOK_IDS_KEY    = 'wardrobe:lookids';
const JOURNAL_IDS_KEY = 'wardrobe:journalids';
const SETTINGS_KEY    = 'wardrobe:settings';

const itemKey    = (id: string) => `wardrobe:item:${id}`;
const imgKey     = (id: string) => `wardrobe:img:${id}`;
const wearKey    = (id: string) => `wardrobe:wear:${id}`;
const lookKey    = (id: string) => `wardrobe:look:${id}`;
const journalKey = (id: string) => `wardrobe:journal:${id}`;

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function getAllItems(): Promise<ItemRow[]> {
  const ids = await getIds(ITEM_IDS_KEY);
  if (!ids.length) return [];

  const items = await Promise.all(
    ids.map(async (id): Promise<ItemRow | null> => {
      try {
        const [metaRaw, imgRaw, wearRaw] = await Promise.all([
          redisGet(itemKey(id)),
          redisGet(imgKey(id)),
          redisGet(wearKey(id)),
        ]);
        const item = parseVal<ItemRow>(metaRaw);
        if (!item || typeof item !== 'object') return null;
        const img = parseVal<string>(imgRaw);
        if (img && typeof img === 'string') item.image_data_url = img;
        // Prefer the dedicated wear key (atomic INCR); fall back to legacy wear_count in meta
        const wearFromKey = wearRaw != null ? parseInt(wearRaw, 10) : NaN;
        item.wear_count = !isNaN(wearFromKey) ? wearFromKey : (item.wear_count ?? 0);
        return item;
      } catch { return null; }
    })
  );

  return items
    .filter((item): item is ItemRow => item !== null)
    .sort((a, b) => b.added_at - a.added_at);
}

export async function getItem(id: string): Promise<ItemRow | undefined> {
  const [metaRaw, imgRaw, wearRaw] = await Promise.all([
    redisGet(itemKey(id)),
    redisGet(imgKey(id)),
    redisGet(wearKey(id)),
  ]);
  const item = parseVal<ItemRow>(metaRaw);
  if (!item || typeof item !== 'object') return undefined;
  const img = parseVal<string>(imgRaw);
  if (img && typeof img === 'string') item.image_data_url = img;
  const wearFromKey = wearRaw != null ? parseInt(wearRaw, 10) : NaN;
  item.wear_count = !isNaN(wearFromKey) ? wearFromKey : (item.wear_count ?? 0);
  return item;
}

export async function insertItem(item: ItemRow): Promise<void> {
  const { image_data_url, ...meta } = item;

  // Pass values directly — redisSet does ONE JSON.stringify
  await Promise.all([
    redisSet(itemKey(item.id), { ...meta, image_data_url: '' }),
    image_data_url ? redisSet(imgKey(item.id), image_data_url) : Promise.resolve(),
  ]);

  const ids = await getIds(ITEM_IDS_KEY);
  if (!ids.includes(item.id)) {
    await setIds(ITEM_IDS_KEY, [item.id, ...ids]);
  }
}

export async function incrementWear(id: string): Promise<number> {
  return redisIncr(wearKey(id));
}

export async function updateItem(id: string, patch: Partial<ItemRow>): Promise<void> {
  const existing = await getItem(id);
  if (!existing) return;
  const { image_data_url, ...meta } = { ...existing, ...patch };
  await redisSet(itemKey(id), { ...meta, image_data_url: '' });
  if (image_data_url !== undefined && image_data_url !== existing.image_data_url) {
    await redisSet(imgKey(id), image_data_url);
  }
}

export async function deleteItem(id: string): Promise<void> {
  const ids = await getIds(ITEM_IDS_KEY);
  await setIds(ITEM_IDS_KEY, ids.filter((i) => i !== id));
  await Promise.all([
    redisSet(itemKey(id), ''),
    redisSet(imgKey(id), ''),
    redisSet(wearKey(id), '0'),
  ]);
}

export async function clearAllItems(): Promise<void> {
  await setIds(ITEM_IDS_KEY, []);
}

// No-op — no legacy blob to nuke under the new GET/SET-only design
export async function nukeLegacyBlob(): Promise<void> {}

// ---------------------------------------------------------------------------
// Image helpers (kept for backward compat with [id]/route.ts DELETE handler)
// ---------------------------------------------------------------------------

export async function getImage(filename: string): Promise<{ data: string; mimeType: string } | null> {
  const raw = await redisGet(`wardrobe:img-file:${filename}`);
  return parseVal<{ data: string; mimeType: string }>(raw);
}

export async function saveImage(filename: string, base64Data: string, mimeType: string): Promise<void> {
  await redisSet(`wardrobe:img-file:${filename}`, { data: base64Data, mimeType });
}

export async function deleteImage(filename: string): Promise<void> {
  await redisSet(`wardrobe:img-file:${filename}`, '');
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

async function readSettings(): Promise<Record<string, string>> {
  const raw = await redisGet(SETTINGS_KEY);
  const parsed = parseVal<Record<string, string>>(raw);
  return (parsed && typeof parsed === 'object') ? parsed : {};
}

async function writeSettings(settings: Record<string, string>): Promise<void> {
  await redisSet(SETTINGS_KEY, settings);
}

export async function getSetting(key: string): Promise<string | undefined> {
  const settings = await readSettings();
  return settings[key];
}

export async function setSetting(key: string, value: string): Promise<void> {
  const settings = await readSettings();
  settings[key] = value;
  await writeSettings(settings);
}

export async function deleteSetting(key: string): Promise<void> {
  const settings = await readSettings();
  delete settings[key];
  await writeSettings(settings);
}

// ---------------------------------------------------------------------------
// Saved looks
// ---------------------------------------------------------------------------

export async function getSavedLooks(): Promise<SavedLook[]> {
  const ids = await getIds(LOOK_IDS_KEY);
  if (!ids.length) return [];

  const looks = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisGet(lookKey(id));
      return parseVal<SavedLook>(raw);
    })
  );

  return looks
    .filter((l): l is SavedLook => l !== null)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function addSavedLook(look: SavedLook): Promise<void> {
  await redisSet(lookKey(look.id), look);
  const ids = await getIds(LOOK_IDS_KEY);
  if (!ids.includes(look.id)) {
    await setIds(LOOK_IDS_KEY, [look.id, ...ids]);
  }
}

export async function updateSavedLook(id: string, patch: Partial<SavedLook>): Promise<void> {
  const raw = await redisGet(lookKey(id));
  const existing = parseVal<SavedLook>(raw);
  if (!existing) return;
  await redisSet(lookKey(id), { ...existing, ...patch });
}

export async function deleteSavedLook(id: string): Promise<void> {
  const ids = await getIds(LOOK_IDS_KEY);
  await setIds(LOOK_IDS_KEY, ids.filter((i) => i !== id));
  await redisSet(lookKey(id), '');
}

// ---------------------------------------------------------------------------
// Outfit journal
// ---------------------------------------------------------------------------

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const ids = await getIds(JOURNAL_IDS_KEY);
  if (!ids.length) return [];

  const entries = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisGet(journalKey(id));
      return parseVal<JournalEntry>(raw);
    })
  );

  return entries
    .filter((e): e is JournalEntry => e !== null)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await redisSet(journalKey(entry.id), entry);
  const ids = await getIds(JOURNAL_IDS_KEY);
  if (!ids.includes(entry.id)) {
    await setIds(JOURNAL_IDS_KEY, [entry.id, ...ids]);
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const ids = await getIds(JOURNAL_IDS_KEY);
  await setIds(JOURNAL_IDS_KEY, ids.filter((i) => i !== id));
  await redisSet(journalKey(id), '');
}
