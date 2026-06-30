import type { WardrobeItem } from '@/app/page';
import { COLOR_HEX } from './constants';

// Strip imageUrl (base64) before sending items to analysis APIs — saves megabytes per request
export function slim(items: WardrobeItem[]) {
  return items.map(({ imageUrl: _, imageFilename: __, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// Outfit combinatorics — every sensible pairing of closet items, generated
// deterministically (no AI cost), tagged by formality/season.
// ---------------------------------------------------------------------------

export type OutfitCombo = {
  id: string;
  pieces: WardrobeItem[];
  outerwear?: WardrobeItem;
  accessory?: WardrobeItem;
  formality: string;
  season: string;
};

const FORMALITY_RANK: Record<string, number> = {
  Athletic: 0, Casual: 1, 'Smart Casual': 2, Business: 3, Formal: 4,
};

function formalityCompatible(a?: string, b?: string): boolean {
  if (!a || !b) return true;
  return a === b;
}

function seasonCompatible(a?: string, b?: string): boolean {
  if (!a || !b || a === 'All-season' || b === 'All-season') return true;
  return a === b;
}

function pickFormality(items: WardrobeItem[]): string {
  const specific = items.map((i) => i.formality).filter(Boolean);
  if (!specific.length) return 'Casual';
  return specific.reduce((most, f) => (FORMALITY_RANK[f] ?? 1) > (FORMALITY_RANK[most] ?? 1) ? f : most, specific[0]);
}

function pickSeason(items: WardrobeItem[]): string {
  const specific = items.map((i) => i.season).filter((s) => s && s !== 'All-season');
  return specific[0] ?? 'All-season';
}

function bestLayer(candidates: WardrobeItem[], base: WardrobeItem[]): WardrobeItem | undefined {
  return candidates.find((c) => base.every((b) => formalityCompatible(c.formality, b.formality) && seasonCompatible(c.season, b.season)));
}

export function generateCombinations(items: WardrobeItem[], cap = 240): OutfitCombo[] {
  const byCat = (cat: string) => items.filter((i) => i.category === cat);
  const dresses = byCat('Dress/One-piece');
  const tops = byCat('Top');
  const bottoms = byCat('Bottom');
  const footwear = byCat('Footwear');
  const outerwear = byCat('Outerwear');
  const accessories = byCat('Accessory');

  const combos: OutfitCombo[] = [];

  const pushCombo = (pieces: WardrobeItem[]) => {
    const layer1 = bestLayer(outerwear, pieces);
    const layer2 = bestLayer(accessories, pieces);
    combos.push({
      id: pieces.map((p) => p.id).join('-'),
      pieces,
      outerwear: layer1,
      accessory: layer2,
      formality: pickFormality(pieces),
      season: pickSeason(pieces),
    });
  };

  for (const dress of dresses) {
    if (footwear.length === 0) { pushCombo([dress]); continue; }
    for (const shoe of footwear) {
      if (formalityCompatible(dress.formality, shoe.formality) && seasonCompatible(dress.season, shoe.season)) {
        pushCombo([dress, shoe]);
      }
    }
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!formalityCompatible(top.formality, bottom.formality) || !seasonCompatible(top.season, bottom.season)) continue;
      if (footwear.length === 0) { pushCombo([top, bottom]); continue; }
      for (const shoe of footwear) {
        if (
          formalityCompatible(top.formality, shoe.formality) &&
          formalityCompatible(bottom.formality, shoe.formality) &&
          seasonCompatible(top.season, shoe.season) &&
          seasonCompatible(bottom.season, shoe.season)
        ) {
          pushCombo([top, bottom, shoe]);
        }
      }
    }
  }

  return combos.slice(0, cap);
}

export function colorDot(name: string | null | undefined): string {
  if (!name) return '#a8a29e';
  const key = name.toLowerCase().trim();
  for (const k in COLOR_HEX) {
    if (key.includes(k)) return COLOR_HEX[k];
  }
  return '#a8a29e';
}

export function compressImage(file: File, maxDim = 340, quality = 0.62): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target!.result as string;
      const img = new Image();
      const sizeCap = 220_000;

      img.onload = () => {
        const draw = (dim: number, q: number): string | null => {
          try {
            let w = img.width, h = img.height;
            if (w > h) {
              if (w > dim) { h = Math.round((h * dim) / w); w = dim; }
            } else {
              if (h > dim) { w = Math.round((w * dim) / h); h = dim; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
            return canvas.toDataURL('image/jpeg', q);
          } catch {
            return null;
          }
        };

        const passes: [number, number][] = [
          [maxDim, quality],
          [Math.round(maxDim * 0.75), quality * 0.8],
          [Math.round(maxDim * 0.55), 0.4],
          [160, 0.35],
        ];

        let out: string | null = null;
        for (const [dim, q] of passes) {
          out = draw(dim, q);
          if (out && out.length < sizeCap) break;
        }

        if (out) resolve(out);
        else if (rawDataUrl.length < sizeCap * 2) resolve(rawDataUrl);
        else reject(new Error('That photo is too large. Try a different, smaller photo.'));
      };

      img.onerror = () => {
        if (rawDataUrl.length < sizeCap * 2) resolve(rawDataUrl);
        else reject(new Error("Couldn't process that photo's format. Try a JPEG or PNG instead."));
      };

      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}
