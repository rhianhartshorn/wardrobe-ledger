import type { WardrobeItem } from '@/app/page';
import { COLOR_HEX } from './constants';

// Strip imageUrl (base64) before sending items to analysis APIs — saves megabytes per request
export function slim(items: WardrobeItem[]) {
  return items.map(({ imageUrl: _, imageFilename: __, ...rest }) => rest);
}

// Build a wear behaviour summary string for injecting into AI prompts
export function buildWearBehaviourSummary(items: WardrobeItem[]): string {
  const totalWears = items.reduce((sum, i) => sum + (i.wearCount ?? 0), 0);
  if (totalWears === 0) return '';

  const neverWorn = items.filter((i) => (i.wearCount ?? 0) === 0);

  const catWear: Record<string, number> = {};
  items.forEach((i) => { catWear[i.category] = (catWear[i.category] ?? 0) + (i.wearCount ?? 0); });
  const topCat = Object.entries(catWear).sort((a, b) => b[1] - a[1])[0];

  const formalityWear: Record<string, number> = {};
  items.forEach((i) => { formalityWear[i.formality] = (formalityWear[i.formality] ?? 0) + (i.wearCount ?? 0); });
  const topFormalities = Object.entries(formalityWear)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([f, v]) => `${f} (${Math.round((v / totalWears) * 100)}%)`);

  const parts: string[] = [];
  if (topCat) parts.push(`Most-worn category: ${topCat[0]}`);
  if (topFormalities.length > 1) parts.push(`Formality they actually live in: ${topFormalities.join(' → ')}`);
  if (neverWorn.length > 0) {
    const names = neverWorn.slice(0, 3).map((i) => i.name).join(', ');
    parts.push(`${neverWorn.length} item${neverWorn.length > 1 ? 's' : ''} never worn (${names}${neverWorn.length > 3 ? ` +${neverWorn.length - 3} more` : ''})`);
  }
  return parts.join('. ');
}

// Build a numbered image grid from wardrobe item thumbnails for visual AI context.
// Returns base64 JPEG (no data: prefix) + a numbered mapping string, or null if
// running server-side or no items have images.
export async function buildWardrobeGrid(
  items: WardrobeItem[],
): Promise<{ base64: string; mapping: string } | null> {
  if (typeof document === 'undefined') return null;
  const withImages = items.filter((i) => i.imageUrl);
  if (withImages.length === 0) return null;

  const COLS = 4;
  const CELL = 90;
  const LABEL_H = 14;
  const rows = Math.ceil(withImages.length / COLS);

  const canvas = document.createElement('canvas');
  canvas.width = COLS * CELL;
  canvas.height = rows * (CELL + LABEL_H);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f5f2ec';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await Promise.all(
    withImages.map((item, i) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = col * CELL;
          const y = row * (CELL + LABEL_H);
          // object-cover crop
          const scale = Math.max(CELL / img.width, CELL / img.height);
          const sw = CELL / scale;
          const sh = CELL / scale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, x, y, CELL, CELL);
          // dark label bar
          ctx.fillStyle = 'rgba(26,23,20,0.72)';
          ctx.fillRect(x, y + CELL - LABEL_H, CELL, LABEL_H);
          ctx.fillStyle = '#f5f2ec';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x + CELL / 2, y + CELL - 3);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = item.imageUrl!;
      }),
    ),
  );

  const base64 = canvas.toDataURL('image/jpeg', 0.65).replace(/^data:[^;]+;base64,/, '');
  const mapping = withImages.map((it, i) => `${i + 1}="${it.name}" (id:${it.id})`).join(', ');
  return { base64, mapping };
}

export function colorDot(name: string | null | undefined): string {
  if (!name) return '#a8a29e';
  const key = name.toLowerCase().trim();
  for (const k in COLOR_HEX) {
    if (key.includes(k)) return COLOR_HEX[k];
  }
  return '#a8a29e';
}

export function compressImage(file: File, maxDim = 340, quality = 0.62, sizeCap = 220_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target!.result as string;
      const img = new Image();

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
        else if (rawDataUrl.length < sizeCap * 4) resolve(rawDataUrl);
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
