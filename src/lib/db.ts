import 'server-only';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

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

// ---------------------------------------------------------------------------
// Redis REST helpers — GET and SET only (proven to work with Upstash REST).
// All hash-based operations have been replaced with GET/SET + an ID-list pattern.
// ---------------------------------------------------------------------------

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json() as { result: string | null };
  return json.result;
}

async function redisSet(key: string, value: string): Promise<void> {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
}

// ---------------------------------------------------------------------------
// ID-list helpers
// Each entity type (items, looks, journal) maintains a JSON array of its IDs.
// Clearing an entity type means writing [] — no DEL command needed.
// ---------------------------------------------------------------------------

async function getIds(listKey: string): Promise<string[]> {
  const raw = await redisGet(listKey);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

async function setIds(listKey: string, ids: string[]): Promise<void> {
  await redisSet(listKey, JSON.stringify(ids));
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
const lookKey    = (id: string) => `wardrobe:look:${id}`;
const journalKey = (id: string) => `wardrobe:journal:${id}`;

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function getAllItems(): Promise<ItemRow[]> {
  const ids = await getIds(ITEM_IDS_KEY);
  if (!ids.length) return [];

  const items = await Promise.all(
    ids.map(async (id) => {
      const [metaRaw, imgRaw] = await Promise.all([
        redisGet(itemKey(id)),
        redisGet(imgKey(id)),
      ]);
      if (!metaRaw) return null;
      try {
        const item = JSON.parse(metaRaw) as ItemRow;
        if (imgRaw) item.image_data_url = imgRaw;
        return item;
      } catch { return null; }
    })
  );

  return items
    .filter((item): item is ItemRow => item !== null)
    .sort((a, b) => b.added_at - a.added_at);
}

export async function getItem(id: string): Promise<ItemRow | undefined> {
  const metaRaw = await redisGet(itemKey(id));
  if (!metaRaw) return undefined;
  try {
    const item = JSON.parse(metaRaw) as ItemRow;
    const imgRaw = await redisGet(imgKey(id));
    if (imgRaw) item.image_data_url = imgRaw;
    return item;
  } catch { return undefined; }
}

export async function insertItem(item: ItemRow): Promise<void> {
  const { image_data_url, ...meta } = item;

  await Promise.all([
    redisSet(itemKey(item.id), JSON.stringify({ ...meta, image_data_url: '' })),
    image_data_url ? redisSet(imgKey(item.id), image_data_url) : Promise.resolve(),
  ]);

  const ids = await getIds(ITEM_IDS_KEY);
  if (!ids.includes(item.id)) {
    await setIds(ITEM_IDS_KEY, [item.id, ...ids]);
  }
}

export async function deleteItem(id: string): Promise<void> {
  const ids = await getIds(ITEM_IDS_KEY);
  await setIds(ITEM_IDS_KEY, ids.filter((i) => i !== id));
  // Blank out the data so orphaned keys don't waste space
  await Promise.all([
    redisSet(itemKey(id), ''),
    redisSet(imgKey(id), ''),
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
  if (!raw) return null;
  try { return JSON.parse(raw) as { data: string; mimeType: string }; } catch { return null; }
}

export async function saveImage(filename: string, base64Data: string, mimeType: string): Promise<void> {
  await redisSet(`wardrobe:img-file:${filename}`, JSON.stringify({ data: base64Data, mimeType }));
}

export async function deleteImage(filename: string): Promise<void> {
  await redisSet(`wardrobe:img-file:${filename}`, '');
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

async function readSettings(): Promise<Record<string, string>> {
  const raw = await redisGet(SETTINGS_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
}

async function writeSettings(settings: Record<string, string>): Promise<void> {
  await redisSet(SETTINGS_KEY, JSON.stringify(settings));
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
      if (!raw) return null;
      try { return JSON.parse(raw) as SavedLook; } catch { return null; }
    })
  );

  return looks
    .filter((l): l is SavedLook => l !== null)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function addSavedLook(look: SavedLook): Promise<void> {
  await redisSet(lookKey(look.id), JSON.stringify(look));
  const ids = await getIds(LOOK_IDS_KEY);
  if (!ids.includes(look.id)) {
    await setIds(LOOK_IDS_KEY, [look.id, ...ids]);
  }
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
      if (!raw) return null;
      try { return JSON.parse(raw) as JournalEntry; } catch { return null; }
    })
  );

  return entries
    .filter((e): e is JournalEntry => e !== null)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await redisSet(journalKey(entry.id), JSON.stringify(entry));
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
