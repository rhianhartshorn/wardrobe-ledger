'use client';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, MessageCircle, CalendarCheck, Check } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { FashionCurrencyItem } from '@/lib/fashion-currency-types';
import type { BodyProfile } from '@/lib/body-profile';

type AppTab = 'home' | 'closet' | 'outfit' | 'looks' | 'style';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeTab({
  items,
  fashionCurrency,
  bodyProfile,
  profileComplete,
  onGetDressed,
  onNavigate,
  onSetupBlueprint,
  onAddItem,
}: {
  items: WardrobeItem[];
  fashionCurrency?: FashionCurrencyItem[];
  bodyProfile?: BodyProfile;
  profileComplete: boolean;
  onGetDressed: (note: string) => void;
  onNavigate: (tab: AppTab) => void;
  onSetupBlueprint: () => void;
  onAddItem: () => void;
}) {
  const [note, setNote] = useState('');
  const [loggedToday, setLoggedToday] = useState(false);
  const [latestDirective, setLatestDirective] = useState<string | null>(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    fetch('/api/journal')
      .then((r) => r.json())
      .then((entries: Array<{ date: string }>) => {
        setLoggedToday(entries.some((e) => e.date === todayStr));
      })
      .catch(() => {});

    fetch('/api/stylist-chat')
      .then((r) => r.json())
      .then((data: { directives: Array<{ instruction: string; addedAt: string }> }) => {
        const sorted = [...(data.directives ?? [])].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
        if (sorted.length > 0) setLatestDirective(sorted[0].instruction);
      })
      .catch(() => {});
  }, []);

  const dormant = items
    .filter((i) => (i.wearCount ?? 0) === 0 && Date.now() - i.addedAt > NINETY_DAYS_MS)
    .slice(0, 2);

  const dated = (fashionCurrency ?? [])
    .filter((fc) => fc.status === 'dated')
    .map((fc) => ({ fc, item: items.find((i) => i.id === fc.itemId) }))
    .filter((x): x is { fc: FashionCurrencyItem; item: WardrobeItem } => Boolean(x.item))
    .slice(0, 2);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (items.length === 0) {
    return (
      <div className="space-y-5 pt-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{today}</p>
          <h2 className="font-serif text-2xl text-[#1A1714] mt-1">{greeting()}</h2>
          <p className="text-sm text-[#6B6058] font-light mt-1 leading-relaxed">
            Your wardrobe is empty. Start by photographing a few pieces — AI tags every item in seconds.
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="w-full border border-[#9B7B3A] text-[#9B7B3A] py-3 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#9B7B3A] hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={13} /> Add your first piece
        </button>
        {!profileComplete && (
          <button
            onClick={onSetupBlueprint}
            className="w-full border border-[#E5DDD0] bg-white p-4 flex items-center justify-between hover:border-[#9B7B3A] transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light">Recommended — 60 seconds</p>
              <p className="text-sm text-[#1A1714] font-light mt-0.5">Complete your Style Blueprint</p>
              <p className="text-xs text-[#A89F96] font-light mt-0.5">Unlocks personalised fits based on your body and colouring</p>
            </div>
            <ArrowRight size={14} className="text-[#9B7B3A] shrink-0 ml-3" />
          </button>
        )}
      </div>
    );
  }

  const hasSecondary = dormant.length > 0 || dated.length > 0 || latestDirective || !profileComplete;

  return (
    <div className="space-y-5 pt-2">

      {/* HERO — single dominant action */}
      <div className="bg-[#1A1714] px-5 pt-5 pb-6">
        <p className="text-[9px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">{today}</p>
        <h2 className="font-serif text-3xl text-white mt-1 mb-4">{greeting()}</h2>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Where are you headed today?"
          className="w-full bg-white/10 border border-white/20 px-3 py-2.5 text-sm font-light text-white placeholder:text-white/40 focus:outline-none focus:border-[#9B7B3A] mb-3"
          onKeyDown={(e) => { if (e.key === 'Enter') onGetDressed(note); }}
        />
        <button
          onClick={() => onGetDressed(note)}
          className="w-full bg-[#9B7B3A] text-white py-3 text-xs tracking-[0.2em] uppercase font-light hover:bg-[#8A6B2E] transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={13} /> Get dressed
        </button>
        {loggedToday ? (
          <p className="text-[10px] text-white/30 font-light mt-3 flex items-center gap-1.5">
            <Check size={10} /> Today&apos;s outfit is logged
          </p>
        ) : (
          <button
            onClick={() => onNavigate('looks')}
            className="text-[10px] text-white/40 font-light mt-3 hover:text-white/60 transition-colors flex items-center gap-1"
          >
            <CalendarCheck size={10} /> Log what you&apos;re already wearing
          </button>
        )}
      </div>

      {/* SECONDARY — quieter, smaller, subordinate */}
      {hasSecondary && (
        <div className="space-y-3">

          {/* Stylist directive */}
          {latestDirective && (
            <div className="flex gap-3 items-start px-1">
              <MessageCircle size={12} className="text-[#9B7B3A] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1A1714] font-light leading-snug">{latestDirective}</p>
                <button
                  onClick={() => onNavigate('style')}
                  className="text-[10px] text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors mt-1 flex items-center gap-1"
                >
                  Continue <ArrowRight size={9} />
                </button>
              </div>
            </div>
          )}

          {/* Blueprint nudge */}
          {!profileComplete && (
            <button
              onClick={onSetupBlueprint}
              className="w-full border border-[#9B7B3A]/25 bg-[#9B7B3A]/5 px-4 py-3 flex items-center justify-between hover:bg-[#9B7B3A]/10 transition-colors"
            >
              <p className="text-xs text-[#1A1714] font-light">Complete your Style Blueprint <span className="text-[#A89F96]">— 60 seconds</span></p>
              <ArrowRight size={12} className="text-[#9B7B3A] shrink-0 ml-3" />
            </button>
          )}

          {/* Dormant + dated — merged into one quiet list */}
          {(dormant.length > 0 || dated.length > 0) && (
            <div className="border border-[#E5DDD0] bg-white divide-y divide-[#F5F2EC]">
              {dormant.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1A1714] font-light truncate">{item.name}</p>
                    <p className="text-[10px] text-[#A89F96] font-light">Never worn</p>
                  </div>
                  <button onClick={() => onGetDressed(item.name)} className="text-[9px] uppercase tracking-widest text-[#9B7B3A] font-light hover:text-[#1A1714] shrink-0">
                    Wear it
                  </button>
                </div>
              ))}
              {dated.map(({ fc, item }) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1A1714] font-light truncate">{item.name}</p>
                    <p className="text-[10px] text-[#A89F96] font-light truncate">{fc.howNow ?? 'Dated — restyle or reconsider'}</p>
                  </div>
                  <span className="text-[8px] uppercase tracking-widest border border-[#A89F96]/30 text-[#A89F96] px-1.5 py-0.5 shrink-0">Dated</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
