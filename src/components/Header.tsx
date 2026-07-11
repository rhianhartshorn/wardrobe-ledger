import { Shirt, Gem, Heart, Plus, MessageCircle, Sun } from 'lucide-react';
import { UserCircle } from 'lucide-react';

type Tab = 'today' | 'stylist' | 'closet' | 'looks' | 'style';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'stylist', label: 'Stylist', icon: MessageCircle },
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'looks', label: 'Looks', icon: Heart },
  { id: 'style', label: 'Style', icon: Gem },
];

export default function Header({
  tab, setTab, count, onProfileOpen, profileComplete, onAddItem,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  count: number;
  onProfileOpen: () => void;
  profileComplete: boolean;
  onAddItem: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-[#1A1714] text-white">
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B7B3A] font-light">Personal styling atelier</p>
          <h1 className="font-serif text-2xl tracking-tight mt-0.5">The Wardrobe Ledger</h1>
          <p className="text-[11px] text-white/40 mt-0.5 font-light">
            {count} {count === 1 ? 'piece' : 'pieces'} catalogued
          </p>
        </div>
        <div className="flex items-start gap-3 mt-1">
          <button
            onClick={onAddItem}
            title="Add item"
            className="flex flex-col items-center gap-0.5 group"
          >
            <div className="w-6 h-6 rounded-full border border-[#9B7B3A] flex items-center justify-center group-hover:bg-[#9B7B3A] transition-colors">
              <Plus size={14} className="text-[#9B7B3A] group-hover:text-white transition-colors" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-[#9B7B3A]/70">Add</span>
          </button>
          <button
            onClick={onProfileOpen}
            title="Your style blueprint"
            className="flex flex-col items-center gap-0.5 group"
          >
            <UserCircle
              size={24}
              className={`transition-colors ${profileComplete ? 'text-[#9B7B3A]' : 'text-white/30 group-hover:text-white/60'}`}
            />
            <span className={`text-[8px] uppercase tracking-widest transition-colors ${profileComplete ? 'text-[#9B7B3A]/70' : 'text-white/30 group-hover:text-white/50'}`}>
              {profileComplete ? 'Blueprint' : 'Set up'}
            </span>
          </button>
        </div>
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
