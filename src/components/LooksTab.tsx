'use client';
import { useState, useEffect } from 'react';
import { Heart, BookOpen, Loader2, Check, X, CalendarCheck, Trash2, ThumbsUp, ThumbsDown, Layers, Sparkles, Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { OCCASIONS } from './constants';
import type { BodyProfile } from '@/lib/body-profile';
import CombinationsTab from './CombinationsTab';

export type SavedLook = {
  id: string;
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  savedAt: number;
  feedback?: 'worked' | 'didnt_work';
};

const LOOKS_CACHE_KEY = 'wl_looks_cache';

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

function WearIntelligence({ journal, items, onRemoveEntry }: {
  journal: JournalEntry[];
  items: WardrobeItem[];
  onRemoveEntry: (id: string) => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // ── Stats ──────────────────────────────────────────────────────────────────

  // Item frequency across journal entries
  const itemFreq = new Map<string, number>();
  journal.forEach((e) => {
    e.itemIds.forEach((id) => itemFreq.set(id, (itemFreq.get(id) ?? 0) + 1));
  });

  // Top items by journal frequency
  const topItems = [...itemFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => ({ item: items.find((i) => i.id === id), count }))
    .filter((x): x is { item: WardrobeItem; count: number } => Boolean(x.item));

  // Logging streak — consecutive days ending today (or yesterday)
  const streak = (() => {
    if (!journal.length) return 0;
    const dates = new Set(journal.map((e) => e.date));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.has(d.toISOString().slice(0, 10))) count++;
      else if (i > 0) break; // allow missing today
    }
    return count;
  })();

  // Best cost-per-wear
  const bestCPW = items
    .filter((i) => i.price && (i.wearCount ?? 0) > 0)
    .map((i) => ({ item: i, cpw: i.price! / i.wearCount! }))
    .sort((a, b) => a.cpw - b.cpw)[0] ?? null;

  // Most common occasion
  const occasionFreq = new Map<string, number>();
  journal.forEach((e) => {
    if (e.occasion) occasionFreq.set(e.occasion, (occasionFreq.get(e.occasion) ?? 0) + 1);
  });
  const topOccasion = [...occasionFreq.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  // ── Group history by month ─────────────────────────────────────────────────

  const byMonth = new Map<string, JournalEntry[]>();
  [...journal].sort((a, b) => b.date.localeCompare(a.date)).forEach((e) => {
    const key = e.date.slice(0, 7); // "2026-06"
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  });

  const toggleMonth = (key: string) =>
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const formatMonthKey = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (journal.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">Wear intelligence</p>
        </div>
        <p className="text-sm text-[#A89F96] font-light">Nothing logged yet. Your wear data — most-reached-for pieces, real cost per wear, your go-to occasions — builds here over time.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={13} className="text-[#9B7B3A]" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">Wear intelligence</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="border border-[#E5DDD0] bg-white p-3 text-center">
          <p className="font-serif text-2xl text-[#1A1714]">{journal.length}</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#A89F96] font-light mt-0.5">Outfits logged</p>
        </div>
        <div className="border border-[#E5DDD0] bg-white p-3 text-center">
          <p className="font-serif text-2xl text-[#1A1714]">{streak}</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#A89F96] font-light mt-0.5">Day streak</p>
        </div>
        <div className="border border-[#E5DDD0] bg-white p-3 text-center">
          <p className="font-serif text-2xl text-[#1A1714]">{topItems[0]?.count ?? 0}</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#A89F96] font-light mt-0.5">Max wears</p>
        </div>
      </div>

      {/* Most-reached-for pieces */}
      {topItems.length > 0 && (
        <div className="mb-5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-2.5">Most reached for</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {topItems.map(({ item, count }) => (
              <div key={item.id} className="shrink-0 text-center">
                <div className="w-16 h-16 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0] relative">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[7px] text-[#A89F96] text-center px-0.5 leading-tight">{item.name}</div>}
                  <span className="absolute bottom-0.5 right-0.5 bg-[#1A1714] text-white text-[7px] px-1 py-0.5 font-light leading-none">{count}×</span>
                </div>
                <p className="text-[8px] text-[#6B6058] font-light mt-1 w-16 truncate">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary insights row */}
      {(bestCPW || topOccasion) && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {bestCPW && (
            <div className="border border-[#E5DDD0] bg-white p-3">
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#A89F96] font-light mb-1">Best cost per wear</p>
              <p className="font-serif text-sm text-[#1A1714] leading-snug truncate">{bestCPW.item.name}</p>
              <p className="text-[10px] text-[#9B7B3A] font-light mt-0.5">£{bestCPW.cpw.toFixed(2)} per wear</p>
            </div>
          )}
          {topOccasion && (
            <div className="border border-[#E5DDD0] bg-white p-3">
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#A89F96] font-light mb-1">Most dressed for</p>
              <p className="font-serif text-sm text-[#1A1714] leading-snug">{topOccasion[0]}</p>
              <p className="text-[10px] text-[#9B7B3A] font-light mt-0.5">{topOccasion[1]} time{topOccasion[1] !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* History grouped by month — collapsed */}
      <div className="space-y-1">
        {[...byMonth.entries()].map(([key, entries]) => {
          const open = expandedMonths.has(key);
          return (
            <div key={key} className="border border-[#E5DDD0]">
              <button
                onClick={() => toggleMonth(key)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#FAF8F4] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light">{formatMonthKey(key)}</p>
                  <span className="text-[9px] text-[#A89F96] font-light">{entries.length} outfit{entries.length !== 1 ? 's' : ''}</span>
                </div>
                {open ? <ChevronUp size={12} className="text-[#A89F96]" /> : <ChevronDown size={12} className="text-[#A89F96]" />}
              </button>
              {open && (
                <div className="divide-y divide-[#F5F2EC]">
                  {entries.map((entry) => {
                    const pieces = entry.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-3 py-2 bg-white">
                        <div className="flex -space-x-2 shrink-0">
                          {pieces.slice(0, 4).map((p) => <ItemThumb key={p.id} item={p} />)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1714] font-light">
                            {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                          </p>
                          {entry.occasion && <p className="text-[9px] text-[#A89F96] font-light">{entry.occasion}</p>}
                        </div>
                        <button onClick={() => onRemoveEntry(entry.id)} className="text-[#D6CFC0] hover:text-red-600 transition-colors shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LookCard({ look, items, hasProfilePhoto, onRemove, onFeedback }: {
  look: SavedLook; items: WardrobeItem[]; hasProfilePhoto: boolean;
  onRemove: () => void; onFeedback: (f: 'worked' | 'didnt_work' | null) => void;
}) {
  const pieces = look.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
  const hasRemovedItems = pieces.length < look.itemIds.length;
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnErr, setTryOnErr] = useState('');
  const [showTryOn, setShowTryOn] = useState(false);

  const getTryOn = async () => {
    if (tryOnUrl) { setShowTryOn(true); return; }
    setTryOnLoading(true); setTryOnErr('');
    try {
      const slimItems = pieces.map((p) => ({ id: p.id, name: p.name, category: p.category, primaryColor: p.primaryColor }));
      const res = await fetch('/api/outfit-try-on', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: slimItems }) });
      const data = await res.json() as { outputUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Try-on failed');
      setTryOnUrl(data.outputUrl ?? null);
      setShowTryOn(true);
    } catch (e) { setTryOnErr(e instanceof Error ? e.message : 'Could not generate try-on'); }
    finally { setTryOnLoading(false); }
  };

  return (
    <>
      <div className={`border bg-white p-3 relative group ${look.feedback === 'worked' ? 'border-green-200' : look.feedback === 'didnt_work' ? 'border-[#E5DDD0] opacity-70' : 'border-[#E5DDD0]'}`}>
        <button onClick={onRemove} className="absolute top-2 right-2 text-[#D6CFC0] hover:text-red-600 transition-colors">
          <Trash2 size={13} />
        </button>
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {pieces.map((p) => <ItemThumb key={p.id} item={p} />)}
        </div>
        <p className="font-serif text-sm text-[#1A1714] leading-snug pr-4">{look.title}</p>
        {look.styleReference && <p className="text-[10px] text-[#9B7B3A] font-light mt-0.5">{look.styleReference}</p>}
        {hasRemovedItems && (
          <p className="text-[9px] text-amber-600 font-light mt-1">{look.itemIds.length - pieces.length} item{look.itemIds.length - pieces.length !== 1 ? 's' : ''} removed from wardrobe</p>
        )}
        {hasProfilePhoto && (
          <div className="mt-2">
            <button onClick={getTryOn} disabled={tryOnLoading} className="w-full flex items-center justify-center gap-1 border border-[#E5DDD0] py-1.5 text-[9px] uppercase tracking-[0.12em] text-[#6B6058] font-light hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors disabled:opacity-40">
              {tryOnLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              Try on
            </button>
            {tryOnErr && <p className="text-[9px] text-[#A89F96] font-light mt-1">{tryOnErr}</p>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F5F2EC]">
          <p className="text-[9px] uppercase tracking-widest text-[#A89F96] font-light flex-1">Did it work?</p>
          <button onClick={() => onFeedback(look.feedback === 'worked' ? null : 'worked')} className={`p-1 transition-colors ${look.feedback === 'worked' ? 'text-green-600' : 'text-[#D6CFC0] hover:text-green-500'}`}><ThumbsUp size={13} /></button>
          <button onClick={() => onFeedback(look.feedback === 'didnt_work' ? null : 'didnt_work')} className={`p-1 transition-colors ${look.feedback === 'didnt_work' ? 'text-red-400' : 'text-[#D6CFC0] hover:text-red-400'}`}><ThumbsDown size={13} /></button>
        </div>
      </div>

      {showTryOn && tryOnUrl && (
        <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col">
          <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10">
            <p className="flex-1 text-sm text-white font-light">Try-on — {look.title}</p>
            <a href={tryOnUrl} download="outfit-tryon.jpg" className="text-white/40 hover:text-white transition-colors"><Download size={16} /></a>
            <button onClick={() => setShowTryOn(false)} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img src={tryOnUrl} alt="You in this outfit" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
}

export default function LooksTab({ items, bodyProfile, profileImageFilename }: { items: WardrobeItem[]; bodyProfile?: BodyProfile; profileImageFilename?: string | null }) {
  const [view, setView] = useState<'looks' | 'combinations'>('looks');
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/looks').then((r) => r.json()),
      fetch('/api/journal').then((r) => r.json()),
    ]).then(([looks, entries]: [SavedLook[], JournalEntry[]]) => {
      setSavedLooks(looks);
      setJournal(entries);
      setLoaded(true);
      try { localStorage.setItem(LOOKS_CACHE_KEY, JSON.stringify(looks)); } catch { /* quota */ }
    }).catch(() => setLoaded(true));
  }, []);

  const setFeedback = async (id: string, feedback: 'worked' | 'didnt_work' | null) => {
    setSavedLooks((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, feedback: feedback ?? undefined } : l);
      try { localStorage.setItem(LOOKS_CACHE_KEY, JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
    await fetch(`/api/looks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
  };

  const removeLook = async (id: string) => {
    setSavedLooks((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      try { localStorage.setItem(LOOKS_CACHE_KEY, JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
    await fetch(`/api/looks/${id}`, { method: 'DELETE' });
  };

  const removeEntry = async (id: string) => {
    setJournal((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/journal/${id}`, { method: 'DELETE' });
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedToday = journal.some((e) => e.date === todayStr);

  // Sort: worked first, then by date saved desc
  const sortedLooks = [...savedLooks].sort((a, b) => {
    if (a.feedback === 'worked' && b.feedback !== 'worked') return -1;
    if (b.feedback === 'worked' && a.feedback !== 'worked') return 1;
    return b.savedAt - a.savedAt;
  });

  if (!loaded) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#A89F96]" size={24} /></div>;
  }

  return (
    <div className="space-y-8">
      {/* View toggle */}
      <div className="flex gap-0 border border-[#E5DDD0]">
        <button
          onClick={() => setView('looks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light transition-colors ${view === 'looks' ? 'bg-[#1A1714] text-white' : 'text-[#6B6058] hover:text-[#1A1714]'}`}
        >
          <Heart size={11} /> Looks
        </button>
        <button
          onClick={() => setView('combinations')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light transition-colors ${view === 'combinations' ? 'bg-[#1A1714] text-white' : 'text-[#6B6058] hover:text-[#1A1714]'}`}
        >
          <Layers size={11} /> Combinations
        </button>
      </div>

      {view === 'combinations' && (
        <CombinationsTab items={items} bodyProfile={bodyProfile} profileImageFilename={profileImageFilename} />
      )}

      {view === 'looks' && <>
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
          <p className="text-sm text-[#A89F96] font-light">No saved looks yet — ask your stylist for outfits and heart the ones you love to build your lookbook.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedLooks.map((look) => (
              <LookCard
                key={look.id}
                look={look}
                items={items}
                hasProfilePhoto={Boolean(profileImageFilename)}
                onRemove={() => removeLook(look.id)}
                onFeedback={(f) => setFeedback(look.id, f)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wear intelligence */}
      <WearIntelligence journal={journal} items={items} onRemoveEntry={removeEntry} />

      </>}

      {showLog && (
        <LogModal
          items={items}
          savedLooks={savedLooks}
          onClose={() => setShowLog(false)}
          onLogged={(entry) => setJournal((prev) => [entry, ...prev])}
        />
      )}
    </div>
  );
}
