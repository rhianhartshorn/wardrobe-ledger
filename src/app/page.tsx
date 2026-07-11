'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import TodayTab from '@/components/TodayTab';
import StylistTab from '@/components/StylistTab';
import ClosetTab from '@/components/ClosetTab';
import AddItemTab from '@/components/AddItemTab';
import StyleTab from '@/components/StyleTab';
import LooksTab from '@/components/LooksTab';
import BodyProfilePage from '@/components/BodyProfilePage';
import OnboardingCarousel from '@/components/OnboardingCarousel';
import StyleDiscoveryCarousel from '@/components/StyleDiscoveryCarousel';
import { ErrorBanner } from '@/components/ui';
import type { BodyProfile } from '@/lib/body-profile';
import { EMPTY_PROFILE } from '@/lib/body-profile';
import { type LifestyleProfile, EMPTY_LIFESTYLE } from '@/lib/lifestyle-types';
import { type FashionCurrencyItem, type StoredFashionCurrency, getCurrentSeasonTag } from '@/lib/fashion-currency-types';
import { slim } from '@/components/utils';

export type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
  material?: string;
  fit?: string;
  length?: string;
  accessoryType?: string;
  imageFilename: string | null;
  imageUrl: string | null;
  addedAt: number;
  price?: number;
  wearCount?: number;
  styleNote?: string;
  visualNotes?: string;
};

type Tab = 'today' | 'stylist' | 'closet' | 'looks' | 'style';

