'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Loader2, Sparkles, Cloud, Sun, CloudRain, Wind, RefreshCw, Check,
} from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import { compressImage, colorDot } from './utils';
import { OCCASIONS } from './constants';

// ---- Weather ---------------------------------------------------------------

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
  return <Icon className="text-amber-600" size={28} />;
}

// ---- Silhouette sketch ------------------------------------------------------

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
    <svg viewBox="0 0 80 160" width="56" height="112" className="shrink-0">
      <circle cx="40" cy="14" r="10" fill="#e7e2d6" stroke="#d6cfc0" strokeWidth="1" />
      {dressColor ? (
        <path d="M26 26 L54 26 L60 118 L20 118 Z" fill={dressColor} />
      ) : (
        <>
          <rect x="22" y="26" width="36" height="46" rx="9" fill={topColor ?? '#e7e3d8'} />
          <rect x="24" y="72" width="32" height="48" rx="6" fill={bottomColor ?? '#e7e3d8'} />
        </>
      )}
      {outerColor && (
        <path
          d="M18 30 L30 26 L30 70 L18 74 Z M62 30 L50 26 L50 70 L62 74 Z"
          fill={outerColor}
          opacity="0.85"
        />
      )}
      <ellipse cx="30" cy="124" rx="8" ry="5" fill={shoeColor ?? '#a8a29e'} />
      <ellipse cx="50" cy="124" rx="8" ry="5" fill={shoeColor ?? '#a8a29e'} />
      {accColor && <circle cx="40" cy="24" r="3" fill={accColor} />}
    </svg>
  );
}

// ---- Outfit card ------------------------------------------------------------

type Outfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessorizing?: string[];
  weatherNote?: string;
};

