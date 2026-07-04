'use client';
import { useState } from 'react';
import { Shirt, Sparkles, Gem, ArrowRight, X } from 'lucide-react';

type Props = {
  onDone: () => void;
  onSetupBlueprint: () => void;
};

const SCREENS = [
  {
    eyebrow: 'Welcome',
    headline: 'Your AI-powered wardrobe',
    body: 'Photograph your clothes — AI tags every piece instantly. Then get weather-matched outfit ideas, discover your style identity, and finally see what you actually wear.',
    icon: Shirt,
    cta: 'How it works',
  },
  {
    eyebrow: 'Everything runs on your wardrobe',
    headline: 'Add pieces, unlock features',
    body: 'Outfit suggestions, style analysis, and outfit combinations all pull from your actual clothes. The more you add, the sharper and more personal the recommendations get.',
    icon: Sparkles,
    cta: 'One more thing',
  },
  {
    eyebrow: 'Personalise in 60 seconds',
    headline: 'Set your Style Blueprint',
    body: 'Your height, body shape, and skin undertone unlock recommendations built specifically for you — not generic advice. It makes a real difference.',
    icon: Gem,
    cta: null, // custom buttons on last screen
  },
];

export default function OnboardingCarousel({ onDone, onSetupBlueprint }: Props) {
  const [screen, setScreen] = useState(0);

  const next = () => {
    if (screen < SCREENS.length - 1) setScreen((s) => s + 1);
    else onDone();
  };

  const { eyebrow, headline, body, icon: Icon, cta } = SCREENS[screen];
  const isLast = screen === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-5">
        <button
          onClick={onDone}
          className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors text-xs font-light uppercase tracking-[0.15em]"
        >
          Skip <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-8 max-w-sm mx-auto w-full">
        <div className="mb-8">
          <div className="w-12 h-12 border border-[#9B7B3A]/40 flex items-center justify-center mb-6">
            <Icon size={22} className="text-[#9B7B3A]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light mb-3">{eyebrow}</p>
          <h2 className="font-serif text-3xl text-white leading-tight mb-4">{headline}</h2>
          <p className="text-sm text-white/55 font-light leading-relaxed">{body}</p>
        </div>

        {/* Feature chips — screen 1 only */}
        {screen === 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {['AI tagging', 'Daily outfits', 'Style DNA'].map((f) => (
              <div key={f} className="border border-white/10 px-2 py-2 text-center">
                <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 font-light leading-tight">{f}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab overview — screen 2 only */}
        {screen === 1 && (
          <div className="space-y-2 mb-8">
            {[
              { tab: 'Closet', desc: 'Your catalogue — search, filter, track wears' },
              { tab: 'Outfit', desc: 'Daily look matched to today\'s weather' },
              { tab: 'Looks', desc: 'Saved looks, journal, AI combinations' },
              { tab: 'Style', desc: 'Your style DNA and wardrobe insights' },
            ].map(({ tab, desc }) => (
              <div key={tab} className="flex items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B7B3A] font-light w-12 shrink-0">{tab}</span>
                <span className="text-xs text-white/40 font-light">{desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        {isLast ? (
          <div className="space-y-3">
            <button
              onClick={() => { onDone(); onSetupBlueprint(); }}
              className="w-full bg-[#9B7B3A] text-white py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-[#8A6C2E] transition-colors flex items-center justify-center gap-2"
            >
              Set up Blueprint now <ArrowRight size={13} />
            </button>
            <button
              onClick={onDone}
              className="w-full border border-white/15 text-white/40 py-3 text-xs tracking-[0.15em] uppercase font-light hover:text-white/60 hover:border-white/25 transition-colors"
            >
              I'll do it later
            </button>
          </div>
        ) : (
          <button
            onClick={next}
            className="w-full bg-white text-[#1A1714] py-3.5 text-xs tracking-[0.2em] uppercase font-light hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            {cta} <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 pb-10">
        {SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => setScreen(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === screen ? 'bg-[#9B7B3A]' : 'bg-white/20'}`}
            aria-label={`Screen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
