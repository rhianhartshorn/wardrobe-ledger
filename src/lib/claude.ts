import 'server-only';
import { logUsage } from './usage';

interface ClaudeImage {
  base64: string;
  mediaType?: string;
}

interface ClaudeOptions {
  prompt: string;
  imageBase64?: string;
  mediaType?: string;
  images?: ClaudeImage[];
  // Large, stable text blocks that stay byte-identical across many calls
  // (persona-independent context: shared principles, wardrobe list) — each
  // gets its own Anthropic cache breakpoint, so repeat calls within the ~5
  // minute cache window reuse them at a fraction of normal input cost
  // instead of reprocessing them every time. Order matters and must be
  // consistent between calls that should share a cache hit. Blocks under
  // roughly 1024 tokens are silently not cached (no error, just no discount).
  cacheableSections?: string[];
  useWebSearch?: boolean;
  maxTokens?: number;
  model?: string;
  route?: string; // for cost tracking — e.g. 'combinations', 'style-read'
}

export async function callClaude({
  prompt,
  imageBase64,
  mediaType = 'image/jpeg',
  images,
  cacheableSections,
  useWebSearch = false,
  maxTokens = 1000,
  model = 'claude-sonnet-4-6',
  route = 'unknown',
}: ClaudeOptions): Promise<string> {
  const content: unknown[] = [];

  for (const section of cacheableSections ?? []) {
    content.push({
      type: 'text',
      text: section,
      cache_control: { type: 'ephemeral' },
    });
  }

  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imageBase64 },
    });
  }
  for (const img of images ?? []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType ?? 'image/jpeg', data: img.base64 },
    });
  }
  content.push({ type: 'text', text: prompt });

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content }],
  };

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  };
  if (useWebSearch) {
    headers['anthropic-beta'] = 'web-search-2025-03-05';
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json() as {
    content?: Array<{ type: string; text?: string }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };

  if (!data?.content || !Array.isArray(data.content)) {
    throw new Error('Unexpected response shape from Claude');
  }

  // Fire-and-forget usage log — never blocks the response
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const cacheCreationTokens = data.usage?.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = data.usage?.cache_read_input_tokens ?? 0;
  if (inputTokens || outputTokens || cacheCreationTokens || cacheReadTokens) {
    logUsage({ ts: Date.now(), route, model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens }).catch(() => {});
  }

  return data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
    .trim();
}

export function parseJSON(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }
  // Find the outermost { } or [ ] block by tracking brace depth
  const start = cleaned.search(/[{[]/);
  if (start !== -1) {
    const opener = cleaned[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === opener) depth++;
      else if (cleaned[i] === closer) { depth--; if (depth === 0) { try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { break; } } }
    }
  }
  // Last resort: trim to last closing brace
  const first = cleaned.search(/[{[]/);
  const last = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(cleaned.slice(first, last + 1));
  }
  throw new Error('Could not parse a JSON response from Claude');
}
