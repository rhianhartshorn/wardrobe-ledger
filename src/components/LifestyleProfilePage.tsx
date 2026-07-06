'use client';
import { useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import {
  type LifestyleProfile, EMPTY_LIFESTYLE,
  WORK_DRESS_CODES, OCCASION_OPTIONS, TRAVEL_OPTIONS, CLIMATE_OPTIONS, FIT_COMFORT_OPTIONS,
} from '@/lib/lifestyle-types';

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{title}</p>
        {sub && <p className="text-xs text-[#A89F96] font-light mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-light border transition-colors ${
        selected
          ? 'bg-[#1A1714] text-white border-[#1A1714]'
          : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
      }`}
    >
      {label}
    </button>
  );
}

export default function LifestyleProfilePage({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<LifestyleProfile>;
  onSave: (p: LifestyleProfile) => void;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<LifestyleProfile>({ ...EMPTY_LIFESTYLE(), ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (field: 'occasions' | 'fitComfort', value: string) => {
    setProfile((p) => {
      const arr = p[field];
      return { ...p, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Save failed');
      onSave(profile);
      onClose();
    } catch {
      setErr('Could not save — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--ivory)] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="sticky top-0 bg-[var(--ivory)] pt-4 pb-3 flex items-center gap-3 border-b border-[#E5DDD0] mb-6">
          <button onClick={onClose} className="text-[#A89F96] hover:text-[#1A1714] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Your life context</p>
            <h2 className="font-serif text-xl text-[#1A1714]">Lifestyle profile</h2>
          </div>
        </div>

        <p className="text-sm text-[#6B6058] font-light mb-6 leading-relaxed">
          A stylist asks about your life before touching your wardrobe. These answers shape every recommendation — occasion appropriateness, climate suitability, and what your wardrobe actually needs to do.
        </p>

        <div className="space-y-8">
          <Section title="Work dress code" sub="What does your workplace expect?">
            <div className="flex flex-wrap gap-2">
              {WORK_DRESS_CODES.map((v) => (
                <Chip key={v} label={v} selected={profile.workDressCode === v}
                  onClick={() => setProfile((p) => ({ ...p, workDressCode: p.workDressCode === v ? '' : v }))} />
              ))}
            </div>
          </Section>

          <Section title="Key occasions" sub="Select all that apply to your life regularly.">
            <div className="flex flex-wrap gap-2">
              {OCCASION_OPTIONS.map((v) => (
                <Chip key={v} label={v} selected={profile.occasions.includes(v)}
                  onClick={() => toggle('occasions', v)} />
              ))}
            </div>
          </Section>

          <Section title="Travel frequency" sub="How often do you need to pack a bag?">
            <div className="flex flex-wrap gap-2">
              {TRAVEL_OPTIONS.map((v) => (
                <Chip key={v} label={v} selected={profile.travelFrequency === v}
                  onClick={() => setProfile((p) => ({ ...p, travelFrequency: p.travelFrequency === v ? '' : v }))} />
              ))}
            </div>
          </Section>

          <Section title="Climate" sub="Where do you spend most of your time?">
            <div className="flex flex-wrap gap-2">
              {CLIMATE_OPTIONS.map((v) => (
                <Chip key={v} label={v} selected={profile.climate === v}
                  onClick={() => setProfile((p) => ({ ...p, climate: p.climate === v ? '' : v }))} />
              ))}
            </div>
          </Section>

          <Section title="Fit comfort zones" sub="What are you comfortable wearing? Select everything that feels like you.">
            <div className="flex flex-wrap gap-2">
              {FIT_COMFORT_OPTIONS.map((v) => (
                <Chip key={v} label={v} selected={profile.fitComfort.includes(v)}
                  onClick={() => toggle('fitComfort', v)} />
              ))}
            </div>
          </Section>

          <Section title="Things you won't wear" sub="Anything you dislike, find uncomfortable, or won't consider — be specific.">
            <textarea
              value={profile.avoidances}
              onChange={(e) => setProfile((p) => ({ ...p, avoidances: e.target.value }))}
              placeholder="e.g. anything dry-clean only, very high heels, anything too clingy around the stomach..."
              rows={3}
              className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder-[#C5BDB4] focus:outline-none focus:border-[#9B7B3A] resize-none"
            />
          </Section>
        </div>

        {err && <p className="text-xs text-red-700 font-light mt-4">{err}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-8 bg-[#1A1714] text-white py-3.5 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="animate-spin" size={13} /> Saving...</> : <><Check size={13} /> Save lifestyle profile</>}
        </button>
      </div>
    </div>
  );
}
