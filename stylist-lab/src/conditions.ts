import type { EngineContext, Item, StylistOutput } from './types';
import { seasonFor } from './requests';

// Real-life conditions, worked out in code before any model call. The
// baseline treated weather and activity as an afterthought — the single
// biggest source of failures — so here they become explicit facts, item
// tags, and hard checks on the finished looks.

export type Conditions = {
  season: string;
  tempC: number;
  weather: string;
  rain: boolean;
  heavyRain: boolean; // sustained rain, not showers or a forecast "might"
  tempBand: 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  needsOuterwear: boolean;
  cycling: boolean;
  walkingALot: boolean;
  muchTimeOutside: boolean; // vs. mostly indoors with a coat for the journey
  outdoorEvent: boolean;
  formality: [number, number] | null; // target range for the clothes, or null when open
  heelLimitCm: number | null;
  rules: string[];                    // plain-language rules for the stylist
};

const has = (re: RegExp, s: string) => re.test(s.toLowerCase());

export function heelCm(i: Item): number {
  if (i.category !== 'shoes') return 0;
  const m = /(\d+(?:\.\d+)?)\s?cm/.exec(i.silhouette);
  return m ? parseFloat(m[1]) : 0;
}

function formalityTarget(text: string): [number, number] | null {
  const t = text.toLowerCase();
  if (/wedding|black tie|gala/.test(t)) return [4, 5];
  if (/leadership|presentation|presenting|board|interview|pitch/.test(t)) return [3, 4];
  if (/cocktail|smart bar|nice restaurant|dinner/.test(t)) return [3, 4];
  if (/travel/.test(t)) return [1, 2];
  if (/brunch|weekend|shops/.test(t)) return [1, 3];
  if (/work/.test(t)) return [2, 3];
  return null;
}

export function deriveConditions(ctx: EngineContext): Conditions {
  const { request, wardrobe } = ctx;
  const c = wardrobe.client;
  const text = request.resolvedText;
  const temp = request.weather.tempC;
  const rain = has(/rain|shower|drizzle|wet/, request.weather.conditions) || has(/rain/, text);
  const heavyRain = has(/rain all day|heavy rain|steady rain|cold rain/, request.weather.conditions) || has(/raining all day/, text);
  const tempBand = temp < 8 ? 'cold' : temp < 14 ? 'cool' : temp < 20 ? 'mild' : temp < 27 ? 'warm' : 'hot';

  const cycleDirective = c.directives.find((d) => has(/cycl/, d));
  const commuteDay = ['everyday', 'high-stakes', 'weather'].includes(request.kind);
  const cycling = !!cycleDirective && (has(/everything|always/, cycleDirective) || commuteDay);
  const walkingALot = has(/walk|wander|shops|travel/, text);
  const outdoorEvent = has(/outdoor/, text);
  const muchTimeOutside = walkingALot || outdoorEvent || cycling || ['everyday', 'weather'].includes(request.kind);

  const heelDirective = c.directives.find((d) => has(/heel/, d));
  let heelLimitCm: number | null = null;
  if (heelDirective) {
    const m = /(\d+)\s?cm/.exec(heelDirective);
    if (m) heelLimitCm = parseInt(m[1], 10);
    else if (has(/flat/, heelDirective)) heelLimitCm = has(/wedding/, text) && has(/wedding/, heelDirective) ? 5 : 0;
  }

  const formality = formalityTarget(text);
  const needsOuterwear = temp < 14;

  const rules: string[] = [];
  rules.push(`It is ${temp}°C and ${request.weather.conditions} (${tempBand}).`);
  if (needsOuterwear) rules.push('Every look needs outerwear for getting there and back, and the whole look must be warm enough for the time spent outside.');
  if (heavyRain) rules.push('Sustained rain: outerwear must be rain-ready, shoes must cope with wet ground, and avoid delicate fabrics (suede, velvet, silk) where they will get wet. Full-length hems will drag and wick on wet ground unless they clear the shoe.');
  else if (rain) rules.push('Possible showers: prefer shoes that cope with wet ground, especially if walking or standing outside; a wool coat is fine for short trips, but say how to handle a downpour.');
  if (cycling) rules.push('The client cycles today: no long or loose hems that can catch, no coats that tangle on the bike, shoes that grip the pedals.');
  if (walkingALot) rules.push('Lots of walking: comfortable shoes the client can walk in all day.');
  if (outdoorEvent) rules.push('Outdoor event: plan for standing outside for a while, and for the ground underfoot.');
  if (formality) rules.push(`Target formality for the clothes: ${formality[0]}–${formality[1]} out of 5.`);
  if (heelLimitCm !== null) rules.push(heelLimitCm === 0 ? 'Flat shoes only.' : `No heels higher than ${heelLimitCm}cm.`);

  return {
    season: seasonFor(c.location.hemisphere, request.date), tempC: temp, weather: request.weather.conditions,
    rain, heavyRain, tempBand, needsOuterwear, cycling, walkingALot, muchTimeOutside, outdoorEvent, formality, heelLimitCm, rules,
  };
}

const rainReady = (i: Item) => has(/waterproof|water-resistant|shower-resistant|rainproof/, i.notes ?? '')
  || has(/waxed|gabardine|membrane|rubber/, i.material);
