import 'server-only';
import { query } from './pg';

const MAX_ENTRIES = 5000;

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
  latencyMs?: number;
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

// Fixed cost per call for external (non-Anthropic) APIs
export const EXTERNAL_PRICING: Record<string, number> = {
  // Google Gemini 3.1 Flash Image (the actual model this app calls, via
  // generativelanguage.googleapis.com): $60/M output tokens, 1120 tokens per
  // 1024px output image = $0.067/image. Input garment images (~1120 tokens
  // each, up to 4 per call) add well under a cent more — folded in here
  // rather than tracked separately since it's marginal against the output cost.
  // Source: verified against Google's published per-image rates, July 2026.
  'gemini-flash-image': 0.067,
  // Google Custom Search JSON API, image mode: free for the first 100
  // queries/day, then $5 per 1,000 queries ($0.005/query) — priced at the
  // paid rate since we can't know from here whether the free quota is used.
  'google-custom-search': 0.005,
};

export async function logExternalCall(entry: { ts: number; route: string; model: string }): Promise<void> {
  const costUsd = EXTERNAL_PRICING[entry.model] ?? 0;
  return appendToLog({ ...entry, inputTokens: 0, outputTokens: 0, costUsd });
}

// One row per call — no read-modify-write of a shared log, so concurrent calls
// can never drop each other's entries.
async function appendToLog(e: UsageEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO usage_log (ts, route, model, input_tokens, output_tokens, cache_creation_tokens,
         cache_read_tokens, cost_usd, latency_ms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [e.ts, e.route, e.model, e.inputTokens, e.outputTokens, e.cacheCreationTokens ?? 0,
        e.cacheReadTokens ?? 0, e.costUsd, e.latencyMs ?? null]);
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

export async function getUsageLog(): Promise<UsageEntry[]> {
  try {
    const rows = await query<{
      ts: number; route: string; model: string; input_tokens: number; output_tokens: number;
      cache_creation_tokens: number; cache_read_tokens: number; cost_usd: number; latency_ms: number | null;
    }>(`SELECT ts, route, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
          cost_usd, latency_ms FROM usage_log ORDER BY ts DESC LIMIT ${MAX_ENTRIES}`);
    return rows.reverse().map((r) => ({
      ts: r.ts, route: r.route, model: r.model, inputTokens: r.input_tokens, outputTokens: r.output_tokens,
      cacheCreationTokens: r.cache_creation_tokens, cacheReadTokens: r.cache_read_tokens,
      costUsd: r.cost_usd, latencyMs: r.latency_ms ?? undefined,
    }));
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
