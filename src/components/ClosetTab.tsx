'use client';
import { useState } from 'react';
import { Shirt, Trash2, X, Loader2, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { colorDot, slim } from './utils';
import type { BodyProfile } from '@/lib/body-profile';
import TryOnModal from './TryOnModal';

type Look = {
  title: string;
  aesthetic: string;
  wardrobeItemIds: string[];
  suggestedPurchases?: string[];
  howToWear: string;
  inspirationImageUrl?: string;
  inspirationLink?: { label: string; url: string };
};

function LookCard({ look, allItems }: { look: Look; allItems: WardrobeItem[] }) {
  const pieces = look.wardrobeItemIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));
  const isShopping = look.wardrobeItemIds.length === 0;

  return (
    <div className="border border-[#E5DDD0] bg-white overflow-hidden">
      <div className="p-4 space-y-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{look.aesthetic}</p>
        <h3 className="font-serif text-lg text-[#1A1714]">{look.title}</h3>
        <p className="text-sm text-[#1A1714] font-light leading-relaxed">{look.howToWear}</p>

        {pieces.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pieces.map((p) => (
              <div key={p.id} className="shrink-0 w-14">
                <div className="aspect-square w-14 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Shirt size={14} className="text-[#D6CFC0]" /></div>
                  }
                </div>
                <p className="text-[9px] text-[#A89F96] truncate mt-0.5 font-light">{p.name}</p>
              </div>
            ))}
          </div>
        )}

        {isShopping && look.suggestedPurchases && look.suggestedPurchases.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mb-1.5">To complete this look</p>
            <ul className="space-y-1">
              {look.suggestedPurchases.map((s, i) => (
                <li key={i} className="text-xs text-[#6B6058] font-light flex gap-2">
                  <span className="text-[#9B7B3A] shrink-0">+</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

function ItemDetailView({ item, allItems, bodyProfile, onClose }: { item: WardrobeItem; allItems: WardrobeItem[]; bodyProfile?: BodyProfile; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [err, setErr] = useState('');

  const generate = async () => {
    setLoading(true); setErr(''); setLooks(null);
    try {
      const res = await fetch('/api/item-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: slim([item])[0], wardrobe: slim(allItems), bodyProfile }),
      });
      const data = await res.json() as { looks?: Look[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setLooks(data.looks ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not generate looks right now.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--ivory)] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--ivory)] pt-4 pb-3 flex items-center gap-3 border-b border-[#E5DDD0] mb-4">
          <button onClick={onClose} className="text-[#A89F96] hover:text-[#1A1714] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">How to wear</p>
            <h2 className="font-serif text-xl text-[#1A1714] truncate">{item.name}</h2>
          </div>
          {item.imageUrl && (
            <div className="w-10 h-10 shrink-0 overflow-hidden border border-[#E5DDD0]">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="flex gap-3 mb-4">
          {item.imageUrl && (
            <div className="w-24 h-24 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-serif text-2xl text-[#1A1714]">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full border border-[#E5DDD0] shrink-0" style={{ backgroundColor: colorDot(item.primaryColor) }} />
              <p className="text-xs text-[#A89F96] font-light">{item.category} · {item.formality} · {item.season}</p>
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {loading ? <><Loader2 className="animate-spin" size={13} /> Finding ways to wear this...</> : looks ? 'Regenerate looks' : 'Show me how to wear this'}
        </button>

        {err && <p className="text-sm text-red-700 font-light mb-4">{err}</p>}

        {looks && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">
              {looks.length} ways to wear it
            </p>
            {looks.map((look, i) => <LookCard key={i} look={look} allItems={allItems} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const TRY_ON_CATEGORIES = new Set(['top', 'bottom', 'outerwear', 'dress/one-piece']);

function ItemCard({ item, allItems, onRemove, onWearLogged, profileImageUrl, onAddPhoto, bodyProfile }: { item: WardrobeItem; allItems: WardrobeItem[]; onRemove: (id: string) => void; onWearLogged: (id: string, wearCount: number) => void; profileImageUrl?: string | null; onAddPhoto?: () => void; bodyProfile?: BodyProfile }) {
  const [confirming, setConfirming] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [loggingWear, setLoggingWear] = useState(false);
  const canTryOn = TRY_ON_CATEGORIES.has(item.category.toLowerCase());

  const logWear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loggingWear) return;
    setLoggingWear(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log-wear' }),
      });
      const data = await res.json() as { wear_count?: number };
      if (res.ok && data.wear_count != null) onWearLogged(item.id, data.wear_count);
    } finally {
      setLoggingWear(false);
    }
  };

  const wears = item.wearCount ?? 0;
  const cpw = item.price && wears > 0 ? (item.price / wears).toFixed(2) : null;

  return (
    <>
      {showDetail && (
        <ItemDetailView item={item} allItems={allItems} bodyProfile={bodyProfile} onClose={() => setShowDetail(false)} />
      )}
      {showTryOn && (
        <TryOnModal
          item={item}
          hasProfilePhoto={Boolean(profileImageUrl)}
          onClose={() => setShowTryOn(false)}
          onAddPhoto={onAddPhoto ?? (() => setShowTryOn(false))}
        />
      )}
      <div className="bg-white border border-[#E5DDD0] group relative cursor-pointer" onClick={() => !confirming && setShowDetail(true)}>
        <div className="aspect-square w-full overflow-hidden bg-[#F5F2EC]">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt size={24} className="text-[#D6CFC0]" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-light text-[#1A1714] leading-snug truncate">{item.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full border border-[#E5DDD0] shrink-0" style={{ backgroundColor: colorDot(item.primaryColor) }} />
            <span className="text-[10px] text-[#A89F96] truncate font-light">{item.category}</span>
          </div>
          {/* Wear counter + CPW */}
          <div className="flex items-center justify-between mt-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={logWear}
              disabled={loggingWear}
              className="text-[9px] text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors disabled:opacity-40"
              title="Log a wear"
            >
              {loggingWear ? '…' : `${wears} wear${wears !== 1 ? 's' : ''} +`}
            </button>
            {cpw && (
              <span className="text-[9px] text-[#9B7B3A] font-light">${cpw}/wear</span>
            )}
          </div>
          {confirming ? (
            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onRemove(item.id)} className="flex-1 text-[10px] bg-red-700 text-white py-1 font-light">Remove</button>
              <button onClick={() => setConfirming(false)} className="flex-1 text-[10px] border border-[#E5DDD0] text-[#6B6058] py-1 font-light">Cancel</button>
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {canTryOn && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTryOn(true); }}
                  className="text-[#D6CFC0] hover:text-[#9B7B3A] transition-colors"
                  aria-label="Try on"
                  title="Virtual try-on"
                >
                  <Sparkles size={13} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                className="text-[#D6CFC0] hover:text-red-600 transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      <span className="shrink-0 text-[9px] uppercase tracking-[0.15em] text-[#A89F96] font-light self-center pr-1">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o === value ? 'All' : o)}
          className={`shrink-0 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] font-light border transition-colors ${
            value === o ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function isDormant(item: WardrobeItem) {
  return (item.wearCount ?? 0) === 0 && Date.now() - item.addedAt > NINETY_DAYS_MS;
}

export default function ClosetTab({ items, onRemove, onWearLogged, profileImageUrl, onAddPhoto, bodyProfile }: { items: WardrobeItem[]; onRemove: (id: string) => void; onWearLogged: (id: string, wearCount: number) => void; profileImageUrl?: string | null; onAddPhoto?: () => void; bodyProfile?: BodyProfile }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [formality, setFormality] = useState('All');
  const [season, setSeason] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const dormantItems = items.filter(isDormant);

  const cats      = Array.from(new Set(items.map((i) => i.category))).sort();
  const formalities = Array.from(new Set(items.map((i) => i.formality).filter(Boolean))).sort();
  const seasons   = Array.from(new Set(items.map((i) => i.season).filter(Boolean))).sort();

  const q = search.toLowerCase();
  const visible = (reviewMode ? dormantItems : items).filter((i) => {
    if (cat !== 'All' && i.category !== cat) return false;
    if (formality !== 'All' && i.formality !== formality) return false;
    if (season !== 'All' && i.season !== season) return false;
    if (q && !i.name.toLowerCase().includes(q) && !i.category.toLowerCase().includes(q)) return false;
    return true;
  });

  const hasActiveFilter = cat !== 'All' || formality !== 'All' || season !== 'All' || q || reviewMode;

  const clearAll = () => { setSearch(''); setCat('All'); setFormality('All'); setSeason('All'); setReviewMode(false); };

  if (items.length === 0) {
    return (
      <div className="py-12 space-y-6">
        <div className="border border-[#E5DDD0] bg-white p-6 text-center">
          <Shirt className="mx-auto text-[#D6CFC0] mb-4" size={32} />
          <h2 className="font-serif text-xl text-[#1A1714] mb-2">Your digital wardrobe</h2>
          <p className="text-sm text-[#6B6058] font-light leading-relaxed max-w-xs mx-auto">
            Photograph your clothes — AI tags every piece instantly. Then get outfit ideas, track what you actually wear, and discover your style identity.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'AI auto-tagging', sub: 'Name, colour, formality' },
            { label: 'Outfit builder', sub: 'Weather-matched daily looks' },
            { label: 'Style DNA', sub: 'Your wardrobe archetype' },
          ].map(({ label, sub }) => (
            <div key={label} className="border border-[#E5DDD0] bg-white p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light leading-tight">{label}</p>
              <p className="text-[9px] text-[#A89F96] font-light mt-1 leading-tight">{sub}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[#A89F96] font-light">
          Tap <span className="text-[#1A1714]">Add</span> above to photograph your first piece →
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Seasonal review banner */}
      {dormantItems.length > 0 && !reviewMode && (
        <button
          onClick={() => setReviewMode(true)}
          className="w-full mb-4 flex items-center gap-3 border border-amber-200 bg-amber-50 px-3 py-2.5 text-left hover:bg-amber-100 transition-colors"
        >
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-800 font-light">
              <span className="font-normal">{dormantItems.length} {dormantItems.length === 1 ? 'piece' : 'pieces'}</span> unworn for 90+ days — time to review
            </p>
          </div>
          <span className="text-amber-600 text-xs font-light shrink-0">Review →</span>
        </button>
      )}
      {reviewMode && (
        <div className="mb-4 flex items-center justify-between border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800 font-light">Showing {dormantItems.length} unworn pieces — keep or remove</p>
          <button onClick={() => setReviewMode(false)} className="text-amber-600 hover:text-amber-800 transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 border border-[#E5DDD0] bg-white px-3 py-2 text-xs font-light text-[#1A1714] placeholder-[#C5BDB4] outline-none focus:border-[#9B7B3A] transition-colors"
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-light border transition-colors ${
            showFilters || (cat !== 'All' || formality !== 'All' || season !== 'All')
              ? 'bg-[#1A1714] text-white border-[#1A1714]'
              : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
          }`}
        >
          Filter
        </button>
      </div>

      {/* Expandable filter rows */}
      {showFilters && (
        <div className="space-y-2 mb-3 -mx-4 px-4">
          {cats.length > 1 && <FilterChips label="Type" options={cats} value={cat} onChange={setCat} />}
          {formalities.length > 1 && <FilterChips label="Wear" options={formalities} value={formality} onChange={setFormality} />}
          {seasons.length > 1 && <FilterChips label="Season" options={seasons} value={season} onChange={setSeason} />}
        </div>
      )}

      {/* Result count + clear */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[#A89F96] font-light">
          {hasActiveFilter ? `${visible.length} of ${items.length}` : `${items.length} pieces`}
          {!hasActiveFilter && ' · tap to style'}
        </p>
        {hasActiveFilter && (
          <button onClick={clearAll} className="text-[10px] text-[#9B7B3A] font-light hover:underline">
            Clear
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-sm text-[#A89F96] font-light py-12">No items match.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E5DDD0]">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} allItems={items} onRemove={onRemove} onWearLogged={onWearLogged} profileImageUrl={profileImageUrl} onAddPhoto={onAddPhoto} bodyProfile={bodyProfile} />
          ))}
        </div>
      )}
    </div>
  );
}
