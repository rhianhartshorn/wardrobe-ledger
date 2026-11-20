import { z } from 'zod';
import { callStructured, MODELS, type ModelId, type Effort } from '../llm';
import { renderLooks, renderRequest, renderWardrobe } from '../render';
import { runChecks } from '../checks';
import { deriveConditions, excludedItems, itemTags, checkConditions, type Conditions } from '../conditions';
import { JUDGE_FAILURES } from '../judge';
import { OutputSchema } from './baseline';
import type { CallRecord, Engine, EngineContext, StylistOutput } from '../types';

// v1: conditions in code → generate → code checks → critique → revise.
// Targets the baseline's main failures: practicality/weather, proportion,
// register and weak or untrue explanations.

const STYLIST = `You are an exceptional personal stylist with a strong eye and real range. You style clients using only the clothes they actually own.

Work like a top stylist:
1. Read the brief and the client: the occasion, what they will physically be doing, today's conditions, their Style DNA, body, colouring, directives and history.
2. For each look, decide the idea first — a point of view you could name in one line — then the anchor piece, then build around it.
3. Finish it from the feet up: shoes that suit the conditions, the right outer layer for getting there, a bag and jewellery/accessories from the wardrobe where they help.
4. Check it before you commit: proportion on this client's body, colour near the face for their colouring, register for the occasion, warmth and weather, and the activity (walking, cycling, standing outside).

Give three complete looks with different jobs:
- Look 1: the strongest answer to the brief.
- Look 2: a genuinely different anchor and mood.
- Look 3: a discovery look built on an under-worn piece — only if it genuinely works; otherwise another strong option.

Rules:
- Use only items in the wardrobe, by exact id. Never use an item listed as unavailable today.
- Every look: a top and bottom or a dress/jumpsuit, plus shoes; a layer always has a base underneath.
- TODAY'S CONDITIONS and ITEM NOTES are facts worked out for you — treat them as hard constraints.
- Style the client as a sharper version of their own Style DNA, not your own taste. Repeat what worked in spirit; avoid what didn't.
- Explanations must be concrete and true of the actual pieces: never claim warmth, practicality, waist definition or proportion effects the pieces don't deliver.
- If the wardrobe can't fully meet the brief, give the best honest options and say plainly what's missing.`;

const CRITIC = `You are the senior stylist doing quality control before looks go to a paying client. Review the draft looks against the client, the brief and today's conditions. Be exacting but fair: flag real problems, not taste quibbles.

For each look give a verdict:
- keep: ready to send.
- fix: good idea, but specific problems need fixing — name the exact swaps or styling changes (with item ids).
- replace: the look doesn't work; say why and what direction would.

Check especially: warmth, rain and the activity (walking, cycling, standing outside); register for the occasion; proportion on this client's body; colours near the face; pattern and colour logic; whether a clearly stronger piece was ignored; whether the look is finished (shoes, outer layer, bag, accessories); and whether the explanation claims anything untrue.

Use these failure codes: ${Object.keys(JUDGE_FAILURES).join(', ')}.

Weigh trade-offs like a stylist, not a safety officer:
- Use the critical codes (WRONG_REGISTER, BREAKS_DIRECTIVE, WRONG_FOR_WEATHER, IMPRACTICAL) only when the look would genuinely fail the client: properly cold or wet, unable to do the activity, clearly mis-dressed, or a directive broken. A workable choice where a more practical option existed is COULD_BE_MORE_PRACTICAL — usually not worth changing the look for.
- Never trade the occasion's register for marginal practicality (e.g. a casual rain jacket over wedding tailoring because showers are possible).
- Protect each look's idea and the range across the set: fix the specific problem inside the look's own idea, and don't propose the same swap (same coat, same shoes) across every look.
- Mark a look "keep" when it's genuinely good, even if you'd personally style it differently.`;

const CritiqueSchema = z.object({
  looks: z.array(z.object({
    look: z.number(),
    verdict: z.enum(['keep', 'fix', 'replace']),
    issues: z.array(z.object({ code: z.string(), detail: z.string(), fix: z.string() })),
  })),
  overall: z.string().describe('one or two sentences on the set as a whole, incl. range and any stronger option missed'),
});
type Critique = z.infer<typeof CritiqueSchema>;

function todayBlock(ctx: EngineContext, cond: Conditions): string {
  const excluded = excludedItems(ctx.wardrobe.items, cond);
  const notes = ctx.wardrobe.items
    .filter((i) => !excluded.has(i.id))
    .map((i) => ({ i, tags: itemTags(i, cond) }))
    .filter((x) => x.tags.length)
    .map((x) => `- ${x.i.id} ${x.i.name}: ${x.tags.join('; ')}`);
  return [
    renderRequest(ctx),
    `\nTODAY'S CONDITIONS (facts):\n${cond.rules.map((r) => `- ${r}`).join('\n')}`,
    excluded.size ? `\nUNAVAILABLE TODAY (break a directive): ${Array.from(excluded).join(', ')}` : '',
    notes.length ? `\nITEM NOTES FOR TODAY:\n${notes.join('\n')}` : '',
  ].join('\n');
}

