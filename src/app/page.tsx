'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ClosetTab from '@/components/ClosetTab';
import AddItemTab from '@/components/AddItemTab';
import OutfitTab from '@/components/OutfitTab';
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

type Tab = 'closet' | 'add' | 'outfit' | 'mirror';

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
        setError('Failed to load wardrobe data. Make sure the dev server is running properly.');
        setLoaded(true);
      });
  }, []);

  const addItem = (item: WardrobeItem) => {
    setItems((prev) => [item, ...prev]);
  };

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setError('Failed to remove item — try again.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      <Header tab={tab} setTab={setTab} count={items.length} />
      <main className="max-w-3xl mx-auto px-4 pb-16 pt-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!loaded ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-stone-400" size={28} />
          </div>
        ) : tab === 'closet' ? (
          <ClosetTab items={items} onRemove={removeItem} />
        ) : tab === 'add' ? (
          <AddItemTab onAdd={addItem} />
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
        ) : (
          <MirrorTab items={items} />
        )}

        <p className="text-center text-xs text-stone-400 mt-10">
          Your wardrobe data stays private to this device.
        </p>
      </main>
    </div>
  );
}
