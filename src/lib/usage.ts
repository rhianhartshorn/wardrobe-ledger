import 'server-only';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const LOG_KEY = 'wl:usage:log';
const MAX_ENTRIES = 1000;

// Pricing per million tokens (USD) — update if Anthropic changes rates
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':          { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001':  { input: 0.80,  output:  4.00 },
  'claude-haiku-4-5':           { input: 0.80,  output:  4.00 },
  'claude-opus-4-8':            { input: 15.00, output: 75.00 },
};

export type UsageEntry = {
  ts: number;       // Unix ms
  route: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number; // written to a new 5-min ephemeral cache — billed 1.25x input rate
  cacheReadTokens?: number;     // served from cache — billed 0.1x input rate
  costUsd: number;
};

// Anthropic prompt caching multipliers on the base input rate (5-min ephemeral cache)
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
): number {
  const price = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (inputTokens / 1_000_000) * price.input
    + (outputTokens / 1_000_000) * price.output
    + (cacheCreationTokens / 1_000_000) * price.input * CACHE_WRITE_MULTIPLIER
    + (cacheReadTokens / 1_000_000) * price.input * CACHE_READ_MULTIPLIER;
}

async function redisGet(key: string): Promise<string | null> {
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    });
    const json = await res.json() as { result: string | null };
    return json.result ?? null;
  } catch { return null; }
}

// ENCODING NOTE (matches src/lib/db.ts): Upstash REST stores the raw POST
// body bytes, so JSON.stringify is called ONCE here on the value. Callers
// must pass the raw value (array/object), never a pre-stringified string —
// doing so double-encodes it, and a double-encoded array reads back as a
// plain string, silently breaking every subsequent read and write.
async function redisSet(key: string, value: unknown): Promise<void> {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
}

// Parse a raw Redis GET result back to its original value. Handles both
// correctly-encoded values AND legacy double-encoded values (from the bug
// above) so historical entries are still readable rather than silently lost.
function parseVal<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const once = JSON.parse(raw) as unknown;
    if (typeof once === 'string') {
      try { return JSON.parse(once) as T; } catch { return once as T; }
    }
    return once as T;
  } catch { return null; }
}

// Fixed cost per call for external (non-Anthropic) APIs
export const EXTERNAL_PRICING: Record<string, number> = {
  'gemini-flash-image': 0.04,     // Google Gemini Flash image gen: ~$0.04/image (estimate)
};

export async function logExternalCall(entry: { ts: number; route: string; model: string }): Promise<void> {
  const costUsd = EXTERNAL_PRICING[entry.model] ?? 0;
  return appendToLog({ ...entry, inputTokens: 0, outputTokens: 0, costUsd });
}

async function appendToLog(full: UsageEntry): Promise<void> {
  try {
    const raw = await redisGet(LOG_KEY);
    const parsed = parseVal<unknown[]>(raw);
    const log: UsageEntry[] = Array.isArray(parsed) ? (parsed as UsageEntry[]) : [];
    log.push(full);
    if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
    await redisSet(LOG_KEY, log);
  } catch {
    // Never let logging failures surface to users
  }
}

export async function logUsage(entry: Omit<UsageEntry, 'costUsd'>): Promise<void> {
  try {
    const costUsd = computeCost(entry.model, entry.inputTokens, entry.outputTokens, entry.cacheCreationTokens, entry.cacheReadTokens);
    const full: UsageEntry = { ...entry, costUsd };
    await appendToLog(full);
  } catch {
    // Never let logging failures surface to users
  }
}

