'use client';
import { useState } from 'react';
import { Shirt, Trash2 } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { colorDot } from './utils';

function ItemCard({ item, onRemove }: { item: WardrobeItem; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-white border border-[#E5DDD0] group relative">
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
          <span
            className="w-2 h-2 rounded-full border border-[#E5DDD0] shrink-0"
            style={{ backgroundColor: colorDot(item.primaryColor) }}
          />
          <span className="text-[10px] text-[#A89F96] truncate font-light">
            {item.category}
          </span>
        </div>
        {confirming ? (
          <div className="flex gap-1 mt-2">
            <button onClick={() => onRemove(item.id)} className="flex-1 text-[10px] bg-red-700 text-white py-1 font-light">Remove</button>
            <button onClick={() => setConfirming(false)} className="flex-1 text-[10px] border border-[#E5DDD0] text-[#6B6058] py-1 font-light">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="absolute top-2 right-2 text-[#D6CFC0] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
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
                filter === c
                  ? 'bg-[#1A1714] text-white border-[#1A1714]'
                  : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E5DDD0]">
        {visible.map((item) => (
          <ItemCard key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
