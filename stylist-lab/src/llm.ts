import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';
import type { CallRecord } from './types';

// Reuse the app's key without copying it anywhere.
if (!process.env.ANTHROPIC_API_KEY) {
  const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const m = /^ANTHROPIC_API_KEY=(.+)$/m.exec(fs.readFileSync(envFile, 'utf-8'));
    if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
  }
}

export const MODELS = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-5-5',
} as const;
export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// USD per million tokens. Cache writes are billed at ~1.25x input.
// Haiku 5.5's cache-read rate isn't in our reference table; 0.1x input assumed.
const PRICES: Record<ModelId, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.1 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
};
const CACHE_WRITE_MULTIPLIER = 1.25;

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

const client = new Anthropic();

export type CallOptions<S extends z.ZodTypeAny> = {
  stage: string;
  model: ModelId;
  effort: Effort;
  // Stable blocks first (instructions, then client + wardrobe), each cached,
  // so repeated requests against the same wardrobe reuse them cheaply.
  cachedSystem: string[];
  user: string;
  schema: S;
  maxTokens?: number;
};

export async function callStructured<S extends z.ZodTypeAny>(
  opts: CallOptions<S>,
): Promise<{ data: z.infer<S>; call: CallRecord }> {
  const started = Date.now();
  const response = await client.messages.parse({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: opts.cachedSystem.map((text) => ({
      type: 'text' as const,
      text,
      cache_control: { type: 'ephemeral' as const },
    })),
    messages: [{ role: 'user', content: opts.user }],
    output_config: { effort: opts.effort, format: zodOutputFormat(opts.schema) },
  });
  const latencyMs = Date.now() - started;

  const u = response.usage;
  const price = PRICES[opts.model];
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const costUsd =
    (u.input_tokens * price.input +
      cacheWrite * price.input * CACHE_WRITE_MULTIPLIER +
      cacheRead * price.cacheRead +
      u.output_tokens * price.output) / 1_000_000;

  const call: CallRecord = {
    stage: opts.stage, model: opts.model, latencyMs, costUsd,
    inputTokens: u.input_tokens, outputTokens: u.output_tokens,
    cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite,
  };

  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error(`Model declined (${response.stop_details?.category ?? 'unknown'}) at stage ${opts.stage}`), { call });
  }
  if (response.stop_reason === 'max_tokens') {
    throw Object.assign(new Error(`Hit max_tokens at stage ${opts.stage}`), { call });
  }
  if (!response.parsed_output) {
    throw Object.assign(new Error(`No parsable output at stage ${opts.stage}`), { call });
  }
  return { data: response.parsed_output as z.infer<S>, call };
}
