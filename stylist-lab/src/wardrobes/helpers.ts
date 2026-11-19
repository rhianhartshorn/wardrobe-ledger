import type { Category, Item } from '../types';

type F = Item['formality'];
type W = Item['warmth'];

export function it(
  id: string, category: Category, name: string, colours: string[], pattern: string,
  material: string, silhouette: string, formality: F, warmth: W, wears: number, notes?: string,
): Item {
  return { id, category, name, colours, pattern, material, silhouette, formality, warmth, wears, notes };
}
