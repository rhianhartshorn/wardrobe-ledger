import type { Engine } from '../types';
import { MODELS } from '../llm';
import { makeBaseline } from './baseline';

export const ENGINES: Record<string, Engine> = {
  baseline: makeBaseline({ name: 'baseline-sonnet' }),
  'baseline-opus': makeBaseline({ model: MODELS.opus, effort: 'high', name: 'baseline-opus' }),
};
