'use client';
import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import type { StyleDiscoveryAnswers } from '@/app/api/persona/route';

type Props = {
  onDone: () => void;
  itemCount: number;
  topWorn?: string[];
  savedLookTitles?: string[];
};

const MOODS = [
  {
    id: 'Quiet Luxury',
    label: 'Quiet Luxury',
    desc: 'Expensive without logos. Understated, precise, effortless.',
    palette: ['#C4B08A', '#E5DDD0', '#1A1714'],
  },
  {
    id: 'Parisian Cool',
    label: 'Parisian Cool',
    desc: 'Cigarette trousers, a stripe, something slightly undone.',
    palette: ['#1A1714', '#E5DDD0', '#9B7B3A'],
  },
  {
    id: 'Relaxed Refined',
    label: 'Relaxed Refined',
    desc: 'Linen, earth tones, easy shapes that still look considered.',
    palette: ['#B5A48A', '#D4C4A0', '#6B6058'],
  },
  {
    id: 'Sharp & Tailored',
    label: 'Sharp & Tailored',
    desc: 'Structured blazers, clean lines, monochrome confidence.',
    palette: ['#1A1714', '#6B6058', '#E5DDD0'],
  },
  {
    id: 'Eclectic & Expressive',
    label: 'Eclectic & Expressive',
    desc: 'Prints, colour clashes, personality over rules.',
    palette: ['#9B7B3A', '#C4513A', '#2A4A6A'],
  },
  {
    id: 'Street-Influenced',
    label: 'Street-Influenced',
    desc: 'Oversized shapes, trainers, sportswear energy done well.',
    palette: ['#1A1714', '#A89F96', '#9B7B3A'],
  },
];

const DINNER_OPTIONS = [
  { id: 'effortless', label: 'Effortlessly put-together', desc: "Like I didn't try too hard" },
  { id: 'glamorous', label: 'A bit glamorous', desc: 'I want to make an entrance' },
  { id: 'relaxed', label: 'Relaxed but pulled together', desc: 'Comfortable and clearly stylish' },
  { id: 'polished', label: 'Polished and confident', desc: 'Like I mean it' },
];

const VALUE_OPTIONS = [
  { id: 'expensive', label: 'Looking expensive and considered' },
  { id: 'comfortable', label: 'Feeling comfortable in what I wear' },
  { id: 'expressive', label: 'Standing out and expressing myself' },
  { id: 'appropriate', label: 'Always fitting the occasion perfectly' },
];

const LIFESTYLE_OPTIONS = [
  { id: 'outdoors', label: 'Outdoors & active', desc: 'Hiking, sport, nature — movement is part of my week' },
  { id: 'social', label: 'City social & dining', desc: 'Brunches, bars, restaurants, seeing people' },
  { id: 'cultural', label: 'Cultural & arts', desc: 'Galleries, theatre, gigs, exhibitions' },
  { id: 'professional', label: 'Professional & work-focused', desc: 'Meetings, client-facing, office or hybrid' },
  { id: 'home', label: 'Home-based & slow', desc: 'Working from home, quiet weekends, low-key' },
  { id: 'travel', label: 'Travelling & on the move', desc: 'Airports, new cities, varied climates' },
];

const DRESSING_FOR_OPTIONS = [
  { id: 'self', label: 'Myself first', desc: "I dress for how I feel, not what others think" },
  { id: 'others', label: 'The people I\'m with', desc: 'I like to fit in and feel appropriate for the crowd' },
  { id: 'occasion', label: 'The occasion', desc: 'Context drives my choices — I dress for the room' },
  { id: 'aspiration', label: 'The person I\'m becoming', desc: 'I dress slightly ahead of where I am right now' },
];

type Step = 'moods' | 'dinner' | 'values' | 'lifestyle' | 'dressingfor' | 'generating';

