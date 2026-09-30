import 'server-only';
import { callClaude } from './claude';
import { getSetting, setSetting, updateItem, type ItemRow } from './db';

// ---------------------------------------------------------------------------
// PER-ITEM STYLE DOSSIER
// Generated once when a piece is added. A short, standing note on what the
// piece IS and what it's FOR — so the team recognises it instantly on every
// future request instead of re-deriving its character from raw tags.
// ---------------------------------------------------------------------------

export async function generateItemDossierInBackground(item: ItemRow): Promise<void> {
  try {
    const prompt = `You are a stylist writing a one-time internal note on a new piece entering a client's wardrobe. This note will be read by the styling team on every future request, so it should capture the piece's character — not just restate its tags.

PIECE: ${item.name}, ${item.category}${item.accessory_type ? ' (' + item.accessory_type + ')' : ''}, ${item.primary_color}${item.secondary_color ? '/' + item.secondary_color : ''}, ${item.pattern || 'solid'}${item.material ? ', ' + item.material : ''}${item.fit ? ', ' + item.fit : ''}${item.length ? ', ' + item.length : ''}, ${item.formality}, ${item.season}

Write a max 25-word note covering: what role this piece plays (anchor, workhorse, statement, filler), what it pairs naturally with in register/formality, and one non-obvious styling opportunity it opens up.

Respond with ONLY the note text — no JSON, no preamble, no quotation marks.`;

    const note = await callClaude({ prompt, maxTokens: 100, route: 'item-dossier' });
    if (note?.trim()) {
      await updateItem(item.id, { style_note: note.trim() });
    }
  } catch {
    // Fire-and-forget — never block the add-item flow
  }
}

// ---------------------------------------------------------------------------
// WARDROBE CHARACTER BRIEF
// A living ~200-word summary of what this wardrobe IS as a whole — its
// workhorses, its native styling moves, its blind spots. Regenerated in the
// background whenever the wardrobe's composition changes (add/edit/delete),
// so the team reasons from standing knowledge instead of re-reading a fresh
// item list cold on every single chat turn.
// ---------------------------------------------------------------------------

export async function updateWardrobeCharacterBriefInBackground(items: ItemRow[]): Promise<void> {
  try {
    if (items.length < 3) return;

    const itemListText = items
      .map((it) => `${it.category}${it.accessory_type ? ' (' + it.accessory_type + ')' : ''}, "${it.name}", ${it.primary_color}${it.secondary_color ? '/' + it.secondary_color : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}, ${it.formality}${(it.wear_count ?? 0) > 0 ? ', worn ' + it.wear_count + 'x' : ', unworn'}${it.style_note ? ' — ' + it.style_note : ''}`)
      .join('\n');

    const prompt = `You are the wardrobe intelligence analyst on a private styling team. You maintain a living brief on what this client's wardrobe IS as a whole — not an inventory list, a character study. The rest of the styling team reads this brief before every recommendation instead of parsing the raw item list cold, so it should give them instant, standing knowledge of this wardrobe's identity.

CURRENT WARDROBE (${items.length} pieces):
${itemListText}

Write a max 220-word brief covering:
— The 3-5 workhorse pieces this wardrobe is actually built around, and why they're load-bearing
— 3-5 UNDERUSED pieces with real, specific potential that don't get proposed as often as they could — name them and say exactly what combination or register would unlock each one. This section exists specifically so the styling team doesn't unconsciously default to the same workhorses every single time this brief is read.
— The native styling moves this wardrobe supports well (what combinations and registers it's naturally strong in)
— The blind spots — formality levels, occasions, or categories this wardrobe currently cannot serve
— How the wardrobe has shifted recently, if new pieces have changed what's now possible

Be specific — name actual pieces, not categories. No generalities, no hollow observations.

Respond with ONLY the brief text — no JSON, no heading, no preamble.`;

    const brief = await callClaude({ prompt, maxTokens: 400, route: 'wardrobe-character-brief' });
    if (brief?.trim()) {
      await setSetting('wardrobe_character_brief', brief.trim());
    }
  } catch {
    // Background update — never propagate errors
  }
}

