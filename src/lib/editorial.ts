import 'server-only';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';

export type Violation = {
  quote: string;
  issue: string;
  rewrite: string;
};

export type ReviewResult = {
  passed: boolean;
  score: number;
  summary: string;
  violations: Violation[];
};

export type EditorialLogEntry = {
  id: string;
  route: string;
  context: string;
  text: string;
  score: number;
  passed: boolean;
  summary: string;
  violations: Violation[];
  loggedAt: number;
};

const COPY_DIRECTOR_PROMPT = `You are the Copy Director for a fashion app called The Wardrobe Ledger. Review AI-generated copy against the brand voice spec and produce a precise editorial report.

BRAND VOICE SPEC:
- Voice: "A brilliant friend who happens to be a stylist." Direct, personal, specific. Doesn't perform expertise — just has it.
- Address: Always second person ("you", "your"). Never third person or clinical distance.
- Length: One sharp sentence per unit. Outfit rationale max 20 words. Accessory direction max 12 words. Strength/gap labels max 8 words. Fashion currency tip max 15 words. Style archetype/brand statement max 20 words. Stylist acknowledgment 2-3 sentences max.
- Directness: State observations as facts. Explain the WHY. Never hedge with "could", "might", "you might want to try". Never qualify out of politeness.
- No hollow compliments: never say something looks "stunning", "beautiful", "gorgeous" — say specifically what works.
- No filler: not "of course", "certainly", "feel free to", "I hope this helps", "based on your wardrobe".
- No exclamation marks. Ever.
- BANNED WORDS (automatic fail): elevate/elevated/elevating, effortless/effortlessly, luxurious/luxury, stunning/beautiful/gorgeous/lovely, chic, curated, versatile/versatility, investment piece, wardrobe essential, must-have, statement piece (vague use), transitional, flattering (without explaining WHY), on-trend/trendy/fashionable, capsule/capsule wardrobe, stylish, classic (without qualification), sophisticated, polished (without explaining what creates the effect).

SCORING: 10=perfect, 8-9=minor issues, 6-7=noticeable problems, 4-5=multiple issues, 1-3=off-brand throughout.`;

export async function reviewCopy(text: string, context: string): Promise<ReviewResult> {
  const prompt = `${COPY_DIRECTOR_PROMPT}

Context (where this copy appears): ${context}

COPY TO REVIEW:
"""
${text}
"""

Respond with ONLY valid JSON, no markdown:
{
  "passed": true or false (true = score 8 or above, no banned words),
  "score": 0–10,
  "summary": "1 sentence — the most important thing to fix, or confirmation it's on-voice",
  "violations": [
    {
      "quote": "exact text from the copy that violates the spec",
      "issue": "which rule it breaks and why",
      "rewrite": "the corrected version — same intent, on-voice"
    }
  ]
}

violations array is empty if the copy passes.`;

  const raw = await callClaude({ prompt, maxTokens: 800, model: 'claude-haiku-4-5-20251001' });
  return parseJSON(raw) as ReviewResult;
}

export async function logEditorialResult(
  route: string,
  context: string,
  text: string,
  result: ReviewResult
): Promise<void> {
  try {
    const raw = await getSetting('editorial_log');
    const log: EditorialLogEntry[] = raw ? JSON.parse(raw) : [];

    const entry: EditorialLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      route,
      context,
      text: text.slice(0, 500),
      score: result.score,
      passed: result.passed,
      summary: result.summary,
      violations: result.violations,
      loggedAt: Date.now(),
    };

    // Keep last 50 entries
    const updated = [entry, ...log].slice(0, 50);
    await setSetting('editorial_log', JSON.stringify(updated));
  } catch {
    // Logging failures are silent — never interrupt the main flow
  }
}

// Fire-and-forget: call this without await in route handlers
export function auditInBackground(route: string, context: string, text: string): void {
  if (!text?.trim()) return;
  reviewCopy(text, context)
    .then((result) => logEditorialResult(route, context, text, result))
    .catch(() => {});
}
