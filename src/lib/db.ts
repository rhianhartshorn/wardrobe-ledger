import 'server-only';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const KEY = 'wardrobe';

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

type Store = {
  items: ItemRow[];
  settings: Record<string, string>;
  images: Record<string, string>;
  imageTypes: Record<string, string>;
};

const EMPTY: Store = { items: [], settings: {}, images: {}, imageTypes: {} };

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

// ---------------------------------------------------------------------------
// Read / write
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
    };
  } catch {
    return { ...EMPTY };
  }
}

async function write(store: Store): Promise<void> {
  await redisSet(KEY, JSON.stringify(store));
}

// ---------------------------------------------------------------------------
// Item helpers
// ---------------------------------------------------------------------------

export async function getAllItems(): Promise<ItemRow[]> {
  const store = await read();
  return store.items.sort((a, b) => b.added_at - a.added_at);
}

export async function getItem(id: string): Promise<ItemRow | undefined> {
  const store = await read();
  return store.items.find((i) => i.id === id);
}

export async function insertItem(item: ItemRow): Promise<void> {
  const store = await read();
  store.items.push(item);
  await write(store);
}

export async function deleteItem(id: string): Promise<void> {
  const store = await read();
  store.items = store.items.filter((i) => i.id !== id);
  await write(store);
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
