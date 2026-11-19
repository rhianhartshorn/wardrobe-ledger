import { z } from 'zod';
import { callStructured, MODELS, type ModelId, type Effort } from '../llm';
import { renderRequest, renderWardrobe } from '../render';
import type { Engine } from '../types';

// The bar to beat: one well-written prompt, one call, no pipeline. If a
// multi-step engine can't clearly beat this, its extra cost isn't worth it.

export const OutputSchema = z.object({
  looks: z.array(z.object({
    title: z.string(),
    idea: z.string().describe('the point of view of the look, in one line'),
    itemIds: z.array(z.string()).describe('every piece in the look, by wardrobe id, including shoes and any bag/jewellery/accessories'),
    anchorItemId: z.string().describe('the piece the look is built around'),
    howToWear: z.string().describe('the specific styling moves: tucks, rolls, layering order, proportions'),
    why: z.string().describe('why it works for this client and this brief'),
  })),
  note: z.string().optional().describe('only if needed: e.g. what the wardrobe lacks for this brief'),
});

const INSTRUCTIONS = `You are an exceptional personal stylist with a strong eye and real range. You style clients using only the clothes they actually own.

For each request, give three complete looks:
- Use only items from the client's wardrobe, referenced by their exact id.
- Every look is complete and wearable: a top and bottom or a dress/jumpsuit, shoes, and whatever layer, bag, jewellery or accessories finish it from the wardrobe.
- The three looks should be genuinely different, each built around a different anchor piece.
- Respect the weather, the occasion, what the client will actually be doing, and every permanent directive.
- Style the client as a sharper version of their own Style DNA, not your own taste. Use their history: repeat what worked in spirit, avoid what didn't.
- Reach for the strongest pieces for the brief, including under-worn ones, but never force a piece that doesn't work.
- If the wardrobe can't fully meet the brief, give the best honest options and say plainly what's missing.
- For each look give the idea in one line, the specific styling moves, and why it works.`;

export function makeBaseline(opts: { model?: ModelId; effort?: Effort; name?: string } = {}): Engine {
  const model = opts.model ?? MODELS.sonnet;
  const effort = opts.effort ?? 'high';
  return {
    name: opts.name ?? `baseline-${model.replace('claude-', '')}-${effort}`,
    description: `Single call to ${model} at ${effort} effort with one well-written stylist prompt.`,
    async run(ctx) {
      const { data, call } = await callStructured({
        stage: 'stylist',
        model,
        effort,
        cachedSystem: [INSTRUCTIONS, renderWardrobe(ctx.wardrobe)],
        user: renderRequest(ctx),
        schema: OutputSchema,
      });
      return { output: data, calls: [call] };
    },
  };
}
