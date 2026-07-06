'use client';
import { useState, useEffect } from 'react';
import { Heart, BookOpen, Loader2, Check, X, CalendarCheck, Trash2 } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { OCCASIONS } from './constants';
import type { BodyProfile } from '@/lib/body-profile';

export type SavedLook = {
  id: string;
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  savedAt: number;
};

export type JournalEntry = {
  id: string;
  date: string;
  itemIds: string[];
  occasion?: string;
  savedLookId?: string;
  loggedAt: number;
};

function ItemThumb({ item, size = 'sm' }: { item: WardrobeItem; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  return (
    <div className={`${dim} shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]`}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A89F96] text-center px-0.5 leading-tight">{item.name}</div>}
    </div>
  );
}

function LogModal({ items, savedLooks, onClose, onLogged }: {
  items: WardrobeItem[];
  savedLooks: SavedLook[];
  onClose: () => void;
  onLogged: (entry: JournalEntry) => void;
}) {
  const [mode, setMode] = useState<'looks' | 'custom'>(savedLooks.length > 0 ? 'looks' : 'custom');
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [customIds, setCustomIds] = useState<Set<string>>(new Set());
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [saving, setSaving] = useState(false);

  const toggleCustom = (id: string) =>
    setCustomIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleLog = async () => {
    const itemIds = mode === 'looks'
      ? savedLooks.find((l) => l.id === selectedLookId)?.itemIds ?? []
      : Array.from(customIds);
    if (itemIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          itemIds,
          occasion,
          savedLookId: mode === 'looks' ? selectedLookId ?? undefined : undefined,
        }),
      });
      const entry = await res.json() as JournalEntry;
      onLogged(entry);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[var(--ivory)] w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--ivory)] flex items-center justify-between p-4 border-b border-[#E5DDD0]">
          <h3 className="font-serif text-lg text-[#1A1714]">What did you wear today?</h3>
          <button onClick={onClose} className="text-[#A89F96] hover:text-[#1A1714]"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-5">
          {savedLooks.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => setMode('looks')} className={`flex-1 py-2 text-xs uppercase tracking-wide font-light border ${mode === 'looks' ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>From saved looks</button>
              <button onClick={() => setMode('custom')} className={`flex-1 py-2 text-xs uppercase tracking-wide font-light border ${mode === 'custom' ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>Build custom</button>
            </div>
          )}

          {mode === 'looks' ? (
            <div className="space-y-2">
              {savedLooks.map((look) => {
                const pieces = look.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
                return (
                  <button
                    key={look.id}
                    onClick={() => setSelectedLookId(look.id)}
                    className={`w-full flex items-center gap-3 border p-3 text-left transition-colors ${selectedLookId === look.id ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0]'}`}
                  >
                    <div className="flex -space-x-2 shrink-0">
                      {pieces.slice(0, 3).map((p) => <ItemThumb key={p.id} item={p} />)}
                    </div>
                    <p className="text-sm text-[#1A1714] font-light flex-1 min-w-0 truncate">{look.title}</p>
                    {selectedLookId === look.id && <Check size={14} className="text-[#9B7B3A] shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-2">Tap everything you wore</p>
              <div className="grid grid-cols-5 gap-2">
                {items.map((item) => (
                  <button key={item.id} onClick={() => toggleCustom(item.id)} className="relative">
                    <ItemThumb item={item} size="md" />
                    {customIds.has(item.id) && (
                      <div className="absolute inset-0 bg-[#9B7B3A]/40 flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-2">Occasion</p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button key={o} onClick={() => setOccasion(o)} className={`px-2.5 py-1 text-[11px] font-light border ${occasion === o ? 'bg-[#1A1714] text-white border-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058]'}`}>{o}</button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLog}
            disabled={saving || (mode === 'looks' ? !selectedLookId : customIds.size === 0)}
            className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Logging...</> : 'Log today'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LooksTab({ items, bodyProfile: _bodyProfile }: { items: WardrobeItem[]; bodyProfile?: BodyProfile }) {
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/looks').then((r) => r.json()),
      fetch('/api/journal').then((r) => r.json()),
    ]).then(([looks, entries]: [SavedLook[], JournalEntry[]]) => {
      setSavedLooks(looks); setJournal(entries); setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const removeLook = async (id: string) => {
    setSavedLooks((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/looks/${id}`, { method: 'DELETE' });
  };

  const removeEntry = async (id: string) => {
    setJournal((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/journal/${id}`, { method: 'DELETE' });
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedToday = journal.some((e) => e.date === todayStr);

  if (!loaded) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#A89F96]" size={24} /></div>;
  }

  return (
    <div className="space-y-8">
      <>
      {/* Daily journal prompt */}
      <div className="border border-[#E5DDD0] bg-[#1A1714] text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck size={14} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Outfit journal</p>
        </div>
        <h2 className="font-serif text-2xl">What did you wear today?</h2>
        <p className="text-sm text-white/60 font-light mt-1 mb-4">Log it in 10 seconds — over time this builds your real wear data: cost per wear, your go-to pieces, and what's gathering dust.</p>
        <button
          onClick={() => setShowLog(true)}
          className="w-full bg-white text-[#1A1714] py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-white/90 transition-colors"
        >
          {loggedToday ? 'Log another outfit today' : 'Log today\'s outfit'}
        </button>
      </div>

      {/* Saved looks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">Saved looks</p>
        </div>
        {savedLooks.length === 0 ? (
          <p className="text-sm text-[#A89F96] font-light">No saved looks yet — heart an outfit in the Outfit tab to build your lookbook.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedLooks.map((look) => {
              const pieces = look.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
              return (
                <div key={look.id} className="border border-[#E5DDD0] bg-white p-3 relative group">
                  <button onClick={() => removeLook(look.id)} className="absolute top-2 right-2 text-[#D6CFC0] hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  <div className="flex gap-1 mb-2 overflow-x-auto">
                    {pieces.map((p) => <ItemThumb key={p.id} item={p} />)}
                  </div>
                  <p className="font-serif text-sm text-[#1A1714] leading-snug pr-4">{look.title}</p>
                  {look.styleReference && <p className="text-[10px] text-[#9B7B3A] font-light mt-0.5">{look.styleReference}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Journal history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">Wear history</p>
        </div>
        {journal.length === 0 ? (
          <p className="text-sm text-[#A89F96] font-light">Nothing logged yet — your wear history will build up here.</p>
        ) : (
          <div className="space-y-2">
            {journal.map((entry) => {
              const pieces = entry.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
              return (
                <div key={entry.id} className="border border-[#E5DDD0] bg-white p-3 flex items-center gap-3">
                  <div className="flex -space-x-2 shrink-0">
                    {pieces.slice(0, 4).map((p) => <ItemThumb key={p.id} item={p} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1A1714] font-light">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    {entry.occasion && <p className="text-[10px] text-[#A89F96] font-light">{entry.occasion}</p>}
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="text-[#D6CFC0] hover:text-red-600 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLog && (
        <LogModal
          items={items}
          savedLooks={savedLooks}
          onClose={() => setShowLog(false)}
          onLogged={(entry) => setJournal((prev) => [entry, ...prev])}
        />
      )}
      </>
    </div>
  );
}