// Older or partially-written entries may be missing fields, non-numeric, or
// not even objects — normalize everything to a safe shape so a single bad
// record from an earlier schema can never crash the dashboard render.
function sanitizeEntry(e: unknown): UsageEntry | null {
  if (!e || typeof e !== 'object') return null;
  const r = e as Partial<UsageEntry>;
  return {
    ts: typeof r.ts === 'number' && !isNaN(r.ts) ? r.ts : 0,
    route: typeof r.route === 'string' ? r.route : 'unknown',
    model: typeof r.model === 'string' ? r.model : 'unknown',
    inputTokens: typeof r.inputTokens === 'number' && !isNaN(r.inputTokens) ? r.inputTokens : 0,
    outputTokens: typeof r.outputTokens === 'number' && !isNaN(r.outputTokens) ? r.outputTokens : 0,
    cacheCreationTokens: typeof r.cacheCreationTokens === 'number' && !isNaN(r.cacheCreationTokens) ? r.cacheCreationTokens : 0,
    cacheReadTokens: typeof r.cacheReadTokens === 'number' && !isNaN(r.cacheReadTokens) ? r.cacheReadTokens : 0,
    costUsd: typeof r.costUsd === 'number' && !isNaN(r.costUsd) ? r.costUsd : 0,
  };
}

export async function getUsageLog(): Promise<UsageEntry[]> {
  try {
    const raw = await redisGet(LOG_KEY);
    const parsed = parseVal<unknown[]>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeEntry).filter((e): e is UsageEntry => e !== null);
  } catch { return []; }
}

// ---- Aggregation helpers ----

export type RouteStat = {
  route: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type DayStat = {
  date: string; // YYYY-MM-DD
  calls: number;
  costUsd: number;
};

export type UsageSummary = {
  totalCostUsd: number;
  totalCalls: number;
  mtdCostUsd: number;
  todayCostUsd: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  estimatedCacheSavingsUsd: number; // vs. paying full input price for the cached reads
  byRoute: RouteStat[];
  byDay: DayStat[];   // last 30 days, ascending
  recentCalls: UsageEntry[]; // last 50
};

export function summarise(log: UsageEntry[]): UsageSummary {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7); // YYYY-MM

  let totalCostUsd = 0;
  let totalCalls = 0;
  let mtdCostUsd = 0;
  let todayCostUsd = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;
  let estimatedCacheSavingsUsd = 0;

  const routeMap = new Map<string, RouteStat>();
  const dayMap = new Map<string, DayStat>();

  for (const e of log) {
    if (!e.ts || isNaN(new Date(e.ts).getTime())) continue;
    totalCostUsd += e.costUsd;
    totalCalls++;

    const readTokens = e.cacheReadTokens ?? 0;
    totalCacheReadTokens += readTokens;
    totalCacheCreationTokens += e.cacheCreationTokens ?? 0;
    if (readTokens > 0) {
      const price = PRICING[e.model] ?? PRICING['claude-sonnet-4-6'];
      // What those tokens would have cost at the full input rate, minus what the cache read actually cost
      estimatedCacheSavingsUsd += (readTokens / 1_000_000) * price.input * (1 - CACHE_READ_MULTIPLIER);
    }

    const dateStr = new Date(e.ts).toISOString().slice(0, 10);
    if (dateStr === todayStr) todayCostUsd += e.costUsd;
    if (dateStr.startsWith(monthStr)) mtdCostUsd += e.costUsd;

    // by route
    const rs = routeMap.get(e.route) ?? { route: e.route, calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    rs.calls++;
    rs.inputTokens += e.inputTokens;
    rs.outputTokens += e.outputTokens;
    rs.costUsd += e.costUsd;
    routeMap.set(e.route, rs);

    // by day — only last 30 days
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    if (new Date(e.ts) >= cutoff) {
      const ds = dayMap.get(dateStr) ?? { date: dateStr, calls: 0, costUsd: 0 };
      ds.calls++;
      ds.costUsd += e.costUsd;
      dayMap.set(dateStr, ds);
    }
  }

  const byRoute = Array.from(routeMap.values()).sort((a, b) => b.costUsd - a.costUsd);
  const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const recentCalls = [...log].reverse().slice(0, 50);

  return {
    totalCostUsd, totalCalls, mtdCostUsd, todayCostUsd,
    totalCacheReadTokens, totalCacheCreationTokens, estimatedCacheSavingsUsd,
    byRoute, byDay, recentCalls,
  };
}
