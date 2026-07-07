'use client';
import { useState } from 'react';
import { Shirt, Trash2, X, Loader2, ArrowLeft, AlertCircle, Pencil, Check } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { colorDot, slim } from './utils';
import { Field } from './ui';
import { CATEGORIES, FORMALITY, SEASONS, MATERIALS, FIT_OPTIONS, LENGTH_OPTIONS } from './constants';
import type { BodyProfile } from '@/lib/body-profile';
import type { FashionCurrencyItem } from '@/lib/fashion-currency-types';

type EditForm = {
  name: string; category: string; primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string; material: string;
  fit: string; length: string; price: string;
};

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

function ItemDetailView({ item, allItems, bodyProfile, onClose, onEdit, currency }: { item: WardrobeItem; allItems: WardrobeItem[]; bodyProfile?: BodyProfile; onClose: () => void; onEdit: (updated: WardrobeItem) => void; currency?: FashionCurrencyItem }) {
  const [loading, setLoading] = useState(false);
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editForm, setEditForm] = useState<EditForm>({
    name: item.name, category: item.category,
    primaryColor: item.primaryColor, secondaryColor: item.secondaryColor ?? '',
    pattern: item.pattern ?? '', formality: item.formality, season: item.season,
    material: item.material ?? '', fit: item.fit ?? '', length: item.length ?? '',
    price: item.price != null ? String(item.price) : '',
  });

  const saveEdit = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true); setEditErr('');
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-fields',
          name: editForm.name.trim(),
          category: editForm.category,
          primaryColor: editForm.primaryColor,
          secondaryColor: editForm.secondaryColor,
          pattern: editForm.pattern,
          formality: editForm.formality,
          season: editForm.season,
          material: editForm.material || null,
          fit: editForm.fit || null,
          length: editForm.length || null,
          price: editForm.price && parseFloat(editForm.price) > 0 ? parseFloat(editForm.price) : null,
        }),
      });
      const data = await res.json() as WardrobeItem & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      onEdit({ ...item, ...data, imageUrl: item.imageUrl, imageFilename: item.imageFilename });
      setEditing(false);
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

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
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{editing ? 'Edit piece' : 'How to wear'}</p>
            <h2 className="font-serif text-xl text-[#1A1714] truncate">{item.name}</h2>
          </div>
          <button
            onClick={() => { setEditing((v) => !v); setEditErr(''); }}
            className={`p-1.5 border transition-colors ${editing ? 'border-[#9B7B3A] text-[#9B7B3A]' : 'border-[#E5DDD0] text-[#A89F96] hover:text-[#1A1714]'}`}
            title={editing ? 'Cancel edit' : 'Edit details'}
          >
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          {item.imageUrl && !editing && (
            <div className="w-10 h-10 shrink-0 overflow-hidden border border-[#E5DDD0]">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mb-4 space-y-3 border border-[#E5DDD0] bg-white p-4">
            <Field label="Name">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-[#E5DDD0] px-3 py-1.5 text-sm font-light text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Category">
                <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Formality">
                <select value={editForm.formality} onChange={(e) => setEditForm((f) => ({ ...f, formality: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  {FORMALITY.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Primary color">
                <input value={editForm.primaryColor} onChange={(e) => setEditForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]" />
              </Field>
              <Field label="Season">
                <select value={editForm.season} onChange={(e) => setEditForm((f) => ({ ...f, season: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  {SEASONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Material">
                <select value={editForm.material} onChange={(e) => setEditForm((f) => ({ ...f, material: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  <option value="">Unknown</option>
                  {MATERIALS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Fit">
                <select value={editForm.fit} onChange={(e) => setEditForm((f) => ({ ...f, fit: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  <option value="">Unknown</option>
                  {FIT_OPTIONS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Length">
                <select value={editForm.length} onChange={(e) => setEditForm((f) => ({ ...f, length: e.target.value }))}
                  className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                  <option value="">N/A</option>
                  {LENGTH_OPTIONS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Price paid (optional)">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#A89F96] font-light">$</span>
                  <input type="number" min="0" step="0.01" value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-[#E5DDD0] pl-5 pr-2 py-1.5 text-xs font-light text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]" />
                </div>
              </Field>
            </div>
            {editErr && <p className="text-[11px] text-red-700 font-light">{editErr}</p>}
            <button
              onClick={saveEdit}
              disabled={saving || !editForm.name.trim()}
              className="w-full bg-[#1A1714] text-white py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="animate-spin" size={12} /> Saving...</> : <><Check size={12} /> Save changes</>}
            </button>
          </div>
        )}

        {/* Item details (hidden while editing) */}
        {!editing && (
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
        )}

        {!editing && currency && (() => {
          const statusStyles: Record<string, string> = {
            timeless: 'text-green-700 bg-green-50 border-green-200',
            current: 'text-[#9B7B3A] bg-amber-50 border-amber-200',
            'coming-back': 'text-purple-700 bg-purple-50 border-purple-200',
            dated: 'text-[#A89F96] bg-[#F5F2EC] border-[#E5DDD0]',
          };
          const label = currency.status === 'coming-back' ? 'Coming back' : currency.status.charAt(0).toUpperCase() + currency.status.slice(1);
          return (
            <div className="mb-4 border border-[#E5DDD0] bg-white p-3 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] uppercase tracking-widest border px-1.5 py-0.5 font-light shrink-0 ${statusStyles[currency.status] ?? statusStyles.dated}`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-[#A89F96] font-light">{currency.era}</span>
                </div>
                {currency.howNow && <p className="text-xs text-[#6B6058] font-light leading-snug">{currency.howNow}</p>}
              </div>
            </div>
          );
        })()}

        {!editing && (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {loading ? <><Loader2 className="animate-spin" size={13} /> Finding ways to wear this...</> : looks ? 'Regenerate looks' : 'Show me how to wear this'}
        </button>
        )}

        {!editing && err && <p className="text-sm text-red-700 font-light mb-4">{err}</p>}

        {!editing && looks && (
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

function ItemCard({ item, allItems, onRemove, onWearLogged, onEdit, bodyProfile, fashionCurrency }: { item: WardrobeItem; allItems: WardrobeItem[]; onRemove: (id: string) => void; onWearLogged: (id: string, wearCount: number) => void; onEdit: (updated: WardrobeItem) => void; bodyProfile?: BodyProfile; fashionCurrency?: FashionCurrencyItem[] }) {
  const [confirming, setConfirming] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loggingWear, setLoggingWear] = useState(false);
  const currency = fashionCurrency?.find((fc) => fc.itemId === item.id);

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
        <ItemDetailView item={item} allItems={allItems} bodyProfile={bodyProfile} onClose={() => setShowDetail(false)} onEdit={(updated) => { onEdit(updated); setShowDetail(false); }} currency={currency} />
      )}
      <div className="bg-white border border-[#E5DDD0] group relative cursor-pointer" onClick={() => !confirming && setShowDetail(true)}>
        <div className="aspect-square w-full overflow-hidden bg-[#F5F2EC] relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt size={24} className="text-[#D6CFC0]" />
            </div>
          )}
          {currency && (
            <span className={`absolute bottom-1 left-1 text-[8px] uppercase tracking-widest border px-1 py-0.5 font-light leading-none ${
              currency.status === 'timeless' ? 'text-green-700 bg-green-50 border-green-200' :
              currency.status === 'current' ? 'text-[#9B7B3A] bg-amber-50/90 border-amber-200' :
              currency.status === 'coming-back' ? 'text-purple-700 bg-purple-50 border-purple-200' :
              'text-[#A89F96] bg-white/90 border-[#E5DDD0]'
            }`}>
              {currency.status === 'coming-back' ? '↑' : currency.status === 'dated' ? 'Dated' : currency.status === 'timeless' ? '✦' : 'Now'}
            </span>
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
            <div className="absolute top-2 right-2 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

export default function ClosetTab({ items, onRemove, onWearLogged, onEdit, bodyProfile, fashionCurrency }: { items: WardrobeItem[]; onRemove: (id: string) => void; onWearLogged: (id: string, wearCount: number) => void; onEdit: (updated: WardrobeItem) => void; bodyProfile?: BodyProfile; fashionCurrency?: FashionCurrencyItem[] }) {
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

      {/* Category chips — always visible */}
      {cats.length > 1 && (
        <div className="mb-2 -mx-4 px-4">
          <FilterChips label="" options={cats} value={cat} onChange={setCat} />
        </div>
      )}

      {/* Expandable filter rows — formality + season */}
      {showFilters && (
        <div className="space-y-2 mb-3 -mx-4 px-4">
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
            <ItemCard key={item.id} item={item} allItems={items} onRemove={onRemove} onWearLogged={onWearLogged} onEdit={onEdit} bodyProfile={bodyProfile} fashionCurrency={fashionCurrency} />
          ))}
        </div>
      )}
    </div>
  );
}
