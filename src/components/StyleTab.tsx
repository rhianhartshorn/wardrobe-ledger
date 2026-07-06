'use client';
import { useState } from 'react';
import { Loader2, Gem, RefreshCw, Target, ChevronRight } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { slim } from './utils';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';
import type { BodyProfile } from '@/lib/body-profile';
import MirrorTab from './MirrorTab';
import StylistChat from './StylistChat';
import StyleDiscoveryCarousel from './StyleDiscoveryCarousel';
import type { StyleReadResult } from '@/lib/style-types';

const GOAL_SUGGESTIONS = [
  'Quiet Luxury', 'Old Money', 'Zoe Kravitz', 'Sofia Richie',
  'Hailey Bieber', 'Rosie Huntington-Whiteley', 'Street Style', 'Parisian Cool',
  'Margot Robbie', 'Coastal Grandmother', 'Clean Girl', 'Timothée Chalamet',
];

type FashionCurrency = { itemId: string; era: string; status: 'timeless' | 'current' | 'dated' | 'coming-back'; how2026: string | null };
type GoalAnalysis = { goal: string; howClose: string; workingPieces: string[]; missingPieces: string[]; bridgeTips: string[] };
type MatchResult = { closestMatches?: Array<{ name: string; why: string; matchStrength: string }>; goalAnalysis?: GoalAnalysis };

function LearnMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light hover:text-[#1A1714] transition-colors mt-2">
      Learn more <ChevronRight size={11} />
    </button>
  );
}

