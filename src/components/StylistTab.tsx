'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';
import type { BodyProfile } from '@/lib/body-profile';
import type { StyleDirective } from '@/app/api/stylist-chat/route';
import { slim, buildWardrobeGrid } from './utils';

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

function OutfitMini({ outfit, items }: { outfit: ChatOutfit; items: WardrobeItem[] }) {
  const pieces = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((x): x is WardrobeItem => Boolean(x));
  const [showWhy, setShowWhy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  if (pieces.length === 0) return null;

  return (
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
      </div>
    </div>
  );
}

export default function StylistTab({
  items,
  bodyProfile,
}: {
  items: WardrobeItem[];
  bodyProfile?: BodyProfile;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directives, setDirectives] = useState<StyleDirective[]>([]);
  const [showDirectives, setShowDirectives] = useState(false);
  const [err, setErr] = useState('');
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Personal styling atelier</p>
        <h2 className="font-serif text-2xl text-[#1A1714] mt-0.5">Your Stylist</h2>
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
                    <OutfitMini key={j} outfit={outfit} items={items} />
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
      <div className="flex gap-2 items-end sticky bottom-4 bg-[var(--ivory)] pt-2 border-t border-[#E5DDD0]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={messages.length > 0 ? 'Continue the conversation...' : 'Ask your stylist anything...'}
          rows={2}
          className="flex-1 border border-[#E5DDD0] px-3 py-2.5 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] resize-none"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
        />
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
  );
}