export default function StyleDiscoveryCarousel({ onDone, itemCount, topWorn, savedLookTitles }: Props) {
  const [step, setStep] = useState<Step>('moods');
  const [moodPicks, setMoodPicks] = useState<Set<string>>(new Set());
  const [dinnerFeeling, setDinnerFeeling] = useState('');
  const [dressedValue, setDressedValue] = useState('');
  const [lifestyleMix, setLifestyleMix] = useState<Set<string>>(new Set());
  const [dressingFor, setDressingFor] = useState('');
  const [error, setError] = useState('');

  const toggleMood = (id: string) => {
    setMoodPicks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const toggleLifestyle = (id: string) => {
    setLifestyleMix((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const generatePersona = async (answers: StyleDiscoveryAnswers) => {
    setStep('generating');
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, itemCount, topWorn, savedLookTitles }),
      });
      if (!res.ok) throw new Error('Generation failed');
      onDone();
    } catch {
      setError('Something went wrong — your preferences have been noted and we\'ll use them going forward.');
      setTimeout(onDone, 2000);
    }
  };

  const handleDone = () => {
    const answers: StyleDiscoveryAnswers = {
      moodPicks: Array.from(moodPicks),
      dinnerFeeling,
      dressedValue,
      lifestyleMix: Array.from(lifestyleMix),
      dressingFor,
    };
    generatePersona(answers);
  };

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#9B7B3A]" size={28} />
        <p className="text-white/60 text-sm font-light tracking-wide">
          {error || 'Building your personal stylist profile...'}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 shrink-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light mb-1">
          {step === 'moods' ? 'Step 1 of 5' : step === 'dinner' ? 'Step 2 of 5' : step === 'values' ? 'Step 3 of 5' : step === 'lifestyle' ? 'Step 4 of 5' : 'Step 5 of 5'}
        </p>
        <h2 className="font-serif text-2xl text-white leading-tight">
          {step === 'moods' && 'Which of these feels most like you?'}
          {step === 'dinner' && "You're going for dinner Saturday night."}
          {step === 'values' && 'When you get dressed, what matters most?'}
          {step === 'lifestyle' && 'What does a typical week look like?'}
          {step === 'dressingfor' && 'Who do you dress for?'}
        </h2>
        <p className="text-sm text-white/45 font-light mt-1.5">
          {step === 'moods' && 'Pick up to 3 that resonate — not what you own, what you\'re drawn to.'}
          {step === 'dinner' && 'How do you want to feel when you walk in?'}
          {step === 'values' && 'Be honest — there\'s no wrong answer.'}
          {step === 'lifestyle' && 'Pick up to 3 that describe your life most of the time.'}
          {step === 'dressingfor' && 'Be honest — the more specific you are, the better the advice.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-4 shrink-0">
        <div className="h-px bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#9B7B3A] transition-all duration-500"
            style={{ width: step === 'moods' ? '20%' : step === 'dinner' ? '40%' : step === 'values' ? '60%' : step === 'lifestyle' ? '80%' : '100%' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {step === 'moods' && (
          <div className="grid grid-cols-2 gap-3">
            {MOODS.map((mood) => {
              const selected = moodPicks.has(mood.id);
              return (
                <button
                  key={mood.id}
                  onClick={() => toggleMood(mood.id)}
                  className={`relative text-left p-4 border transition-all ${
                    selected ? 'border-[#9B7B3A] bg-[#9B7B3A]/10' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-[#9B7B3A] rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  {/* Colour palette dots */}
                  <div className="flex gap-1 mb-3">
                    {mood.palette.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className={`text-sm font-light leading-snug mb-1 ${selected ? 'text-white' : 'text-white/70'}`}>
                    {mood.label}
                  </p>
                  <p className="text-[10px] text-white/35 leading-relaxed">{mood.desc}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === 'dinner' && (
          <div className="space-y-3">
            {DINNER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDinnerFeeling(opt.label)}
                className={`w-full text-left p-4 border transition-all flex items-center justify-between ${
                  dinnerFeeling === opt.label ? 'border-[#9B7B3A] bg-[#9B7B3A]/10' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div>
                  <p className={`text-sm font-light ${dinnerFeeling === opt.label ? 'text-white' : 'text-white/70'}`}>{opt.label}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{opt.desc}</p>
                </div>
                {dinnerFeeling === opt.label && <Check size={14} className="text-[#9B7B3A] shrink-0 ml-3" />}
              </button>
            ))}
          </div>
        )}

        {step === 'values' && (
          <div className="space-y-3">
            {VALUE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDressedValue(opt.label)}
                className={`w-full text-left p-4 border transition-all flex items-center justify-between ${
                  dressedValue === opt.label ? 'border-[#9B7B3A] bg-[#9B7B3A]/10' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <p className={`text-sm font-light ${dressedValue === opt.label ? 'text-white' : 'text-white/70'}`}>{opt.label}</p>
                {dressedValue === opt.label && <Check size={14} className="text-[#9B7B3A] shrink-0 ml-3" />}
              </button>
            ))}
          </div>
        )}

        {step === 'lifestyle' && (
          <div className="grid grid-cols-2 gap-3">
            {LIFESTYLE_OPTIONS.map((opt) => {
              const selected = lifestyleMix.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleLifestyle(opt.id)}
                  className={`relative text-left p-4 border transition-all ${
                    selected ? 'border-[#9B7B3A] bg-[#9B7B3A]/10' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-[#9B7B3A] rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <p className={`text-sm font-light leading-snug mb-1 ${selected ? 'text-white' : 'text-white/70'}`}>{opt.label}</p>
                  <p className="text-[10px] text-white/35 leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === 'dressingfor' && (
          <div className="space-y-3">
            {DRESSING_FOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDressingFor(opt.label)}
                className={`w-full text-left p-4 border transition-all flex items-center justify-between ${
                  dressingFor === opt.label ? 'border-[#9B7B3A] bg-[#9B7B3A]/10' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div>
                  <p className={`text-sm font-light ${dressingFor === opt.label ? 'text-white' : 'text-white/70'}`}>{opt.label}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{opt.desc}</p>
                </div>
                {dressingFor === opt.label && <Check size={14} className="text-[#9B7B3A] shrink-0 ml-3" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 pt-4 shrink-0 border-t border-white/10">
        {step === 'moods' && (
          <button
            onClick={() => setStep('dinner')}
            disabled={moodPicks.size === 0}
            className="w-full bg-white text-[#1A1714] py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={13} />
          </button>
        )}
        {step === 'dinner' && (
          <button
            onClick={() => setStep('values')}
            disabled={!dinnerFeeling}
            className="w-full bg-white text-[#1A1714] py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={13} />
          </button>
        )}
        {step === 'values' && (
          <button
            onClick={() => setStep('lifestyle')}
            disabled={!dressedValue}
            className="w-full bg-white text-[#1A1714] py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={13} />
          </button>
        )}
        {step === 'lifestyle' && (
          <button
            onClick={() => setStep('dressingfor')}
            disabled={lifestyleMix.size === 0}
            className="w-full bg-white text-[#1A1714] py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={13} />
          </button>
        )}
        {step === 'dressingfor' && (
          <button
            onClick={handleDone}
            disabled={!dressingFor}
            className="w-full bg-[#9B7B3A] text-white py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-[#8A6C2E] transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Build my stylist profile <ArrowRight size={13} />
          </button>
        )}
        <button
          onClick={onDone}
          className="w-full mt-3 text-white/25 py-2 text-xs tracking-[0.15em] uppercase font-light hover:text-white/40 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
