'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, MessageCircle, ChevronDown, ChevronUp, RefreshCw, Send } from 'lucide-react';
import type { StyleDirective } from '@/app/api/stylist-chat/route';
import type { WardrobeItem } from '@/app/page';
import { slim, buildWardrobeGrid } from './utils';

const PROMPT_SUGGESTIONS = [
  'What should I wear to a job interview?',
  'I need a dinner date outfit from what I have',
  'What am I wearing wrong about my wardrobe?',
  'Stop playing it safe — I want more edge',
  'What\'s the one piece I\'m underusing?',
  'How do I make my outfits look more intentional?',
];

type Message = { role: 'user' | 'stylist'; text: string };

type Props = {
  items: WardrobeItem[];
  onRebuildProfile?: () => void;
};

export default function StylistChat({ items, onRebuildProfile }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directives, setDirectives] = useState<StyleDirective[]>([]);
  const [showDirectives, setShowDirectives] = useState(false);
  const [err, setErr] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [personaExists, setPersonaExists] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/stylist-chat').then((r) => r.json()),
      fetch('/api/persona').then((r) => r.json()),
    ]).then(([chatData, personaData]: [{ directives: StyleDirective[] }, { persona: string | null }]) => {
      setDirectives(chatData.directives ?? []);
      setPersonaExists(Boolean(personaData.persona));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = async () => {
    if (!message.trim() || sending) return;
    const userText = message.trim();
    setMessage('');
    setSending(true);
    setErr('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const grid = await buildWardrobeGrid(items);
      // Pass the last 6 messages as context so the stylist can follow the thread
      const conversationHistory = messages.slice(-6);
      const res = await fetch('/api/stylist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          items: slim(items),
          wardrobeGrid: grid?.base64,
          wardrobeGridMapping: grid?.mapping,
          conversationHistory,
        }),
      });
      const data = await res.json() as { acknowledgment?: string; allDirectives?: StyleDirective[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMessages((prev) => [...prev, { role: 'stylist', text: data.acknowledgment ?? '' }]);
      setDirectives(data.allDirectives ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1)); // remove the user message on failure
    } finally {
      setSending(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="border border-[#E5DDD0] bg-white">
      <div className="p-4 border-b border-[#E5DDD0]">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={13} className="text-[#9B7B3A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Talk to your stylist</p>
        </div>
        <p className="text-sm text-[#1A1714] font-light">
          {items.length > 0
            ? 'Your stylist has your full wardrobe in front of them. Ask what to wear, what\'s missing, or what you\'re doing wrong.'
            : 'Tell your stylist what you\'re looking for — they\'ll adjust their approach to suit you.'}
        </p>
        {onRebuildProfile && (
          <button
            onClick={onRebuildProfile}
            className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light hover:text-[#9B7B3A] transition-colors mt-2"
          >
            <RefreshCw size={10} /> {personaExists ? 'Rebuild stylist profile' : 'Set up stylist profile'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Conversation thread */}
        {messages.length > 0 ? (
          <div className="space-y-3 mb-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'stylist' && (
                  <div className="shrink-0 w-5 h-5 rounded-full bg-[#1A1714] flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-[8px] text-[#9B7B3A] font-light">S</span>
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-[#1A1714] text-white text-sm font-light rounded-tl-lg rounded-bl-lg rounded-tr-none rounded-br-lg'
                    : 'bg-[#F5F2EC] border border-[#E5DDD0] text-sm text-[#1A1714] font-light leading-relaxed rounded-tr-lg rounded-br-lg rounded-tl-none rounded-bl-lg'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="shrink-0 w-5 h-5 rounded-full bg-[#1A1714] flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-[8px] text-[#9B7B3A] font-light">S</span>
                </div>
                <div className="bg-[#F5F2EC] border border-[#E5DDD0] px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="animate-spin text-[#A89F96]" size={12} />
                  <span className="text-xs text-[#A89F96] font-light">Looking at your wardrobe...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setMessage(s)}
                className="text-[10px] border border-[#E5DDD0] px-2.5 py-1.5 text-[#6B6058] hover:border-[#9B7B3A] hover:text-[#9B7B3A] transition-colors font-light"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messages.length > 0
              ? 'Continue the conversation...'
              : items.length > 0
                ? 'Ask your stylist anything — what to wear tonight, what\'s missing, what you\'re getting wrong...'
                : 'Tell your stylist what you want to change about the advice you\'re getting...'}
            rows={2}
            className="flex-1 border border-[#E5DDD0] px-3 py-2.5 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          />
          <button
            onClick={send}
            disabled={!message.trim() || sending}
            className="shrink-0 w-10 h-10 bg-[#1A1714] text-white flex items-center justify-center hover:bg-[#2C2521] disabled:opacity-40 transition-colors mb-0"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>

        {err && <p className="text-xs text-red-700 font-light">{err}</p>}

        {directives.length > 0 && (
          <div>
            <button
              onClick={() => setShowDirectives((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#A89F96] font-light hover:text-[#6B6058] transition-colors"
            >
              {showDirectives ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {directives.length} active instruction{directives.length !== 1 ? 's' : ''}
            </button>
            {showDirectives && (
              <ul className="mt-2 space-y-1.5">
                {directives.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#9B7B3A] mt-1.5 shrink-0" />
                    <p className="text-xs text-[#6B6058] font-light leading-relaxed">{d.instruction}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
