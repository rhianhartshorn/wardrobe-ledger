'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ClosetTab from '@/components/ClosetTab';
import AddItemTab from '@/components/AddItemTab';
import OutfitTab from '@/components/OutfitTab';
import StyleTab from '@/components/StyleTab';
import MirrorTab from '@/components/MirrorTab';
import { ErrorBanner } from '@/components/ui';

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
};

type Tab = 'closet' | 'add' | 'outfit' | 'style' | 'mirror';

export default function WardrobeApp() {
  const [tab, setTab] = useState<Tab>('closet');
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFilename, setProfileImageFilename] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
    ])
      .then(([itemsData, profileData]: [WardrobeItem[], { imageUrl: string | null; imageFilename: string | null }]) => {
        setItems(itemsData);
        setProfileImageUrl(profileData.imageUrl);
        setProfileImageFilename(profileData.imageFilename);
        setLoaded(true);
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

  return (
    <div className="min-h-screen text-[#1A1714]" style={{ background: 'var(--ivory)' }}>
      <Header tab={tab} setTab={setTab} count={items.length} />
      <main className="max-w-3xl mx-auto px-4 pb-16 pt-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!loaded ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#A89F96]" size={24} />
          </div>
        ) : tab === 'closet' ? (
          <ClosetTab items={items} onRemove={removeItem} />
        ) : tab === 'add' ? (
          <AddItemTab onAdd={addItem} items={items} />
        ) : tab === 'outfit' ? (
          <OutfitTab
            items={items}
            profileImageUrl={profileImageUrl}
            profileImageFilename={profileImageFilename}
            onProfileChange={(url, filename) => {
              setProfileImageUrl(url);
              setProfileImageFilename(filename);
            }}
          />
        ) : tab === 'style' ? (
          <StyleTab items={items} />
        ) : (
          <MirrorTab items={items} />
        )}

        <p className="text-center text-[11px] text-[#A89F96] mt-12 font-light tracking-wide">
          Your wardrobe data stays private — stored only on this server.
        </p>
      </main>
    </div>
  );
}
