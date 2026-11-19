import { z } from 'zod';
import { callStructured, MODELS } from './llm';
import { renderLooks, renderRequest, renderWardrobe } from './render';
import type { CallRecord, EngineContext, StylistOutput } from './types';

// Named failures the judge may tag. Severity is fixed here, not by the judge.
export const JUDGE_FAILURES = {
  WRONG_REGISTER: 'critical',          // wrong formality for the occasion
  BREAKS_DIRECTIVE: 'critical',        // violates a permanent client directive
  WRONG_FOR_WEATHER: 'critical',
  IMPRACTICAL: 'critical',             // can't do the stated activity in it (walk all day, cycle, etc.)
  SAFE_DEFAULT: 'major',               // settled for safe while clearly stronger options were available
  SMOTHERED_STATEMENT: 'major',        // a characterful piece flattened by its pairing
  CLASH_WITHOUT_LOGIC: 'major',        // pattern or colour clash with no coordinating idea
  NOT_HER_STYLE: 'major',              // pulls away from the client's own Style DNA
  BAD_COLOUR_AT_FACE: 'major',         // a colour that drains this client worn near the face
  PROPORTION_PROBLEM: 'major',
  COSTUME: 'major',                    // trying too hard / reads as costume
  REPEATS_KNOWN_MISS: 'major',         // repeats something the history says didn't work
  NO_REAL_TECHNIQUE: 'minor',          // no specific styling move
  WEAK_EXPLANATION: 'minor',           // vague, generic or filler explanation
  UNFINISHED: 'minor',                 // missing an obvious finishing piece the wardrobe has
} as const;
export type JudgeFailureCode = keyof typeof JUDGE_FAILURES;

const score = (what: string) => z.number().describe(`1-5: ${what}`);

const JudgementSchema = z.object({
  looks: z.array(z.object({
    look: z.number().describe('look number, starting at 1'),
    answersBrief: score('right for the occasion, weather and real-life practicality'),
    feelsLikeClient: score("specific to this client's Style DNA, body and colouring rather than a generic well-dressed person"),
    visuallyResolved: score('proportion, colour relationships, pattern scale, texture and visual weight work as one look'),
    hasIdea: score('a real point of view you could name in one line, not just pieces that go together'),
    finished: score('shoes, the right layer, accessories from the wardrobe, and a specific styling move'),
    explanation: score('concrete visual reasons that teach something; no filler'),
    stylistWouldSignOff: z.boolean().describe('would a top professional stylist send this to a paying client as-is?'),
    failures: z.array(z.object({
      code: z.enum(Object.keys(JUDGE_FAILURES) as [JudgeFailureCode, ...JudgeFailureCode[]]),
      detail: z.string(),
    })),
    comment: z.string().describe('one or two sentences, specific'),
  })),
  usesWardrobesBest: score("reached for the strongest pieces this wardrobe offers for this brief, including under-used ones, rather than defaulting to safe"),
  range: score('the looks are genuinely different from each other, each with a clear job'),
  overall: z.number().describe('1-10 overall: 10 = what an exceptional personal stylist would be proud to send; 6 = competent but forgettable; 3 = poor'),
  missedOpportunity: z.string().describe('the single best look this wardrobe could have produced for this brief that the stylist missed, with item ids — or "none" if they found it'),
  summary: z.string(),
});
export type Judgement = z.infer<typeof JudgementSchema>;

const JUDGE_INSTRUCTIONS = `You are the creative director of a top personal styling studio and a former fashion editor. You review a junior stylist's recommendations before they go to a paying client. Your standard is what an exceptional human stylist would send — not what is merely acceptable.

How to judge:
- Judge against what THIS wardrobe could actually achieve for THIS brief and THIS client. A small or basic wardrobe can still score highly if the stylist found its best answer.
- Do not reward safety for its own sake: a look that avoids mistakes but has no idea, or ignores clearly stronger pieces, is not excellent.
- Do not reward forced variety either: three different looks are only good if each one genuinely works.
- Respect the client's own Style DNA. Excellent styling makes the client a sharper version of herself or himself, not a version of someone else's taste.
- Real life counts: weather, what the client will be doing, comfort constraints and permanent directives are hard requirements.
- If a brief is beyond what the wardrobe can do (for example a formal wedding from a tiny student wardrobe), the best answer finds the strongest honest option and says plainly what the wardrobe lacks. Reward that honesty.
- Scores: 5 = exceptional, what you'd be proud to send; 4 = strong; 3 = competent but unremarkable; 2 = weak; 1 = wrong.
- Tag every failure you see with the named codes. Be specific and concrete in comments; name item ids.`;

export async function judge(ctx: EngineContext, output: StylistOutput): Promise<{ judgement: Judgement; call: CallRecord }> {
  const { data, call } = await callStructured({
    stage: 'judge',
    model: MODELS.opus,
    effort: 'high',
    cachedSystem: [JUDGE_INSTRUCTIONS, renderWardrobe(ctx.wardrobe)],
    user: `${renderRequest(ctx)}\n\nTHE STYLIST'S RECOMMENDATION:\n${renderLooks(output, ctx.wardrobe)}\n\nReview it.`,
    schema: JudgementSchema,
  });
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));
  data.looks.forEach((l) => {
    for (const k of ['answersBrief', 'feelsLikeClient', 'visuallyResolved', 'hasIdea', 'finished', 'explanation'] as const) l[k] = clamp(l[k], 1, 5);
  });
  data.usesWardrobesBest = clamp(data.usesWardrobesBest, 1, 5);
  data.range = clamp(data.range, 1, 5);
  data.overall = clamp(data.overall, 1, 10);
  return { judgement: data, call };
}
