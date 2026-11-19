import type { ClientProfile, EngineContext, Item, StylistOutput, Wardrobe } from './types';
import { seasonFor } from './requests';

export function renderItem(i: Item): string {
  return [
    i.id, i.category, i.name, i.colours.join('/'), i.pattern, i.material, i.silhouette,
    `formality ${i.formality}/5`, `warmth ${i.warmth}/5`, `worn ${i.wears}x`, i.notes ? `note: ${i.notes}` : '',
  ].filter(Boolean).join(' | ');
}

export function renderClient(c: ClientProfile, items: Item[]): string {
  const names = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)?.name ?? id).join(' + ');
  return [
    `CLIENT: ${c.name}, ${c.age}, ${c.pronouns}. Lives in ${c.location.city} (${c.location.hemisphere}ern hemisphere; ${c.location.climate}).`,
    `Body: ${c.body}`,
    `Colouring: ${c.colouring}`,
    `Life: ${c.lifestyle}`,
    `Work dress code: ${c.workDressCode}`,
    `Style DNA: ${c.styleDNA.summary}`,
    `Keywords: ${c.styleDNA.keywords.join(', ')}`,
    `Style references: ${c.styleDNA.references.join(', ')}`,
    `Would betray this style: ${c.styleDNA.antiReferences.join(', ')}`,
    c.styleDNA.aspiration ? `Aspiration: ${c.styleDNA.aspiration}` : '',
    `Permanent directives (must always hold):\n${c.directives.map((d) => `- ${d}`).join('\n')}`,
    c.history.worked.length ? `Looks that worked in real life:\n${c.history.worked.map((h) => `- ${names(h.itemIds)} — ${h.note}`).join('\n')}` : '',
    c.history.didntWork.length ? `Looks that did NOT work:\n${c.history.didntWork.map((h) => `- ${names(h.itemIds)} — ${h.note}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export function renderWardrobe(w: Wardrobe): string {
  return `${renderClient(w.client, w.items)}\n\nWARDROBE (${w.items.length} pieces — id | category | name | colours | pattern | material | silhouette | formality | warmth | wear count | notes):\n${w.items.map(renderItem).join('\n')}`;
}

export function renderRequest(ctx: EngineContext): string {
  const { request, wardrobe } = ctx;
  const season = seasonFor(wardrobe.client.location.hemisphere, request.date);
  return `DATE: ${request.date} — it is ${season} in ${wardrobe.client.location.city}.\nWEATHER: ${request.weather.tempC}°C, ${request.weather.conditions}.\nREQUEST: "${request.resolvedText}"`;
}

export function renderLooks(output: StylistOutput, w: Wardrobe): string {
  const byId = new Map(w.items.map((i) => [i.id, i]));
  const looks = output.looks.map((l, idx) => [
    `LOOK ${idx + 1}: "${l.title}"`,
    `Idea: ${l.idea}`,
    `Anchor: ${l.anchorItemId}`,
    `Pieces:\n${l.itemIds.map((id) => `  - ${byId.has(id) ? renderItem(byId.get(id)!) : `${id} | NOT IN WARDROBE`}`).join('\n')}`,
    `How to wear: ${l.howToWear}`,
    `Why: ${l.why}`,
  ].join('\n')).join('\n\n');
  return output.note ? `${looks}\n\nSTYLIST'S NOTE: ${output.note}` : looks;
}
