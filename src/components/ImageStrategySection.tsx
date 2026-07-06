'use client';
import { useState } from 'react';
import { Loader2, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { BodyProfile } from '@/lib/body-profile';
import { slim } from './utils';
import type { ImageStrategyResult } from '@/app/api/image-strategy/route';

type Props = {
  items: WardrobeItem[];
  bodyProfile?: BodyProfile;
};

export default function ImageStrategySection({ items, bodyProfile }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageStrategyResult | null>(null);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState(false);

  const run = async () => {
    if (items.length < 5) { setErr('Add at least 5 items for a meaningful image analysis.'); return; }
    setLoading(true); setErr(''); setResult(null);

    const topWorn = [...items]
      .sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0))
      .slice(0, 5)
      .filter((i) => (i.wearCount ?? 0) > 0)
      .map((i) => `${i.name} (worn ${i.wearCount}x)`);

    const savedLookTitles: string[] = [];
    try {
      const raw = localStorage.getItem('wl_saved_looks');
      if (raw) (JSON.parse(raw) as Array<{ title: string }>).slice(0, 5).forEach((l) => savedLookTitles.push(l.title));
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/image-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), bodyProfile, topWorn, savedLookTitles }),
      });
      const data = await res.json() as ImageStrategyResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
      setExpanded(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className="p-4 border-b border-[#E5DDD0]">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Image Strategy</p>
        </div>
        <h3 className="font-serif text-lg text-[#1A1714]">What is your wardrobe saying?</h3>
        <p className="text-sm text-[#6B6058] font-light mt-1">A brand strategist reads your wardrobe as a communication system — not individual outfits, but the overall story you're telling the world.</p>
      </div>

      <div className="p-4">
        {!result ? (
          <>
            <button
              onClick={run}
              disabled={loading || items.length < 5}
              className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={13} /> Reading your image...</> : 'Read my image'}
            </button>
            {err && <p className="text-xs text-red-700 mt-3 font-light">{err}</p>}
            {items.length < 5 && <p className="text-xs text-[#A89F96] mt-2 font-light text-center">Add at least 5 items to unlock this.</p>}
          </>
        ) : (
          <div className="space-y-4">
            {/* Brand statement — always visible */}
            <div className="border-l-2 border-[#9B7B3A] pl-3 py-1">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mb-1">What your wardrobe says right now</p>
              <p className="font-serif text-lg text-[#1A1714] leading-snug">{result.brandStatement}</p>
            </div>

            {/* Next chapter — always visible */}
            <div className="bg-[#F5F2EC] p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1">The shift that matters most</p>
              <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.nextChapter}</p>
            </div>

            {/* Expandable detail */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light hover:text-[#6B6058] transition-colors"
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'Less detail' : 'Full analysis'}
            </button>

            {expanded && (
              <div className="space-y-4 pt-1">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1.5">Narrative arc</p>
                  <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.narrativeArc}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1.5">Coherence</p>
                  <p className="text-sm text-[#1A1714] font-light leading-relaxed">{result.consistencyRead}</p>
                </div>

                {result.strengthSignals?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mb-1.5">What's working</p>
                    <ul className="space-y-1.5">
                      {result.strengthSignals.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[#1A1714] font-light">
                          <span className="text-[#9B7B3A] shrink-0">+</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.tensionPoints?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light mb-1.5">Tensions working against you</p>
                    <ul className="space-y-1.5">
                      {result.tensionPoints.map((t, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[#6B6058] font-light">
                          <span className="text-[#A89F96] shrink-0">—</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.strategicGaps?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light mb-1.5">Narrative gaps</p>
                    <ul className="space-y-1.5">
                      {result.strategicGaps.map((g, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[#6B6058] font-light">
                          <span className="text-[#A89F96] shrink-0">○</span>{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={run}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors"
            >
              <RefreshCw size={10} /> Reanalyse
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
