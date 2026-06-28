'use client';
import { useState } from 'react';
import { Loader2, BarChart3, TrendingUp, TrendingDown, RefreshCw, ShoppingBag, ChevronRight } from 'lucide-react';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';
import type { WardrobeItem } from '@/app/page';
import { slim } from './utils';
import type { BodyProfile } from '@/lib/body-profile';

type Ranked = { item: WardrobeItem; score: number; verdict: string };
type Highlighted = { item: WardrobeItem; reason: string };
type Purchase = { item: string; why: string; pairsWith: number[] };
type Result = { rankings: Ranked[]; mostValuable: Highlighted[]; worthReconsidering: Highlighted[]; purchases: Purchase[] };

function ItemRow({ item, reason, tone }: { item: WardrobeItem; reason: string; tone: 'gold' | 'muted' }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[#1A1714] truncate">{item.name}</p>
        <p className={`text-xs font-light truncate ${tone === 'gold' ? 'text-[#9B7B3A]' : 'text-[#A89F96]'}`}>{reason}</p>
      </div>
    </li>
  );
}

const STORAGE_KEY = 'mirror_last_result';

export default function MirrorTab({ items, bodyProfile }: { items: WardrobeItem[]; bodyProfile?: BodyProfile }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState('');
  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);
  const [result, setResult] = useState<Result | null>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) as Result : null;
    } catch { return null; }
  });

  const runAnalysis = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to get a meaningful read.'); return; }
    setAnalyzing(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), bodyProfile }),
      });
      const data = await res.json() as {
        rankings?: { i: number; score: number; verdict: string }[];
        mostValuable?: { i: number; reason: string }[];
        worthReconsidering?: { i: number; reason: string }[];
        purchases?: Purchase[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      const byIndex = (i: number) => items[i - 1];
      const rankings = (data.rankings ?? [])
        .map((r) => ({ item: byIndex(r.i), score: r.score, verdict: r.verdict ?? '' }))
        .filter((r): r is Ranked => Boolean(r.item))
        .sort((a, b) => b.score - a.score);
      const mostValuable = (data.mostValuable ?? [])
        .map((r) => ({ item: byIndex(r.i), reason: r.reason }))
        .filter((r): r is Highlighted => Boolean(r.item));
      const worthReconsidering = (data.worthReconsidering ?? [])
        .map((r) => ({ item: byIndex(r.i), reason: r.reason }))
        .filter((r): r is Highlighted => Boolean(r.item));

      const newResult = { rankings, mostValuable, worthReconsidering, purchases: data.purchases ?? [] };
      setResult(newResult);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newResult)); } catch { /* quota */ }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't run the analysis just now. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Nothing to analyze yet.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add a few pieces to your closet first.</p>
      </div>
    );
  }

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  return (
    <div className="space-y-4">
      <div className="border border-[#E5DDD0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Wardrobe Intelligence</p>
        <h2 className="font-serif text-2xl mt-1 text-[#1A1714]">The Mirror</h2>
        <p className="text-sm text-[#6B6058] font-light mt-1 leading-relaxed">
          Each piece is scored on versatility within your wardrobe, occasion necessity, and what gaps it fills — not just how often you wear it.
        </p>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
        >
          {analyzing ? (
            <><Loader2 className="animate-spin" size={14} /> Analyzing your closet...</>
          ) : (
            <><RefreshCw size={14} /> {result ? 'Re-run analysis' : 'Analyze my closet'}</>
          )}
        </button>
        {err && <p className="text-sm text-red-700 mt-3">{err}</p>}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Most valuable */}
            {result.mostValuable.length > 0 && (
              <div className="border border-[#E5DDD0] bg-white p-4 col-span-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp size={13} className="text-[#9B7B3A]" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Most valuable</p>
                </div>
                <ul className="space-y-3">
                  {result.mostValuable.map(({ item, reason }) => (
                    <ItemRow key={item.id} item={item} reason={reason} tone="gold" />
                  ))}
                </ul>
              </div>
            )}
            {/* Worth reconsidering */}
            {result.worthReconsidering.length > 0 && (
              <div className="border border-[#E5DDD0] bg-white p-4 col-span-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingDown size={13} className="text-[#A89F96]" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#A89F96] font-light">Worth reconsidering</p>
                </div>
                <ul className="space-y-3">
                  {result.worthReconsidering.map(({ item, reason }) => (
                    <ItemRow key={item.id} item={item} reason={reason} tone="muted" />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Full ranking */}
          <div className="border border-[#E5DDD0] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-4">Every piece, ranked</p>
            <div className="space-y-3">
              {result.rankings.map(({ item, score, verdict }) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[#1A1714] truncate">{item.name}</p>
                      <span className="text-xs text-[#9B7B3A] font-light ml-2 shrink-0">{score}/10</span>
                    </div>
                    <div className="h-px bg-[#E5DDD0] overflow-hidden">
                      <div className="h-full bg-[#9B7B3A]" style={{ width: `${score * 10}%` }} />
                    </div>
                    {verdict && <p className="text-[10px] text-[#A89F96] mt-1 font-light">{verdict}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase recommendations */}
          {result.purchases?.length > 0 && (
            <div className="border border-[#E5DDD0] bg-[#1A1714] text-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag size={14} className="text-[#9B7B3A]" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Top 3 pieces to buy</p>
              </div>
              <p className="text-xs text-white/50 font-light mb-4">These would make your existing wardrobe work significantly harder.</p>
              <div className="space-y-4">
                {result.purchases.map((p, i) => (
                  <div key={i} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                    <button className="text-left group w-full" onClick={() => setLearnMore({ type: 'purchase', title: p.item, context: p.why, onClose: () => setLearnMore(null) })}>
                      <p className="font-serif text-lg text-white group-hover:text-white/80 transition-colors">{p.item}</p>
                      <p className="text-xs text-white/60 font-light mt-0.5">{p.why}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mt-1 flex items-center gap-0.5">What to look for <ChevronRight size={10} /></p>
                    </button>
                    {p.pairsWith?.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {p.pairsWith.map((idx) => {
                          const it = items[idx - 1];
                          return it ? (
                            <div key={idx} className="shrink-0 w-9 h-9 overflow-hidden bg-white/10 border border-white/20">
                              {it.imageUrl
                                ? <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full" />}
                            </div>
                          ) : null;
                        })}
                        <p className="text-[10px] text-white/40 self-center font-light">pairs with these</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
