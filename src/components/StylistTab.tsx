'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, Heart, Sparkles, Download, X, Mic, MicOff, ChevronRight, MapPin, Cloud } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { BodyProfile } from '@/lib/body-profile';
import type { StyleDirective } from '@/app/api/stylist-chat/route';
import { slim, buildWardrobeGrid } from './utils';
import LearnMorePage, { type LearnMoreProps } from './LearnMorePage';

type Weather = { locationName: string; tempF: number; condition: string; windMph: number; summary: string };

const PROMPT_SUGGESTIONS = [
  'What should I wear today?',
  'I have a dinner tonight — what works?',
  'Why do I always reach for the same things?',
  'What am I missing in my wardrobe?',
  'Help me look more intentional',
  'What should I stop buying?',
];

type ChatOutfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessories?: string;
  stylingNote?: string;
};

type PackingPiece = { itemId: string; role: string };
type GapItem = { description: string; why: string; priority: 'high' | 'medium' | 'low' };

type Block =
  | { type: 'text'; label?: string; content: string }
  | { type: 'outfits'; label?: string; outfits: ChatOutfit[] }
  | { type: 'packingList'; label?: string; logic: string; outfitCount: number; pieces: PackingPiece[] }
  | { type: 'focus'; label?: string; focusItemId: string; analysis: string; styling: string; pairings: Array<{ itemIds: string[]; note: string }> }
  | { type: 'verdict'; label?: string; verdict: 'yes' | 'no' | 'with-modifications'; reasoning: string; modification?: string; alternativeItemIds?: string[] }
  | { type: 'principles'; label?: string; items: string[] }
  | { type: 'gaps'; label?: string; gaps: GapItem[]; unlockPiece?: string }
  | { type: 'itemList'; label: string; itemIds: string[] };

type Message = {
  role: 'user' | 'stylist';
  text: string;
  blocks?: Block[];
  consultedSpecialists?: string[];
};

