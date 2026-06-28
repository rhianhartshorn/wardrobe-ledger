'use client';
import { useState } from 'react';
import { ArrowLeft, Check, Loader2, User } from 'lucide-react';
import type { BodyProfile } from '@/lib/body-profile';

export { type BodyProfile };

const HEIGHT_OPTIONS: { value: BodyProfile['height']; label: string; sub: string }[] = [
  { value: 'petite', label: 'Petite', sub: 'Under 5\'4"' },
  { value: 'average', label: 'Average', sub: '5\'4" – 5\'7"' },
  { value: 'tall', label: 'Tall', sub: 'Above 5\'7"' },
];

const SHAPE_OPTIONS: { value: BodyProfile['bodyShape']; label: string; sub: string; svg: string }[] = [
  {
    value: 'hourglass', label: 'Hourglass', sub: 'Balanced shoulders & hips, defined waist',
    svg: 'M18 4 C18 4 22 8 22 14 C22 20 18 22 16 26 C14 30 14 34 16 38 C18 42 22 44 22 44 L10 44 C10 44 14 42 16 38 C18 34 18 30 16 26 C14 22 10 20 10 14 C10 8 14 4 18 4 Z',
  },
  {
    value: 'pear', label: 'Pear', sub: 'Narrower shoulders, fuller hips & thighs',
    svg: 'M18 4 C18 4 20 7 20 12 C20 17 18 19 16 22 C13 26 10 30 10 36 C10 41 13 44 16 44 L20 44 C23 44 26 41 26 36 C26 30 23 26 20 22 C18 19 16 17 16 12 C16 7 18 4 18 4 Z',
  },
  {
    value: 'apple', label: 'Apple', sub: 'Fuller through the torso & midsection',
    svg: 'M18 4 C18 4 23 7 24 13 C25 19 24 23 24 26 C24 30 22 32 20 36 C18 40 18 44 18 44 L18 44 C18 44 18 40 16 36 C14 32 12 30 12 26 C12 23 11 19 12 13 C13 7 18 4 18 4 Z',
  },
  {
    value: 'rectangle', label: 'Rectangle', sub: 'Similar shoulder & hip width',
    svg: 'M14 4 L22 4 L23 14 L23 26 L23 36 L22 44 L14 44 L13 36 L13 26 L13 14 Z',
  },
  {
    value: 'athletic', label: 'Athletic', sub: 'Broader shoulders, leaner hips',
    svg: 'M18 4 C18 4 25 6 26 12 C27 18 24 20 22 24 C20 28 19 32 19 36 C19 40 19 44 19 44 L17 44 C17 44 17 40 17 36 C17 32 16 28 14 24 C12 20 9 18 10 12 C11 6 18 4 18 4 Z',
  },
];

const FEATURE_OPTIONS = [
  'Elongate my silhouette',
  'Create waist definition',
  'Balance my proportions',
  'Minimise my bust',
  'Celebrate my curves',
  'Look taller',
  'Slim my hips',
  'Show off my legs',
];

const FIT_OPTIONS: { value: BodyProfile['fitPreference']; label: string; sub: string }[] = [
  { value: 'relaxed', label: 'Relaxed', sub: 'Easy, comfortable shapes' },
  { value: 'tailored', label: 'Tailored', sub: 'Structured, fitted pieces' },
  { value: 'mix', label: 'Mix', sub: 'Depends on the day' },
];

const UNDERTONE_OPTIONS: { value: BodyProfile['undertone']; label: string; sub: string; swatch: string }[] = [
  { value: 'warm', label: 'Warm', sub: 'Golden, peachy, olive', swatch: '#D4A574' },
  { value: 'cool', label: 'Cool', sub: 'Pink, rosy, blue-toned', swatch: '#C4A8B8' },
  { value: 'neutral', label: 'Neutral', sub: 'A blend of both', swatch: '#C8B89A' },
];