function OutfitCard({ outfit, items }: { outfit: Outfit; items: WardrobeItem[] }) {
  const pieces = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 relative">
      <span className="absolute -top-2 left-4 bg-amber-700 text-white text-xs px-2 py-0.5 rounded-full">
        Look
      </span>
      <div className="flex gap-3 mt-1">
        <LookSketch pieces={pieces} />
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg leading-snug">{outfit.title}</h3>
          {outfit.styleReference && (
            <p className="text-xs text-amber-700 mt-0.5">Inspired by: {outfit.styleReference}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 overflow-x-auto">
        {pieces.map((p) => (
          <div key={p.id} className="shrink-0 w-16">
            <div className="aspect-square w-16 rounded overflow-hidden bg-stone-100 border border-stone-200">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-stone-500 truncate mt-1 w-16">{p.name}</p>
          </div>
        ))}
      </div>

      {outfit.rationale && (
        <p className="text-sm text-stone-700 mt-3">{outfit.rationale}</p>
      )}
      {outfit.accessorizing && outfit.accessorizing.length > 0 && (
        <ul className="mt-2 space-y-1">
          {outfit.accessorizing.map((tip, i) => (
            <li key={i} className="text-sm text-stone-600 flex gap-1.5">
              <Check size={14} className="text-amber-600 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      )}
      {outfit.weatherNote && (
        <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
          <Cloud size={12} /> {outfit.weatherNote}
        </p>
      )}
    </div>
  );
}

// ---- Tab -------------------------------------------------------------------

export default function OutfitTab({
  items,
  profileImageUrl,
  profileImageFilename,
  onProfileChange,
}: {
  items: WardrobeItem[];
  profileImageUrl: string | null;
  profileImageFilename: string | null;
  onProfileChange: (url: string | null, filename: string | null) => void;
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
  const triedAuto = useRef(false);

  const loadWeather = async (qs: string) => {
    setLocating(true); setWeatherErr('');
    try {
      const res = await fetch(`/api/weather?${qs}`);
      const data = await res.json() as Weather & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Weather fetch failed');
      setWeather(data);
      setNeedsCity(false);
    } catch (e) {
      setWeatherErr("Couldn't fetch live weather. Enter your city below.");
      setNeedsCity(true);
    } finally {
      setLocating(false);
    }
  };

  const detectLocation = () => {
    setLocating(true); setWeatherErr('');
    if (!navigator.geolocation) {
      setWeatherErr('Location unavailable. Enter your city below.');
      setNeedsCity(true); setLocating(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        setWeatherErr('Location access denied. Enter your city below.');
        setNeedsCity(true); setLocating(false);
      },
      { timeout: 6000 }
    );
  };

  useEffect(() => {
    if (!triedAuto.current) { triedAuto.current = true; detectLocation(); }
  }, []);

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
    } catch {
      setGenErr("Couldn't save that photo — try another.");
    }
    if (selfieRef.current) selfieRef.current.value = '';
  };

  const removeProfile = async () => {
    await fetch('/api/profile', { method: 'DELETE' });
    onProfileChange(null, null);
  };

  const handleGenerate = async () => {
    if (items.length === 0) { setGenErr('Add a few wardrobe items first.'); return; }
    if (!weather) { setGenErr('Get a weather reading first.'); return; }
    setGenerating(true); setGenErr(''); setOutfits(null);
    try {
      const res = await fetch('/api/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, weather, occasion, note, profileImageFilename }),
      });
      const data = await res.json() as { outfits?: Outfit[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setOutfits(data.outfits ?? []);
    } catch (e) {
      setGenErr(
        e instanceof Error ? e.message : "Couldn't put outfits together just now. Try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Profile photo */}
      <section className="bg-white border border-stone-200 rounded-lg p-4">
        <h2 className="text-xs uppercase tracking-wide text-stone-500 mb-1">Your photo</h2>
        <p className="text-xs text-stone-400 mb-2">
          Optional. Lets the stylist tailor notes to your coloring — stored only on this device.
        </p>
        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleSelfie}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            {profileImageUrl && (
              <img src={profileImageUrl} alt="you" className="w-full h-full object-cover" />
            )}
          </div>
          <button
            onClick={() => selfieRef.current?.click()}
            className="text-sm border border-stone-300 rounded px-3 py-1.5 hover:border-amber-600 hover:text-amber-700"
          >
            {profileImageUrl ? 'Replace photo' : 'Add a photo'}
          </button>
          {profileImageUrl && (
            <button onClick={removeProfile} className="text-sm text-stone-400 hover:text-red-700">
              Remove
            </button>
          )}
        </div>
      </section>

      {/* Weather */}
      <section className="bg-white border border-stone-200 rounded-lg p-4">
        <h2 className="text-xs uppercase tracking-wide text-stone-500 mb-2">Today's weather</h2>
        {locating ? (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 className="animate-spin" size={16} /> Checking live weather...
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WeatherIcon condition={weather.condition} />
              <div>
                <p className="font-serif text-xl">{Math.round(weather.tempF)}°F</p>
                <p className="text-xs text-stone-500">
                  {weather.locationName} · {weather.condition}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                needsCity
                  ? loadWeather(`city=${encodeURIComponent(city)}`)
                  : detectLocation()
              }
              className="text-stone-400 hover:text-amber-700"
              aria-label="Refresh weather"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">No reading yet.</p>
        )}
        {weatherErr && <p className="text-xs text-red-700 mt-2">{weatherErr}</p>}
        {needsCity && (
          <div className="flex gap-2 mt-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City, State or City, Country"
              className="flex-1 border border-stone-300 rounded px-2 py-1.5 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && city && loadWeather(`city=${encodeURIComponent(city)}`)}
            />
            <button
              onClick={() => loadWeather(`city=${encodeURIComponent(city)}`)}
              disabled={!city || locating}
              className="px-3 py-1.5 text-sm bg-stone-900 text-stone-50 rounded disabled:opacity-50"
            >
              Get weather
            </button>
          </div>
        )}
      </section>

      {/* Occasion */}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-stone-500 mb-2">Occasion</h2>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              className={`px-3 py-1.5 text-sm rounded-full border ${
                occasion === o
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-300 text-stone-600'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context (dress code, venue, vibe)..."
          className="w-full mt-2 border border-stone-300 rounded px-2 py-1.5 text-sm"
        />
      </section>

      <button
        onClick={handleGenerate}
        disabled={generating || items.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-stone-900 text-stone-50 rounded py-3 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
      >
        {generating ? (
          <><Loader2 className="animate-spin" size={16} /> Styling your looks...</>
        ) : (
          <><Sparkles size={16} /> Generate outfits</>
        )}
      </button>

      {genErr && <p className="text-sm text-red-700">{genErr}</p>}
      {items.length === 0 && (
        <p className="text-xs text-stone-400 text-center">Add a few pieces to your closet first.</p>
      )}

      {outfits && (
        <div className="space-y-4 pt-2">
          {outfits.map((o, idx) => (
            <OutfitCard key={idx} outfit={o} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}
