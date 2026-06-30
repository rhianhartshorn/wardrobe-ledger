'use client';
import { useState, useMemo } from 'react';
import { Layers, ChevronRight, Plus } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { generateCombinations, type OutfitCombo } from './utils';
import { FORMALITY, SEASONS } from './constants';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';

function Thumb({ item, dim = 'w-12 h-12' }: { item: WardrobeItem; dim?: string }) {
  return (
    <div className={`${dim} shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]`}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A89F96] text-center px-0.5 leading-tight">{item.name}</div>}
    </div>
  );
}

function comboTitle(combo: OutfitCombo): string {
  return combo.pieces.map((p) => p.name).join(' + ');
}

function ComboCard({ combo, onLearnMore }: { combo: OutfitCombo; onLearnMore: () => void }) {
  return (
    <div className="border border-[#E5DDD0] bg-white p-3">
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {combo.pieces.map((p) => <Thumb key={p.id} item={p} />)}
        {combo.outerwear && (
          <div className="relative">
            <Thumb item={combo.outerwear} dim="w-9 h-9" />
            <Plus size={9} className="absolute -top-1 -left-1 text-[#9B7B3A] bg-white rounded-full" />
          </div>
        )}
        {combo.accessory && (
          <div className="relative">
            <Thumb item={combo.accessory} dim="w-9 h-9" />
            <Plus size={9} className="absolute -top-1 -left-1 text-[#9B7B3A] bg-white rounded-full" />
          </div>
        )}
      </div>
      <p className="text-sm text-[#1A1714] font-light leading-snug">{comboTitle(combo)}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
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

export default function CombinationsTab({ items }: { items: WardrobeItem[] }) {
  const [formalityFilter, setFormalityFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);

  const allCombos = useMemo(() => generateCombinations(items), [items]);

  const filtered = useMemo(() => allCombos.filter((c) =>
    (!formalityFilter || c.formality === formalityFilter) &&
    (!seasonFilter || c.season === seasonFilter || c.season === 'All-season')
  ), [allCombos, formalityFilter, seasonFilter]);

  const visible = filtered.slice(0, visibleCount);

  const availableFormalities = FORMALITY.filter((f) => allCombos.some((c) => c.formality === f));
  const availableSeasons = SEASONS.filter((s) => s !== 'All-season' && allCombos.some((c) => c.season === s));

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  if (items.length < 2) {
    return (
      <div className="text-center py-20">
        <Layers className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Nothing to combine yet.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add a few tops, bottoms and shoes to see your possible outfits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border border-[#E5DDD0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Every combination</p>
        <h2 className="font-serif text-2xl mt-0.5 text-[#1A1714]">Your Possibility Space</h2>
        <p className="text-sm text-[#6B6058] font-light mt-1 leading-relaxed">
          {allCombos.length} viable outfit{allCombos.length === 1 ? '' : 's'} from {items.length} pieces — each one a real combination already sitting in your closet.
        </p>
      </div>

      {(availableFormalities.length > 1 || availableSeasons.length > 0) && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFormalityFilter(null)} className={`px-2.5 py-1.5 text-[11px] font-light border ${!formalityFilter ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>All formality</button>
            {availableFormalities.map((f) => (
              <button key={f} onClick={() => setFormalityFilter(f)} className={`px-2.5 py-1.5 text-[11px] font-light border ${formalityFilter === f ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>{f}</button>
            ))}
          </div>
          {availableSeasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSeasonFilter(null)} className={`px-2.5 py-1.5 text-[11px] font-light border ${!seasonFilter ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>All seasons</button>
              {availableSeasons.map((s) => (
                <button key={s} onClick={() => setSeasonFilter(s)} className={`px-2.5 py-1.5 text-[11px] font-light border ${seasonFilter === s ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#A89F96] font-light">{filtered.length} match{filtered.length === 1 ? '' : 'es'}</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#A89F96] font-light text-center py-10">No combinations match these filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {visible.map((combo) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                onLearnMore={() => setLearnMore({
                  type: 'outfit',
                  title: comboTitle(combo),
                  context: `Formality: ${combo.formality}. Season: ${combo.season}. Core pieces: ${combo.pieces.map((p) => p.name).join(', ')}.${combo.outerwear ? ` Optional layer: ${combo.outerwear.name}.` : ''}${combo.accessory ? ` Optional accessory: ${combo.accessory.name}.` : ''}`,
                  relevantItems: [...combo.pieces, ...(combo.outerwear ? [combo.outerwear] : []), ...(combo.accessory ? [combo.accessory] : [])],
                  onClose: () => setLearnMore(null),
                })}
              />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((n) => n + 24)}
              className="w-full border border-[#E5DDD0] py-3 text-xs uppercase tracking-[0.15em] font-light text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors"
            >
              Show more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