function violationsText(output: StylistOutput, ctx: EngineContext, cond: Conditions): string[] {
  const structural = runChecks(output, ctx.wardrobe).filter((c) => c.severity !== 'minor').map((c) => `Look ${c.look ?? '-'}: ${c.code} — ${c.detail}`);
  const conditional = checkConditions(output, ctx.wardrobe.items, cond).map((v) => `Look ${v.look}: ${v.detail}`);
  return [...structural, ...conditional];
}

// mode: 'lite'    — conditions + prompt, one call
//       'checked' — revise only when code checks find hard problems
//       'critic'  — model critique of every draft, then revise when needed
export function makeV1(opts: { name: string; mode: 'lite' | 'checked' | 'critic'; criticModel?: ModelId; criticEffort?: Effort }): Engine {
  const criticModel = opts.criticModel ?? MODELS.sonnet;
  const criticEffort = opts.criticEffort ?? 'medium';
  const steps = {
    lite: 'Conditions in code → generate (Sonnet 5.5, high), one call.',
    checked: 'Conditions in code → generate (Sonnet 5.5, high) → code checks → revise only if a check fails.',
    critic: `Conditions in code → generate (Sonnet 5.5, high) → code checks → critique (${criticModel}, ${criticEffort}) → revise when needed.`,
  };
  return {
    name: opts.name,
    description: steps[opts.mode],
    async run(ctx) {
      const calls: CallRecord[] = [];
      const cond = deriveConditions(ctx);
      const wardrobeBlock = renderWardrobe(ctx.wardrobe);
      const today = todayBlock(ctx, cond);

      const gen = await callStructured({
        stage: 'generate', model: MODELS.sonnet, effort: 'high',
        cachedSystem: [STYLIST, wardrobeBlock], user: today, schema: OutputSchema,
      });
      calls.push(gen.call);
      const draft = gen.data as StylistOutput;
      const draftViolations = violationsText(draft, ctx, cond);

      if (opts.mode === 'lite' || (opts.mode === 'checked' && draftViolations.length === 0)) {
        return { output: draft, calls, trace: { conditions: cond, draftViolations, revised: false } };
      }
      if (opts.mode === 'checked') {
        const rev = await callStructured({
          stage: 'revise', model: MODELS.sonnet, effort: 'high',
          cachedSystem: [STYLIST, wardrobeBlock],
          user: `${today}\n\nYOUR DRAFT:\n${renderLooks(draft, ctx.wardrobe)}\n\nAUTOMATIC CHECKS FOUND THESE PROBLEMS:\n${draftViolations.map((v) => `- ${v}`).join('\n')}\n\nReturn the three looks with only these problems fixed. Keep every look's idea and anchor; change as little as possible. Make sure every claim in the explanations is still true.`,
          schema: OutputSchema,
        });
        calls.push(rev.call);
        const final = rev.data as StylistOutput;
        return { output: final, calls, trace: { conditions: cond, draftViolations, revised: true, finalViolations: violationsText(final, ctx, cond) } };
      }

      const crit = await callStructured({
        stage: 'critique', model: criticModel, effort: criticEffort,
        cachedSystem: [CRITIC, wardrobeBlock],
        user: `${today}\n\nDRAFT LOOKS:\n${renderLooks(draft, ctx.wardrobe)}\n\nAUTOMATIC CHECKS FOUND:\n${draftViolations.length ? draftViolations.map((v) => `- ${v}`).join('\n') : '- nothing'}\n\nReview the draft.`,
        schema: CritiqueSchema,
      });
      calls.push(crit.call);
      const critique = crit.data as Critique;

      const needsRevision = draftViolations.length > 0 || critique.looks.some((l) => l.verdict !== 'keep');
      if (!needsRevision) {
        return { output: draft, calls, trace: { conditions: cond, draftViolations, critique, revised: false } };
      }

      const critiqueText = critique.looks.map((l) => `Look ${l.look}: ${l.verdict.toUpperCase()}${l.issues.length ? '\n' + l.issues.map((i) => `  - ${i.code}: ${i.detail} → ${i.fix}`).join('\n') : ''}`).join('\n');
      const rev = await callStructured({
        stage: 'revise', model: MODELS.sonnet, effort: 'high',
        cachedSystem: [STYLIST, wardrobeBlock],
        user: `${today}\n\nYOUR DRAFT:\n${renderLooks(draft, ctx.wardrobe)}\n\nQUALITY CONTROL REVIEW:\n${critiqueText}\nOverall: ${critique.overall}\n\nAUTOMATIC CHECKS (must be fixed):\n${draftViolations.length ? draftViolations.map((v) => `- ${v}`).join('\n') : '- nothing'}\n\nProduce the final three looks. Return looks marked KEEP unchanged unless an automatic check flagged them. For FIX looks, fix the specific problems while keeping the look's idea and anchor. For REPLACE looks, build a new look with a different anchor from the other two. Fix every automatic-check problem. You may disagree with the review where it would make the look safer but worse — the three looks must stay genuinely different, so don't converge on the same coat or shoes everywhere. Make sure every claim in the explanations is true.`,
        schema: OutputSchema,
      });
      calls.push(rev.call);
      const final = rev.data as StylistOutput;
      return { output: final, calls, trace: { conditions: cond, draftViolations, critique, revised: true, finalViolations: violationsText(final, ctx, cond) } };
    },
  };
}
