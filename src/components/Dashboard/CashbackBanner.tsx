import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ChevronRight, Crown, AlertCircle, Sparkles } from 'lucide-react';

interface CashbackBannerProps {
  onLearnMore: () => void;
}

export const CashbackBanner: React.FC<CashbackBannerProps> = ({ onLearnMore }) => {
  const { user, formatNaira } = useAuth();
  const balance = user?.balance || 0;
  const currentTier = user?.tier || 1;

  // Only show if user reached 400,000 limit on Tier 1
  if (currentTier >= 2 || balance < 400000) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-[#1b1712] via-[#211a14] to-[#2c2010] border border-amber-500/50 p-5 sm:p-6 shadow-xl animate-in fade-in">
      {/* Golden Wave Ribbon Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <svg
          viewBox="0 0 400 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-0 top-0 h-full w-full object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M180,180 C260,100 320,60 400,0 L400,180 Z"
            fill="url(#offerGoldGrad)"
            opacity="0.3"
          />
          <path
            d="M150,180 C240,110 300,40 400,-20"
            stroke="url(#offerStroke)"
            strokeWidth="2"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="offerGoldGrad" x1="180" y1="180" x2="400" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b45309" stopOpacity="0" />
              <stop offset="0.5" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="1" stopColor="#fbbf24" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="offerStroke" x1="150" y1="180" x2="400" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#78350f" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#fef08a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left Text & CTA */}
        <div className="space-y-1.5 max-w-[65%] sm:max-w-[70%]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-400 uppercase bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
              TIER 1 LIMIT REACHED
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-snug">
            Earning Page Locked
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
            Your balance reached ₦400,000. Upgrade to Tier 2 to unlock higher capacity and continue earning!
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLearnMore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
            >
              <span>Upgrade to Tier 2</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right 3D Visual Crown Artwork */}
        <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none">
          {/* Glowing aura */}
          <div className="absolute w-20 h-20 rounded-full bg-amber-500/30 blur-xl animate-pulse" />

          {/* Golden Crown Orb Badge */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-black flex items-center justify-center shadow-2xl border-2 border-amber-300/80 transform hover:scale-105 transition-transform duration-300">
            <Crown className="w-9 h-9 stroke-[2.2]" />
          </div>

          {/* Floating Gold Coin 1 */}
          <div className="absolute -top-1 right-2 w-5 h-5 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border border-amber-100/60 shadow-md shadow-amber-500/30 flex items-center justify-center text-[9px] font-black text-black">
            ₦
          </div>

          {/* Floating Alert Dot */}
          <div className="absolute -bottom-1 left-2 w-6 h-6 rounded-full bg-amber-400 text-black shadow-md flex items-center justify-center font-bold text-xs">
            !
          </div>
        </div>
      </div>
    </div>
  );
};
