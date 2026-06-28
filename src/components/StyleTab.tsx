'use client';
import { useState } from 'react';
import { Loader2, Gem, RefreshCw } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';

type StyleGroup = { groupName: string; mood: string; itemIds: string[] };
type StyleResult = {
  archetype: string;
  archetypeDescription: string;
  styleKeywords: string[];
  colorStory: string;
  wardrobeStrengths: string[];
  wardrobeGaps: string[];
  styleGroups: StyleGroup[];
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
  const [err, setErr] = useState('');
  const [result, setResult] = useState<StyleResult | null>(null);

  const runAnalysis = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to get a style reading.'); return; }
    setAnalyzing(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json() as StyleResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
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
        </>
      )}
    </div>
  );
}
