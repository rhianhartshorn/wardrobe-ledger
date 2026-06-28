import 'server-only';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_PATH = path.join(process.cwd(), 'wardrobe.json');

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
  added_at: number;
};

type Store = {
  items: ItemRow[];
  settings: Record<string, string>;
  images: Record<string, string>; // filename → base64 data (no prefix)
  imageTypes: Record<string, string>; // filename → mime type
};

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

function read(): Store {
  if (!existsSync(DB_PATH)) return { items: [], settings: {}, images: {}, imageTypes: {} };
  try {
    const parsed = JSON.parse(readFileSync(DB_PATH, 'utf8')) as Store;
    return {
      items: parsed.items ?? [],
      settings: parsed.settings ?? {},
      images: parsed.images ?? {},
      imageTypes: parsed.imageTypes ?? {},
    };
  } catch {
    return { items: [], settings: {}, images: {}, imageTypes: {} };
  }
}

function write(store: Store) {
  writeFileSync(DB_PATH, JSON.stringify(store), 'utf8');
}

// ---------------------------------------------------------------------------
// Item helpers
// ---------------------------------------------------------------------------

export function getAllItems(): ItemRow[] {
  return read().items.sort((a, b) => b.added_at - a.added_at);
}

export function getItem(id: string): ItemRow | undefined {
  return read().items.find((i) => i.id === id);
}

export function insertItem(item: ItemRow) {
  const store = read();
  store.items.push(item);
  write(store);
}

export function deleteItem(id: string) {
  const store = read();
  store.items = store.items.filter((i) => i.id !== id);
  write(store);
}

// ---------------------------------------------------------------------------
// Image helpers (stored in DB instead of filesystem)
// ---------------------------------------------------------------------------

export function getImage(filename: string): { data: string; mimeType: string } | null {
  const store = read();
  const data = store.images[filename];
  if (!data) return null;
  return { data, mimeType: store.imageTypes[filename] ?? 'image/jpeg' };
}

export function saveImage(filename: string, base64Data: string, mimeType: string) {
  const store = read();
  store.images[filename] = base64Data;
  store.imageTypes[filename] = mimeType;
  write(store);
}

export function deleteImage(filename: string) {
  const store = read();
  delete store.images[filename];
  delete store.imageTypes[filename];
  write(store);
}

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | undefined {
  return read().settings[key];
}

export function setSetting(key: string, value: string) {
  const store = read();
  store.settings[key] = value;
  write(store);
}

export function deleteSetting(key: string) {
  const store = read();
  delete store.settings[key];
  write(store);
}
