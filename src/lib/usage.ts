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
  costUsd: number;
};

export function computeCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
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

async function redisSet(key: string, value: string): Promise<void> {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
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
    const log: UsageEntry[] = raw ? (JSON.parse(raw) as UsageEntry[]) : [];
    log.push(full);
    if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
    await redisSet(LOG_KEY, JSON.stringify(log));
  } catch {
    // Never let logging failures surface to users
  }
}

export async function logUsage(entry: Omit<UsageEntry, 'costUsd'>): Promise<void> {
  try {
    const costUsd = computeCost(entry.model, entry.inputTokens, entry.outputTokens);
    const full: UsageEntry = { ...entry, costUsd };
    await appendToLog(full);
  } catch {
    // Never let logging failures surface to users
  }
}

export async function getUsageLog(): Promise<UsageEntry[]> {
  try {
    const raw = await redisGet(LOG_KEY);
    return raw ? (JSON.parse(raw) as UsageEntry[]) : [];
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

  const routeMap = new Map<string, RouteStat>();
  const dayMap = new Map<string, DayStat>();

  for (const e of log) {
    totalCostUsd += e.costUsd;
    totalCalls++;

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

  return { totalCostUsd, totalCalls, mtdCostUsd, todayCostUsd, byRoute, byDay, recentCalls };
}
