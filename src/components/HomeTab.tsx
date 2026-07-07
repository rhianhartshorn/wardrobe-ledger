'use client';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, AlertCircle, MessageCircle, CalendarCheck, Check } from 'lucide-react';
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

  return (
    <div className="space-y-4 pt-2">
      {/* Date + greeting */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">{today}</p>
        <h2 className="font-serif text-2xl text-[#1A1714] mt-0.5">{greeting()}</h2>
      </div>

      {/* Get dressed today */}
      <div className="border border-[#E5DDD0] bg-white p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-1">Getting dressed</p>
        <p className="text-sm text-[#1A1714] font-light mb-3">
          Where are you headed? Your stylist will pull together the right look from your wardrobe.
        </p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Coffee meeting, dinner, job interview, casual day..."
          className="w-full border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] mb-3"
          onKeyDown={(e) => { if (e.key === 'Enter') onGetDressed(note); }}
        />
        <button
          onClick={() => onGetDressed(note)}
          className="w-full bg-[#1A1714] text-white py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={13} /> Get dressed today
        </button>
      </div>

      {/* Style blueprint nudge */}
      {!profileComplete && (
        <button
          onClick={onSetupBlueprint}
          className="w-full border border-[#9B7B3A]/30 bg-[#9B7B3A]/5 p-3 flex items-center justify-between hover:bg-[#9B7B3A]/10 transition-colors"
        >
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light">Recommended — 60 seconds</p>
            <p className="text-sm text-[#1A1714] font-light mt-0.5">Complete your Style Blueprint</p>
          </div>
          <ArrowRight size={14} className="text-[#9B7B3A] shrink-0 ml-3" />
        </button>
      )}

      {/* Latest stylist directive */}
      {latestDirective && (
        <div className="border-l-2 border-[#9B7B3A] pl-4 py-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mb-1.5 flex items-center gap-1.5">
            <MessageCircle size={10} /> Your stylist says
          </p>
          <p className="text-sm text-[#1A1714] font-light leading-relaxed">{latestDirective}</p>
          <button
            onClick={() => onNavigate('style')}
            className="text-[10px] text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors mt-1.5 flex items-center gap-1"
          >
            Continue the conversation <ArrowRight size={10} />
          </button>
        </div>
      )}

      {/* Dormant items */}
      {dormant.length > 0 && (
        <div className="border border-[#E5DDD0] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Worth revisiting</p>
          <div className="space-y-3">
            {dormant.map((item) => {
              const monthsAgo = Math.floor((Date.now() - item.addedAt) / (30 * 24 * 60 * 60 * 1000));
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1714] font-light truncate">{item.name}</p>
                    <p className="text-[10px] text-[#A89F96] font-light">
                      {monthsAgo > 0 ? `Added ${monthsAgo} month${monthsAgo !== 1 ? 's' : ''} ago — never worn` : 'Added recently — never worn'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onNavigate('closet')}
            className="text-[10px] text-[#9B7B3A] font-light hover:underline mt-3 flex items-center gap-1"
          >
            Review in closet <ArrowRight size={10} />
          </button>
        </div>
      )}

      {/* Dated items needing attention */}
      {dated.length > 0 && (
        <div className="border border-[#E5DDD0] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3 flex items-center gap-1.5">
            <AlertCircle size={11} className="text-amber-500" /> Needs attention
          </p>
          <div className="space-y-3">
            {dated.map(({ fc, item }) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-[#1A1714] font-light">{item.name}</p>
                    <span className="text-[8px] uppercase tracking-widest border border-[#A89F96]/40 text-[#A89F96] px-1.5 py-0.5 shrink-0">Dated</span>
                  </div>
                  {fc.howNow && (
                    <p className="text-[11px] text-[#6B6058] font-light mt-0.5 leading-snug">{fc.howNow}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log today's outfit */}
      <div className="border border-[#E5DDD0] bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck size={14} className={loggedToday ? 'text-green-500' : 'text-[#9B7B3A]'} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light">Outfit journal</p>
            <p className="text-sm text-[#1A1714] font-light mt-0.5">
              {loggedToday ? "Today's outfit is logged" : "What did you wear today?"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('looks')}
          className={`shrink-0 ml-3 px-3 py-2 text-[10px] uppercase tracking-wide font-light border transition-colors ${
            loggedToday
              ? 'border-green-200 text-green-600 flex items-center gap-1'
              : 'border-[#1A1714] text-[#1A1714] hover:bg-[#1A1714] hover:text-white'
          }`}
        >
          {loggedToday ? <><Check size={11} /> Logged</> : 'Log now →'}
        </button>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {([
          { tab: 'outfit' as const, label: 'Build outfit', sub: 'Weather + occasion' },
          { tab: 'style' as const, label: 'Style DNA', sub: 'Your archetype' },
          { tab: 'closet' as const, label: 'Your closet', sub: `${items.length} piece${items.length !== 1 ? 's' : ''}` },
        ]).map(({ tab, label, sub }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="border border-[#E5DDD0] bg-white p-3 text-left hover:border-[#9B7B3A] transition-colors"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#9B7B3A] font-light leading-tight">{label}</p>
            <p className="text-[9px] text-[#A89F96] font-light mt-1">{sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
