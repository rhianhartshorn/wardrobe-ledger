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

Write a max 200-word brief covering:
— The 3-5 workhorse pieces this wardrobe is actually built around, and why they're load-bearing
— The native styling moves this wardrobe supports well (what combinations and registers it's naturally strong in)
— The blind spots — formality levels, occasions, or categories this wardrobe currently cannot serve
— How the wardrobe has shifted recently, if new pieces have changed what's now possible

Be specific — name actual pieces, not categories. No generalities, no hollow observations.

Respond with ONLY the brief text — no JSON, no heading, no preamble.`;

    const brief = await callClaude({ prompt, maxTokens: 350, route: 'wardrobe-character-brief' });
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
    return `\nWARDROBE CHARACTER BRIEF (standing knowledge of this wardrobe's identity, maintained by Wardrobe Intelligence — read this instead of re-deriving the wardrobe's character from the raw item list):\n${raw}\n`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// STYLE IDENTITY — the client's own declared aesthetic, from Read My Style.
// The team has a default technical point of view (see STYLIST_2026_LENS and
// the Fashion Editor's reference points — restraint, proportion-led, quiet
// luxury). That POV is a lens for HOW to execute — proportion discipline,
// currency, coherence — not a mandate on WHAT aesthetic the client should
// end up in. Without this, the team had no persisted record of the client's
// own archetype and defaulted toward its own house style by omission. Real
// stylists adapt their flair to the client's direction; this is what lets
// ours do the same instead of quietly editing every client toward the same
// restrained neutral outcome.
// ---------------------------------------------------------------------------

export type StyleIdentity = {
  archetype: string;
  styleKeywords: string[];
  brandStatement: string;
  colorStory: string;
  narrativeArc: string;
  updatedAt: number;
};

export async function saveStyleIdentity(identity: Omit<StyleIdentity, 'updatedAt'>): Promise<void> {
  try {
    const full: StyleIdentity = { ...identity, updatedAt: Date.now() };
    await setSetting('style_identity', JSON.stringify(full));
    // Regenerate the team's adaptation note whenever the archetype changes —
    // cheap (one Haiku call) and only fires on real Read My Style runs, not
    // per chat message.
    generateTeamPerspectiveInBackground(full);
  } catch {
    // Never block the style-read response
  }
}

export async function getStyleIdentityContext(): Promise<string> {
  try {
    const raw = await getSetting('style_identity');
    if (!raw) return '';
    const identity = JSON.parse(raw) as StyleIdentity;
    return `\nCLIENT'S DECLARED STYLE IDENTITY (from her own Read My Style reading — this is HER stated aesthetic identity and takes priority over the team's default reference points when they differ):\nArchetype: ${identity.archetype}\nKeywords: ${identity.styleKeywords.join(', ')}\nWhat her wardrobe says: ${identity.brandStatement}\nColour story: ${identity.colorStory}\nDirection: ${identity.narrativeArc}\nThe team's own technical point of view (proportion discipline, current execution, coherence) is a lens for HOW to style her — it is not a mandate on WHICH aesthetic she should be styled into. Adapt to her archetype; do not quietly edit her toward the team's default restraint.\n`;
  } catch {
    return '';
  }
}

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
