import React from 'react';
import { Headphones } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface FloatingSupportToggleProps {
  unreadCount: number;
  onOpenSupport: () => void;
}

export const FloatingSupportToggle: React.FC<FloatingSupportToggleProps> = ({
  unreadCount,
  onOpenSupport,
}) => {
  const { isLight } = useTheme();

  return (
    <div className="fixed inset-x-0 bottom-28 sm:bottom-32 z-40 max-w-md mx-auto pointer-events-none flex justify-end">
      <button
        type="button"
        onClick={onOpenSupport}
        aria-label={
          unreadCount > 0
            ? `Open 9jacash Support chat (${unreadCount} new message)`
            : 'Open 9jacash Support chat'
        }
        className="pointer-events-auto group relative flex items-center gap-1.5 pl-3 pr-2.5 py-2.5 rounded-l-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.45)] border border-r-0 border-blue-300/40 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        {/* Red inbox signal badge when support replies */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -left-2 flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span
              className={`relative min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 shadow-md shadow-red-600/50 ${
                isLight ? 'border-white' : 'border-[#0a0b0e]'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}

        <Headphones className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="text-[11px] font-bold tracking-tight">Support</span>
      </button>
    </div>
  );
};
