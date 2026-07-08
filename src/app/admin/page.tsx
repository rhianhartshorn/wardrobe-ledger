import { getUsageLog, summarise } from '@/lib/usage';

export const dynamic = 'force-dynamic';

function fmt$(n: number) {
  if (n < 0.01) return '<$0.01';
  return '$' + n.toFixed(n < 1 ? 4 : 2);
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Simple bar — width as % of max
function Bar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-[#E5DDD0] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function safeDate(val: unknown, opts: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(val as number | string);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', opts);
  } catch { return '—'; }
}

export default async function AdminPage() {
  let log, s, maxRouteCost: number, maxDayCost: number;
  try {
    log = await getUsageLog();
    s = summarise(log);
    maxRouteCost = s.byRoute.length > 0 ? Math.max(...s.byRoute.map((r) => r.costUsd)) : 0.000001;
    maxDayCost = s.byDay.length > 0 ? Math.max(...s.byDay.map((d) => d.costUsd)) : 0.000001;
  } catch (err) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace' }}>
        <h2>Admin page error</h2>
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{String(err)}</pre>
        <p>REDIS_URL set: {!!process.env.UPSTASH_REDIS_REST_URL ? 'yes' : 'NO'}</p>
        <p>REDIS_TOKEN set: {!!process.env.UPSTASH_REDIS_REST_TOKEN ? 'yes' : 'NO'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1A1714] px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Wardrobe Ledger</p>
        <h1 className="font-serif text-3xl mt-1">Cost dashboard</h1>
        <p className="text-xs text-[#A89F96] font-light mt-1">Anthropic API usage · last {log.length} calls logged</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'All time', value: fmt$(s.totalCostUsd), sub: `${s.totalCalls} calls` },
          { label: 'This month', value: fmt$(s.mtdCostUsd), sub: 'MTD' },
          { label: 'Today', value: fmt$(s.todayCostUsd), sub: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) },
        ].map(({ label, value, sub }) => (
          <div key={label} className="border border-[#E5DDD0] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light">{label}</p>
            <p className="font-serif text-2xl mt-1">{value}</p>
            <p className="text-[10px] text-[#A89F96] font-light mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Cost by route */}
      <div className="border border-[#E5DDD0] bg-white mb-6">
        <div className="p-4 border-b border-[#E5DDD0]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Cost by route</p>
        </div>
        <div className="divide-y divide-[#F0EBE4]">
          {s.byRoute.length === 0 && (
            <p className="p-4 text-sm text-[#A89F96] font-light">No data yet — usage will appear after the first API calls.</p>
          )}
          {s.byRoute.map((r) => (
            <div key={r.route} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-[#1A1714]">{r.route}</span>
                <span className="text-sm font-light text-[#1A1714]">{fmt$(r.costUsd)}</span>
              </div>
              <Bar value={r.costUsd} max={maxRouteCost} className="bg-[#9B7B3A]" />
              <div className="flex gap-4 text-[10px] text-[#A89F96] font-light">
                <span>{r.calls} call{r.calls !== 1 ? 's' : ''}</span>
                <span>{fmtTokens(r.inputTokens)} in</span>
                <span>{fmtTokens(r.outputTokens)} out</span>
                <span>{fmt$(r.calls > 0 ? r.costUsd / r.calls : 0)}/call avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily spend — last 30 days */}
      {s.byDay.length > 0 && (
        <div className="border border-[#E5DDD0] bg-white mb-6">
          <div className="p-4 border-b border-[#E5DDD0]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Daily spend — last 30 days</p>
          </div>
          <div className="p-4 space-y-2">
            {s.byDay.map((d) => (
              <div key={d.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-light">
                  <span className="text-[#6B6058]">{safeDate(d.date + 'T12:00:00', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                  <span className="text-[#1A1714]">{fmt$(d.costUsd)}</span>
                </div>
                <Bar value={d.costUsd} max={maxDayCost} className="bg-[#C4A882]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent calls */}
      <div className="border border-[#E5DDD0] bg-white">
        <div className="p-4 border-b border-[#E5DDD0]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Recent calls</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-light">
            <thead>
              <tr className="border-b border-[#F0EBE4] text-[#A89F96] text-[10px] uppercase tracking-[0.1em]">
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-4 py-2">Route</th>
                <th className="text-left px-4 py-2">Model</th>
                <th className="text-right px-4 py-2">In</th>
                <th className="text-right px-4 py-2">Out</th>
                <th className="text-right px-4 py-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE4]">
              {s.recentCalls.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-4 text-[#A89F96]">No calls logged yet.</td></tr>
              )}
              {s.recentCalls.map((e, i) => (
                <tr key={i} className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="px-4 py-2 text-[#A89F96] whitespace-nowrap">{fmtTime(e.ts)}</td>
                  <td className="px-4 py-2 text-[#1A1714]">{e.route}</td>
                  <td className="px-4 py-2 text-[#6B6058] whitespace-nowrap">{(e.model ?? '').replace('claude-', '').replace('-20251001', '')}</td>
                  <td className="px-4 py-2 text-right text-[#6B6058]">{fmtTokens(e.inputTokens)}</td>
                  <td className="px-4 py-2 text-right text-[#6B6058]">{fmtTokens(e.outputTokens)}</td>
                  <td className="px-4 py-2 text-right text-[#1A1714]">{fmt$(e.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-1 text-[10px] text-[#C4BAB0] font-light">
        <p>Anthropic: Sonnet 4.6 $3.00/MTok in · $15.00/MTok out · Haiku 4.5 $0.80/MTok in · $4.00/MTok out</p>
        <p>Try-on: Google Gemini Flash image ~$0.04/image (outfit-try-on) — estimate, verify at Google Cloud console</p>
        <p>Log capped at 1,000 entries. Upstash Redis storage cost not included (typically &lt;$1/mo on free tier).</p>
        <p>Vercel hosting: free on Hobby plan for this traffic level.</p>
      </div>
    </div>
  );
}
