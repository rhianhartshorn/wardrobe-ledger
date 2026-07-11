'use client';
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, MapPin, Heart, ChevronRight } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { BodyProfile } from '@/lib/body-profile';
import { slim } from './utils';

type Weather = { locationName: string; tempF: number; condition: string; windMph: number; summary: string };

type TodayOutfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessories?: string;
  stylingNote?: string;
};

type TodayResponse = { greeting: string; primary?: TodayOutfit; alternative?: TodayOutfit };

function OutfitCard({ outfit, items, label }: { outfit: TodayOutfit; items: WardrobeItem[]; label: string }) {
  const pieces = outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (pieces.length === 0) return null;

  const save = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await fetch('/api/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: outfit.title, itemIds: outfit.itemIds, occasion: '', styleReference: outfit.styleReference ?? '' }),
      });
      setSaved(true);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className="px-3 pt-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-2">{label}</p>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto px-3">
        {pieces.map((p) => (
          <div key={p.id} className="w-14 h-14 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
            {p.imageUrl
              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-end p-0.5"><p className="text-[7px] text-[#A89F96] truncate">{p.name}</p></div>}
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="font-serif text-lg text-[#1A1714] leading-snug">{outfit.title}</p>
        {outfit.styleReference && (
          <p className="text-[9px] uppercase tracking-widest text-[#9B7B3A] font-light mt-0.5">{outfit.styleReference}</p>
        )}
        {outfit.rationale && (
          <p className="text-xs text-[#6B6058] font-light leading-snug mt-1.5">{outfit.rationale}</p>
        )}
        {outfit.stylingNote && (
          <p className="text-[10px] text-[#9B7B3A] font-light leading-snug mt-1.5 border-l-2 border-[#E5DDD0] pl-2">{outfit.stylingNote}</p>
        )}
        {outfit.accessories && (
          <p className="text-[9px] text-[#A89F96] font-light leading-snug mt-1.5 border-l-2 border-[#E5DDD0] pl-2 italic">{outfit.accessories}</p>
        )}
        <button
          onClick={save}
          disabled={saved || saving}
          className={`flex items-center gap-1 text-[9px] uppercase tracking-widest font-light transition-colors mt-2.5 ${saved ? 'text-[#9B7B3A]' : 'text-[#A89F96] hover:text-[#9B7B3A]'}`}
        >
          <Heart size={10} fill={saved ? '#9B7B3A' : 'none'} stroke={saved ? '#9B7B3A' : 'currentColor'} />
          {saved ? 'Saved' : 'Save look'}
        </button>
      </div>
    </div>
  );
}

export default function TodayTab({ items, bodyProfile, onGoToStylist }: { items: WardrobeItem[]; bodyProfile?: BodyProfile; onGoToStylist: () => void }) {
  const [brief, setBrief] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [city, setCity] = useState('');

  const loadWeather = async (qs: string): Promise<Weather | null> => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?${qs}`);
      const data = await res.json() as Weather & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'failed');
      setWeather(data); setShowCityInput(false);
      return data;
    } catch {
      setShowCityInput(true);
      return null;
    } finally { setWeatherLoading(false); }
  };

  const detectWeather = (): Promise<Weather | null> => {
    return new Promise((resolve) => {
      setWeatherLoading(true);
      if (!navigator.geolocation) { setShowCityInput(true); setWeatherLoading(false); resolve(null); return; }
      const fallback = setTimeout(() => { setShowCityInput(true); setWeatherLoading(false); resolve(null); }, 10000);
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(fallback); loadWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`).then(resolve); },
        () => { clearTimeout(fallback); setShowCityInput(true); setWeatherLoading(false); resolve(null); },
        { timeout: 8000, maximumAge: 300000 }
      );
    });
  };

  const runBrief = async (w?: Weather | null) => {
    if (items.length < 3) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/today-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), bodyProfile, weather: (w ?? weather) ?? undefined }),
      });
      const data = await res.json() as TodayResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not build today\'s brief.');
      setBrief(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not build today\'s brief.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (items.length < 3) return;
    detectWeather().then((w) => runBrief(w));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length < 3) {
    return (
      <div className="border border-[#E5DDD0] bg-white p-6 text-center">
        <p className="font-serif text-xl text-[#1A1714]">Today</p>
        <p className="text-sm text-[#6B6058] font-light mt-2">Add at least 3 pieces to your wardrobe and your team will start preparing a look for you each day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="font-serif text-2xl mt-0.5 text-[#1A1714]">Today</h2>
        </div>
        <button
          onClick={() => runBrief()}
          disabled={loading}
          className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#6B6058] hover:text-[#9B7B3A] transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Refresh
        </button>
      </div>

      {weather ? (
        <p className="text-xs text-[#6B6058] font-light">{weather.locationName} · {weather.tempF}°F · {weather.condition}</p>
      ) : (
        <button
          onClick={() => detectWeather().then((w) => w && runBrief(w))}
          disabled={weatherLoading}
          className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#A89F96] hover:text-[#9B7B3A] transition-colors"
        >
          {weatherLoading ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
          {weatherLoading ? 'Getting weather...' : 'Add weather for a sharper brief'}
        </button>
      )}

      {showCityInput && !weather && (
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city"
            onKeyDown={(e) => { if (e.key === 'Enter' && city.trim()) loadWeather(`city=${encodeURIComponent(city.trim())}`).then((w) => w && runBrief(w)); }}
            className="flex-1 border border-[#E5DDD0] px-3 py-1.5 text-xs font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
          />
          <button
            onClick={() => loadWeather(`city=${encodeURIComponent(city.trim())}`).then((w) => w && runBrief(w))}
            disabled={!city.trim()}
            className="border border-[#E5DDD0] px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors disabled:opacity-40"
          >
            Go
          </button>
        </div>
      )}

      {loading && !brief && (
        <div className="flex items-center gap-2 text-xs text-[#A89F96] font-light py-8 justify-center">
          <Loader2 size={14} className="animate-spin" /> Your team is preparing today's look...
        </div>
      )}

      {err && <p className="text-sm text-red-700">{err}</p>}

      {brief && (
        <>
          <div className="border border-[#E5DDD0] bg-[#F5F2EC] px-4 py-3">
            <p className="text-sm text-[#1A1714] font-light leading-relaxed">{brief.greeting}</p>
          </div>

          {brief.primary && <OutfitCard outfit={brief.primary} items={items} label="Today" />}
          {brief.alternative && <OutfitCard outfit={brief.alternative} items={items} label="Or instead" />}

          {!brief.primary && !brief.alternative && (
            <p className="text-sm text-[#6B6058] font-light">The team couldn't resolve a look that passed final review today — try refreshing, or ask the stylist directly.</p>
          )}
        </>
      )}

      <button
        onClick={onGoToStylist}
        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light hover:text-[#1A1714] transition-colors"
      >
        Ask the stylist something else <ChevronRight size={11} />
      </button>
    </div>
  );
}
