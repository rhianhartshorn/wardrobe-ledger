import 'server-only';

interface ClaudeOptions {
  prompt: string;
  imageBase64?: string;
  mediaType?: string;
  useWebSearch?: boolean;
  maxTokens?: number;
}

export async function callClaude({
  prompt,
  imageBase64,
  mediaType = 'image/jpeg',
  useWebSearch = false,
  maxTokens = 1000,
}: ClaudeOptions): Promise<string> {
  const content: unknown[] = [];

  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imageBase64 },
    });
  }
  content.push({ type: 'text', text: prompt });

  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-6',
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

  const data = await res.json();

  if (!data?.content || !Array.isArray(data.content)) {
    throw new Error('Unexpected response shape from Claude');
  }

  return (data.content as Array<{ type: string; text?: string }>)
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
  const first = cleaned.search(/[{[]/);
  const last = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(cleaned.slice(first, last + 1));
  }
  throw new Error('Could not parse a JSON response from Claude');
}
