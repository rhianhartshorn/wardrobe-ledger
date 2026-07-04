import 'server-only';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const KEY = 'wardrobe'; // legacy blob — settings/images only now, see migration note below

const ITEMS_KEY = 'wardrobe:items';
const LOOKS_KEY = 'wardrobe:looks';
const JOURNAL_KEY = 'wardrobe:journal';
const MIGRATION_FLAG_KEY = 'wardrobe:migrated_v2';

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
  image_filename: string;
  image_data_url: string;
  added_at: number;
};

export type SavedLook = {
  id: string;
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  savedAt: number;
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

type Store = {
  items: ItemRow[];
  settings: Record<string, string>;
  images: Record<string, string>;
  imageTypes: Record<string, string>;
  savedLooks: SavedLook[];
  journalEntries: JournalEntry[];
};

const EMPTY: Store = { items: [], settings: {}, images: {}, imageTypes: {}, savedLooks: [], journalEntries: [] };

// ---------------------------------------------------------------------------
// Redis REST helpers
// ---------------------------------------------------------------------------

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json() as { result: string | null };
  return json.result;
}

async function redisSet(key: string, value: string): Promise<void> {
  await fetch(`${REDIS_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}

// Hash helpers using the same URL-path format as redisGet/redisSet (proven to work).
// Value is stored as a raw JSON string; callers pass JSON.stringify(obj) as value.

function enc(s: string) { return encodeURIComponent(s); }

async function checkErr(res: Response): Promise<{ result: unknown; error?: string }> {
  const json = await res.json() as { result: unknown; error?: string };
  if (json.error) throw new Error(`Redis error: ${json.error}`);
  return json;
}

async function redisHSet(key: string, field: string, value: string): Promise<void> {
  const res = await fetch(`${REDIS_URL}/hset/${enc(key)}/${enc(field)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
  await checkErr(res);
}

async function redisHDel(key: string, field: string): Promise<void> {
  const res = await fetch(`${REDIS_URL}/hdel/${enc(key)}/${enc(field)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  await checkErr(res);
}

async function redisHGetAll(key: string): Promise<unknown> {
  const res = await fetch(`${REDIS_URL}/hgetall/${enc(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await checkErr(res);
  return json.result;
}

async function redisDel(key: string): Promise<void> {
  const res = await fetch(`${REDIS_URL}/del/${enc(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  await checkErr(res);
}

async function redisHGet(key: string, field: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/hget/${enc(key)}/${enc(field)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await checkErr(res);
  return json.result as string | null;
}

function parseHashValues<T>(raw: unknown): T[] {
  const out: T[] = [];
  if (Array.isArray(raw)) {
    for (let i = 1; i < raw.length; i += 2) {
      try { out.push(JSON.parse(raw[i] as string) as T); } catch { /* skip corrupt entry */ }
    }
  } else if (raw && typeof raw === 'object') {
    for (const v of Object.values(raw as Record<string, string>)) {
      try { out.push(JSON.parse(v) as T); } catch { /* skip corrupt entry */ }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Legacy blob read/write — settings + images only (low write frequency,
// read-modify-write race risk is acceptable here for now)
// ---------------------------------------------------------------------------

async function read(): Promise<Store> {
  try {
    const raw = await redisGet(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Store;
    return {
      items: parsed.items ?? [],
      settings: parsed.settings ?? {},
      images: parsed.images ?? {},
      imageTypes: parsed.imageTypes ?? {},
      savedLooks: parsed.savedLooks ?? [],
      journalEntries: parsed.journalEntries ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function write(store: Store): Promise<void> {
  await redisSet(KEY, JSON.stringify(store));
}

// Migration disabled — legacy blob contained data from a different Railway
// project sharing the same Upstash instance, causing ghost items on every load.
async function migrateToHashesIfNeeded(): Promise<void> {
  // no-op: hashes are the only storage now, nothing to migrate
}

// ---------------------------------------------------------------------------
// Item helpers — metadata in hash, image stored as separate string key
// so large base64 values don't bloat hash fields or HGETALL responses.
// ---------------------------------------------------------------------------

function imgKey(id: string) { return `wardrobe:img:${id}`; }

export async function getAllItems(): Promise<ItemRow[]> {
  await migrateToHashesIfNeeded();
  const raw = await redisHGetAll(ITEMS_KEY);
  const items = parseHashValues<ItemRow>(raw);
  // Fetch images in parallel — stored separately so hash stays small
  await Promise.all(items.map(async (item) => {
    if (!item.image_data_url) {
      const img = await redisGet(imgKey(item.id));
      if (img) item.image_data_url = img;
    }
  }));
  return items.sort((a, b) => b.added_at - a.added_at);
}

export async function getItem(id: string): Promise<ItemRow | undefined> {
  await migrateToHashesIfNeeded();
  const raw = await redisHGet(ITEMS_KEY, id);
  if (!raw) return undefined;
  try {
    const item = JSON.parse(raw) as ItemRow;
    if (!item.image_data_url) {
      const img = await redisGet(imgKey(id));
      if (img) item.image_data_url = img;
    }
    return item;
  } catch { return undefined; }
}

export async function insertItem(item: ItemRow): Promise<void> {
  await migrateToHashesIfNeeded();
  const { image_data_url, ...meta } = item;
  // Store image separately so the hash field stays small and HGETALL is fast
  if (image_data_url) await redisSet(imgKey(item.id), image_data_url);
  await redisHSet(ITEMS_KEY, item.id, JSON.stringify({ ...meta, image_data_url: '' }));
}

export async function deleteItem(id: string): Promise<void> {
  await migrateToHashesIfNeeded();
  await Promise.all([
    redisHDel(ITEMS_KEY, id),
    redisDel(imgKey(id)).catch(() => {}),
  ]);
}

export async function clearAllItems(): Promise<void> {
  await redisDel(ITEMS_KEY);
  await redisDel(MIGRATION_FLAG_KEY);
  migrationChecked = false;
}

// Wipes the legacy blob and sets the migration flag so the old data
// can never be re-imported again on next load.
export async function nukeLegacyBlob(): Promise<void> {
  await redisDel(KEY);
  await redisSet(MIGRATION_FLAG_KEY, '1');
  migrationChecked = true;
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

export async function getImage(filename: string): Promise<{ data: string; mimeType: string } | null> {
  const store = await read();
  const data = store.images[filename];
  if (!data) return null;
  return { data, mimeType: store.imageTypes[filename] ?? 'image/jpeg' };
}

export async function saveImage(filename: string, base64Data: string, mimeType: string): Promise<void> {
  const store = await read();
  store.images[filename] = base64Data;
  store.imageTypes[filename] = mimeType;
  await write(store);
}

export async function deleteImage(filename: string): Promise<void> {
  const store = await read();
  delete store.images[filename];
  delete store.imageTypes[filename];
  await write(store);
}

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | undefined> {
  const store = await read();
  return store.settings[key];
}

export async function setSetting(key: string, value: string): Promise<void> {
  const store = await read();
  store.settings[key] = value;
  await write(store);
}

export async function deleteSetting(key: string): Promise<void> {
  const store = await read();
  delete store.settings[key];
  await write(store);
}

// ---------------------------------------------------------------------------
// Saved looks — atomic hash operations
// ---------------------------------------------------------------------------

export async function getSavedLooks(): Promise<SavedLook[]> {
  await migrateToHashesIfNeeded();
  const raw = await redisHGetAll(LOOKS_KEY);
  return parseHashValues<SavedLook>(raw).sort((a, b) => b.savedAt - a.savedAt);
}

export async function addSavedLook(look: SavedLook): Promise<void> {
  await migrateToHashesIfNeeded();
  await redisHSet(LOOKS_KEY, look.id, JSON.stringify(look));
}

export async function deleteSavedLook(id: string): Promise<void> {
  await migrateToHashesIfNeeded();
  await redisHDel(LOOKS_KEY, id);
}

// ---------------------------------------------------------------------------
// Outfit journal — atomic hash operations
// ---------------------------------------------------------------------------

export async function getJournalEntries(): Promise<JournalEntry[]> {
  await migrateToHashesIfNeeded();
  const raw = await redisHGetAll(JOURNAL_KEY);
  return parseHashValues<JournalEntry>(raw).sort((a, b) => b.loggedAt - a.loggedAt);
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await migrateToHashesIfNeeded();
  await redisHSet(JOURNAL_KEY, entry.id, JSON.stringify(entry));
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await migrateToHashesIfNeeded();
  await redisHDel(JOURNAL_KEY, id);
}
