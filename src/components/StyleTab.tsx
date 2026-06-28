'use client';
import { useState } from 'react';
import { Loader2, Gem, RefreshCw, Target, User } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { slim } from './utils';

const GOAL_SUGGESTIONS = [
  'Quiet Luxury', 'Old Money', 'Zoe Kravitz', 'Sofia Richie',
  'Hailey Bieber', 'Rosie Huntington-Whiteley', 'Street Style', 'Parisian Chic',
  'Margot Robbie', 'Coastal Grandmother', 'Clean Girl', 'Timothée Chalamet',
];

type StyleMatch = { name: string; why: string; matchStrength: 'high' | 'medium' | 'low' };
type GoalAnalysis = {
  goal: string; howClose: string;
  workingPieces: string[]; missingPieces: string[]; bridgeTips: string[];
};
type MatchResult = { closestMatches: StyleMatch[]; goalAnalysis?: GoalAnalysis };

function MatchStrengthBar({ strength }: { strength: string }) {
  const w = strength === 'high' ? '100%' : strength === 'medium' ? '60%' : '30%';
  const color = strength === 'high' ? 'bg-[#9B7B3A]' : strength === 'medium' ? 'bg-[#C4B08A]' : 'bg-[#E5DDD0]';
  return <div className="h-px bg-[#E5DDD0] overflow-hidden mt-1"><div className={`h-full ${color}`} style={{ width: w }} /></div>;
}

