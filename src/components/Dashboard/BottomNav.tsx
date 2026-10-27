import React from 'react';
import { ActiveTab } from '../../types/index.ts';
import { Home, Users, Zap, Headphones, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { isLight } = useTheme();

  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'community' as ActiveTab, label: 'Community', icon: Users },
    { id: 'payments' as ActiveTab, label: 'Payments', icon: Zap },
    { id: 'support' as ActiveTab, label: 'Support', icon: Headphones },
    { id: 'more' as ActiveTab, label: 'More', icon: LayoutGrid },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto backdrop-blur-xl border-t px-4 py-2 pb-5 sm:pb-3 shadow-2xl transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]'
          : 'bg-[#0d0e12]/95 border-stone-800/90'
      }`}
    >
      <div className="flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'community' && activeTab === 'cards');

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-1 group focus:outline-none cursor-pointer"
            >
              {/* Active Indicator Top Line */}
              {isActive && (
                <div
                  className={`absolute -top-2 w-8 h-1 rounded-full ${
                    isLight
                      ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]'
                      : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                  }`}
                />
              )}

              {/* Icon */}
              <div
                className={`p-1 transition-transform duration-200 ${
                  isActive
                    ? isLight
                      ? 'scale-110 text-amber-600'
                      : 'scale-110 text-amber-400'
                    : isLight
                    ? 'text-slate-500 group-hover:text-slate-900'
                    : 'text-stone-400 group-hover:text-stone-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? isLight
                      ? 'text-amber-600 font-bold'
                      : 'text-amber-400 font-semibold'
                    : isLight
                    ? 'text-slate-500 group-hover:text-slate-900'
                    : 'text-stone-400 group-hover:text-stone-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
