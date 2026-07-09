'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, Heart, Camera, Sparkles, Download, X, Mic, MicOff } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { BodyProfile } from '@/lib/body-profile';
import type { StyleDirective } from '@/app/api/stylist-chat/route';
import { slim, buildWardrobeGrid, compressImage } from './utils';

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
};

type Message = {
  role: 'user' | 'stylist';
  text: string;
  outfits?: ChatOutfit[];
};

function OutfitMini({ outfit, items, hasProfilePhoto }: { outfit: ChatOutfit; items: WardrobeItem[]; hasProfilePhoto: boolean }) {
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [listening, setListening] = useState(false);
  const selfieRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleVoice = () => {
    const SR = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { setErr('Voice input is not supported in this browser — try Chrome or Safari.'); return; }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';

    rec.onstart = () => setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
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
        // Small delay so state settles, then send
        setTimeout(() => send(finalTranscript.trim()), 100);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const uploadSelfie = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImage(file, 1024, 0.82, 900_000);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json() as { imageUrl?: string; imageFilename?: string };
      if (res.ok) onProfileChange(data.imageUrl ?? null, data.imageFilename ?? null);
    } catch { /* ignore */ }
    finally { setUploadingPhoto(false); }
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
          wardrobeGrid: grid?.base64,
          wardrobeGridMapping: grid?.mapping,
          conversationHistory,
        }),
      });
      const data = await res.json() as {
        acknowledgment?: string;
        outfits?: ChatOutfit[];
        allDirectives?: StyleDirective[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMessages((prev) => [...prev, {
        role: 'stylist',
        text: data.acknowledgment ?? '',
        outfits: data.outfits,
      }]);
      setDirectives(data.allDirectives ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col pt-2">
      {/* Hidden file input */}
      <input
        ref={selfieRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSelfie(f); e.target.value = ''; }}
      />

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Personal styling atelier</p>
            <h2 className="font-serif text-2xl text-[#1A1714] mt-0.5">Your Stylist</h2>
          </div>
          {/* Profile photo for try-on */}
          <button
            onClick={() => selfieRef.current?.click()}
            disabled={uploadingPhoto}
            title={profileImageUrl ? 'Change your photo for try-on' : 'Add your photo to try on outfits'}
            className="flex flex-col items-center gap-1 mt-1 group"
          >
            {profileImageUrl ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#9B7B3A] group-hover:border-[#8A6B2E] transition-colors">
                <img src={profileImageUrl} alt="Your photo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border border-dashed border-[#E5DDD0] flex items-center justify-center group-hover:border-[#9B7B3A] transition-colors">
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin text-[#A89F96]" /> : <Camera size={14} className="text-[#A89F96] group-hover:text-[#9B7B3A] transition-colors" />}
              </div>
            )}
            <span className="text-[8px] uppercase tracking-widest text-[#A89F96] group-hover:text-[#9B7B3A] transition-colors font-light">
              {profileImageUrl ? 'Try-on' : 'Add photo'}
            </span>
          </button>
        </div>
        {directives.length > 0 && (
          <>
            <button
              onClick={() => setShowDirectives((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] text-[#A89F96] font-light mt-1.5 hover:text-[#6B6058] transition-colors"
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
              {msg.outfits && msg.outfits.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.outfits.map((outfit, j) => (
                    <OutfitMini key={j} outfit={outfit} items={items} hasProfilePhoto={Boolean(profileImageFilename)} />
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