export async function getWardrobeCharacterBriefContext(): Promise<string> {
  try {
    const raw = await getSetting('wardrobe_character_brief');
    if (!raw) return '';
    return `\nWARDROBE CHARACTER BRIEF (standing knowledge of this wardrobe's identity, maintained by Wardrobe Intelligence — read this instead of re-deriving the wardrobe's character from the raw item list). This brief names both workhorse pieces AND underused pieces with real potential — treat both as equally available starting points. The workhorses are a description of established patterns, not an instruction to keep repeating them; the underused pieces named here are exactly the ones the team should be actively working into new recommendations:\n${raw}\n`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// CLIENT AESTHETIC LENS (operational Style DNA) — the client's own declared
// aesthetic, from Read My Style, persisted as machine-usable dimensions and
// concrete reference points rather than descriptive prose alone.
//
// This replaced a fixed universal aesthetic (see STYLIST_2026_LENS in
// stylist.ts) that named the same minimalist reference points — The Row,
// Toteme, Lemaire, Copenhagen dressing — for every single client, with one
// caveat sentence saying to adapt if she differed. Measured evidence pointed
// to that fixed, vivid anchor as a likely root cause of the team defaulting
// to safe, neutral combinations even on wardrobes that were independently
// confirmed to be print-heavy and colourful. There is no longer one "house
// style" — styleReferences/antiReferences below are generated FROM this
// specific client's actual wardrobe and declared identity, so a maximalist
// client gets maximalist reference points, not a minimalist one with a
// footnote.
// ---------------------------------------------------------------------------

export type ClientAestheticLens = {
  archetype: string;
  styleKeywords: string[];
  brandStatement: string;
  colorStory: string;
  narrativeArc: string;
  // Operational dimensions — free-text scale (e.g. 'low'|'medium'|'high' or
  // 'medium-high') rather than a fixed enum, so generation doesn't need a
  // rigid rubric to hit exactly and existing prose-only readings degrade
  // gracefully if a field is missing.
  colourAppetite?: string;
  patternAppetite?: string;
  contrastPreference?: string;
  visualDensity?: string;
  noveltyAppetite?: string;
  minimalismTolerance?: string;
  tailoringPreference?: string;
  silhouettePreferences?: string[];
  // Concrete reference points GENERATED FOR THIS CLIENT — replaces the fixed
  // universal reference list previously hardcoded into the Fashion Editor
  // persona.
  styleReferences?: string[];
  antiReferences?: string[];
  updatedAt: number;
};

export async function saveStyleIdentity(identity: Omit<ClientAestheticLens, 'updatedAt'>): Promise<void> {
  try {
    const full: ClientAestheticLens = { ...identity, updatedAt: Date.now() };
    await setSetting('style_identity', JSON.stringify(full));
    // Regenerate the team's adaptation note whenever the archetype changes —
    // cheap (one Haiku call) and only fires on real Read My Style runs, not
    // per chat message.
    generateTeamPerspectiveInBackground(full);
  } catch {
    // Never block the style-read response
  }
}

export async function getClientAestheticLensContext(): Promise<string> {
  try {
    const raw = await getSetting('style_identity');
    if (!raw) return '';
    const lens = JSON.parse(raw) as ClientAestheticLens;
    const dims = [
      lens.colourAppetite ? `colour appetite ${lens.colourAppetite}` : '',
      lens.patternAppetite ? `pattern appetite ${lens.patternAppetite}` : '',
      lens.contrastPreference ? `contrast preference ${lens.contrastPreference}` : '',
      lens.visualDensity ? `visual density ${lens.visualDensity}` : '',
      lens.noveltyAppetite ? `novelty appetite ${lens.noveltyAppetite}` : '',
      lens.minimalismTolerance ? `minimalism tolerance ${lens.minimalismTolerance}` : '',
      lens.tailoringPreference ? `tailoring preference ${lens.tailoringPreference}` : '',
    ].filter(Boolean).join(', ');
    return `\nCLIENT AESTHETIC LENS (operational Style DNA, from her own Read My Style reading — this is HER stated aesthetic identity and takes priority over any generic execution default when they differ):\nArchetype: ${lens.archetype}\nKeywords: ${lens.styleKeywords.join(', ')}\nWhat her wardrobe says: ${lens.brandStatement}\nColour story: ${lens.colorStory}\nDirection: ${lens.narrativeArc}${dims ? `\nDimensions: ${dims}` : ''}${lens.silhouettePreferences?.length ? `\nSilhouette preferences: ${lens.silhouettePreferences.join(', ')}` : ''}${lens.styleReferences?.length ? `\nHer style references (use these BY NAME, not a generic house aesthetic): ${lens.styleReferences.join(', ')}` : ''}${lens.antiReferences?.length ? `\nWhat would betray this style (avoid): ${lens.antiReferences.join(', ')}` : ''}\nThe team's technical rigor (proportion discipline, current execution, coherence) is a lens for HOW to style her — it is not a mandate on WHICH aesthetic she should be styled into. Adapt to her archetype and references; never quietly edit her toward a generic restrained default.\n`;
  } catch {
    return '';
  }
}

// Backward-compatible alias — same data, prior name, for any caller not yet
// migrated to the operational lens naming.
export const getStyleIdentityContext = getClientAestheticLensContext;
export type StyleIdentity = ClientAestheticLens;

async function generateTeamPerspectiveInBackground(identity: StyleIdentity): Promise<void> {
  try {
    const prompt = `You are the head of a styling atelier whose team has a default technical point of view: restraint, proportion discipline, quiet current-ness (think The Row, Toteme, Lemaire as reference points for HOW to execute a look well). A new client's declared style identity is:

Archetype: ${identity.archetype}
Keywords: ${identity.styleKeywords.join(', ')}
Brand statement: ${identity.brandStatement}
Colour story: ${identity.colorStory}

Write a max 60-word note, addressed to the client, explaining specifically how your team's technical point of view adapts to serve HER archetype rather than editing her toward the team's own default aesthetic. Be concrete about what stays the same (the rigor) and what flexes (the aesthetic destination). No hollow reassurance — name the actual adaptation.

Respond with ONLY the note text — no JSON, no heading, no preamble.`;

    const note = await callClaude({ prompt, maxTokens: 150, model: 'claude-haiku-4-5-20251001', route: 'team-perspective' });
    if (note?.trim()) {
      await setSetting('team_perspective', note.trim());
    }
  } catch {
    // Background update — never propagate errors
  }
}

export async function getTeamPerspective(): Promise<string> {
  try {
    return (await getSetting('team_perspective')) || '';
  } catch {
    return '';
  }
}