const rainRisky = (i: Item) => has(/suede|velvet|\bsilk\b|satin|faux fur|calf hair|mesh/, `${i.material} ${i.pattern}`)
  || has(/not for (heavy )?rain/, i.notes ?? '')
  || (i.category === 'shoes' && has(/sandal|strappy|slide/, `${i.name} ${i.silhouette}`));
const cycleRisky = (i: Item, wet: boolean) =>
  (i.category === 'dress' || i.category === 'bottom') && has(/maxi|midi|tulle/, i.silhouette) && !has(/trouser|jean|jumpsuit|wide-leg/, `${i.name} ${i.silhouette}`)
  || (i.category === 'outerwear' && has(/awkward on the bike|knee length|below the knee|longline/, `${i.silhouette} ${i.notes ?? ''}`))
  || (i.category === 'shoes' && has(/leather sole|slippery|stiletto/, `${i.silhouette} ${i.notes ?? ''}`))
  || (i.category === 'shoes' && wet && has(/crepe/, `${i.silhouette} ${i.notes ?? ''}`));

// Items removed outright: only clear-cut directive violations.
export function excludedItems(items: Item[], cond: Conditions): Set<string> {
  const out = new Set<string>();
  for (const i of items) {
    if (cond.heelLimitCm !== null && heelCm(i) > cond.heelLimitCm) out.add(i.id);
  }
  return out;
}

// What each remaining item means today — shown to the stylist next to the item.
export function itemTags(i: Item, cond: Conditions): string[] {
  const tags: string[] = [];
  // Light showers: only point out what's genuinely rain-ready; marking
  // everything else "not rain-ready" pushed the stylist into rain gear for
  // weddings. Sustained rain (or lots of time outside in showers): full tags.
  const wetDay = cond.heavyRain || (cond.rain && cond.muchTimeOutside);
  if (cond.rain && (i.category === 'outerwear' || i.category === 'shoes')) {
    const ready = rainReady(i) || (i.category === 'shoes' && !rainRisky(i));
    if (ready && i.category === 'outerwear') tags.push('rain-ready');
    if (!ready && wetDay) tags.push('not rain-ready');
    if (!ready && !wetDay && i.category === 'shoes') tags.push('not for wet ground');
  }
  if (wetDay && i.category !== 'outerwear' && i.category !== 'shoes' && rainRisky(i)) tags.push('delicate if wet');
  if (cond.cycling && cycleRisky(i, cond.rain)) tags.push('risky on the bike');
  if (cond.needsOuterwear && cond.muchTimeOutside && ['top', 'dress'].includes(i.category) && i.warmth <= 1) tags.push('very light for today');
  if (cond.formality && ['top', 'bottom', 'dress', 'layer'].includes(i.category)) {
    if (i.formality < cond.formality[0] - 1) tags.push('too casual for this');
    if (i.formality > cond.formality[1] + 1) tags.push('too dressy for this');
  }
  return tags;
}

export type ConditionViolation = { look: number; detail: string };

// Hard checks on finished looks against today's conditions.
export function checkConditions(output: StylistOutput, items: Item[], cond: Conditions): ConditionViolation[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const v: ConditionViolation[] = [];
  output.looks.forEach((look, idx) => {
    const n = idx + 1;
    const pieces = look.itemIds.map((id) => byId.get(id)).filter((i): i is Item => !!i);
    const of = (cat: string) => pieces.filter((p) => p.category === cat);
    const outer = of('outerwear');
    const shoes = of('shoes');

    if (cond.heelLimitCm !== null && shoes.some((s) => heelCm(s) > cond.heelLimitCm!)) v.push({ look: n, detail: `Shoes break the heel limit (${cond.heelLimitCm}cm).` });
    if (cond.needsOuterwear && outer.length === 0) v.push({ look: n, detail: `No outerwear at ${cond.tempC}°C.` });
    if (cond.tempC < 8) {
      const outerWarmth = Math.max(0, ...outer.map((o) => o.warmth));
      const coreWarmth = Math.max(0, ...pieces.filter((p) => ['top', 'dress', 'layer'].includes(p.category)).map((p) => p.warmth));
      if (outerWarmth < 4 && !(outerWarmth >= 3 && coreWarmth >= 3)) v.push({ look: n, detail: `Not warm enough for ${cond.tempC}°C (outerwear warmth ${outerWarmth}, warmest underneath ${coreWarmth}).` });
    }
    if (cond.heavyRain && !outer.some(rainReady)) v.push({ look: n, detail: 'Sustained rain but no rain-ready outerwear.' });
    if (cond.heavyRain || (cond.rain && (cond.walkingALot || cond.outdoorEvent))) {
      const badShoes = shoes.filter(rainRisky);
      if (badShoes.length) v.push({ look: n, detail: `Shoes will suffer in the wet: ${badShoes.map((s) => s.id).join(', ')}.` });
    }
    if (cond.cycling) {
      const risky = pieces.filter((p) => cycleRisky(p, cond.rain));
      if (risky.length) v.push({ look: n, detail: `Not bike-friendly: ${risky.map((r) => `${r.id} (${r.name})`).join(', ')}.` });
    }
    if (cond.formality) {
      const clothes = pieces.filter((p) => ['top', 'bottom', 'dress', 'layer'].includes(p.category));
      const top = Math.max(0, ...clothes.map((p) => p.formality));
      if (clothes.length && top < cond.formality[0] - 1) v.push({ look: n, detail: `Under-dressed: dressiest piece is formality ${top}, target ${cond.formality[0]}–${cond.formality[1]}.` });
    }
  });
  return v;
}
