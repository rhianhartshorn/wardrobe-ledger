'use client';
import { useState, useEffect } from 'react';
import { Loader2, MessageCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { StyleDirective } from '@/app/api/stylist-chat/route';

type Props = {
  onRebuildProfile?: () => void;
};

export default function StylistChat({ onRebuildProfile }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [acknowledgment, setAcknowledgment] = useState('');
  const [directives, setDirectives] = useState<StyleDirective[]>([]);
  const [showDirectives, setShowDirectives] = useState(false);
  const [err, setErr] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [personaExists, setPersonaExists] = useState(false);

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

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true); setErr(''); setAcknowledgment('');
    try {
      const res = await fetch('/api/stylist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json() as { acknowledgment?: string; allDirectives?: StyleDirective[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setAcknowledgment(data.acknowledgment ?? '');
      setDirectives(data.allDirectives ?? []);
      setMessage('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
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
          {personaExists
            ? 'Your stylist knows you. Tell them what\'s been off, what you want more of, or how you want advice to change.'
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
        {/* Prompt suggestions */}
        {!acknowledgment && (
          <div className="flex flex-wrap gap-2">
            {[
              'Stop playing it safe — I want more edge',
              'I want more practical everyday outfits',
              'Focus on what works for my colouring',
              'I\'m tired of being told to wear neutrals',
            ].map((s) => (
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

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell your stylist what you want to change about the advice you're getting..."
          rows={3}
          className="w-full border border-[#E5DDD0] px-3 py-2.5 text-sm font-light text-[#1A1714] placeholder:text-[#A89F96] focus:outline-none focus:border-[#9B7B3A] resize-none"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
        />

        <button
          onClick={send}
          disabled={!message.trim() || sending}
          className="w-full bg-[#1A1714] text-white py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:bg-[#2C2521] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {sending ? <><Loader2 className="animate-spin" size={12} /> Sending...</> : 'Send to stylist'}
        </button>

        {err && <p className="text-xs text-red-700 font-light">{err}</p>}

        {acknowledgment && (
          <div className="border-l-2 border-[#9B7B3A] pl-3 py-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B7B3A] font-light mb-1.5">Your stylist</p>
            <p className="text-sm text-[#1A1714] font-light leading-relaxed">{acknowledgment}</p>
          </div>
        )}

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
