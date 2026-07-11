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
