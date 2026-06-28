'use client';
import { useState } from 'react';
import { Shirt, Trash2, X, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { colorDot } from './utils';

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
      {look.inspirationImageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F2EC]">
          <img
            src={look.inspirationImageUrl}
            alt={look.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{look.aesthetic}</p>
            <h3 className="font-serif text-lg text-white leading-snug">{look.title}</h3>
          </div>
        </div>
      )}
      <div className="p-4 space-y-3">
        {!look.inspirationImageUrl && (
          <>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{look.aesthetic}</p>
            <h3 className="font-serif text-lg text-[#1A1714]">{look.title}</h3>
          </>
        )}
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

        {look.inspirationLink && (
          <a
            href={look.inspirationLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#9B7B3A] hover:text-[#1A1714] transition-colors group"
          >
            <ExternalLink size={10} className="shrink-0" />
            <span className="group-hover:underline underline-offset-2 truncate">{look.inspirationLink.label}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function ItemDetailView({ item, allItems, onClose }: { item: WardrobeItem; allItems: WardrobeItem[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [err, setErr] = useState('');

  const generate = async () => {
    setLoading(true); setErr(''); setLooks(null);
    try {
      const res = await fetch('/api/item-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, wardrobe: allItems }),
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

function ItemCard({ item, allItems, onRemove }: { item: WardrobeItem; allItems: WardrobeItem[]; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      {showDetail && (
        <ItemDetailView item={item} allItems={allItems} onClose={() => setShowDetail(false)} />
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
          {confirming ? (
            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onRemove(item.id)} className="flex-1 text-[10px] bg-red-700 text-white py-1 font-light">Remove</button>
              <button onClick={() => setConfirming(false)} className="flex-1 text-[10px] border border-[#E5DDD0] text-[#6B6058] py-1 font-light">Cancel</button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              className="absolute top-2 right-2 text-[#D6CFC0] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function ClosetTab({ items, onRemove }: { items: WardrobeItem[]; onRemove: (id: string) => void }) {
  const [filter, setFilter] = useState('All');
  const cats = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Shirt className="mx-auto text-[#E5DDD0]" size={36} />
        <p className="mt-4 text-[#6B6058] font-serif text-lg">Your closet is empty.</p>
        <p className="text-sm text-[#A89F96] font-light mt-1">Add your first piece from the Add tab.</p>
      </div>
    );
  }

  return (
    <div>
      {cats.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-light border transition-colors ${
                filter === c ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-[#A89F96] font-light mb-3">Tap any piece to see how to style it</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E5DDD0]">
        {visible.map((item) => (
          <ItemCard key={item.id} item={item} allItems={items} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
