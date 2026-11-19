import type { StyleRequest, Wardrobe, EngineContext } from './types';

// The fixed request set. Every engine is scored on exactly these, against
// every test wardrobe, so results are comparable run to run.
export const REQUESTS: StyleRequest[] = [
  { key: 'r01', kind: 'everyday', text: 'What should I wear to work tomorrow?' },
  { key: 'r02', kind: 'occasion', text: 'Dinner with friends at a nice restaurant on Saturday night.' },
  { key: 'r03', kind: 'surprise', text: "Surprise me — put together something I wouldn't normally think of." },
  { key: 'r04', kind: 'weather', text: "It's raining all day and I'll be walking a lot. What should I wear?", weather: undefined },
  { key: 'r05', kind: 'occasion', text: 'First date — cocktails at a smart bar.' },
  { key: 'r06', kind: 'weekend', text: 'Weekend brunch and then wandering around the shops.' },
  { key: 'r07', kind: 'high-stakes', text: "I'm presenting to senior leadership next week. I want to look authoritative but still like me." },
  { key: 'r08', kind: 'hard', text: 'Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain.' },
  { key: 'r09', kind: 'focus-piece', text: 'How should I wear my {hero}?' },
  { key: 'r10', kind: 'practical', text: 'Long travel day tomorrow — I want to be comfortable but still look put-together.' },
];

export const EVAL_DATE = '2026-11-18';

export function seasonFor(hemisphere: 'north' | 'south', isoDate: string): string {
  const month = new Date(isoDate).getUTCMonth(); // 0 = Jan
  const north = ['winter', 'winter', 'early spring', 'spring', 'late spring', 'early summer', 'summer', 'late summer', 'early autumn', 'autumn', 'late autumn', 'winter'];
  const south = ['summer', 'late summer', 'early autumn', 'autumn', 'late autumn', 'early winter', 'winter', 'late winter', 'early spring', 'spring', 'late spring', 'early summer'];
  return (hemisphere === 'north' ? north : south)[month];
}

const RAIN_BY_CITY: Record<string, { tempC: number; conditions: string }> = {
  London: { tempC: 8, conditions: 'steady rain all day, breezy' },
  Copenhagen: { tempC: 5, conditions: 'heavy rain and strong wind all day' },
  Sydney: { tempC: 21, conditions: 'warm, humid, rain all day' },
  Berlin: { tempC: 3, conditions: 'cold rain all day' },
};

export function resolveRequest(req: StyleRequest, wardrobe: Wardrobe): EngineContext['request'] {
  const hero = wardrobe.items.find((i) => i.id === wardrobe.heroItemId);
  const weather = req.key === 'r04'
    ? RAIN_BY_CITY[wardrobe.client.location.city] ?? wardrobe.defaultWeather
    : req.weather ?? wardrobe.defaultWeather;
  return {
    ...req,
    resolvedText: req.text.replace('{hero}', hero ? `${hero.name.toLowerCase()} (${hero.id})` : 'hero piece'),
    weather,
    date: EVAL_DATE,
  };
}
