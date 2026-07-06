'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EditorialLogEntry } from '@/lib/editorial';
import type { EditorialPatch } from '@/app/api/editorial-patch/route';

function ScoreBadge({ score, passed }: { score: number; passed: boolean }) {
  const color = passed ? '#7C9A7E' : score >= 6 ? '#C4A35A' : '#B05252';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: color + '22', border: `1px solid ${color}`, color, fontSize: 13, fontWeight: 500 }}>
      {score}
    </span>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ReviewDashboard() {
  const [log, setLog] = useState<EditorialLogEntry[]>([]);
  const [patches, setPatches] = useState<EditorialPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'failed'>('all');
  const [patching, setPatching] = useState(false);

  const fetchLog = useCallback(async () => {
    try {
      const [logRes, patchRes] = await Promise.all([
        fetch('/api/editorial-review'),
        fetch('/api/editorial-patch-list'),
      ]);
      const logData = await logRes.json() as { log: EditorialLogEntry[] };
      const patchData = await patchRes.json() as { patches: EditorialPatch[] };
      setLog(logData.log ?? []);
      setPatches(patchData.patches ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  async function runPatch() {
    setPatching(true);
    try {
      await fetch('/api/editorial-patch');
      await fetchLog();
    } finally {
      setPatching(false);
    }
  }

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const shown = filter === 'failed' ? log.filter((e) => !e.passed) : log;
  const failCount = log.filter((e) => !e.passed).length;
  const avgScore = log.length ? Math.round(log.reduce((s, e) => s + e.score, 0) / log.length * 10) / 10 : null;

  return (
    <main style={{ minHeight: '100vh', background: '#0E0C0A', color: '#E8E0D5', fontFamily: 'var(--font-geist-sans, sans-serif)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.15em', color: '#7A7067', textTransform: 'uppercase', marginBottom: 8 }}>Editorial Review</p>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: '#E8E0D5', marginBottom: 8 }}>Copy Director Log</h1>
          <p style={{ fontSize: 14, color: '#A89F96' }}>Background audits of AI outputs against the brand voice spec.</p>
        </div>

        {!loading && log.length > 0 && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 8, padding: '16px 20px', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 300, color: '#E8E0D5' }}>{log.length}</div>
              <div style={{ fontSize: 11, color: '#7A7067', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Audited</div>
            </div>
            <div style={{ background: '#1A1714', border: `1px solid ${failCount > 0 ? '#3A2020' : '#2A3A2B'}`, borderRadius: 8, padding: '16px 20px', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 300, color: failCount > 0 ? '#B05252' : '#7C9A7E' }}>{failCount}</div>
              <div style={{ fontSize: 11, color: '#7A7067', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Failed</div>
            </div>
            <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 8, padding: '16px 20px', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 300, color: avgScore !== null && avgScore >= 8 ? '#7C9A7E' : avgScore !== null && avgScore >= 6 ? '#C4A35A' : '#B05252' }}>{avgScore ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#7A7067', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Avg score</div>
            </div>
          </div>
        )}

        {patches.length > 0 && (
          <div style={{ background: '#0E1A10', border: '1px solid #2A3A2B', borderRadius: 8, padding: '16px 20px', marginBottom: 28 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#7C9A7E', textTransform: 'uppercase', marginBottom: 12 }}>
              {patches.length} active correction{patches.length !== 1 ? 's' : ''} — injected into all AI prompts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patches.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: '#C8C0B5', lineHeight: 1.5 }}>
                  <span style={{ color: '#5A7A5C', marginRight: 8 }}>→</span>
                  {p.rule}
                  <span style={{ color: '#5A5248', marginLeft: 8, fontSize: 11 }}>({p.triggeredBy})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'failed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#C4A35A' : '#1A1714', color: filter === f ? '#0E0C0A' : '#A89F96', border: '1px solid #2A2520', padding: '6px 14px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 4 }}>
              {f === 'all' ? 'All' : `Failed (${failCount})`}
            </button>
          ))}
          <button onClick={runPatch} disabled={patching || failCount < 3} style={{ background: 'transparent', color: patching || failCount < 3 ? '#5A5248' : '#7C9A7E', border: '1px solid #2A3A2B', padding: '6px 14px', fontSize: 12, cursor: patching || failCount < 3 ? 'not-allowed' : 'pointer', borderRadius: 4 }}>
            {patching ? 'Patching...' : 'Run patch now'}
          </button>
          <button onClick={fetchLog} style={{ marginLeft: 'auto', background: 'transparent', color: '#7A7067', border: '1px solid #2A2520', padding: '6px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}>
            Refresh
          </button>
        </div>

        {loading && <p style={{ color: '#7A7067', fontSize: 14 }}>Loading log...</p>}
        {!loading && log.length === 0 && <p style={{ color: '#7A7067', fontSize: 14 }}>No audits yet. They run automatically after AI outputs are generated.</p>}
        {!loading && shown.length === 0 && log.length > 0 && <p style={{ color: '#7C9A7E', fontSize: 14 }}>No failed audits — all copy is on-voice.</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map((entry) => (
            <div key={entry.id} style={{ background: '#1A1714', border: `1px solid ${entry.passed ? '#2A2520' : '#3A2020'}`, borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: '#E8E0D5', cursor: 'pointer', textAlign: 'left' }}
              >
                <ScoreBadge score={entry.score} passed={entry.passed} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#7A7067', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{entry.route}</span>
                    <span style={{ fontSize: 11, color: '#5A5248' }}>·</span>
                    <span style={{ fontSize: 11, color: '#5A5248' }}>{entry.context}</span>
                    <span style={{ fontSize: 11, color: '#5A5248', marginLeft: 'auto' }}>{timeAgo(entry.loggedAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#C8C0B5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.summary}</p>
                </div>
                <span style={{ color: '#5A5248', fontSize: 12, flexShrink: 0 }}>{expanded === entry.id ? '▲' : '▼'}</span>
              </button>

              {expanded === entry.id && (
                <div style={{ borderTop: '1px solid #2A2520', padding: '16px' }}>
                  <div style={{ fontSize: 12, color: '#7A7067', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.6, borderLeft: '2px solid #2A2520', paddingLeft: 10 }}>
                    {entry.text}
                  </div>

                  {entry.violations.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#7C9A7E' }}>No violations — copy is on-voice.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {entry.violations.map((v, i) => (
                        <div key={i} style={{ background: '#120F0D', borderRadius: 6, padding: '12px 14px' }}>
                          <div style={{ fontSize: 12, color: '#B05252', fontStyle: 'italic', marginBottom: 6, borderLeft: '2px solid #B05252', paddingLeft: 8 }}>"{v.quote}"</div>
                          <div style={{ fontSize: 11, color: '#7A7067', marginBottom: 8, lineHeight: 1.5 }}>{v.issue}</div>
                          <div style={{ fontSize: 12, color: '#7C9A7E', borderLeft: '2px solid #7C9A7E', paddingLeft: 8, lineHeight: 1.5 }}>{v.rewrite}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
