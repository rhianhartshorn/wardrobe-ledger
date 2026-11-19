import type { StylistOutput, Wardrobe } from './types';

export type Severity = 'critical' | 'major' | 'minor';
export type CheckFailure = { look?: number; code: string; severity: Severity; detail: string };

const CLOTHING = new Set(['top', 'bottom', 'dress', 'layer', 'outerwear']);

// Rules code can verify with certainty — never left to a model's judgement.
export function runChecks(output: StylistOutput, w: Wardrobe): CheckFailure[] {
  const byId = new Map(w.items.map((i) => [i.id, i]));
  const failures: CheckFailure[] = [];

  if (output.looks.length === 0) {
    failures.push({ code: 'NO_LOOKS', severity: 'critical', detail: 'No looks returned.' });
  }

  output.looks.forEach((look, idx) => {
    const n = idx + 1;
    const unknown = look.itemIds.filter((id) => !byId.has(id));
    if (unknown.length) failures.push({ look: n, code: 'UNOWNED_ITEM', severity: 'critical', detail: `Not in wardrobe: ${unknown.join(', ')}` });

    const items = look.itemIds.map((id) => byId.get(id)).filter((i) => !!i);
    const count = (c: string) => items.filter((i) => i!.category === c).length;
    const hasDress = count('dress') > 0;
    const hasTop = count('top') > 0;
    const hasBottom = count('bottom') > 0;

    if (!hasDress && !(hasTop && hasBottom)) {
      failures.push({ look: n, code: 'INCOMPLETE', severity: 'critical', detail: 'Needs a top and a bottom, or a dress/jumpsuit.' });
    }
    if (count('shoes') === 0) failures.push({ look: n, code: 'NO_SHOES', severity: 'critical', detail: 'No shoes chosen.' });
    if (count('layer') > 0 && !hasTop && !hasDress) {
      failures.push({ look: n, code: 'LAYER_WITHOUT_BASE', severity: 'critical', detail: 'A layer with nothing underneath it.' });
    }
    if (count('shoes') > 1) failures.push({ look: n, code: 'TWO_PAIRS_OF_SHOES', severity: 'critical', detail: 'More than one pair of shoes.' });
    if (count('dress') > 1) failures.push({ look: n, code: 'TWO_DRESSES', severity: 'critical', detail: 'More than one dress.' });
    if (new Set(look.itemIds).size !== look.itemIds.length) failures.push({ look: n, code: 'DUPLICATE_ITEM', severity: 'minor', detail: 'Same item listed twice.' });
    if (!look.itemIds.includes(look.anchorItemId)) failures.push({ look: n, code: 'ANCHOR_NOT_IN_LOOK', severity: 'minor', detail: `Anchor ${look.anchorItemId} isn't in the look.` });
  });

  // Across looks
  const keyOf = (ids: string[]) => [...ids].sort().join(',');
  const seen = new Map<string, number>();
  output.looks.forEach((l, idx) => {
    const k = keyOf(l.itemIds);
    if (seen.has(k)) failures.push({ look: idx + 1, code: 'REPEATED_LOOK', severity: 'critical', detail: `Identical to look ${seen.get(k)}.` });
    else seen.set(k, idx + 1);
  });

  const anchors = output.looks.map((l) => l.anchorItemId);
  anchors.forEach((a, idx) => {
    const first = anchors.indexOf(a);
    if (first !== idx) failures.push({ look: idx + 1, code: 'SAME_ANCHOR', severity: 'major', detail: `Same anchor as look ${first + 1} (${a}).` });
  });

  const clothes = (ids: string[]) => new Set(ids.filter((id) => CLOTHING.has(byId.get(id)?.category ?? '')));
  for (let a = 0; a < output.looks.length; a++) {
    for (let b = a + 1; b < output.looks.length; b++) {
      const A = clothes(output.looks[a].itemIds);
      const B = clothes(output.looks[b].itemIds);
      const shared = [...A].filter((x) => B.has(x)).length;
      const union = new Set([...A, ...B]).size;
      if (union && shared / union >= 0.5) {
        failures.push({ look: b + 1, code: 'TOO_SIMILAR', severity: 'minor', detail: `Shares most of its clothing with look ${a + 1}.` });
      }
    }
  }
  return failures;
}