export default function StyleTab({ items, bodyProfile }: { items: WardrobeItem[]; bodyProfile?: BodyProfile }) {
  const [view, setView] = useState<'dna' | 'insights'>('dna');
  const [showPersonaSetup, setShowPersonaSetup] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<StyleReadResult | null>(null);
  const [fashionCurrency, setFashionCurrency] = useState<FashionCurrency[] | null>(null);

  const [goal, setGoal] = useState('');
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalErr, setGoalErr] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);

  const runAnalysis = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to get a style reading.'); return; }
    setAnalyzing(true); setErr(''); setResult(null); setFashionCurrency(null); setMatchResult(null);

    const topWorn = [...items]
      .sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0))
      .slice(0, 5)
      .filter((i) => (i.wearCount ?? 0) > 0)
      .map((i) => `${i.name} (${i.category}, worn ${i.wearCount}x)`);

    const savedLookTitles: string[] = [];
    try {
      const raw = localStorage.getItem('wl_saved_looks');
      if (raw) (JSON.parse(raw) as Array<{ title: string }>).slice(0, 5).forEach((l) => savedLookTitles.push(l.title));
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/style-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), bodyProfile, topWorn, savedLookTitles }),
      });
      const data = await res.json() as StyleReadResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);

      // Fashion currency loads in parallel — heavier per-item call
      setLoadingCurrency(true);
      fetch('/api/fashion-currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items) }),
      })
        .then((r) => r.json())
        .then((fc: { fashionCurrency?: FashionCurrency[] }) => {
          if (fc.fashionCurrency) setFashionCurrency(fc.fashionCurrency);
        })
        .catch(() => {})
        .finally(() => setLoadingCurrency(false));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't run style analysis right now.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runGoal = async (overrideGoal?: string) => {
    const g = overrideGoal ?? goal;
    setLoadingGoal(true); setGoalErr(''); setMatchResult((prev) => prev ? { ...prev, goalAnalysis: undefined } : null);
    try {
      const res = await fetch('/api/style-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), goal: g || undefined }),
      });
      const data = await res.json() as MatchResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMatchResult(data);
    } catch (e) { setGoalErr(e instanceof Error ? e.message : 'Could not run analysis.'); }
    finally { setLoadingGoal(false); }
  };

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Gem className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Nothing to analyse yet.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add 3 or more pieces to the Closet tab, then return here for your style archetype, colour story, and what's missing from your range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showPersonaSetup && (
        <StyleDiscoveryCarousel
          onDone={() => { setShowPersonaSetup(false); localStorage.setItem('wl_style_discovery_done', '1'); }}
          itemCount={items.length}
          topWorn={[...items].sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0)).slice(0, 5).filter((i) => (i.wearCount ?? 0) > 0).map((i) => i.name)}
        />
      )}

      {/* Internal view toggle */}
      <div className="flex border border-[#E5DDD0] overflow-hidden">
        {(['dna', 'insights'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-[0.15em] font-light transition-colors ${
              view === v ? 'bg-[#1A1714] text-white' : 'bg-white text-[#6B6058] hover:bg-[#F5F2EC]'
            }`}
          >
            {v === 'dna' ? 'Style DNA' : 'Insights'}
          </button>
        ))}
      </div>

      {view === 'insights' ? (
        <MirrorTab items={items} bodyProfile={bodyProfile} />
      ) : (<>

      {/* ── SECTION 1: READ MY STYLE ── */}
      <div className="border border-[#E5DDD0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Section 1</p>
        <h2 className="font-serif text-2xl mt-0.5 text-[#1A1714]">Read My Style</h2>
        <p className="text-sm text-[#6B6058] font-light mt-1">Your style archetype, what your clothes communicate, and which style icons your wardrobe matches closest.</p>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
        >
          {analyzing ? <><Loader2 className="animate-spin" size={14} /> Reading your style...</> : <><RefreshCw size={14} /> {result ? 'Re-read my style' : 'Read my style'}</>}
        </button>
        {err && <p className="text-sm text-red-700 mt-3">{err}</p>}
      </div>

      {result && (
        <>
          {/* Archetype */}
          <div
            className="border border-[#E5DDD0] bg-[#1A1714] text-white p-6 cursor-pointer group"
            onClick={() => setLearnMore({ type: 'aesthetic', title: result.archetype, context: result.archetypeDescription, onClose: () => setLearnMore(null) })}
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Your archetype</p>
            <h2 className="font-serif text-3xl mt-2 italic">{result.archetype}</h2>
            <p className="text-sm text-white/70 font-light mt-3 leading-relaxed">{result.archetypeDescription}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {result.styleKeywords?.map((kw) => (
                <span key={kw} className="text-[10px] uppercase tracking-widest border border-white/20 px-2 py-1 text-white/60">{kw}</span>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mt-4 flex items-center gap-1 group-hover:opacity-70 transition-opacity">
              Deep dive <ChevronRight size={11} />
            </p>
          </div>

          {/* Brand statement */}
          <div className="border border-[#E5DDD0] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">What your wardrobe says right now</p>
            <p className="font-serif text-lg text-[#1A1714] leading-snug">{result.brandStatement}</p>
            {result.narrativeArc && (
              <p className="text-sm text-[#6B6058] font-light mt-3 leading-relaxed border-t border-[#E5DDD0] pt-3">{result.narrativeArc}</p>
            )}
          </div>

          {/* Style twins */}
          {result.styleTwins?.length > 0 && (
            <div className="border border-[#E5DDD0] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-4">You dress closest to</p>
              <div className="space-y-4">
                {result.styleTwins.map((m, i) => (
                  <div key={i} className="cursor-pointer group" onClick={() => setLearnMore({ type: 'style-match', title: m.name, context: `${m.why}. Match strength: ${m.matchStrength}`, onClose: () => setLearnMore(null) })}>
                    <div className="flex items-baseline justify-between">
                      <p className="font-serif text-lg text-[#1A1714]">{m.name}</p>
                      <span className="text-[10px] text-[#A89F96] font-light capitalize">{m.matchStrength} match</span>
                    </div>
                    <div className="h-px bg-[#E5DDD0] overflow-hidden mt-1">
                      <div className={`h-full ${m.matchStrength === 'high' ? 'bg-[#9B7B3A]' : m.matchStrength === 'medium' ? 'bg-[#C4B08A]' : 'bg-[#E5DDD0]'}`}
                        style={{ width: m.matchStrength === 'high' ? '100%' : m.matchStrength === 'medium' ? '60%' : '30%' }} />
                    </div>
                    <p className="text-xs text-[#6B6058] font-light mt-1.5 leading-snug">{m.why}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mt-1.5 flex items-center gap-1 group-hover:opacity-70 transition-opacity">
                      Learn about their style <ChevronRight size={11} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next chapter */}
          <div className="bg-[#F5F2EC] p-4 border border-[#E5DDD0]">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1">The shift that matters most</p>
            <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.nextChapter}</p>
          </div>

          {/* Color story */}
          <div className="border border-[#E5DDD0] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">Colour story</p>
            <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.colorStory}</p>
          </div>

          {/* Strengths & gaps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#E5DDD0] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-3">Strengths</p>
              <ul className="space-y-2">
                {result.wardrobeStrengths?.map((s, i) => (
                  <li key={i} className="text-xs text-[#1A1714] font-light leading-snug flex gap-2"><span className="text-[#9B7B3A] shrink-0">—</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="border border-[#E5DDD0] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Gaps</p>
              <ul className="space-y-2">
                {result.wardrobeGaps?.map((g, i) => (
                  <li key={i} className="text-xs text-[#1A1714] font-light leading-snug flex gap-2"><span className="text-[#A89F96] shrink-0">—</span>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Style groups */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Your wardrobe by aesthetic</p>
            <div className="space-y-3">
              {result.styleGroups?.map((g, i) => {
                const groupItems = g.itemIds.map((id) => items.find((it) => it.id === id)).filter((x): x is WardrobeItem => Boolean(x));
                return (
                  <div key={i} className="border border-[#E5DDD0] bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-0.5">{g.mood}</p>
                    <h3 className="font-serif text-lg text-[#1A1714]">{g.groupName}</h3>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {groupItems.map((p) => (
                        <div key={p.id} className="shrink-0 w-16">
                          <div className="aspect-square w-16 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[#A89F96] text-[9px] text-center px-1 leading-tight">{p.name}</div>}
                          </div>
                          <p className="text-[10px] text-[#6B6058] truncate mt-1">{p.name}</p>
                        </div>
                      ))}
                    </div>
                    <LearnMoreButton onClick={() => setLearnMore({
                      type: 'style-group',
                      title: g.groupName,
                      context: `Mood: ${g.mood}. Contains: ${groupItems.map((it) => it.name).join(', ')}`,
                      relevantItems: groupItems,
                      onClose: () => setLearnMore(null),
                    })} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fashion currency */}
          {loadingCurrency && (
            <div className="flex items-center gap-2 text-xs text-[#A89F96] font-light">
              <Loader2 size={12} className="animate-spin" /> Loading fashion currency...
            </div>
          )}
          {fashionCurrency && fashionCurrency.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Fashion currency — 2026</p>
              <div className="border border-[#E5DDD0] bg-white divide-y divide-[#E5DDD0]">
                {fashionCurrency.map((fc) => {
                  const item = items.find((i) => i.id === fc.itemId);
                  if (!item) return null;
                  const statusStyles: Record<string, string> = {
                    timeless: 'text-green-700 bg-green-50 border-green-200',
                    current: 'text-[#9B7B3A] bg-amber-50 border-amber-200',
                    'coming-back': 'text-purple-700 bg-purple-50 border-purple-200',
                    dated: 'text-[#A89F96] bg-[#F5F2EC] border-[#E5DDD0]',
                  };
                  return (
                    <div key={fc.itemId} className="flex gap-3 p-3 cursor-pointer group" onClick={() => setLearnMore({
                      type: 'aesthetic',
                      title: `How to wear: ${item.name} in 2026`,
                      context: `This is a ${item.category} in ${item.primaryColor}. Era: ${fc.era}. Status: ${fc.status}. ${fc.how2026 ?? ''}`,
                      relevantItems: [item],
                      onClose: () => setLearnMore(null),
                    })}>
                      <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs text-[#1A1714] font-light truncate">{item.name}</p>
                          <span className={`text-[9px] uppercase tracking-widest border px-1.5 py-0.5 font-light shrink-0 ${statusStyles[fc.status] ?? statusStyles.dated}`}>
                            {fc.status === 'coming-back' ? 'Coming back' : fc.status}
                          </span>
                        </div>
                        {fc.how2026 && <p className="text-[11px] text-[#6B6058] font-light leading-snug">{fc.how2026}</p>}
                        <p className="text-[10px] text-[#9B7B3A] font-light mt-1 flex items-center gap-0.5 group-hover:opacity-70">How to wear in 2026 <ChevronRight size={10} /></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SECTION 2: YOUR STYLE GOALS ── */}
      <div className="border-t-2 border-[#E5DDD0] pt-5">
        <div className="border border-[#E5DDD0] bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target size={13} className="text-[#9B7B3A]" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Section 2</p>
          </div>
          <h2 className="font-serif text-2xl text-[#1A1714]">Your Style Goals</h2>
          <p className="text-sm text-[#6B6058] font-light mt-1 mb-4">Name a style target — your styling team will show you how close you are and the specific steps to close the gap.</p>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Zoe Kravitz, Old Money, Quiet Luxury..."
            className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] mb-3"
          />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GOAL_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setGoal(s); runGoal(s); }}
                className="text-[10px] border border-[#E5DDD0] px-2.5 py-1 text-[#6B6058] font-light hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors">
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => runGoal()} disabled={loadingGoal}
            className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {loadingGoal ? <><Loader2 className="animate-spin" size={13} /> Analysing...</> : 'How do I achieve this?'}
          </button>
          {goalErr && <p className="text-xs text-red-700 mt-3 font-light">{goalErr}</p>}
        </div>

        {matchResult?.goalAnalysis && (
          <div className="border border-[#E5DDD0] bg-[#1A1714] text-white p-5 space-y-4 mt-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Your goal</p>
              <p className="font-serif text-2xl italic mt-1">{matchResult.goalAnalysis.goal}</p>
              <p className="text-sm text-white/60 font-light mt-2 leading-relaxed">{matchResult.goalAnalysis.howClose}</p>
            </div>

            {matchResult.goalAnalysis.workingPieces?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">Pieces you already have that work</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {matchResult.goalAnalysis.workingPieces.map((id) => {
                    const item = items.find((i) => i.id === id);
                    return item ? (
                      <div key={id} className="shrink-0 w-12">
                        <div className="w-12 h-12 overflow-hidden bg-white/10 border border-white/20">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                        </div>
                        <p className="text-[9px] text-white/40 truncate mt-0.5 font-light">{item.name}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {matchResult.goalAnalysis.bridgeTips?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">How to get there with what you own</p>
                <ul className="space-y-2">
                  {matchResult.goalAnalysis.bridgeTips.map((tip, i) => (
                    <li key={i} className="text-xs text-white/70 font-light flex gap-2 leading-snug">
                      <span className="text-[#9B7B3A] shrink-0">—</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {matchResult.goalAnalysis.missingPieces?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A89F96] font-light mb-2">Key pieces to buy</p>
                <ul className="space-y-1">
                  {matchResult.goalAnalysis.missingPieces.map((p, i) => (
                    <li key={i} className="text-xs text-white/50 font-light flex gap-2 cursor-pointer group" onClick={() => setLearnMore({
                      type: 'purchase', title: p, context: `Goal style: ${matchResult.goalAnalysis?.goal}. This piece would help bridge the gap.`, onClose: () => setLearnMore(null),
                    })}>
                      <span className="text-[#9B7B3A] shrink-0">+</span>
                      <span className="group-hover:text-white/80 transition-colors">{p} <ChevronRight size={10} className="inline" /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <LearnMoreButton onClick={() => setLearnMore({
              type: 'style-match', title: matchResult.goalAnalysis!.goal,
              context: `Goal: ${matchResult.goalAnalysis!.goal}. Current gap: ${matchResult.goalAnalysis!.howClose}`,
              onClose: () => setLearnMore(null),
            })} />
          </div>
        )}
      </div>

      {/* Stylist feedback */}
      <StylistChat onRebuildProfile={() => setShowPersonaSetup(true)} />
      </>)}
    </div>
  );
}
