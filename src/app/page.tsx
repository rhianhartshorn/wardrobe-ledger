'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ClosetTab from '@/components/ClosetTab';
import AddItemTab from '@/components/AddItemTab';
import OutfitTab from '@/components/OutfitTab';
import StyleTab from '@/components/StyleTab';
import LooksTab from '@/components/LooksTab';
import BodyProfilePage from '@/components/BodyProfilePage';
import OnboardingCarousel from '@/components/OnboardingCarousel';
import { ErrorBanner } from '@/components/ui';
import type { BodyProfile } from '@/lib/body-profile';
import { EMPTY_PROFILE } from '@/lib/body-profile';

export type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
  imageFilename: string | null;
  imageUrl: string | null;
  addedAt: number;
  price?: number;
  wearCount?: number;
};

type Tab = 'closet' | 'add' | 'outfit' | 'looks' | 'style';

export default function WardrobeApp() {
  const [tab, setTab] = useState<Tab>('closet');
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFilename, setProfileImageFilename] = useState<string | null>(null);
  const [bodyProfile, setBodyProfile] = useState<BodyProfile>(EMPTY_PROFILE);
  const [showBodyProfile, setShowBodyProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('wl_onboarded');
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/body-profile').then((r) => r.json()),
    ])
      .then(([itemsData, profileData, bodyData]) => {
        // Guard: API may return {error: "..."} on 500 — never pass a non-array to setItems
        setItems(Array.isArray(itemsData) ? itemsData as WardrobeItem[] : []);
        if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
          const p = profileData as { imageUrl?: string | null; imageFilename?: string | null };
          setProfileImageUrl(p.imageUrl ?? null);
          setProfileImageFilename(p.imageFilename ?? null);
        }
        setBodyProfile((bodyData && typeof bodyData === 'object') ? bodyData as BodyProfile : EMPTY_PROFILE);
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

  const profileComplete = Boolean(bodyProfile.height && bodyProfile.bodyShape && bodyProfile.undertone);

  const dismissOnboarding = () => {
    localStorage.setItem('wl_onboarded', '1');
    setShowOnboarding(false);
  };

  if (showBodyProfile) {
    return (
      <BodyProfilePage
        initial={bodyProfile}
        onSave={(p) => setBodyProfile(p)}
        onClose={() => setShowBodyProfile(false)}
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
      <Header
        tab={tab}
        setTab={setTab}
        count={items.length}
        onProfileOpen={() => setShowBodyProfile(true)}
        profileComplete={profileComplete}
      />
      <main className="max-w-3xl mx-auto px-4 pb-16 pt-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!profileComplete && loaded && (
          <button
            onClick={() => setShowBodyProfile(true)}
            className="w-full mb-5 border border-[#9B7B3A]/40 bg-[#9B7B3A]/5 p-4 flex items-center justify-between group hover:bg-[#9B7B3A]/10 transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B7B3A] font-light">Recommended</p>
              <p className="text-sm text-[#1A1714] font-light mt-0.5">Complete your Style Blueprint</p>
              <p className="text-xs text-[#A89F96] font-light mt-0.5">60 seconds — unlocks personalised recommendations based on your body and colouring</p>
            </div>
            <span className="text-[#9B7B3A] text-lg font-light ml-4">→</span>
          </button>
        )}

        {!loaded ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#A89F96]" size={24} />
          </div>
        ) : tab === 'closet' ? (
          <ClosetTab items={items} onRemove={removeItem} onWearLogged={updateWearCount} profileImageUrl={profileImageUrl} onAddPhoto={() => setTab('outfit')} bodyProfile={bodyProfile} />
        ) : tab === 'add' ? (
          <AddItemTab onAdd={addItem} items={items} />
        ) : tab === 'outfit' ? (
          <OutfitTab
            items={items}
            profileImageUrl={profileImageUrl}
            profileImageFilename={profileImageFilename}
            bodyProfile={bodyProfile}
            onProfileChange={(url, filename) => {
              setProfileImageUrl(url);
              setProfileImageFilename(filename);
            }}
          />
        ) : tab === 'style' ? (
          <StyleTab items={items} bodyProfile={bodyProfile} />
        ) : (
          <LooksTab items={items} bodyProfile={bodyProfile} />
        )}

        <p className="text-center text-[11px] text-[#A89F96] mt-12 font-light tracking-wide">
          Your wardrobe data stays private — stored only on this server.
        </p>
      </main>
    </div>
  );
}
