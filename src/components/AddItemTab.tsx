'use client';
import { useState, useRef } from 'react';
import { Camera, Loader2, Check, AlertTriangle } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { compressImage } from './utils';
import { Field } from './ui';
import { CATEGORIES, FORMALITY, SEASONS } from './constants';

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

type TagForm = {
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
};

const EMPTY_FORM: TagForm = {
  name: '', category: 'Top', primaryColor: '', secondaryColor: '',
  pattern: '', formality: 'Casual', season: 'All-season',
};

function findDuplicates(form: TagForm, items: WardrobeItem[]): WardrobeItem[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameNorm = normalize(form.name);
  if (!nameNorm) return [];
  return items.filter((it) => {
    const sameCat = it.category === form.category;
    const existName = normalize(it.name);
    if (!existName) return false;
    if (existName === nameNorm) return true;
    // partial overlap: one is a substring of the other
    if (sameCat && (existName.includes(nameNorm) || nameNorm.includes(existName))) return true;
    // fuzzy: same category + same primary color + long name overlap
    if (sameCat && normalize(it.primaryColor) === normalize(form.primaryColor) && normalize(form.primaryColor)) {
      const shorter = existName.length < nameNorm.length ? existName : nameNorm;
      const longer = existName.length < nameNorm.length ? nameNorm : existName;
      if (shorter.length >= 4 && longer.includes(shorter)) return true;
    }
    return false;
  });
}

export default function AddItemTab({ onAdd, items }: { onAdd: (item: WardrobeItem) => void; items: WardrobeItem[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState<TagForm | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [duplicates, setDuplicates] = useState<WardrobeItem[]>([]);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setForm(null); setImageDataUrl(null); setPreview(null); setDuplicates([]); setConfirmedDuplicate(false);

    let dataUrl: string;
    try { dataUrl = await compressImage(file); }
    catch (e1) { setErr(e1 instanceof Error ? e1.message : "Couldn't read that photo."); return; }

    setPreview(dataUrl);
    setImageDataUrl(dataUrl);
    setAnalyzing(true);

    try {
      const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
      const mediaType = match ? match[1] : 'image/jpeg';
      const base64Data = match ? match[2] : dataUrl;

      const tagRes = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mediaType }),
      });
      const tagData = await tagRes.json() as { tags?: TagForm; error?: string };
      const tagged = tagRes.ok && tagData.tags ? tagData.tags : EMPTY_FORM;
      if (!tagRes.ok || !tagData.tags) setErr("Auto-tagging didn't come through — fill in the details below.");
      setForm(tagged);
      const dupes = findDuplicates(tagged, items);
      setDuplicates(dupes);
    } catch {
      setErr("Auto-tagging didn't come through — fill in the details below.");
      setForm(EMPTY_FORM);
    } finally {
      setAnalyzing(false);
    }
  };

  const checkDupes = (updatedForm: TagForm) => {
    setForm(updatedForm);
    setDuplicates(findDuplicates(updatedForm, items));
    setConfirmedDuplicate(false);
  };

  const handleSave = async () => {
    if (!form?.name?.trim()) { setErr('Give this piece a name first.'); return; }
    if (duplicates.length > 0 && !confirmedDuplicate) { setErr(''); return; }
    setSaving(true);
    try {
      const id = genId();
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, imageDataUrl: imageDataUrl ?? '', ...form }),
      });
      const data = await res.json() as WardrobeItem & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');

      onAdd(data);
      setPreview(null); setForm(null); setImageDataUrl(null); setDuplicates([]); setConfirmedDuplicate(false);
      if (fileRef.current) fileRef.current.value = '';
      setErr('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {justSaved && (
        <div className="flex items-center gap-2 border border-green-200 bg-green-50 text-green-800 text-xs px-3 py-2.5 font-light">
          <Check size={13} /> Piece added to your closet.
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border border-dashed border-[#D6CFC0] py-14 flex flex-col items-center gap-3 text-[#A89F96] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors"
        >
          <Camera size={24} />
          <span className="text-xs tracking-[0.12em] uppercase font-light">Take or upload a photo</span>
        </button>
      ) : (
        <div className="overflow-hidden border border-[#E5DDD0] bg-[#F5F2EC]">
          <img src={preview} alt="preview" className="w-full max-h-72 object-contain" />
          <button
            onClick={() => { setPreview(null); setForm(null); setImageDataUrl(null); setDuplicates([]); if (fileRef.current) fileRef.current.value = ''; }}
            className="w-full text-xs text-[#A89F96] py-2 hover:text-[#9B7B3A] font-light transition-colors"
          >
            Change photo
          </button>
        </div>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-xs text-[#A89F96] font-light">
          <Loader2 className="animate-spin" size={13} /> Reading the garment...
        </div>
      )}

      {err && <p className="text-xs text-red-700 font-light">{err}</p>}

      {/* Duplicate warning */}
      {duplicates.length > 0 && !confirmedDuplicate && (
        <div className="border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-light">
              This looks like it might already be in your closet:
            </p>
          </div>
          <ul className="space-y-1 pl-5">
            {duplicates.map((d) => (
              <li key={d.id} className="text-xs text-amber-700 font-light flex items-center gap-2">
                {d.imageUrl && (
                  <img src={d.imageUrl} alt={d.name} className="w-7 h-7 object-cover border border-amber-200 shrink-0" />
                )}
                {d.name} <span className="text-amber-500">({d.category})</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setConfirmedDuplicate(true); }}
              className="text-xs border border-amber-300 text-amber-800 px-3 py-1.5 font-light hover:bg-amber-100 transition-colors"
            >
              Add anyway — it's different
            </button>
            <button
              onClick={() => { setPreview(null); setForm(null); setImageDataUrl(null); setDuplicates([]); if (fileRef.current) fileRef.current.value = ''; }}
              className="text-xs text-[#A89F96] px-3 py-1.5 font-light hover:text-[#1A1714] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {form && !analyzing && (
        <div className="bg-white border border-[#E5DDD0] p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">Details</p>
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => checkDupes({ ...form, name: e.target.value })}
              className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
              placeholder="e.g. Navy linen blazer"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => checkDupes({ ...form, category: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] bg-white focus:outline-none focus:border-[#9B7B3A]"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Formality">
              <select
                value={form.formality}
                onChange={(e) => setForm({ ...form, formality: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] bg-white focus:outline-none focus:border-[#9B7B3A]"
              >
                {FORMALITY.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Primary color">
              <input
                value={form.primaryColor}
                onChange={(e) => checkDupes({ ...form, primaryColor: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
              />
            </Field>
            <Field label="Secondary color">
              <input
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
              />
            </Field>
            <Field label="Pattern">
              <input
                value={form.pattern}
                onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
              />
            </Field>
            <Field label="Season">
              <select
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] bg-white focus:outline-none focus:border-[#9B7B3A]"
              >
                {SEASONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (duplicates.length > 0 && !confirmedDuplicate)}
            className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="animate-spin" size={13} /> Saving...</> : 'Add to closet'}
          </button>
          {duplicates.length > 0 && !confirmedDuplicate && (
            <p className="text-[10px] text-[#A89F96] text-center font-light">Confirm the duplicate check above to continue.</p>
          )}
        </div>
      )}
    </div>
  );
}
