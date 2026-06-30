import type { WardrobeItem } from '@/app/page';
import { COLOR_HEX } from './constants';

// Strip imageUrl (base64) before sending items to analysis APIs — saves megabytes per request
export function slim(items: WardrobeItem[]) {
  return items.map(({ imageUrl: _, imageFilename: __, ...rest }) => rest);
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
