'use client';
import { useState, useRef } from 'react';
import { Camera, Loader2, Check, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
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

type QueueStatus = 'pending' | 'analyzing' | 'ready' | 'duplicate' | 'saved' | 'error';

type QueueItem = {
  localId: string;
  file: File;
  preview: string;
  imageDataUrl: string;
  status: QueueStatus;
  form: TagForm;
  error?: string;
  expanded: boolean;
  duplicateOf?: WardrobeItem[];
  confirmedDuplicate?: boolean;
};

function normalize(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function findDuplicates(form: TagForm, items: WardrobeItem[]): WardrobeItem[] {
  const nameNorm = normalize(form.name);
  if (!nameNorm) return [];
  return items.filter((it) => {
    const existName = normalize(it.name);
    if (!existName) return false;
    if (existName === nameNorm) return true;
    const sameCat = it.category === form.category;
    if (sameCat && (existName.includes(nameNorm) || nameNorm.includes(existName))) return true;
    if (sameCat && normalize(it.primaryColor) === normalize(form.primaryColor) && normalize(form.primaryColor)) {
      const shorter = existName.length < nameNorm.length ? existName : nameNorm;
      const longer = existName.length < nameNorm.length ? nameNorm : existName;
      if (shorter.length >= 4 && longer.includes(shorter)) return true;
    }
    return false;
  });
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const map: Record<QueueStatus, { label: string; className: string }> = {
    pending: { label: 'Waiting', className: 'text-[#A89F96] border-[#E5DDD0]' },
    analyzing: { label: 'Reading…', className: 'text-[#9B7B3A] border-[#9B7B3A]/30' },
    ready: { label: 'Ready', className: 'text-green-700 border-green-200' },
    duplicate: { label: 'Possible duplicate', className: 'text-amber-700 border-amber-200' },
    saved: { label: 'Saved', className: 'text-green-700 border-green-200 bg-green-50' },
    error: { label: 'Error', className: 'text-red-700 border-red-200' },
  };
  const { label, className } = map[status];
  return (
    <span className={`text-[10px] font-light border px-2 py-0.5 ${className}`}>{label}</span>
  );
}

function QueueCard({
  item, onUpdate, onRemove, existingItems,
}: {
  item: QueueItem;
  onUpdate: (localId: string, patch: Partial<QueueItem>) => void;
  onRemove: (localId: string) => void;
  existingItems: WardrobeItem[];
}) {
  const { localId, preview, status, form, expanded, duplicateOf, confirmedDuplicate } = item;

  const updateForm = (patch: Partial<TagForm>) => {
    const newForm = { ...form, ...patch };
    const dupes = findDuplicates(newForm, existingItems);
    onUpdate(localId, {
      form: newForm,
      duplicateOf: dupes,
      status: dupes.length > 0 && !confirmedDuplicate ? 'duplicate' : status === 'duplicate' ? 'ready' : status,
      confirmedDuplicate: dupes.length > 0 ? confirmedDuplicate : false,
    });
  };

  const canExpand = status !== 'pending' && status !== 'analyzing' && status !== 'saved';

  return (
    <div className={`border bg-white ${status === 'saved' ? 'border-green-200 opacity-60' : 'border-[#E5DDD0]'}`}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
          <img src={preview} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#1A1714] font-light truncate">{form.name || item.file.name}</p>
          <p className="text-[10px] text-[#A89F96] font-light">{form.category}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === 'analyzing' && <Loader2 size={13} className="animate-spin text-[#9B7B3A]" />}
          <StatusBadge status={status} />
          {canExpand && (
            <button onClick={() => onUpdate(localId, { expanded: !expanded })} className="text-[#A89F96] hover:text-[#1A1714] transition-colors">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {status !== 'saved' && (
            <button onClick={() => onRemove(localId)} className="text-[#D6CFC0] hover:text-red-600 transition-colors ml-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Duplicate warning */}
      {status === 'duplicate' && !confirmedDuplicate && duplicateOf && duplicateOf.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50 px-3 py-2 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-800 font-light">May already be in your closet:</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {duplicateOf.map((d) => (
              <span key={d.id} className="text-[10px] text-amber-700 font-light">{d.name}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(localId, { confirmedDuplicate: true, status: 'ready' })}
              className="text-[10px] border border-amber-300 text-amber-800 px-2 py-1 font-light hover:bg-amber-100 transition-colors"
            >
              Add anyway
            </button>
            <button
              onClick={() => onRemove(localId)}
              className="text-[10px] text-[#A89F96] px-2 py-1 font-light hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Expanded edit form */}
      {expanded && canExpand && (
        <div className="border-t border-[#E5DDD0] p-3 space-y-3">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              className="w-full border border-[#E5DDD0] px-3 py-1.5 text-sm font-light text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })}
                className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Formality">
              <select value={form.formality} onChange={(e) => updateForm({ formality: e.target.value })}
                className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                {FORMALITY.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Primary color">
              <input value={form.primaryColor} onChange={(e) => updateForm({ primaryColor: e.target.value })}
                className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]" />
            </Field>
            <Field label="Season">
              <select value={form.season} onChange={(e) => updateForm({ season: e.target.value })}
                className="w-full border border-[#E5DDD0] px-2 py-1.5 text-xs font-light bg-white text-[#1A1714] focus:outline-none focus:border-[#9B7B3A]">
                {SEASONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddItemTab({ onAdd, items }: { onAdd: (item: WardrobeItem) => void; items: WardrobeItem[] }) {
  const fileRef = useRef<HTMLInputElement>(null); // kept for reset only
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [uploadErr, setUploadErr] = useState('');

  const update = (localId: string, patch: Partial<QueueItem>) => {
    setQueue((q) => q.map((it) => it.localId === localId ? { ...it, ...patch } : it));
  };

  const remove = (localId: string) => {
    setQueue((q) => q.filter((it) => it.localId !== localId));
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadErr(`Debug: input fired, ${files.length} file(s) received.`);
    if (!files.length) return;
    if (fileRef.current) fileRef.current.value = '';

    // Add all to queue as pending first — isolate failures per file so one bad
    // photo (unsupported format, corrupt file) doesn't silently drop the whole batch
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const preview = await compressImage(file, 200, 0.5);
        return {
          localId: genId(),
          file,
          preview,
          imageDataUrl: '',
          status: 'pending' as QueueStatus,
          form: EMPTY_FORM,
          expanded: false,
        };
      })
    );

    const newItems: QueueItem[] = [];
    const failures: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') newItems.push(r.value);
      else {
        console.error('Failed to process photo', files[i]?.name, r.reason);
        failures.push(files[i]?.name ?? 'a photo');
      }
    });

    if (failures.length) {
      setUploadErr(`Couldn't read ${failures.join(', ')} — try a JPEG or PNG.`);
    } else {
      setUploadErr('');
    }

    if (newItems.length === 0) return;
    setQueue((q) => [...q, ...newItems]);

    // Process each sequentially
    for (const qi of newItems) {
      setQueue((q) => q.map((it) => it.localId === qi.localId ? { ...it, status: 'analyzing' } : it));
      try {
        const dataUrl = await compressImage(qi.file);
        const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
        const mediaType = match ? match[1] : 'image/jpeg';
        const base64Data = match ? match[2] : dataUrl;

        const tagRes = await fetch('/api/tag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, mediaType }),
        });
        const tagData = await tagRes.json() as { tags?: TagForm; error?: string };
        const form = tagRes.ok && tagData.tags ? tagData.tags : EMPTY_FORM;

        // Check duplicates against existing items + already-queued ready items
        setQueue((q) => {
          const allExisting = [
            ...items,
            ...q.filter((x) => x.status === 'ready' || x.status === 'saved').map((x) => ({
              id: x.localId, name: x.form.name, category: x.form.category,
              primaryColor: x.form.primaryColor, secondaryColor: x.form.secondaryColor,
              pattern: x.form.pattern, formality: x.form.formality, season: x.form.season,
              imageFilename: null, imageUrl: x.preview, addedAt: 0,
            } as WardrobeItem)),
          ];
          const dupes = findDuplicates(form, allExisting);
          return q.map((it) => it.localId === qi.localId ? {
            ...it,
            imageDataUrl: dataUrl,
            form,
            status: dupes.length > 0 ? 'duplicate' : 'ready',
            duplicateOf: dupes,
            expanded: false,
          } : it);
        });
      } catch {
        setQueue((q) => q.map((it) => it.localId === qi.localId ? {
          ...it, status: 'error', error: 'Tagging failed — edit manually or remove.',
        } : it));
      }
    }
  };

  const handleSaveAll = async () => {
    const toSave = queue.filter((it) =>
      (it.status === 'ready' || it.status === 'error') && it.form.name?.trim()
    );
    if (toSave.length === 0) return;
    setSaving(true);
    let count = 0;
    for (const qi of toSave) {
      try {
        const id = genId();
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, imageDataUrl: qi.imageDataUrl ?? '', ...qi.form }),
        });
        const data = await res.json() as WardrobeItem & { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        onAdd(data);
        update(qi.localId, { status: 'saved' });
        count++;
      } catch {
        update(qi.localId, { status: 'error', error: 'Save failed — try again.' });
      }
    }
    setSavedCount((n) => n + count);
    setSaving(false);
    // Remove saved items after a moment
    setTimeout(() => {
      setQueue((q) => q.filter((it) => it.status !== 'saved'));
    }, 1500);
  };

  const readyCount = queue.filter((it) => it.status === 'ready' && it.form.name?.trim()).length;
  const pendingCount = queue.filter((it) => it.status === 'pending' || it.status === 'analyzing').length;
  const dupeCount = queue.filter((it) => it.status === 'duplicate' && !it.confirmedDuplicate).length;

  return (
    <div className="space-y-4">
      {savedCount > 0 && (
        <div className="flex items-center gap-2 border border-green-200 bg-green-50 text-green-800 text-xs px-3 py-2.5 font-light">
          <Check size={13} /> {savedCount} {savedCount === 1 ? 'piece' : 'pieces'} added to your closet.
        </div>
      )}

      {uploadErr && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-800 text-xs px-3 py-2.5 font-light">
          <AlertTriangle size={13} className="shrink-0" /> {uploadErr}
        </div>
      )}

      {queue.length === 0 && (
        <label className="w-full border border-dashed border-[#D6CFC0] py-10 flex flex-col items-center gap-3 text-[#A89F96] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors cursor-pointer">
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="sr-only" />
          <Camera size={24} />
          <div className="text-center">
            <p className="text-xs tracking-[0.12em] uppercase font-light">Select photos</p>
            <p className="text-[10px] text-[#C4BAB0] mt-1 font-light">Tap one photo at a time — they queue up automatically</p>
          </div>
        </label>
      )}

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light">
              {queue.length} {queue.length === 1 ? 'piece' : 'pieces'}
              {pendingCount > 0 && ` · ${pendingCount} processing`}
              {dupeCount > 0 && ` · ${dupeCount} to review`}
            </p>
            <button
              onClick={() => setQueue([])}
              className="text-[10px] text-[#A89F96] hover:text-red-600 font-light transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {queue.map((item) => (
              <QueueCard
                key={item.localId}
                item={item}
                onUpdate={update}
                onRemove={remove}
                existingItems={items}
              />
            ))}
          </div>

          {/* Add more */}
          <label className="w-full border border-dashed border-[#D6CFC0] py-3 flex items-center justify-center gap-2 text-[#A89F96] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="sr-only" />
            <Camera size={13} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-light">Add more photos</span>
          </label>

          {readyCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving || dupeCount > 0}
              className="w-full bg-[#1A1714] text-white py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="animate-spin" size={13} /> Saving...</>
                : `Add ${readyCount} ${readyCount === 1 ? 'piece' : 'pieces'} to closet`
              }
            </button>
          )}
          {dupeCount > 0 && (
            <p className="text-[10px] text-[#A89F96] text-center font-light">Resolve the duplicate warnings above before saving.</p>
          )}
        </div>
      )}
    </div>
  );
}
