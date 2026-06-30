'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Cloud, Sun, CloudRain, Wind, RefreshCw, ChevronRight, Heart } from 'lucide-react';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';
import type { WardrobeItem } from '@/app/page';
import { compressImage, colorDot, slim } from './utils';
import { OCCASIONS } from './constants';
import type { BodyProfile } from '@/lib/body-profile';

type Weather = {
  locationName: string;
  tempF: number;
  condition: string;
  windMph: number;
  summary: string;
};

function WeatherIcon({ condition }: { condition: string }) {
  const c = condition.toLowerCase();
  const Icon =
    c.includes('rain') || c.includes('storm') || c.includes('drizzle') ? CloudRain
    : c.includes('cloud') || c.includes('overcast') ? Cloud
    : c.includes('wind') ? Wind
    : Sun;
  return <Icon className="text-[#9B7B3A]" size={24} />;
}

function LookSketch({ pieces }: { pieces: WardrobeItem[] }) {
  const colorFor = (cat: string) => {
    const item = pieces.find((p) => p.category === cat);
    return item ? colorDot(item.primaryColor) : null;
  };
  const dressColor = colorFor('Dress/One-piece');
  const topColor = colorFor('Top') ?? dressColor;
  const bottomColor = dressColor ? null : colorFor('Bottom');
  const outerColor = colorFor('Outerwear');
  const shoeColor = colorFor('Footwear');
  const accColor = colorFor('Accessory');

  return (
    <svg viewBox="0 0 80 160" width="48" height="96" className="shrink-0 opacity-90">
      <circle cx="40" cy="14" r="10" fill="#E8E2D9" stroke="#D6CFC0" strokeWidth="1" />
      {dressColor ? (
        <path d="M26 26 L54 26 L60 118 L20 118 Z" fill={dressColor} />
      ) : (
        <>
          <rect x="22" y="26" width="36" height="46" rx="6" fill={topColor ?? '#E8E2D9'} />
          <rect x="24" y="72" width="32" height="48" rx="4" fill={bottomColor ?? '#E8E2D9'} />
        </>
      )}
      {outerColor && (
        <path d="M18 30 L30 26 L30 70 L18 74 Z M62 30 L50 26 L50 70 L62 74 Z" fill={outerColor} opacity="0.85" />
      )}
      <ellipse cx="30" cy="124" rx="8" ry="4" fill={shoeColor ?? '#A89F96'} />
      <ellipse cx="50" cy="124" rx="8" ry="4" fill={shoeColor ?? '#A89F96'} />
      {accColor && <circle cx="40" cy="24" r="3" fill={accColor} />}
    </svg>
  );
}

type InspirationLink = { label: string; url: string };
type Outfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  weatherNote?: string;
  inspirationImageUrl?: string;
  inspirationLinks?: InspirationLink[];
};

