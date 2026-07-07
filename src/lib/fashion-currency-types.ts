export type FashionCurrencyItem = {
  itemId: string;
  era: string;
  status: 'timeless' | 'current' | 'dated' | 'coming-back';
  howNow: string | null;
};

export type StoredFashionCurrency = {
  season: string;       // e.g. "summer-2026"
  generatedAt: string;  // ISO date string
  fashionCurrency: FashionCurrencyItem[];
};

export function getCurrentSeasonTag(): string {
  const m = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  if (m >= 3 && m <= 5) return `spring-${year}`;
  if (m >= 6 && m <= 8) return `summer-${year}`;
  if (m >= 9 && m <= 11) return `autumn-${year}`;
  return `winter-${year}`;
}
