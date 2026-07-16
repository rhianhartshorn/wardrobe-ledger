import 'server-only';
import { callClaude, parseJSON } from './claude';
import { getItem, incrementRecommendation } from './db';
import { ACCESSORIES_DIRECTOR_PERSONA, BRAND_VOICE_RULES } from './stylist';

export type WardrobeItemLite = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
  material?: string; fit?: string; length?: string;
  accessoryType?: string; wearCount?: number; recommendationCount?: number; styleNote?: string; visualNotes?: string;
};

export type ChatOutfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessories?: string;
  stylingNote?: string;
};

const LAYERING_KEYWORDS = [
  'cardigan','blazer','jacket','coat','gilet','vest','waistcoat','kimono',
  'overshirt','shacket','hoodie','zip-up','sweater','jumper','pullover',
  'sweatshirt','fleece','anorak','parka','trench',
];

// ─────────────────────────────────────────────────────────────────────────────
// SPOTLIGHT — counters "lost in the middle": a 75-item flat list means pieces
// buried in the middle get systematically less attention than ones at the
// start or end, and that bias compounds across every specialist call that
// sees the same ordering. Pulling underused pieces into their own small,
// unmissable block forces them to actually be considered rather than
// unconsciously skipped past every time.
//
// Sorted by recommendationCount — a closed-loop count of how many times the
// TEAM has actually proposed each piece, incremented by
// recordRecommendationsInBackground() below every time outfits are returned.
// This is a genuinely different signal from wearCount (what the CLIENT has
// reached for): a piece can have low wear because the client hasn't gotten
// to it yet, or low recommendation count because the TEAM keeps skipping
// past it — this block targets the second, which is the team's own failure,
// not the client's. Because the count updates after every real response,
// the spotlight self-rotates as items actually get proposed — no arbitrary
// time-based rotation needed. Kept OUT of the cached prefix deliberately —
// it needs to vary, and it's cheap either way.
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpotlightBlock(items: WardrobeItemLite[]): string {
  if (items.length < 6) return '';
  const sorted = [...items].sort((a, b) =>
    (a.recommendationCount ?? 0) - (b.recommendationCount ?? 0)
    || (a.wearCount ?? 0) - (b.wearCount ?? 0)
    || a.id.localeCompare(b.id)
  );
  const spotlightSize = Math.min(8, sorted.length);
  const spotlight = sorted.slice(0, spotlightSize);
  if (spotlight.length === 0) return '';

  const lines = spotlight.map((it) =>
    `${it.id} :: ${it.category}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''} — recommended ${it.recommendationCount ?? 0}x${(it.wearCount ?? 0) === 0 ? ', never worn' : `, worn ${it.wearCount}x`}`
  );

  return `\nSPOTLIGHT — pieces the team has conspicuously never or rarely recommended (tracked, not guessed). A long wardrobe list makes it easy to unconsciously skip past the same pieces every time; these are flagged specifically so that doesn't happen. Before finalizing, actively check whether any of these genuinely serve this request — not as a quota to fill, but as pieces you must actually have considered, not defaulted past:\n${lines.join('\n')}\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Records which pieces actually made it into a response's outfit/packingList
// blocks, so the spotlight above reflects real, closed-loop recommendation
// history instead of a proxy. Fire-and-forget — never blocks the response.
// ─────────────────────────────────────────────────────────────────────────────

export function recordRecommendationsInBackground(itemIds: string[]): void {
  const unique = Array.from(new Set(itemIds));
  for (const id of unique) {
    incrementRecommendation(id).catch(() => {});
  }
}

export function isCompleteOutfit(itemIds: string[], items: WardrobeItemLite[]): boolean {
  const pieces = itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as WardrobeItemLite[];
  if (pieces.length === 0) return false;
  if (pieces.some((p) => p.category === 'Dress/One-piece')) return true;
  const hasBottom = pieces.some((p) => p.category === 'Bottom');
  if (!hasBottom) return false;
  const isLayering = (p: WardrobeItemLite) => p.category === 'Outerwear' || LAYERING_KEYWORDS.some((kw) => p.name.toLowerCase().includes(kw));
  const hasBaseLayer = pieces.some((p) => p.category === 'Top' && !isLayering(p));
  return hasBaseLayer;
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL GATE — the final look at the rail.
// Everything upstream reasons largely from text. This is the one step where
// someone actually LOOKS at the proposed outfit: the real garment photos are
// pulled from storage and judged together as an assembled look. Catches the
// clashes text tags can never encode. Runs one vision call per outfit, in
// parallel; on any failure it passes the outfit through rather than blocking.
// ─────────────────────────────────────────────────────────────────────────────

export async function runVisualGate(
  outfits: ChatOutfit[],
  items: WardrobeItemLite[],
): Promise<Set<ChatOutfit>> {
  const survivors = new Set<ChatOutfit>();

  await Promise.all(outfits.map(async (outfit) => {
    try {
      const images: Array<{ base64: string; mediaType?: string }> = [];
      for (const id of outfit.itemIds.slice(0, 4)) {
        const row = await getItem(id);
        const dataUrl = row?.image_data_url;
        if (dataUrl?.startsWith('data:')) {
          const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
          if (match) images.push({ mediaType: match[1], base64: match[2] });
        }
      }

      // Fewer than 2 photos — nothing to judge visually, pass through
      if (images.length < 2) { survivors.add(outfit); return; }

      const pieceNames = outfit.itemIds
        .map((id) => items.find((i) => i.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const prompt = `You are the final visual quality check at a styling atelier. The attached photos are the actual garments proposed as ONE outfit: ${pieceNames}.

Look at them TOGETHER as an assembled look — the way the pieces would read worn at the same time.

FAIL only for a genuine visual problem a stranger would notice on the street:
— two bold patterns clashing with no shared colour family and no scale hierarchy
— colours that visibly fight each other
— an obvious formality mismatch between pieces (e.g. athletic piece with formal tailoring)
— proportions or registers that cannot resolve into one coherent look

Do NOT fail a look for being safe, plain, or conventional. Boring passes. Broken fails.

Respond with ONLY valid JSON, no markdown:
{"verdict":"pass|fail","reason":"max 15 words — the specific visual problem, or why it holds"}`;

      const raw = await callClaude({ prompt, images, maxTokens: 150, route: 'visual-gate' });
      const parsed = parseJSON(raw) as { verdict?: string };
      if (parsed.verdict !== 'fail') survivors.add(outfit);
    } catch {
      // Gate must never block a response — pass through on any error
      survivors.add(outfit);
    }
  }));

  return survivors;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSORIES DIRECTOR — finishes the selected outfits
// ─────────────────────────────────────────────────────────────────────────────

export async function runAccessoriesDirector(
  outfits: ChatOutfit[],
  items: WardrobeItemLite[],
  styleBriefCtx: string,
  lifestyleCtx: string,
): Promise<ChatOutfit[]> {

  const outfitDescriptions = outfits.map((o, i) => {
    const pieces = o.itemIds
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean)
      .map((it) => `${it!.name} (${it!.category}, ${it!.primaryColor}${it!.material ? ', ' + it!.material : ''})`)
      .join('; ');
    return `OUTFIT ${i + 1}: "${o.title}"\nPieces: ${pieces}\nStyle reference: ${o.styleReference ?? 'n/a'}`;
  }).join('\n\n');

  const prompt = `${ACCESSORIES_DIRECTOR_PERSONA}

${BRAND_VOICE_RULES}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}

The head stylist has selected the following outfits for the client. Your job is to provide the finishing accessory direction for each — the precise, opinionated detail that resolves the look.

${outfitDescriptions}

For each outfit, specify: what accessory or accessories to add (or confirm the look is complete without them), with the exact weight, finish, colour relationship, and why. Be specific — not "add a bag" but which shape, size, finish, and how it relates to the rest of the look. Max 25 words per outfit.

Respond with ONLY valid JSON, no markdown:
{
  "outfits": [
    {"accessories": "specific direction for outfit 1"}
  ]
}`;

  try {
    const raw = await callClaude({ prompt, maxTokens: 400, route: 'accessories-director' });
    const parsed = parseJSON(raw) as { outfits: Array<{ accessories: string }> };
    return outfits.map((o, i) => ({
      ...o,
      accessories: parsed.outfits[i]?.accessories ?? undefined,
    }));
  } catch {
    return outfits;
  }
}