function OutfitMini({ outfit, items, hasProfilePhoto, onLearnMore }: { outfit: ChatOutfit; items: WardrobeItem[]; hasProfilePhoto: boolean; onLearnMore: (props: LearnMoreProps) => void }) {
  const pieces = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));
  const [showWhy, setShowWhy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnErr, setTryOnErr] = useState('');
  const [showTryOn, setShowTryOn] = useState(false);

  const save = async () => {
    if (saved || saving || pieces.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: outfit.title,
          itemIds: outfit.itemIds,
          occasion: '',
          styleReference: outfit.styleReference ?? '',
        }),
      });
      setSaved(true);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const getTryOn = async () => {
    if (tryOnUrl) { setShowTryOn(true); return; }
    setTryOnLoading(true); setTryOnErr('');
    try {
      const slimItems = pieces.map((p) => ({ id: p.id, name: p.name, category: p.category, primaryColor: p.primaryColor }));
      const res = await fetch('/api/outfit-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slimItems }),
      });
      const data = await res.json() as { outputUrl?: string; error?: string };
      if (!res.ok) {
        const msg = data.error ?? 'Failed';
        if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing')) {
          throw new Error('Try-on needs Google AI billing enabled on the API key.');
        }
        throw new Error(msg);
      }
      setTryOnUrl(data.outputUrl ?? null);
      setShowTryOn(true);
    } catch (e) { setTryOnErr(e instanceof Error ? e.message : 'Could not generate try-on'); }
    finally { setTryOnLoading(false); }
  };

  if (pieces.length === 0) return null;

  return (
    <>
    <div className="border border-[#E5DDD0] bg-white">
      <div className="flex items-center gap-1 overflow-x-auto p-2">
        {pieces.map((p) => (
          <div key={p.id} className="w-10 h-10 shrink-0 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
            {p.imageUrl
              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-end p-0.5"><p className="text-[7px] text-[#A89F96] truncate">{p.name}</p></div>}
          </div>
        ))}
      </div>
      <div className="px-3 pb-3">
        <p className="font-serif text-sm text-[#1A1714] leading-snug">{outfit.title}</p>
        {outfit.styleReference && (
          <p className="text-[9px] uppercase tracking-widest text-[#9B7B3A] font-light mt-0.5">{outfit.styleReference}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {outfit.rationale && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="text-[9px] uppercase tracking-widest text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors"
            >
              {showWhy ? 'Less' : 'Why this works'}
            </button>
          )}
          <button
            onClick={save}
            disabled={saved || saving}
            className={`ml-auto flex items-center gap-1 text-[9px] uppercase tracking-widest font-light transition-colors ${saved ? 'text-[#9B7B3A]' : 'text-[#A89F96] hover:text-[#9B7B3A]'}`}
          >
            <Heart size={10} fill={saved ? '#9B7B3A' : 'none'} stroke={saved ? '#9B7B3A' : 'currentColor'} />
            {saved ? 'Saved' : 'Save look'}
          </button>
        </div>
        {showWhy && outfit.rationale && (
          <p className="text-[11px] text-[#6B6058] font-light leading-snug mt-1.5 border-l-2 border-[#E5DDD0] pl-2">{outfit.rationale}</p>
        )}
        {outfit.stylingNote && (
          <p className="text-[10px] text-[#9B7B3A] font-light leading-snug mt-1.5 border-l-2 border-[#E5DDD0] pl-2">{outfit.stylingNote}</p>
        )}
        {outfit.accessories && (
          <p className="text-[9px] text-[#A89F96] font-light leading-snug mt-1.5 border-l-2 border-[#E5DDD0] pl-2 italic">{outfit.accessories}</p>
        )}
        <button
          onClick={() => onLearnMore({ type: 'aesthetic', title: outfit.title, context: `Style: ${outfit.styleReference ?? ''}. ${outfit.rationale ?? ''}. Items: ${pieces.map((p) => p.name).join(', ')}`, relevantItems: pieces, onClose: () => {} })}
          className="flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-[#9B7B3A] font-light hover:text-[#1A1714] transition-colors mt-2"
        >
          Deep dive <ChevronRight size={10} />
        </button>
        {hasProfilePhoto && (
          <div className="pt-2 mt-1 border-t border-[#F5F2EC]">
            <button
              onClick={getTryOn}
              disabled={tryOnLoading}
              className="w-full flex items-center justify-center gap-1.5 border border-[#E5DDD0] py-1.5 text-[9px] uppercase tracking-[0.12em] text-[#6B6058] font-light hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors disabled:opacity-40"
            >
              {tryOnLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              Try on full look
            </button>
            {tryOnErr && <p className="text-[10px] text-[#A89F96] font-light mt-1.5 leading-snug">{tryOnErr}</p>}
          </div>
        )}
      </div>
    </div>

    {showTryOn && tryOnUrl && (
      <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10">
          <p className="flex-1 text-sm text-white font-light">Full outfit try-on</p>
          <a href={tryOnUrl} download="outfit-tryon.jpg" className="text-white/40 hover:text-white transition-colors" aria-label="Download">
            <Download size={16} />
          </a>
          <button onClick={() => setShowTryOn(false)} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <img src={tryOnUrl} alt="You in this outfit" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="px-4 pb-6 pt-3 border-t border-white/10">
          <button
            onClick={() => { save(); setShowTryOn(false); }}
            disabled={saving || saved}
            className="w-full py-3 text-xs tracking-[0.15em] uppercase font-light flex items-center justify-center gap-2 transition-colors disabled:opacity-40 border border-white/30 text-white hover:bg-white/10"
          >
            <Heart size={13} className={saved ? 'fill-[#9B7B3A] text-[#9B7B3A]' : 'text-white'} />
            {saved ? 'Saved to your looks' : 'Save this look'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}

function BlockRenderer({ block, items, hasProfilePhoto, onLearnMore }: {
  block: Block;
  items: WardrobeItem[];
  hasProfilePhoto: boolean;
  onLearnMore: (props: LearnMoreProps) => void;
}) {
  const label = block.label ? (
    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light mb-2">{block.label}</p>
  ) : null;

  if (block.type === 'text') return (
    <div className="border border-[#E5DDD0] bg-white px-3 py-2.5">
      {label}
      <p className="text-[11px] text-[#6B6058] font-light leading-relaxed">{block.content}</p>
    </div>
  );

  if (block.type === 'outfits') return (
    <div className="space-y-2">
      {label && <div className="px-1">{label}</div>}
      {block.outfits.map((outfit, i) => (
        <OutfitMini key={i} outfit={outfit} items={items} hasProfilePhoto={hasProfilePhoto} onLearnMore={onLearnMore} />
      ))}
    </div>
  );

  if (block.type === 'packingList') return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className="px-3 py-2 border-b border-[#E5DDD0] flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light">{block.label ?? 'Packing list'}</p>
        <p className="text-[10px] text-[#A89F96] font-light">{block.outfitCount}+ outfits</p>
      </div>
      <p className="px-3 pt-2 pb-1 text-[11px] text-[#6B6058] font-light leading-relaxed">{block.logic}</p>
      <div className="px-3 pb-3 space-y-1.5 mt-1">
        {block.pieces.map((p, k) => {
          const item = items.find((i) => i.id === p.itemId);
          if (!item) return null;
          return (
            <div key={k} className="flex items-center gap-2.5">
              {item.imageUrl
                ? <img src={item.imageUrl} alt="" className="w-8 h-8 object-cover shrink-0 border border-[#E5DDD0]" />
                : <div className="w-8 h-8 shrink-0 bg-[#F5F2EC] border border-[#E5DDD0]" />}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#1A1714] font-light truncate">{item.name}</p>
                <p className="text-[10px] text-[#A89F96] font-light truncate">{p.role}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (block.type === 'focus') {
    const focusItem = items.find((i) => i.id === block.focusItemId);
    return (
      <div className="border border-[#E5DDD0] bg-white">
        {focusItem && (
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#E5DDD0]">
            {focusItem.imageUrl && <img src={focusItem.imageUrl} alt="" className="w-10 h-10 object-cover border border-[#E5DDD0] shrink-0" />}
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light">{block.label ?? 'Focus piece'}</p>
              <p className="text-xs text-[#1A1714] font-light">{focusItem.name}</p>
            </div>
          </div>
        )}
        <div className="px-3 py-2 space-y-1 border-b border-[#E5DDD0]">
          <p className="text-[11px] text-[#6B6058] font-light leading-relaxed">{block.analysis}</p>
          {block.styling && <p className="text-[11px] text-[#9B7B3A] font-light italic">{block.styling}</p>}
        </div>
        {block.pairings.length > 0 && (
          <div className="px-3 py-2.5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light">Pairings</p>
            {block.pairings.map((p, k) => (
              <OutfitMini key={k} outfit={{ title: p.note, itemIds: p.itemIds }} items={items} hasProfilePhoto={hasProfilePhoto} onLearnMore={onLearnMore} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'verdict') return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className={`px-3 py-2.5 border-b border-[#E5DDD0] ${block.verdict === 'yes' ? 'bg-green-50' : block.verdict === 'no' ? 'bg-red-50' : 'bg-amber-50'}`}>
        <span className={`text-sm font-light ${block.verdict === 'yes' ? 'text-green-700' : block.verdict === 'no' ? 'text-red-700' : 'text-amber-700'}`}>
          {block.verdict === 'yes' ? '✓ Yes' : block.verdict === 'no' ? '✗ No' : '~ With modifications'}
        </span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-[11px] text-[#6B6058] font-light leading-relaxed">{block.reasoning}</p>
        {block.modification && <p className="text-[11px] text-[#9B7B3A] font-light">{block.modification}</p>}
      </div>
      {block.alternativeItemIds?.length && (
        <div className="px-3 pb-3 border-t border-[#E5DDD0] pt-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light mb-2">Alternative</p>
          <OutfitMini outfit={{ title: 'Alternative look', itemIds: block.alternativeItemIds }} items={items} hasProfilePhoto={hasProfilePhoto} onLearnMore={onLearnMore} />
        </div>
      )}
    </div>
  );

  if (block.type === 'principles') return (
    <div className="border border-[#E5DDD0] bg-white px-3 py-2.5 space-y-1.5">
      {label ?? <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light mb-2">Principles</p>}
      {block.items.map((p, k) => (
        <p key={k} className="text-[11px] text-[#6B6058] font-light leading-relaxed">— {p}</p>
      ))}
    </div>
  );

  if (block.type === 'gaps') return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className="px-3 py-2 border-b border-[#E5DDD0]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light">{block.label ?? "What's missing"}</p>
      </div>
      <div className="divide-y divide-[#F0EBE4]">
        {block.gaps.map((g, k) => (
          <div key={k} className="px-3 py-2.5 flex items-start gap-2">
            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${g.priority === 'high' ? 'bg-red-400' : g.priority === 'medium' ? 'bg-amber-400' : 'bg-[#D6CFC0]'}`} />
            <div>
              <p className="text-[11px] text-[#1A1714] font-light">{g.description}</p>
              <p className="text-[10px] text-[#A89F96] font-light mt-0.5">{g.why}</p>
            </div>
          </div>
        ))}
      </div>
      {block.unlockPiece && (
        <div className="px-3 py-2.5 border-t border-[#E5DDD0] bg-[#F9F7F4]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light">Best single purchase</p>
          <p className="text-[11px] text-[#6B6058] font-light mt-1 leading-relaxed">{block.unlockPiece}</p>
        </div>
      )}
    </div>
  );

  if (block.type === 'itemList') return (
    <div className="border border-[#E5DDD0] bg-white px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B7B3A] font-light mb-2">{block.label}</p>
      <div className="space-y-1.5">
        {block.itemIds.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return (
            <div key={id} className="flex items-center gap-2.5">
              {item.imageUrl
                ? <img src={item.imageUrl} alt="" className="w-8 h-8 object-cover shrink-0 border border-[#E5DDD0]" />
                : <div className="w-8 h-8 shrink-0 bg-[#F5F2EC] border border-[#E5DDD0]" />}
              <p className="text-[11px] text-[#1A1714] font-light truncate">{item.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Unknown block type — render as text if possible
  return null;
}

export default function StylistTab({
  items,
  bodyProfile,
  profileImageUrl,
  profileImageFilename,
  onProfileChange,
}: {
  items: WardrobeItem[];
  bodyProfile?: BodyProfile;
  profileImageUrl: string | null;
  profileImageFilename: string | null;
  onProfileChange: (url: string | null, filename: string | null) => void;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directives, setDirectives] = useState<StyleDirective[]>([]);
  const [showDirectives, setShowDirectives] = useState(false);
  const [err, setErr] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [listening, setListening] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherErr, setWeatherErr] = useState('');
  const [city, setCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [learnMore, setLearnMore] = useState<LearnMoreProps | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const loadWeather = async (qs: string) => {
    setWeatherLoading(true); setWeatherErr('');
    try {
      const res = await fetch(`/api/weather?${qs}`);
      const data = await res.json() as Weather & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Weather fetch failed');
      setWeather(data); setShowCityInput(false);
    } catch {
      setWeatherErr("Couldn't get weather — enter your city.");
      setShowCityInput(true);
    } finally { setWeatherLoading(false); }
  };

  const detectWeather = () => {
    setWeatherLoading(true); setWeatherErr('');
    if (!navigator.geolocation) { setShowCityInput(true); setWeatherLoading(false); return; }
    const fallback = setTimeout(() => { setShowCityInput(true); setWeatherLoading(false); }, 10000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(fallback); loadWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`); },
      () => { clearTimeout(fallback); setShowCityInput(true); setWeatherLoading(false); },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setErr('Voice input is not supported in this browser — try Chrome or Safari.'); return; }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';

    rec.onstart = () => setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim = t;
      }
      setInput(finalTranscript + interim);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => {
      setListening(false);
      if (finalTranscript.trim()) {
        setTimeout(() => send(finalTranscript.trim()), 100);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };


  useEffect(() => {
    fetch('/api/stylist-chat')
      .then((r) => r.json())
      .then((data: { directives: StyleDirective[] }) => {
        setDirectives(data.directives ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || sending) return;
    setInput('');
    setSending(true);
    setErr('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const grid = await buildWardrobeGrid(items);
      const conversationHistory = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/stylist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          items: slim(items),
          bodyProfile,
          weather: weather ?? undefined,
          wardrobeGrid: grid?.base64,
          wardrobeGridMapping: grid?.mapping,
          conversationHistory,
        }),
      });
      const data = await res.json() as {
        acknowledgment?: string;
        blocks?: Block[];
        allDirectives?: StyleDirective[];
        consultedSpecialists?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMessages((prev) => [...prev, {
        role: 'stylist',
        text: data.acknowledgment ?? '',
        blocks: data.blocks,
        consultedSpecialists: data.consultedSpecialists,
      }]);
      setDirectives(data.allDirectives ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (learnMore) return <LearnMorePage {...learnMore} onClose={() => setLearnMore(null)} />;

  return (
    <div className="flex flex-col pt-2">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Personal styling atelier</p>
            <h2 className="font-serif text-2xl text-[#1A1714] mt-0.5">Your Stylist</h2>
          </div>
          {/* Weather widget */}
          {weather ? (
            <div className="text-right">
              <p className="text-[10px] text-[#9B7B3A] font-light uppercase tracking-widest">{weather.locationName}</p>
              <p className="text-xs text-[#6B6058] font-light">{weather.tempF}°F · {weather.condition}</p>
            </div>
          ) : (
            <button
              onClick={detectWeather}
              disabled={weatherLoading}
              className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors disabled:opacity-40 mt-1"
            >
              {weatherLoading ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
              {weatherLoading ? 'Getting weather...' : 'Add weather'}
            </button>
          )}
        </div>

        {/* City input fallback */}
        {showCityInput && !weather && (
          <div className="flex gap-2 mt-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city..."
              className="flex-1 border border-[#E5DDD0] px-2.5 py-1.5 text-xs font-light focus:outline-none focus:border-[#9B7B3A]"
              onKeyDown={(e) => { if (e.key === 'Enter' && city.trim()) loadWeather(`city=${encodeURIComponent(city.trim())}`); }}
            />
            <button onClick={() => loadWeather(`city=${encodeURIComponent(city.trim())}`)} disabled={!city.trim()} className="border border-[#E5DDD0] px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors disabled:opacity-40">Go</button>
          </div>
        )}
        {weatherErr && <p className="text-[10px] text-[#A89F96] font-light mt-1">{weatherErr}</p>}

        {directives.length > 0 && (
          <>
            <button
              onClick={() => setShowDirectives((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] text-[#A89F96] font-light mt-2 hover:text-[#6B6058] transition-colors"
            >
              {showDirectives ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {directives.length} active instruction{directives.length !== 1 ? 's' : ''}
            </button>
            {showDirectives && (
              <ul className="mt-2 space-y-1.5 pl-1">
                {directives.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#9B7B3A] mt-1.5 shrink-0" />
                    <p className="text-xs text-[#6B6058] font-light leading-relaxed">{d.instruction}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Empty state — prompt suggestions */}
      {messages.length === 0 && loaded && (
        <div className="space-y-3 mb-5">
          <p className="text-sm text-[#6B6058] font-light leading-relaxed">
            {items.length > 0
              ? 'Your stylist has your full wardrobe in view. Ask what to wear, what\'s missing, or anything about your style.'
              : 'Tell your stylist what you\'re looking for — they\'ll tailor their approach to you.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[10px] border border-[#E5DDD0] px-2.5 py-1.5 text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors font-light"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      <div className="space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'stylist' && (
              <div className="shrink-0 w-5 h-5 rounded-full bg-[#1A1714] flex items-center justify-center mr-2 mt-0.5">
                <span className="text-[8px] text-[#9B7B3A]">S</span>
              </div>
            )}
            <div className={msg.role === 'user' ? 'max-w-[85%]' : 'flex-1 min-w-0'}>
              <div className={`px-3 py-2 text-sm font-light leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1A1714] text-white rounded-tl-lg rounded-bl-lg rounded-br-lg'
                  : 'bg-[#F5F2EC] border border-[#E5DDD0] text-[#1A1714] rounded-tr-lg rounded-br-lg rounded-bl-lg'
              }`}>
                {msg.text}
              </div>
              {msg.role === 'stylist' && msg.consultedSpecialists?.length && (
                <p className="text-[8px] uppercase tracking-[0.18em] text-[#C4B8A8] font-light mt-1.5">
                  Consulted · {msg.consultedSpecialists.join(' · ')}
                </p>
              )}
              {msg.blocks && msg.blocks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.blocks.map((block, k) => (
                    <BlockRenderer key={k} block={block} items={items} hasProfilePhoto={Boolean(profileImageFilename)} onLearnMore={(props) => setLearnMore({ ...props, onClose: () => setLearnMore(null) })} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="shrink-0 w-5 h-5 rounded-full bg-[#1A1714] flex items-center justify-center mr-2 mt-0.5">
              <span className="text-[8px] text-[#9B7B3A]">S</span>
            </div>
            <div className="bg-[#F5F2EC] border border-[#E5DDD0] px-3 py-2 flex items-center gap-1.5 rounded-tr-lg rounded-br-lg rounded-bl-lg">
              <Loader2 className="animate-spin text-[#A89F96]" size={12} />
              <span className="text-xs text-[#A89F96] font-light">Looking at your wardrobe...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {err && <p className="text-xs text-red-700 font-light mb-2">{err}</p>}

      {/* Input */}
      <div className="sticky bottom-4 bg-[var(--ivory)] pt-2 border-t border-[#E5DDD0]">
        {listening && (
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-[#A89F96] font-light uppercase tracking-widest">Listening — speak now</span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? '' : messages.length > 0 ? 'Continue the conversation...' : 'Ask your stylist anything...'}
            rows={2}
            className="flex-1 border border-[#E5DDD0] px-3 py-2.5 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          />
          <button
            onClick={toggleVoice}
            disabled={sending}
            title={listening ? 'Stop listening' : 'Speak to your stylist'}
            className={`shrink-0 w-10 h-10 flex items-center justify-center border transition-colors disabled:opacity-40 ${listening ? 'bg-red-500 border-red-500 text-white' : 'border-[#E5DDD0] text-[#A89F96] hover:border-[#9B7B3A] hover:text-[#9B7B3A]'}`}
            aria-label={listening ? 'Stop' : 'Voice input'}
          >
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="shrink-0 w-10 h-10 bg-[#1A1714] text-white flex items-center justify-center hover:bg-[#2C2521] disabled:opacity-40 transition-colors"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