function StyleAspirations({ items }: { items: WardrobeItem[] }) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);

  const run = async (overrideGoal?: string) => {
    const g = overrideGoal ?? goal;
    setLoading(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/style-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), goal: g || undefined }),
      });
      const data = await res.json() as MatchResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not run analysis.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="border border-[#E5DDD0] bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Target size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Style aspirations</p>
        </div>
        <p className="text-sm text-[#6B6058] font-light mb-3">
          Who do you want to dress like, or what style are you aiming for?
        </p>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Zoe Kravitz, Old Money, Quiet Luxury..."
          className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] mb-3"
        />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {GOAL_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setGoal(s); run(s); }}
              className="text-[10px] border border-[#E5DDD0] px-2.5 py-1 text-[#6B6058] font-light hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => run()}
          disabled={loading}
          className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="animate-spin" size={13} /> Analysing...</> : goal ? 'How do I achieve this?' : 'Who do I currently dress like?'}
        </button>
        {err && <p className="text-xs text-red-700 mt-3 font-light">{err}</p>}
      </div>

      {result && (
        <>
          {/* Closest matches */}
          <div className="border border-[#E5DDD0] bg-white p-4">
            <div className="flex items-center gap-2 mb-4">
              <User size={13} className="text-[#9B7B3A]" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">You currently dress closest to</p>
            </div>
            <div className="space-y-4">
              {result.closestMatches?.map((m, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-serif text-lg text-[#1A1714]">{m.name}</p>
                    <span className="text-[10px] text-[#A89F96] font-light capitalize">{m.matchStrength} match</span>
                  </div>
                  <MatchStrengthBar strength={m.matchStrength} />
                  <p className="text-xs text-[#6B6058] font-light mt-1.5 leading-snug">{m.why}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goal analysis */}
          {result.goalAnalysis && (
            <div className="border border-[#E5DDD0] bg-[#1A1714] text-white p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Your goal</p>
                <p className="font-serif text-2xl italic mt-1">{result.goalAnalysis.goal}</p>
                <p className="text-sm text-white/60 font-light mt-2 leading-relaxed">{result.goalAnalysis.howClose}</p>
              </div>

              {result.goalAnalysis.workingPieces?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">Pieces you already have that work</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {result.goalAnalysis.workingPieces.map((id) => {
                      const item = items.find((i) => i.id === id);
                      return item ? (
                        <div key={id} className="shrink-0 w-12">
                          <div className="w-12 h-12 overflow-hidden bg-white/10 border border-white/20">
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full" />}
                          </div>
                          <p className="text-[9px] text-white/40 truncate mt-0.5 font-light">{item.name}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {result.goalAnalysis.bridgeTips?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">How to get there with what you own</p>
                  <ul className="space-y-2">
                    {result.goalAnalysis.bridgeTips.map((tip, i) => (
                      <li key={i} className="text-xs text-white/70 font-light flex gap-2 leading-snug">
                        <span className="text-[#9B7B3A] shrink-0">—</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.goalAnalysis.missingPieces?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#A89F96] font-light mb-2">Key pieces to buy to complete the look</p>
                  <ul className="space-y-1">
                    {result.goalAnalysis.missingPieces.map((p, i) => (
                      <li key={i} className="text-xs text-white/50 font-light flex gap-2">
                        <span className="text-[#9B7B3A] shrink-0">+</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

type StyleGroup = { groupName: string; mood: string; itemIds: string[] };
type FashionCurrency = { itemId: string; era: string; status: 'timeless' | 'current' | 'dated' | 'coming-back'; how2026: string | null };
type StyleResult = {
  archetype: string;
  archetypeDescription: string;
  styleKeywords: string[];
  colorStory: string;
  wardrobeStrengths: string[];
  wardrobeGaps: string[];
  styleGroups: StyleGroup[];
  fashionCurrency?: FashionCurrency[];
};

function GroupCard({ group, items }: { group: StyleGroup; items: WardrobeItem[] }) {
  const pieces = group.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));

  return (
    <div className="border border-[#E5DDD0] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-0.5">{group.mood}</p>
      <h3 className="font-serif text-lg text-[#1A1714]">{group.groupName}</h3>
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {pieces.map((p) => (
          <div key={p.id} className="shrink-0 w-16">
            <div className="aspect-square w-16 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#A89F96] text-[9px] text-center px-1 leading-tight">{p.name}</div>
              }
            </div>
            <p className="text-[10px] text-[#6B6058] truncate mt-1">{p.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StyleTab({ items }: { items: WardrobeItem[] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<StyleResult | null>(null);

  const runAnalysis = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to get a style reading.'); return; }
    setAnalyzing(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items) }),
      });
      const data = await res.json() as StyleResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
      // Load fashion currency separately so it doesn't bloat the main response
      setLoadingCurrency(true);
      fetch('/api/fashion-currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items) }),
      })
        .then((r) => r.json())
        .then((fc: { fashionCurrency?: FashionCurrency[] }) => {
          if (fc.fashionCurrency) setResult((prev) => prev ? { ...prev, fashionCurrency: fc.fashionCurrency } : prev);
        })
        .catch(() => { /* non-fatal */ })
        .finally(() => setLoadingCurrency(false));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't run style analysis right now.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Gem className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Nothing to read yet.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add a few pieces to discover your style DNA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StyleAspirations items={items} />

      <div className="border border-[#E5DDD0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Style Intelligence</p>
        <h2 className="font-serif text-2xl mt-1 text-[#1A1714]">Your Style DNA</h2>
        <p className="text-sm text-[#6B6058] font-light mt-1">
          An editorial read of your wardrobe — your archetype, color story, and how your pieces cluster aesthetically.
        </p>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
        >
          {analyzing ? (
            <><Loader2 className="animate-spin" size={14} /> Reading your wardrobe...</>
          ) : (
            <><RefreshCw size={14} /> {result ? 'Re-read my style' : 'Read my style DNA'}</>
          )}
        </button>
        {err && <p className="text-sm text-red-700 mt-3">{err}</p>}
      </div>

      {result && (
        <>
          {/* Archetype */}
          <div className="border border-[#E5DDD0] bg-[#1A1714] text-white p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Your archetype</p>
            <h2 className="font-serif text-3xl mt-2 italic">{result.archetype}</h2>
            <p className="text-sm text-white/70 font-light mt-3 leading-relaxed">{result.archetypeDescription}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {result.styleKeywords?.map((kw) => (
                <span key={kw} className="text-[10px] uppercase tracking-widest border border-white/20 px-2 py-1 text-white/60">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Color story */}
          <div className="border border-[#E5DDD0] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">Color story</p>
            <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.colorStory}</p>
          </div>

          {/* Strengths & gaps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#E5DDD0] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-3">Strengths</p>
              <ul className="space-y-2">
                {result.wardrobeStrengths?.map((s, i) => (
                  <li key={i} className="text-xs text-[#1A1714] font-light leading-snug flex gap-2">
                    <span className="text-[#9B7B3A] shrink-0">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#E5DDD0] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Gaps</p>
              <ul className="space-y-2">
                {result.wardrobeGaps?.map((g, i) => (
                  <li key={i} className="text-xs text-[#1A1714] font-light leading-snug flex gap-2">
                    <span className="text-[#A89F96] shrink-0">—</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Style groups */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Your wardrobe by aesthetic</p>
            <div className="space-y-3">
              {result.styleGroups?.map((g, i) => (
                <GroupCard key={i} group={g} items={items} />
              ))}
            </div>
          </div>

          {/* Fashion currency */}
          {loadingCurrency && (
            <div className="flex items-center gap-2 text-xs text-[#A89F96] font-light">
              <Loader2 size={12} className="animate-spin" /> Loading fashion currency...
            </div>
          )}
          {result.fashionCurrency && result.fashionCurrency.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Fashion currency — 2026</p>
              <div className="border border-[#E5DDD0] bg-white divide-y divide-[#E5DDD0]">
                {result.fashionCurrency.map((fc) => {
                  const item = items.find((i) => i.id === fc.itemId);
                  if (!item) return null;
                  const statusStyles: Record<string, string> = {
                    timeless: 'text-green-700 bg-green-50 border-green-200',
                    current: 'text-[#9B7B3A] bg-amber-50 border-amber-200',
                    'coming-back': 'text-purple-700 bg-purple-50 border-purple-200',
                    dated: 'text-[#A89F96] bg-[#F5F2EC] border-[#E5DDD0]',
                  };
                  return (
                    <div key={fc.itemId} className="flex gap-3 p-3">
                      <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs text-[#1A1714] font-light truncate">{item.name}</p>
                          <span className={`text-[9px] uppercase tracking-widest border px-1.5 py-0.5 font-light shrink-0 ${statusStyles[fc.status] ?? statusStyles.dated}`}>
                            {fc.status === 'coming-back' ? 'Coming back' : fc.status}
                          </span>
                          <span className="text-[9px] text-[#A89F96] font-light shrink-0">peaked {fc.era}</span>
                        </div>
                        {fc.how2026 && (
                          <p className="text-[11px] text-[#6B6058] font-light leading-snug">{fc.how2026}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
