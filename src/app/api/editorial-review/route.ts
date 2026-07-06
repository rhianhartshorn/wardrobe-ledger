import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

export type Violation = {
  quote: string;
  issue: string;
  rewrite: string;
};

export type ReviewResult = {
  passed: boolean;
  score: number; // 0–10
  summary: string;
  violations: Violation[];
};

const COPY_DIRECTOR_PROMPT = `You are the Copy Director for a fashion app called The Wardrobe Ledger. Your job is to review AI-generated copy against the app's brand voice spec and produce a precise editorial report.

BRAND VOICE SPEC:
- Voice: "A brilliant friend who happens to be a stylist." Direct, personal, specific. Doesn't perform expertise — just has it.
- Address: Always second person ("you", "your"). Never third person or clinical distance.
- Length: One sharp sentence per unit. Outfit rationale max 20 words. Accessory direction max 12 words. Strength/gap labels max 8 words. Fashion currency tip max 15 words. Style archetype/brand statement max 20 words. Stylist acknowledgment 2-3 sentences max.
- Directness: State observations as facts. Explain the WHY. Never hedge with "could", "might", "you might want to try". Never qualify out of politeness.
- No hollow compliments: never say something looks "stunning", "beautiful", "gorgeous" — say specifically what works.
- No filler: not "of course", "certainly", "feel free to", "I hope this helps", "based on your wardrobe".
- No exclamation marks. Ever.
- BANNED WORDS (automatic fail if present): elevate/elevated/elevating, effortless/effortlessly, luxurious/luxury, stunning/beautiful/gorgeous/lovely, chic, curated/carefully curated, versatile/versatility, investment piece, wardrobe essential, must-have, statement piece (when used vaguely), transitional, flattering (without explaining WHY), on-trend/trendy/fashionable, capsule/capsule wardrobe, stylish, classic (without qualification), sophisticated, polished (without explaining what creates the effect).
- Use precise language about proportion, colour, texture, silhouette, and context instead.

SCORING:
- 10: Perfect. Direct, specific, on-voice, correct length.
- 8–9: Minor issues — slightly long, one weak word choice, but on-voice.
- 6–7: Noticeable problems — vague language, one banned word, slightly hedged.
- 4–5: Multiple issues — banned words, hedging, too long, hollow.
- 1–3: Off-brand — performative, hedged throughout, multiple banned words, sounds like generic fashion copy.

For each violation, quote the exact offending text, name the specific rule it breaks, and provide a rewrite that fixes it while preserving the intent.`;

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json() as { text: string; context?: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const contextBlock = context ? `\nContext (where this copy appears): ${context}\n` : '';

    const prompt = `${COPY_DIRECTOR_PROMPT}
${contextBlock}
Review the following copy against the brand voice spec above.

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

violations array is empty if the copy passes. Never invent violations that aren't there.`;

    const raw = await callClaude({ prompt, maxTokens: 1000, model: 'claude-haiku-4-5-20251001' });
    const parsed = parseJSON(raw) as ReviewResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Review failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
