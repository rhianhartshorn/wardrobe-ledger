import type { Engine } from '../types';
import { MODELS } from '../llm';
import { makeBaseline } from './baseline';
import { makeV1 } from './v1';

export const ENGINES: Record<string, Engine> = {
  baseline: makeBaseline({ name: 'baseline-sonnet' }),
  'baseline-opus': makeBaseline({ model: MODELS.opus, effort: 'high', name: 'baseline-opus' }),
  'v1-lite': makeV1({ name: 'v1-lite', mode: 'lite' }),
  'v1-checked': makeV1({ name: 'v1-checked', mode: 'checked' }),
  v1: makeV1({ name: 'v1.1-sonnet-critic', mode: 'critic' }),
  'v1-haiku-critic': makeV1({ name: 'v1.1-haiku-critic', mode: 'critic', criticModel: MODELS.haiku, criticEffort: 'high' }),
};
