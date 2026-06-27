import { Shirt, ImagePlus, Sparkles, BarChart3 } from 'lucide-react';

type Tab = 'closet' | 'add' | 'outfit' | 'mirror';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'add', label: 'Add item', icon: ImagePlus },
  { id: 'outfit', label: 'Outfit', icon: Sparkles },
  { id: 'mirror', label: 'Mirror', icon: BarChart3 },
];

export default function Header({
  tab, setTab, count,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  count: number;
}) {
  return (
    <header className="sticky top-0 z-10 bg-stone-900 text-stone-50">
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <p className="text-xs uppercase tracking-widest text-amber-500">Personal styling atelier</p>
        <h1 className="font-serif text-2xl tracking-tight">The Wardrobe Ledger</h1>
        <p className="text-xs text-stone-400 mt-0.5">
          {count} {count === 1 ? 'piece' : 'pieces'} catalogued
        </p>
      </div>
      <nav className="max-w-3xl mx-auto px-4 flex gap-1 border-t border-stone-800">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${
                active
                  ? 'border-amber-500 text-stone-50'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
