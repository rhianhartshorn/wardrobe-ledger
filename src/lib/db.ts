import 'server-only';
import path from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_PATH = path.join(process.cwd(), 'wardrobe.json');

mkdirSync(UPLOADS_DIR, { recursive: true });

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
};

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

function read(): Store {
  if (!existsSync(DB_PATH)) return { items: [], settings: {} };
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf8')) as Store;
  } catch {
    return { items: [], settings: {} };
  }
}

function write(store: Store) {
  writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf8');
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
