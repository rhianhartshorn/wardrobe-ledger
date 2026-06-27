'use client';
import { useState } from 'react';
import { Loader2, BarChart3, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';

type Ranked = { item: WardrobeItem; score: number };
type Highlighted = { item: WardrobeItem; reason: string };
type Result = { rankings: Ranked[]; most: Highlighted[]; least: Highlighted[] };

function HighlightGroup({
  title, icon: Icon, tone, entries,
}: {
  title: string;
  icon: React.ElementType;
  tone: 'amber' | 'stone';
  entries: Highlighted[];
}) {
  if (!entries.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <h3 className="text-xs uppercase tracking-wide text-stone-500 mb-2 flex items-center gap-1.5">
        <Icon size={14} className={tone === 'amber' ? 'text-amber-600' : 'text-stone-400'} />
        {title}
      </h3>
      <ul className="space-y-2">
        {entries.map(({ item, reason }) => (
          <li key={item.id} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-stone-800 truncate">{item.name}</p>
              <p className="text-xs text-stone-500 truncate">{reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MirrorTab({ items }: { items: WardrobeItem[] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const runAnalysis = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to get a meaningful read.'); return; }
    setAnalyzing(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json() as {
        rankings?: { i: number; score: number }[];
        mostVersatile?: { i: number; reason: string }[];
        leastVersatile?: { i: number; reason: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      const byIndex = (i: number) => items[i - 1];
      const rankings = (data.rankings ?? [])
        .map((r) => ({ item: byIndex(r.i), score: r.score }))
        .filter((r): r is Ranked => Boolean(r.item))
        .sort((a, b) => b.score - a.score);
      const most = (data.mostVersatile ?? [])
        .map((r) => ({ item: byIndex(r.i), reason: r.reason }))
        .filter((r): r is Highlighted => Boolean(r.item));
      const least = (data.leastVersatile ?? [])
        .map((r) => ({ item: byIndex(r.i), reason: r.reason }))
        .filter((r): r is Highlighted => Boolean(r.item));

      setResult({ rankings, most, least });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't run the analysis just now. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="mx-auto text-stone-300" size={40} />
        <p className="mt-3 text-stone-500">Nothing to analyze yet.</p>
        <p className="text-sm text-stone-400">Add a few pieces to your closet first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <h2 className="font-serif text-lg">The Mirror</h2>
        <p className="text-sm text-stone-500 mt-1">
          Shows which pieces earn their spot in the closet, and which ones rarely have anything to go with.
        </p>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full mt-3 flex items-center justify-center gap-2 bg-stone-900 text-stone-50 rounded py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          {analyzing ? (
            <><Loader2 className="animate-spin" size={16} /> Reading your closet...</>
          ) : (
            <><RefreshCw size={16} /> {result ? 'Re-run analysis' : 'Analyze my closet'}</>
          )}
        </button>
        {err && <p className="text-sm text-red-700 mt-2">{err}</p>}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HighlightGroup title="Most versatile" icon={TrendingUp} tone="amber" entries={result.most} />
            <HighlightGroup title="Worth reconsidering" icon={TrendingDown} tone="stone" entries={result.least} />
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <h3 className="text-xs uppercase tracking-wide text-stone-500 mb-3">Every piece, ranked</h3>
            <div className="space-y-2">
              {result.rankings.map(({ item, score }) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-700 truncate">{item.name}</p>
                    <div className="h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${Math.max(score, 0) * 10}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 font-mono w-6 text-right">{score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
