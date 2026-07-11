import 'server-only';
import { callClaude, parseJSON } from './claude';
import { SHARED_OPERATING_PRINCIPLES } from './stylist';

export type SpecialistBrief = {
  role: string;
  verdict: 'clear' | 'concern' | 'trade-off' | 'opportunity' | 'blocking';
  confidence: 'high' | 'medium' | 'low';
  observation: string;
  mechanism: string;
  recommendation: string;
  trade_off: string;
  abstain: boolean;
  candidates?: Array<{ itemIds: string[]; note: string }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIST CALL — runs one member of the style team on any request type
// (outfit request, style reading, goal analysis, etc.) — the remit determines
// what the specialist is actually being asked to judge.
// ─────────────────────────────────────────────────────────────────────────────

export async function runSpecialist(
  role: string,
  persona: string,
  remit: string,
  task: string,
  itemListText: string,
  contextBlock: string,
  images?: Array<{ base64: string }>,
): Promise<SpecialistBrief> {
  const prompt = `${persona}

${SHARED_OPERATING_PRINCIPLES}

You are one specialist on a private styling team. The head stylist synthesizes all specialist briefs into the final recommendation — the client never sees your brief directly.

${contextBlock}

CLIENT'S WARDROBE:
${itemListText || '(No wardrobe items yet)'}

TASK: "${task}"

YOUR REMIT: ${remit}

Return a structured specialist brief. Be honest about confidence. Abstain if you cannot make a confident judgement from the available information — do not manufacture confidence.

Use verdicts precisely:
— clear: no issue in your domain
— concern: a problem worth noting but not fatal
— trade-off: two valid options with real costs on each side
— opportunity: a specific improvement available
— blocking: a material failure that must change before the outfit works

If the task calls for specific combinations, include 1-2 candidate combinations (by exact item id) that pass your specific criteria. If it does not (e.g. an identity or archetype reading), omit candidates.

Respond with ONLY valid JSON, no markdown:
{
  "verdict": "clear|concern|trade-off|opportunity|blocking",
  "confidence": "high|medium|low",
  "observation": "max 30 words — what you can actually see or know, no invented details",
  "mechanism": "one word or phrase — proportion|colour|context|coherence|identity|practicality|visual-weight",
  "recommendation": "max 20 words — one precise action, or 'no change needed'",
  "trade_off": "max 20 words — what would be lost by making this change",
  "abstain": false,
  "candidates": [{"itemIds": ["id1","id2","id3"], "note": "max 15 words — why this passes your specific test"}]
}`;

  try {
    const raw = await callClaude({ prompt, images, maxTokens: 400, route: `specialist-${role.toLowerCase().replace(/\s+/g, '-')}` });
    const parsed = parseJSON(raw) as Omit<SpecialistBrief, 'role'>;
    return { role, ...parsed };
  } catch {
    return { role, verdict: 'clear', confidence: 'low', observation: 'Brief unavailable.', mechanism: '', recommendation: '', trade_off: '', abstain: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUND TABLE — one cross-talk pass when specialists disagree.
// Real teams get quality from friction, not from five monologues stapled
// together. When verdicts conflict, show each specialist what the others said
// and let them push back, concede, or sharpen — in a single combined call so
// the cost stays bounded to one extra round-trip, not N.
// ─────────────────────────────────────────────────────────────────────────────

export function briefsHaveDisagreement(briefs: SpecialistBrief[]): boolean {
  const live = briefs.filter((b) => !b.abstain);
  if (live.length < 2) return false;
  const verdicts = new Set(live.map((b) => b.verdict));
  const hasBlocking = verdicts.has('blocking');
  const hasTradeOff = verdicts.has('trade-off');
  const mixedClearAndConcern = verdicts.has('clear') && verdicts.has('concern');
  return hasBlocking || hasTradeOff || mixedClearAndConcern;
}

export async function runRoundTable(
  task: string,
  briefs: SpecialistBrief[],
): Promise<SpecialistBrief[]> {
  const briefsText = briefs.map((b) => {
    if (b.abstain) return `── ${b.role.toUpperCase()} ── [abstained]`;
    return [
      `── ${b.role.toUpperCase()} ──`,
      `Verdict: ${b.verdict.toUpperCase()} (confidence: ${b.confidence})`,
      `Observation: ${b.observation}`,
      `Recommendation: ${b.recommendation}`,
      b.candidates?.length ? `Candidates: ${b.candidates.map((c) => `[${c.itemIds.join(', ')}] — ${c.note}`).join(' | ')}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const prompt = `You are moderating a round-table between styling specialists who gave conflicting or tense initial briefs on the same task: "${task}"

${SHARED_OPERATING_PRINCIPLES}

INITIAL BRIEFS:
${briefsText}

Each specialist has now seen every other brief. For each specialist (in the same order, same roles), produce a revised brief: hold their position if it survives the pushback, or concede and sharpen it if a stronger specialist argument overrides theirs. A specialist should update their candidates if another specialist's candidate is objectively stronger against their own criteria. Do not manufacture false consensus — real disagreement should survive if it is genuinely a trade-off, not a lack of information.

Respond with ONLY valid JSON, no markdown — same shape and order as the input, one object per specialist:
{
  "briefs": [
    {"role": "exact role name", "verdict": "clear|concern|trade-off|opportunity|blocking", "confidence": "high|medium|low", "observation": "max 30 words", "mechanism": "one word or phrase", "recommendation": "max 20 words", "trade_off": "max 20 words", "abstain": false, "candidates": [{"itemIds": ["id1","id2"], "note": "max 15 words"}]}
  ]
}`;

  try {
    const raw = await callClaude({ prompt, maxTokens: 700, route: 'round-table' });
    const parsed = parseJSON(raw) as { briefs: SpecialistBrief[] };
    if (!parsed.briefs?.length) return briefs;
    return briefs.map((original) => {
      const revised = parsed.briefs.find((r) => r.role === original.role);
      return revised ? { ...original, ...revised } : original;
    });
  } catch {
    return briefs;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Format a set of briefs into the block the head stylist / synthesizer reads,
// plus a tension classification describing how much the team disagrees.
// ─────────────────────────────────────────────────────────────────────────────

export function classifyTension(briefs: SpecialistBrief[]): string {
  const verdicts = briefs.filter((b) => !b.abstain).map((b) => b.verdict);
  const hasBlocking = verdicts.includes('blocking');
  const concernCount = verdicts.filter((v) => v === 'concern').length;
  return hasBlocking
    ? 'FATAL — at least one specialist has flagged a blocking issue'
    : concernCount >= 3
    ? 'DOMINANT — multiple concerns; the recommendation must address these before aesthetics'
    : concernCount >= 1
    ? 'MINOR — one concern; acknowledge it but do not let it derail the look'
    : verdicts.includes('trade-off')
    ? 'PRODUCTIVE TENSION — conflicting valid options; make a clear call and explain the trade'
    : 'CLEAR — no material concerns; proceed with confidence';
}

export function formatBriefsBlock(briefs: SpecialistBrief[]): string {
  return briefs.map((b) => {
    if (b.abstain) return `── ${b.role.toUpperCase()} ── [abstained — insufficient information]`;
    const parts = [
      `── ${b.role.toUpperCase()} ──`,
      `Verdict: ${b.verdict.toUpperCase()} (confidence: ${b.confidence})`,
      `Observation: ${b.observation}`,
      `Mechanism: ${b.mechanism}`,
      `Recommendation: ${b.recommendation}`,
      `Trade-off: ${b.trade_off}`,
    ];
    if (b.candidates?.length) {
      b.candidates.forEach((c, i) => {
        parts.push(`Candidate ${i + 1}: [${c.itemIds.join(', ')}] — ${c.note}`);
      });
    }
    return parts.join('\n');
  }).join('\n\n');
}
