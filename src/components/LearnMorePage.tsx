'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { WardrobeItem } from '@/app/page';

type Section = { heading: string; body: string };
type Detail = { headline: string; overview: string; sections: Section[]; tips: string[] };

export type LearnMoreProps = {
  type: 'outfit' | 'aesthetic' | 'purchase' | 'style-group' | 'style-match';
  title: string;
  context: string;
  relevantItems?: WardrobeItem[];
  onClose: () => void;
};

export default function LearnMorePage({ type, title, context, relevantItems = [], onClose }: LearnMoreProps) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/learn-more', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, context }),
    })
      .then((r) => r.json())
      .then((d: Detail & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setDetail(d);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Could not load detail.'))
      .finally(() => setLoading(false));
  }, [type, title, context]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--ivory)] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--ivory)] pt-4 pb-3 flex items-center gap-3 border-b border-[#E5DDD0] mb-6">
          <button onClick={onClose} className="text-[#A89F96] hover:text-[#1A1714] transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Deep dive</p>
            <h2 className="font-serif text-xl text-[#1A1714] truncate">{title}</h2>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#A89F96] font-light py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Writing your editorial...
          </div>
        )}

        {err && <p className="text-sm text-red-700 font-light">{err}</p>}

        {detail && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="bg-[#1A1714] text-white p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light mb-2">Editorial</p>
              <h1 className="font-serif text-3xl italic leading-snug">{detail.headline}</h1>
              <p className="text-sm text-white/60 font-light mt-3 leading-relaxed">{detail.overview}</p>
            </div>

            {/* Relevant wardrobe pieces */}
            {relevantItems.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6058] font-light mb-3">From your wardrobe</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {relevantItems.map((item) => (
                    <div key={item.id} className="shrink-0 w-20">
                      <div className="aspect-square w-20 overflow-hidden bg-[#F5F2EC] border border-[#E5DDD0]">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" />
                        }
                      </div>
                      <p className="text-[10px] text-[#A89F96] truncate mt-1 font-light">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sections */}
            {detail.sections?.map((s, i) => (
              <div key={i} className="border-l-2 border-[#9B7B3A] pl-4">
                <h3 className="font-serif text-lg text-[#1A1714] mb-1">{s.heading}</h3>
                <p className="text-sm text-[#6B6058] font-light leading-relaxed">{s.body}</p>
              </div>
            ))}

            {/* Tips */}
            {detail.tips?.length > 0 && (
              <div className="border border-[#E5DDD0] bg-white p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light mb-4">Styling tips</p>
                <ul className="space-y-3">
                  {detail.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#1A1714] font-light leading-snug">
                      <span className="text-[#9B7B3A] font-serif text-lg leading-none shrink-0">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
