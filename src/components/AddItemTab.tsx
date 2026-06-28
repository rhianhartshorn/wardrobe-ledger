'use client';
import { useState, useRef } from 'react';
import { Camera, Loader2, Check } from 'lucide-react';
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

export default function AddItemTab({ onAdd }: { onAdd: (item: WardrobeItem) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState<TagForm | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setForm(null); setImageDataUrl(null); setPreview(null);

    let dataUrl: string;
    try {
      dataUrl = await compressImage(file);
    } catch (e1) {
      setErr(e1 instanceof Error ? e1.message : "Couldn't read that photo.");
      return;
    }
    setPreview(dataUrl);
    setImageDataUrl(dataUrl);
    setAnalyzing(true);

    // Ask Claude to tag — if it fails, user fills in manually but photo is still kept
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
      if (tagRes.ok && tagData.tags) {
        setForm(tagData.tags);
      } else {
        setErr('Auto-tagging didn\'t come through — fill in the details below.');
        setForm(EMPTY_FORM);
      }
    } catch {
      setErr('Auto-tagging didn\'t come through — fill in the details below.');
      setForm(EMPTY_FORM);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!form?.name?.trim()) { setErr('Give this piece a name first.'); return; }
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
      setPreview(null); setForm(null); setImageDataUrl(null);
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
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded px-3 py-2">
          <Check size={16} /> Added to your closet.
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-stone-300 rounded-lg py-12 flex flex-col items-center gap-2 text-stone-500 hover:border-amber-600 hover:text-amber-700"
        >
          <Camera size={28} />
          <span className="text-sm">Take or upload a photo</span>
        </button>
      ) : (
        <div className="rounded-lg overflow-hidden border border-stone-200 bg-white">
          <img src={preview} alt="preview" className="w-full max-h-72 object-contain bg-stone-100" />
        </div>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="animate-spin" size={16} /> Reading the garment...
        </div>
      )}

      {err && <p className="text-sm text-red-700">{err}</p>}

      {form && !analyzing && (
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Formality">
              <select
                value={form.formality}
                onChange={(e) => setForm({ ...form, formality: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                {FORMALITY.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Primary color">
              <input
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Secondary color">
              <input
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Pattern">
              <input
                value={form.pattern}
                onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="Season">
              <select
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="w-full border border-stone-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                {SEASONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-stone-900 text-stone-50 rounded py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="animate-spin" size={14} /> Saving...</>
            ) : (
              'Add to closet'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
