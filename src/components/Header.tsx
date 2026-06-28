import { Shirt, ImagePlus, Sparkles, BarChart3, Gem } from 'lucide-react';

type Tab = 'closet' | 'add' | 'outfit' | 'style' | 'mirror';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'add', label: 'Add', icon: ImagePlus },
  { id: 'outfit', label: 'Outfit', icon: Sparkles },
  { id: 'style', label: 'Style DNA', icon: Gem },
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
    <header className="sticky top-0 z-10 bg-[#1A1714] text-white">
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Personal styling atelier</p>
        <h1 className="font-serif text-2xl tracking-tight mt-0.5">The Wardrobe Ledger</h1>
        <p className="text-[11px] text-white/40 mt-0.5 font-light">
          {count} {count === 1 ? 'piece' : 'pieces'} catalogued
        </p>
      </div>
      <nav className="max-w-3xl mx-auto px-2 flex border-t border-white/10 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-light tracking-wide border-b-[1.5px] transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#9B7B3A] text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
