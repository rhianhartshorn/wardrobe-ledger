'use client';
import { useState } from 'react';
import { Layers, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { slim } from './utils';
import type { BodyProfile } from '@/lib/body-profile';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';

type Combo = {
  itemIds: string[];
  title: string;
  category: string;
  rationale: string;
  formality: string;
  season: string;
};

const STORAGE_KEY = 'combinations_last_result';

function Thumb({ item }: { item: WardrobeItem }) {
  return (
    <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A89F96] text-center px-0.5 leading-tight">{item.name}</div>}
    </div>
  );
}

function ComboCard({ combo, rank, items, onLearnMore }: { combo: Combo; rank: number; items: WardrobeItem[]; onLearnMore: () => void }) {
  const pieces = combo.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
  if (pieces.length === 0) return null;

  return (
    <div className="border border-[#E5DDD0] bg-white p-3 relative">
      <span className="absolute top-2.5 right-2.5 font-serif text-base text-[#E5DDD0] leading-none">#{rank}</span>
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">{combo.category}</p>
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {pieces.map((p) => <Thumb key={p.id} item={p} />)}
      </div>
      <p className="font-serif text-base text-[#1A1714] leading-snug pr-5">{combo.title}</p>
      <p className="text-xs text-[#6B6058] font-light mt-1.5 leading-snug">{combo.rationale}</p>
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="text-[9px] uppercase tracking-widest border border-[#E5DDD0] text-[#9B7B3A] px-1.5 py-0.5 font-light">{combo.formality}</span>
        {combo.season !== 'All-season' && (
          <span className="text-[9px] uppercase tracking-widest border border-[#E5DDD0] text-[#6B6058] px-1.5 py-0.5 font-light">{combo.season}</span>
        )}
      </div>
      <button onClick={onLearnMore} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light hover:text-[#1A1714] transition-colors mt-2.5">
        Learn more <ChevronRight size={11} />
      </button>
    </div>
  );
}

export default function CombinationsTab({ items, bodyProfile }: { items: WardrobeItem[]; bodyProfile?: BodyProfile }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);
  const [combos, setCombos] = useState<Combo[] | null>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) as Combo[] : null;
    } catch { return null; }
  });

  const run = async () => {
    if (items.length < 3) { setErr('Add at least 3 items to see outfit combinations.'); return; }
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/combinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items).slice(0, 30), bodyProfile }),
      });
      const data = await res.json() as { combinations?: Combo[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not curate combinations right now.');
      const result = data.combinations ?? [];
      setCombos(result);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch { /* quota */ }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not curate combinations right now.');
    } finally {
      setLoading(false);
    }
  };

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  if (items.length < 3) {
    return (
      <div className="text-center py-20">
        <Layers className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Nothing to curate yet.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add a few pieces to your closet first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border border-[#E5DDD0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Editorial curation</p>
        <h2 className="font-serif text-2xl mt-0.5 text-[#1A1714]">Best Combinations</h2>
        <p className="text-sm text-[#6B6058] font-light mt-1 leading-relaxed">
          Not every logical pairing — only the combinations a stylist would actually put you in, ranked best first, judged against current 2026 taste{bodyProfile?.bodyShape ? ' and your body and colouring' : ''}.
        </p>
        <button
          onClick={run}
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
        >
          {loading ? <><Loader2 className="animate-spin" size={14} /> Curating your best looks...</> : <><RefreshCw size={14} /> {combos ? 'Re-curate' : 'Curate my combinations'}</>}
        </button>
        {err && <p className="text-sm text-red-700 mt-3">{err}</p>}
      </div>

      {combos && combos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {combos.map((combo, idx) => (
            <ComboCard
              key={idx}
              combo={combo}
              rank={idx + 1}
              items={items}
              onLearnMore={() => {
                const pieces = combo.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
                setLearnMore({
                  type: 'outfit',
                  title: combo.title,
                  context: `Category: ${combo.category}. ${combo.rationale} Formality: ${combo.formality}. Season: ${combo.season}.`,
                  relevantItems: pieces,
                  onClose: () => setLearnMore(null),
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