function OutfitCard({ outfit, items, onLearnMore, onSave, saved, saving }: { outfit: Outfit; items: WardrobeItem[]; onLearnMore: () => void; onSave: () => void; saved: boolean; saving: boolean }) {
  const pieces = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));

  return (
    <div className="border border-[#E5DDD0] bg-white relative">
      <button
        onClick={onSave}
        disabled={saving || saved}
        title={saved ? 'Saved to your looks' : 'Save this look'}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          outfit.inspirationImageUrl ? 'bg-black/30 hover:bg-black/50' : 'bg-white/90 border border-[#E5DDD0] hover:border-[#9B7B3A]'
        }`}
      >
        <Heart size={14} className={saved ? 'fill-[#9B7B3A] text-[#9B7B3A]' : outfit.inspirationImageUrl ? 'text-white' : 'text-[#A89F96]'} />
      </button>
      {outfit.inspirationImageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F2EC]">
          <img
            src={outfit.inspirationImageUrl}
            alt={outfit.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Look</p>
            <h3 className="font-serif text-xl leading-snug text-white">{outfit.title}</h3>
            {outfit.styleReference && (
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-0.5 font-light">{outfit.styleReference}</p>
            )}
          </div>
        </div>
      )}
      {!outfit.inspirationImageUrl && (
        <div className="p-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Look</p>
          <div className="flex gap-3 mt-2">
            <LookSketch pieces={pieces} />
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl leading-snug text-[#1A1714]">{outfit.title}</h3>
              {outfit.styleReference && (
                <p className="text-[10px] uppercase tracking-widest text-[#9B7B3A] mt-1 font-light">{outfit.styleReference}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Piece thumbnails */}
      <div className="flex gap-px border-t border-[#E5DDD0]">
        {pieces.map((p) => (
          <div key={p.id} className="flex-1 min-w-0">
            <div className="aspect-square w-full overflow-hidden bg-[#F5F2EC]">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-end p-1"><p className="text-[9px] text-[#A89F96] leading-tight truncate">{p.name}</p></div>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {outfit.rationale && (
          <p className="text-sm text-[#1A1714] font-light leading-relaxed">{outfit.rationale}</p>
        )}
        {outfit.accessorizing && outfit.accessorizing.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1.5">Styling notes</p>
            <ul className="space-y-1">
              {outfit.accessorizing.map((tip, i) => (
                <li key={i} className="text-xs text-[#6B6058] font-light flex gap-2">
                  <span className="text-[#9B7B3A] shrink-0">—</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        {outfit.weatherNote && (
          <p className="text-[11px] text-[#A89F96] font-light flex items-center gap-1.5">
            <Cloud size={11} />{outfit.weatherNote}
          </p>
        )}
        <button onClick={onLearnMore} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light hover:text-[#1A1714] transition-colors">
          Deep dive into this look <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

export default function OutfitTab({
  items, profileImageUrl, profileImageFilename, onProfileChange, bodyProfile,
}: {
  items: WardrobeItem[];
  profileImageUrl: string | null;
  profileImageFilename: string | null;
  onProfileChange: (url: string | null, filename: string | null) => void;
  bodyProfile?: BodyProfile;
}) {
  const selfieRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherErr, setWeatherErr] = useState('');
  const [needsCity, setNeedsCity] = useState(false);
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState('');
  const [outfits, setOutfits] = useState<Outfit[] | null>(null);
  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const triedAuto = useRef(false);

  const saveLook = async (idx: number, o: Outfit) => {
    setSavingIdx(idx);
    try {
      await fetch('/api/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: o.title,
          itemIds: o.itemIds,
          styleReference: o.styleReference,
          rationale: o.rationale,
          accessorizing: o.accessorizing,
        }),
      });
      setSavedIdx((prev) => new Set(prev).add(idx));
    } catch { /* ignore */ }
    finally { setSavingIdx(null); }
  };

  const loadWeather = async (qs: string) => {
    setLocating(true); setWeatherErr('');
    try {
      const res = await fetch(`/api/weather?${qs}`);
      const data = await res.json() as Weather & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Weather fetch failed');
      setWeather(data); setNeedsCity(false);
    } catch {
      setWeatherErr("Couldn't get live weather — enter your city below.");
      setNeedsCity(true);
    } finally {
      setLocating(false);
    }
  };

  const detectLocation = () => {
    setLocating(true); setWeatherErr('');
    if (!navigator.geolocation) {
      setWeatherErr('Location not available — enter your city below.');
      setNeedsCity(true); setLocating(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => { setWeatherErr('Location access denied — enter your city below.'); setNeedsCity(true); setLocating(false); },
      { timeout: 8000 }
    );
  };

  useEffect(() => { if (!triedAuto.current) { triedAuto.current = true; detectLocation(); } }, []);

  const handleSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 400, 0.65);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json() as { imageUrl: string; imageFilename: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      onProfileChange(data.imageUrl, data.imageFilename);
    } catch { setGenErr("Couldn't save that photo — try another."); }
    if (selfieRef.current) selfieRef.current.value = '';
  };

  const removeProfile = async () => { await fetch('/api/profile', { method: 'DELETE' }); onProfileChange(null, null); };

  const handleGenerate = async () => {
    if (items.length === 0) { setGenErr('Add a few wardrobe items first.'); return; }
    if (!weather) { setGenErr('Get a weather reading first.'); return; }
    setGenerating(true); setGenErr(''); setOutfits(null); setSavedIdx(new Set());
    try {
      const res = await fetch('/api/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slim(items), weather, occasion, note, profileImageFilename, bodyProfile }),
      });
      const data = await res.json() as { outfits?: Outfit[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setOutfits(data.outfits ?? []);
    } catch (e) { setGenErr(e instanceof Error ? e.message : "Couldn't generate outfits. Try again."); }
    finally { setGenerating(false); }
  };

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="border border-[#E5DDD0] bg-white p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Your photo <span className="text-[#A89F96]">— optional</span></p>
        <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={handleSelfie} className="hidden" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0] shrink-0">
            {profileImageUrl && <img src={profileImageUrl} alt="you" className="w-full h-full object-cover" />}
          </div>
          <button onClick={() => selfieRef.current?.click()} className="text-xs border border-[#E5DDD0] px-3 py-1.5 text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors font-light tracking-wide">
            {profileImageUrl ? 'Replace' : 'Add photo'}
          </button>
          {profileImageUrl && <button onClick={removeProfile} className="text-xs text-[#A89F96] hover:text-red-600 transition-colors font-light">Remove</button>}
        </div>
      </div>

      {/* Weather */}
      <div className="border border-[#E5DDD0] bg-white p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Today's weather</p>
        {locating ? (
          <div className="flex items-center gap-2 text-sm text-[#A89F96] font-light">
            <Loader2 className="animate-spin" size={14} /> Detecting location...
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WeatherIcon condition={weather.condition} />
              <div>
                <p className="font-serif text-2xl text-[#1A1714]">{Math.round(weather.tempF)}°F</p>
                <p className="text-xs text-[#A89F96] font-light">{weather.locationName} · {weather.condition}</p>
              </div>
            </div>
            <button onClick={() => needsCity ? loadWeather(`city=${encodeURIComponent(city)}`) : detectLocation()} className="text-[#A89F96] hover:text-[#9B7B3A] transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        ) : (
          <button onClick={detectLocation} className="text-xs text-[#9B7B3A] font-light tracking-wide hover:underline underline-offset-2">
            Detect my location
          </button>
        )}
        {weatherErr && <p className="text-xs text-[#A89F96] mt-2 font-light">{weatherErr}</p>}
        {needsCity && (
          <div className="flex gap-2 mt-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City, Country"
              className="flex-1 border border-[#E5DDD0] px-3 py-1.5 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
              onKeyDown={(e) => e.key === 'Enter' && city && loadWeather(`city=${encodeURIComponent(city)}`)}
            />
            <button
              onClick={() => loadWeather(`city=${encodeURIComponent(city)}`)}
              disabled={!city || locating}
              className="px-3 py-1.5 text-xs bg-[#1A1714] text-white font-light tracking-wide disabled:opacity-40"
            >
              Get weather
            </button>
          </div>
        )}
      </div>

      {/* Occasion */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">Occasion</p>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              className={`px-3 py-1.5 text-xs font-light tracking-wide border transition-colors ${
                occasion === o
                  ? 'bg-[#1A1714] text-white border-[#1A1714]'
                  : 'border-[#E5DDD0] text-[#6B6058] hover:border-[#9B7B3A]'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context — dress code, venue, vibe..."
          className="w-full mt-2 border border-[#E5DDD0] px-3 py-2 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A]"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || items.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-[#1A1714] text-white py-3.5 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
      >
        {generating ? (
          <><Loader2 className="animate-spin" size={14} /> Styling your looks...</>
        ) : (
          <><Sparkles size={14} /> Generate outfits</>
        )}
      </button>

      {genErr && <p className="text-sm text-red-700 font-light">{genErr}</p>}
      {items.length === 0 && <p className="text-xs text-[#A89F96] text-center font-light">Add a few pieces to your closet first.</p>}

      {outfits && (
        <div className="space-y-4 pt-1">
          {outfits.map((o, idx) => (
            <OutfitCard
              key={idx} outfit={o} items={items}
              saved={savedIdx.has(idx)} saving={savingIdx === idx}
              onSave={() => saveLook(idx, o)}
              onLearnMore={() => {
                const pieces = o.itemIds.map((id) => items.find((i) => i.id === id)).filter((x): x is WardrobeItem => Boolean(x));
                setLearnMore({ type: 'outfit', title: o.title, context: `Aesthetic: ${o.styleReference ?? ''}. ${o.rationale ?? ''}. Pieces: ${pieces.map((p) => p.name).join(', ')}`, relevantItems: pieces, onClose: () => setLearnMore(null) });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