const HAIR_OPTIONS: { value: BodyProfile['hairTone']; label: string; swatch: string }[] = [
  { value: 'light', label: 'Light / Blonde', swatch: '#E8D5A3' },
  { value: 'medium', label: 'Medium Brown', swatch: '#8B5E3C' },
  { value: 'dark', label: 'Dark Brown / Black', swatch: '#2C1A0E' },
  { value: 'red', label: 'Red / Auburn', swatch: '#8B3A1A' },
  { value: 'grey', label: 'Grey / Silver', swatch: '#A8A8A8' },
];

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{label}</p>
      <h3 className="font-serif text-xl text-[#1A1714] mt-0.5">{title}</h3>
    </div>
  );
}

function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-light transition-all ${selected ? 'border-[#9B7B3A] bg-[#9B7B3A]/5 text-[#1A1714]' : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]/50'}`}
    >
      {selected && <Check size={10} className="text-[#9B7B3A] shrink-0" />}
      {children}
    </button>
  );
}

type Props = { initial: BodyProfile; onSave: (p: BodyProfile) => void; onClose: () => void };

export default function BodyProfilePage({ initial, onSave, onClose }: Props) {
  const [profile, setProfile] = useState<BodyProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof BodyProfile>(key: K, value: BodyProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleFeature = (f: string) =>
    setProfile((p) => ({
      ...p,
      features: p.features.includes(f) ? p.features.filter((x) => x !== f) : [...p.features, f],
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/body-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      onSave(profile);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } finally {
      setSaving(false);
    }
  };

  const isComplete = profile.height && profile.bodyShape && profile.undertone;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--ivory)] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--ivory)] pt-4 pb-3 flex items-center gap-3 border-b border-[#E5DDD0] mb-6 z-10">
          <button onClick={onClose} className="text-[#A89F96] hover:text-[#1A1714] transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Your profile</p>
            <h2 className="font-serif text-xl text-[#1A1714]">Style Blueprint</h2>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-[#1A1714] text-white p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <User size={14} className="text-[#9B7B3A]" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Why this matters</p>
          </div>
          <p className="font-serif text-2xl italic leading-snug mb-3">Dressing well starts with knowing your canvas.</p>
          <p className="text-sm text-white/60 font-light leading-relaxed">
            Two people can own identical pieces and look completely different in them. Your frame, proportions, and colouring shape every recommendation — from which silhouettes flatter you to which colours make you glow. This takes 60 seconds and changes everything.
          </p>
        </div>

        <div className="space-y-10">

          {/* ── Height ── */}
          <div>
            <SectionHeading label="Your Frame" title="How tall are you?" />
            <div className="grid grid-cols-3 gap-3">
              {HEIGHT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => set('height', o.value)}
                  className={`border p-4 text-center transition-all ${profile.height === o.value ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0] bg-white hover:border-[#9B7B3A]/40'}`}
                >
                  {profile.height === o.value && (
                    <div className="w-4 h-4 rounded-full bg-[#9B7B3A] flex items-center justify-center mx-auto mb-2">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                  <p className="font-serif text-base text-[#1A1714]">{o.label}</p>
                  <p className="text-[11px] text-[#A89F96] font-light mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Body Shape ── */}
          <div>
            <SectionHeading label="Your Frame" title="Which silhouette best describes you?" />
            <p className="text-xs text-[#A89F96] font-light mb-4 -mt-3">Choose the shape closest to yours — most people fall between two.</p>
            <div className="grid grid-cols-5 gap-2">
              {SHAPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => set('bodyShape', o.value)}
                  className={`border p-3 flex flex-col items-center text-center transition-all ${profile.bodyShape === o.value ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0] bg-white hover:border-[#9B7B3A]/40'}`}
                >
                  <svg viewBox="0 0 36 48" className="w-8 h-10 mb-2" fill="none">
                    <path
                      d={o.svg}
                      fill={profile.bodyShape === o.value ? '#9B7B3A' : '#E5DDD0'}
                      className="transition-colors"
                    />
                  </svg>
                  <p className={`text-[11px] font-light leading-tight ${profile.bodyShape === o.value ? 'text-[#1A1714]' : 'text-[#6B6058]'}`}>{o.label}</p>
                </button>
              ))}
            </div>
            {profile.bodyShape && (
              <p className="text-xs text-[#9B7B3A] font-light mt-3 border-l-2 border-[#9B7B3A] pl-3">
                {SHAPE_OPTIONS.find((o) => o.value === profile.bodyShape)?.sub}
              </p>
            )}
          </div>

          {/* ── Features ── */}
          <div>
            <SectionHeading label="What matters to you" title="What are your styling priorities?" />
            <p className="text-xs text-[#A89F96] font-light mb-4 -mt-3">Select everything that applies — no wrong answers.</p>
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map((f) => (
                <Pill key={f} selected={profile.features.includes(f)} onClick={() => toggleFeature(f)}>{f}</Pill>
              ))}
            </div>
          </div>

          {/* ── Fit Preference ── */}
          <div>
            <SectionHeading label="What matters to you" title="How do you like clothes to fit?" />
            <div className="grid grid-cols-3 gap-3">
              {FIT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => set('fitPreference', o.value)}
                  className={`border p-4 text-center transition-all ${profile.fitPreference === o.value ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0] bg-white hover:border-[#9B7B3A]/40'}`}
                >
                  <p className="font-serif text-base text-[#1A1714]">{o.label}</p>
                  <p className="text-[11px] text-[#A89F96] font-light mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Undertone ── */}
          <div>
            <SectionHeading label="Your Colouring" title="What is your skin undertone?" />
            <p className="text-xs text-[#A89F96] font-light mb-4 -mt-3">Look at your wrist veins — blue/purple = cool, green = warm, both = neutral.</p>
            <div className="grid grid-cols-3 gap-3">
              {UNDERTONE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => set('undertone', o.value)}
                  className={`border p-4 text-center transition-all ${profile.undertone === o.value ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0] bg-white hover:border-[#9B7B3A]/40'}`}
                >
                  <div className="w-8 h-8 rounded-full mx-auto mb-3 border border-[#E5DDD0]" style={{ background: o.swatch }} />
                  <p className="font-serif text-base text-[#1A1714]">{o.label}</p>
                  <p className="text-[11px] text-[#A89F96] font-light mt-0.5">{o.sub}</p>
                  {profile.undertone === o.value && (
                    <div className="w-4 h-4 rounded-full bg-[#9B7B3A] flex items-center justify-center mx-auto mt-2">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Hair ── */}
          <div>
            <SectionHeading label="Your Colouring" title="What is your natural hair tone?" />
            <div className="space-y-2">
              {HAIR_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => set('hairTone', o.value)}
                  className={`w-full flex items-center gap-4 border p-3.5 text-left transition-all ${profile.hairTone === o.value ? 'border-[#9B7B3A] bg-[#9B7B3A]/5' : 'border-[#E5DDD0] bg-white hover:border-[#9B7B3A]/40'}`}
                >
                  <div className="w-6 h-6 rounded-full shrink-0 border border-[#E5DDD0]" style={{ background: o.swatch }} />
                  <p className="text-sm font-light text-[#1A1714]">{o.label}</p>
                  {profile.hairTone === o.value && <Check size={13} className="text-[#9B7B3A] ml-auto" />}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Save */}
        <div className="mt-10 sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={saving || !isComplete}
            className="w-full bg-[#1A1714] text-white py-4 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
              : saved ? <><Check size={13} /> Saved</>
              : !isComplete ? 'Complete height, body shape & undertone to save'
              : 'Save my style blueprint'}
          </button>
        </div>
      </div>
    </div>
  );
}
