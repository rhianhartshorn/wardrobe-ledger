'use client';
import { useState } from 'react';
import { Shirt, Trash2 } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { colorDot } from './utils';

function ItemTag({ item, onRemove }: { item: WardrobeItem; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative bg-white border border-stone-200 rounded p-2 shadow-sm">
      <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-stone-50 border border-stone-300" />
      <div className="aspect-square w-full overflow-hidden rounded bg-stone-100 mb-2">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        )}
      </div>
      <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
          style={{ backgroundColor: colorDot(item.primaryColor) }}
        />
        <span className="text-xs text-stone-500 truncate">
          {item.category} · {item.formality}
        </span>
      </div>

      {confirming ? (
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => onRemove(item.id)}
            className="flex-1 text-xs bg-red-700 text-white rounded py-1"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 text-xs border border-stone-300 rounded py-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="absolute top-1.5 right-1.5 text-stone-400 hover:text-red-700"
          aria-label="Remove item"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function ClosetTab({
  items,
  onRemove,
}: {
  items: WardrobeItem[];
  onRemove: (id: string) => void;
}) {
  const [filter, setFilter] = useState('All');
  const cats = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Shirt className="mx-auto text-stone-300" size={40} />
        <p className="mt-3 text-stone-500">Your closet is empty.</p>
        <p className="text-sm text-stone-400">Add your first piece from the "Add item" tab.</p>
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
              className={`shrink-0 px-3 py-1 text-xs rounded-full border ${
                filter === c
                  ? 'bg-stone-900 text-stone-50 border-stone-900'
                  : 'border-stone-300 text-stone-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((item) => (
          <ItemTag key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
