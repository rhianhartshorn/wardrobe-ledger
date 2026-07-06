'use client';

import { useState } from 'react';
import type { ReviewResult } from '@/app/api/editorial-review/route';

const CONTEXT_OPTIONS = [
  'outfit rationale',
  'combination rationale',
  'accessory direction',
  'style archetype description',
  'brand statement',
  'wardrobe strength or gap',
  'fashion currency tip',
  'style analysis section',
  'stylist acknowledgment',
  'image strategy section',
  'learn-more editorial',
  'other',
];

export default function ReviewPage() {
  const [text, setText] = useState('');
  const [context, setContext] = useState('outfit rationale');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runReview() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/editorial-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), context }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data as ReviewResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) => {
    if (s >= 8) return '#7C9A7E';
    if (s >= 6) return '#C4A35A';
    return '#B05252';
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0E0C0A', color: '#E8E0D5', fontFamily: 'var(--font-geist-sans, sans-serif)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.15em', color: '#7A7067', textTransform: 'uppercase', marginBottom: 8 }}>Editorial Review</p>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: '#E8E0D5', marginBottom: 8 }}>Copy Director</h1>
          <p style={{ fontSize: 14, color: '#A89F96', lineHeight: 1.6 }}>Paste any AI-generated output and the Copy Director will score it against the brand voice spec — banned words, hedging, length, specificity — and rewrite what needs fixing.</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: '#7A7067', textTransform: 'uppercase', marginBottom: 8 }}>Where does this copy appear?</label>
          <select
            value={context}
            onChange={e => setContext(e.target.value)}
            style={{ width: '100%', background: '#1A1714', border: '1px solid #2A2520', color: '#E8E0D5', padding: '10px 12px', fontSize: 13, borderRadius: 4, outline: 'none' }}
          >
            {CONTEXT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: '#7A7067', textTransform: 'uppercase', marginBottom: 8 }}>Copy to review</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste the AI output here..."
            rows={8}
            style={{ width: '100%', background: '#1A1714', border: '1px solid #2A2520', color: '#E8E0D5', padding: '12px', fontSize: 13, lineHeight: 1.6, borderRadius: 4, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={runReview}
          disabled={loading || !text.trim()}
          style={{ background: loading || !text.trim() ? '#2A2520' : '#C4A35A', color: loading || !text.trim() ? '#7A7067' : '#0E0C0A', border: 'none', padding: '12px 24px', fontSize: 13, letterSpacing: '0.08em', cursor: loading || !text.trim() ? 'not-allowed' : 'pointer', borderRadius: 4, fontWeight: 500 }}
        >
          {loading ? 'Reviewing...' : 'Run review'}
        </button>

        {error && (
          <p style={{ color: '#B05252', fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        {result && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px 24px', background: '#1A1714', borderRadius: 8, border: `1px solid ${result.passed ? '#2A3A2B' : '#3A2020'}` }}>
              <div style={{ textAlign: 'center', minWidth: 56 }}>
                <div style={{ fontSize: 36, fontWeight: 300, color: scoreColor(result.score), lineHeight: 1 }}>{result.score}</div>
                <div style={{ fontSize: 10, color: '#7A7067', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>/10</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', color: result.passed ? '#7C9A7E' : '#B05252', textTransform: 'uppercase', marginBottom: 4 }}>
                  {result.passed ? 'Passed' : 'Needs revision'}
                </div>
                <p style={{ fontSize: 14, color: '#C8C0B5', lineHeight: 1.5, margin: 0 }}>{result.summary}</p>
              </div>
            </div>

            {result.violations.length === 0 ? (
              <p style={{ fontSize: 14, color: '#7C9A7E', padding: '16px 0' }}>No violations found. Copy is on-voice.</p>
            ) : (
              <div>
                <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#7A7067', textTransform: 'uppercase', marginBottom: 16 }}>
                  {result.violations.length} violation{result.violations.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {result.violations.map((v, i) => (
                    <div key={i} style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 8, padding: '20px 24px' }}>
                      <div style={{ fontSize: 13, color: '#B05252', fontStyle: 'italic', marginBottom: 8, borderLeft: '2px solid #B05252', paddingLeft: 12 }}>
                        "{v.quote}"
                      </div>
                      <div style={{ fontSize: 12, color: '#A89F96', marginBottom: 12, lineHeight: 1.5 }}>
                        {v.issue}
                      </div>
                      <div style={{ fontSize: 13, color: '#7C9A7E', borderLeft: '2px solid #7C9A7E', paddingLeft: 12, lineHeight: 1.5 }}>
                        {v.rewrite}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
