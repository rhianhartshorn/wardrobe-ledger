'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ArrowLeft, Camera, Download } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';

type Phase = 'loading' | 'done' | 'error' | 'no_photo' | 'unsupported';

const LOADING_MESSAGES = [
  'Reading your garment…',
  'Mapping the silhouette…',
  'Fitting to your frame…',
  'Adjusting drape and texture…',
  'Almost there…',
];

type Props = {
  item: WardrobeItem;
  hasProfilePhoto: boolean;
  onClose: () => void;
  onAddPhoto: () => void;
};

export default function TryOnModal({ item, hasProfilePhoto, onClose, onAddPhoto }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1)), 6000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (!hasProfilePhoto) { setPhase('no_photo'); return; }

    // Unsupported category
    const cat = item.category.toLowerCase();
    if (cat === 'footwear' || cat === 'accessory') {
      setPhase('unsupported'); return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const res = await fetch('/api/try-on', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id }),
        });
        const data = await res.json() as { id?: string; error?: string };

        if (!res.ok || !data.id) {
          if (data.error === 'no_profile_photo') { setPhase('no_photo'); return; }
          setErrorMsg(data.error ?? 'Could not start try-on.');
          setPhase('error'); return;
        }

        // Poll for result
        const jobId = data.id;
        const poll = async () => {
          if (cancelled) return;
          const sr = await fetch(`/api/try-on/${jobId}`);
          const sd = await sr.json() as { status: string; outputUrl?: string; error?: string };

          if (sd.status === 'completed' && sd.outputUrl) {
            setOutputUrl(sd.outputUrl);
            setPhase('done');
          } else if (sd.status === 'failed') {
            setErrorMsg(sd.error ?? 'Generation failed.');
            setPhase('error');
          } else {
            // Still processing — poll again in 3 seconds
            pollRef.current = setTimeout(poll, 3000);
          }
        };
        pollRef.current = setTimeout(poll, 3000);
      } catch {
        if (!cancelled) { setErrorMsg('Network error — try again.'); setPhase('error'); }
      }
    };

    start();
    return () => { cancelled = true; if (pollRef.current) clearTimeout(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Virtual try-on</p>
          <p className="text-sm text-white font-light truncate">{item.name}</p>
        </div>
        {item.imageUrl && (
          <div className="w-9 h-9 shrink-0 overflow-hidden border border-white/10">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors ml-1">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">

        {phase === 'loading' && (
          <>
            <Loader2 className="animate-spin text-[#9B7B3A] mb-6" size={28} />
            <p className="text-white font-serif text-xl mb-2">Styling you…</p>
            <p className="text-white/40 text-sm font-light">{LOADING_MESSAGES[msgIndex]}</p>
            <p className="text-white/20 text-xs font-light mt-4">This takes about 30 seconds</p>
          </>
        )}

        {phase === 'done' && outputUrl && (
          <div className="w-full max-w-sm">
            <img
              src={outputUrl}
              alt={`Try-on: ${item.name}`}
              className="w-full object-cover border border-white/10"
            />
            <div className="flex gap-3 mt-4">
              <a
                href={outputUrl}
                download={`tryon-${item.name.replace(/\s+/g, '-')}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border border-white/20 text-white/60 py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:border-white/40 hover:text-white transition-colors"
              >
                <Download size={12} /> Save
              </a>
              <button
                onClick={() => { setPhase('loading'); setMsgIndex(0); setOutputUrl(null); }}
                className="flex-1 border border-[#9B7B3A]/40 text-[#9B7B3A] py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:border-[#9B7B3A] transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {phase === 'no_photo' && (
          <>
            <Camera size={32} className="text-white/20 mb-5" />
            <p className="text-white font-serif text-xl mb-3">Add a photo of yourself first</p>
            <p className="text-white/40 text-sm font-light leading-relaxed max-w-xs mb-6">
              Try-on needs a photo of you — ideally full-body or at least from the waist up, standing straight, in plain lighting.
            </p>
            <button
              onClick={() => { onClose(); onAddPhoto(); }}
              className="bg-[#9B7B3A] text-white px-6 py-3 text-xs tracking-[0.2em] uppercase font-light hover:bg-[#8A6C2E] transition-colors"
            >
              Add your photo
            </button>
          </>
        )}

        {phase === 'unsupported' && (
          <>
            <p className="text-white font-serif text-xl mb-3">Not available for {item.category}</p>
            <p className="text-white/40 text-sm font-light">Try-on works on tops, bottoms, outerwear, and dresses. Footwear and accessories aren't supported yet.</p>
          </>
        )}

        {phase === 'error' && (
          <>
            <p className="text-white font-serif text-xl mb-3">Couldn't generate try-on</p>
            <p className="text-white/40 text-sm font-light mb-6">{errorMsg}</p>
            <button
              onClick={onClose}
              className="border border-white/20 text-white/60 px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-light hover:border-white/40 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