export default function WardrobeApp() {
  const [tab, setTab] = useState<Tab>('today');
  const [showAdd, setShowAdd] = useState(false);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFilename, setProfileImageFilename] = useState<string | null>(null);
  const [bodyProfile, setBodyProfile] = useState<BodyProfile>(EMPTY_PROFILE);
  const [showBodyProfile, setShowBodyProfile] = useState(false);
  const [lifestyleProfile, setLifestyleProfile] = useState<LifestyleProfile>(EMPTY_LIFESTYLE());
  const [fashionCurrency, setFashionCurrency] = useState<FashionCurrencyItem[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('wl_onboarded');
  });
  const [showStyleDiscovery, setShowStyleDiscovery] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/body-profile').then((r) => r.json()),
      fetch('/api/lifestyle').then((r) => r.json()),
      fetch('/api/fashion-currency').then((r) => r.json()),
    ])
      .then(([itemsData, profileData, bodyData, lifestyleData, fcData]) => {
        // Guard: API may return {error: "..."} on 500 — never pass a non-array to setItems
        const loadedItems: WardrobeItem[] = Array.isArray(itemsData) ? itemsData as WardrobeItem[] : [];
        setItems(loadedItems);
        if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
          const p = profileData as { imageUrl?: string | null; imageFilename?: string | null };
          setProfileImageUrl(p.imageUrl ?? null);
          setProfileImageFilename(p.imageFilename ?? null);
        }
        setBodyProfile((bodyData && typeof bodyData === 'object') ? bodyData as BodyProfile : EMPTY_PROFILE);
        if (lifestyleData && typeof lifestyleData === 'object' && !Array.isArray(lifestyleData)) {
          setLifestyleProfile({ ...EMPTY_LIFESTYLE(), ...(lifestyleData as Partial<LifestyleProfile>) });
        }

        // Fashion currency — use cached if current season, otherwise refresh silently in background
        const stored = fcData as StoredFashionCurrency & { fashionCurrency: FashionCurrencyItem[] | null };
        if (stored?.fashionCurrency) setFashionCurrency(stored.fashionCurrency);

        if (loadedItems.length >= 3 && stored?.season !== getCurrentSeasonTag()) {
          fetch('/api/fashion-currency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: slim(loadedItems) }),
          })
            .then((r) => r.json())
            .then((fresh: StoredFashionCurrency) => { if (fresh.fashionCurrency) setFashionCurrency(fresh.fashionCurrency); })
            .catch(() => {});
        }

        // Backfill richer visual attributes for items tagged before the schema upgrade —
        // drains a small batch per round in the background, capped to avoid runaway loops
        if (loadedItems.some((i) => !i.visualNotes)) {
          const drain = async (rounds: number): Promise<void> => {
            if (rounds <= 0) return;
            try {
              const r = await fetch('/api/enrich-tags', { method: 'POST' });
              const d = await r.json() as { remaining?: number };
              if (r.ok && (d.remaining ?? 0) > 0) await drain(rounds - 1);
            } catch { /* background — ignore */ }
          };
          drain(8);
        }

        // Style Discovery only after 10+ items — skip if lifestyle already filled in (Blueprint tab)
        const hasLifestyle = lifestyleData && typeof lifestyleData === 'object' && !!(lifestyleData as Partial<LifestyleProfile>).workDressCode;
        if (loadedItems.length >= 10 && !localStorage.getItem('wl_style_discovery_done') && !!localStorage.getItem('wl_onboarded') && !hasLifestyle) {
          setShowStyleDiscovery(true);
        }

        setLoaded(true);
        if (!Array.isArray(itemsData) && itemsData && (itemsData as { error?: string }).error) {
          setError('Wardrobe failed to load — try refreshing.');
        }
      })
      .catch(() => {
        setError('Failed to load wardrobe data.');
        setLoaded(true);
      });
  }, []);

  const addItem = (item: WardrobeItem) => setItems((prev) => [item, ...prev]);

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    else setError('Failed to remove item — try again.');
  };

  const updateWearCount = (id: string, wearCount: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, wearCount } : i));
  };

  const updateItem = (updated: WardrobeItem) => {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  const profileComplete = Boolean(bodyProfile.height && bodyProfile.bodyShape && bodyProfile.undertone);

  const dismissOnboarding = () => {
    localStorage.setItem('wl_onboarded', '1');
    setShowOnboarding(false);
    // Style Discovery fires after 10+ items load — not immediately after onboarding
  };

  const dismissStyleDiscovery = () => {
    localStorage.setItem('wl_style_discovery_done', '1');
    setShowStyleDiscovery(false);
  };

  if (showBodyProfile) {
    return (
      <BodyProfilePage
        initial={bodyProfile}
        onSave={(p) => setBodyProfile(p)}
        onClose={() => setShowBodyProfile(false)}
        initialLifestyle={lifestyleProfile}
        onSaveLifestyle={(p) => setLifestyleProfile(p)}
        profileImageUrl={profileImageUrl}
        onProfileChange={(url, filename) => { setProfileImageUrl(url); setProfileImageFilename(filename); }}
      />
    );
  }

  return (
    <div className="min-h-screen text-[#1A1714]" style={{ background: 'var(--ivory)' }}>
      {showOnboarding && (
        <OnboardingCarousel
          onDone={dismissOnboarding}
          onSetupBlueprint={() => { dismissOnboarding(); setShowBodyProfile(true); }}
        />
      )}
      {showStyleDiscovery && !showOnboarding && (
        <StyleDiscoveryCarousel
          onDone={dismissStyleDiscovery}
          itemCount={items.length}
          topWorn={[...items].sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0)).slice(0, 5).filter((i) => (i.wearCount ?? 0) > 0).map((i) => i.name)}
          bodyProfile={bodyProfile}
        />
      )}
      <Header
        tab={tab}
        setTab={setTab}
        count={items.length}
        onProfileOpen={() => setShowBodyProfile(true)}
        profileComplete={profileComplete}
        onAddItem={() => setShowAdd(true)}
      />
      <main className="max-w-3xl mx-auto px-4 pb-16 pt-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!loaded ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#A89F96]" size={24} />
          </div>
        ) : tab === 'today' ? (
          <TodayTab items={items} bodyProfile={bodyProfile} onGoToStylist={() => setTab('stylist')} />
        ) : tab === 'stylist' ? (
          <StylistTab
            items={items}
            bodyProfile={bodyProfile}
            profileImageUrl={profileImageUrl}
            profileImageFilename={profileImageFilename}
            onProfileChange={(url, filename) => { setProfileImageUrl(url); setProfileImageFilename(filename); }}
          />
        ) : tab === 'closet' ? (
          <ClosetTab items={items} onRemove={removeItem} onWearLogged={updateWearCount} onEdit={updateItem} bodyProfile={bodyProfile} fashionCurrency={fashionCurrency ?? undefined} />
        ) : tab === 'style' ? (
          <StyleTab items={items} bodyProfile={bodyProfile} lifestyleProfile={lifestyleProfile} onOpenLifestyle={() => setShowBodyProfile(true)} fashionCurrency={fashionCurrency ?? undefined} onFashionCurrencyUpdate={setFashionCurrency} />
        ) : (
          <LooksTab items={items} bodyProfile={bodyProfile} profileImageFilename={profileImageFilename} />
        )}

        {/* Add Item drawer overlay */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAdd(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-[#FAF8F4] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#FAF8F4] border-b border-[#E5DDD0] px-4 py-3 flex items-center justify-between z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Add to wardrobe</p>
                <button onClick={() => setShowAdd(false)} className="text-[#A89F96] hover:text-[#1A1714] transition-colors">✕</button>
              </div>
              <div className="px-4 pb-8 pt-4">
                <AddItemTab onAdd={(item) => { addItem(item); setShowAdd(false); }} items={items} />
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-[#A89F96] mt-12 font-light tracking-wide">
          Your wardrobe data stays private — stored only on this server.
        </p>
        <p className="text-center mt-1">
          <Link href="/admin" className="text-[10px] text-[#D6CFC0] hover:text-[#A89F96] font-light tracking-wide transition-colors">
            Usage &amp; cost
          </Link>
        </p>
      </main>
    </div>
  );
}
