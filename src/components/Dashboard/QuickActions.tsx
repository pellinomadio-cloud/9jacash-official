import React, { useState } from 'react';
import { Sparkles, Users, CreditCard, Hash, Copy, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

interface QuickActionsProps {
  onActionClick: (action: 'earn' | 'community' | 'withdraw' | 'quickcode' | 'deposit') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const { user, depositRequests } = useAuth();
  const { isLight } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Check if user has an active pending request for quick code
  const hasPendingQuickCode = depositRequests.some(
    (r) => r.userId === user?.id && r.requestType === 'quickcode' && r.status === 'pending'
  );

  // Normalize active quick codes
  const activeQuickCodes: { code: string; planName: string; withdrawalsLeft: number }[] = (user?.quickCodes || []).map((item) => {
    if (typeof item === 'string') {
      return { code: item, planName: 'Quick Code', withdrawalsLeft: 1 };
    }
    return item;
  });

  const primaryCode = activeQuickCodes.length > 0 ? activeQuickCodes[0] : null;

  const handleCopy = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const actions = [
    {
      id: 'earn' as const,
      title: 'Earn',
      subtitle: 'Candy & Games',
      icon: Sparkles,
      iconRotate: '',
    },
    {
      id: 'community' as const,
      title: 'Community',
      subtitle: 'Telegram & Proofs',
      icon: Users,
      iconRotate: '',
    },
    {
      id: 'withdraw' as const,
      title: 'Withdraw',
      subtitle: 'Send to bank',
      icon: CreditCard,
      iconRotate: '',
    },
    {
      id: 'quickcode' as const,
      title: 'Buy quick code',
      subtitle: hasPendingQuickCode ? '⏳ Under Review' : 'USSD & offline',
      icon: Hash,
      iconRotate: '',
    },
  ] as const;

  return (
    <div className="space-y-2.5 py-1">
      {/* 4 Action Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 items-start">
        {actions.map((act) => {
          const IconComponent = act.icon;
          const isQuickCode = act.id === 'quickcode';
          const isEarn = act.id === 'earn';
          const isCommunity = act.id === 'community';
          const isWithdraw = act.id === 'withdraw';

          // Determine button circle style
          let circleStyle = isLight
            ? "bg-white border border-stone-200 shadow-md shadow-slate-300/30 group-hover:border-amber-400 group-hover:bg-amber-50/50"
            : "bg-[#18191f] border border-amber-500/40 shadow-lg shadow-black/40 group-hover:border-amber-400 group-hover:bg-[#20222a] group-hover:shadow-amber-500/20";
          let iconStyle = `text-amber-400 ${act.iconRotate} group-hover:scale-110`;
          let titleStyle = isLight
            ? "text-slate-800 group-hover:text-amber-600 font-bold"
            : "text-white group-hover:text-amber-400 font-semibold";

          if (isQuickCode) {
            // Bold saturated color & bold styling
            circleStyle = "bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border-2 border-amber-200 shadow-xl shadow-amber-500/50 ring-2 ring-amber-400/60 group-hover:scale-105 group-hover:shadow-amber-400/70";
            iconStyle = `text-black stroke-[3] ${act.iconRotate} group-hover:scale-110`;
            titleStyle = isLight
              ? "font-black text-amber-700 tracking-tight group-hover:text-amber-800 text-xs sm:text-sm"
              : "font-black text-amber-300 tracking-tight drop-shadow-[0_1px_4px_rgba(245,158,11,0.6)] group-hover:text-amber-200 text-xs sm:text-sm";
          } else if (isEarn) {
            // Mixture of black, gold, and pink in color
            circleStyle = "bg-gradient-to-br from-black via-[#f59e0b] to-[#ec4899] border-2 border-[#f472b6] shadow-xl shadow-[#ec4899]/40 ring-2 ring-[#fbbf24]/50 group-hover:scale-105 group-hover:shadow-[#ec4899]/60";
            iconStyle = `text-amber-200 fill-amber-300 stroke-[2.4] drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] ${act.iconRotate} group-hover:scale-110`;
            titleStyle = isLight
              ? "font-black text-pink-700 group-hover:text-pink-800"
              : "font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-pink-400 bg-clip-text text-transparent group-hover:brightness-125 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]";
          } else if (isCommunity) {
            // Bold Community channel styling
            circleStyle = isLight
              ? "bg-gradient-to-b from-sky-50 to-sky-100 border-2 border-sky-400 shadow-md shadow-sky-500/10 ring-2 ring-sky-300/40 group-hover:scale-105"
              : "bg-gradient-to-b from-[#182030] via-[#0d1322] to-black border-2 border-sky-400/80 shadow-xl shadow-black/90 ring-2 ring-sky-400/50 group-hover:scale-105 group-hover:border-sky-300 group-hover:ring-sky-400 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]";
            iconStyle = isLight
              ? `text-sky-600 stroke-[2.6] ${act.iconRotate} group-hover:scale-110`
              : `text-sky-300 stroke-[2.6] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)] ${act.iconRotate} group-hover:scale-110`;
            titleStyle = isLight
              ? "font-black text-sky-800 tracking-tight group-hover:text-sky-900 text-xs sm:text-sm"
              : "font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-sky-300 text-xs sm:text-sm";
          } else if (isWithdraw) {
            // Bold with more of white and black, the green should just be little
            circleStyle = isLight
              ? "bg-slate-900 border-[2.5px] border-emerald-400 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400/50 group-hover:scale-105 group-hover:border-emerald-300 group-hover:ring-emerald-400"
              : "bg-black border-[2.5px] border-white shadow-xl shadow-black/90 ring-2 ring-emerald-500/70 group-hover:scale-105 group-hover:border-stone-100 group-hover:ring-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]";
            iconStyle = `text-white stroke-[3] drop-shadow-[0_0_5px_rgba(255,255,255,0.7)] ${act.iconRotate} group-hover:scale-110`;
            titleStyle = isLight
              ? "font-black text-slate-900 tracking-tight group-hover:text-emerald-700 text-xs sm:text-sm"
              : "font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-emerald-300 text-xs sm:text-sm";
          }

          return (
            <div key={act.id} className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => onActionClick(act.id)}
                className="w-full flex flex-col items-center text-center group cursor-pointer focus:outline-none"
              >
                {/* Circular Action Button */}
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center group-active:scale-95 transition-all duration-200 ${circleStyle}`}>
                  <IconComponent
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform ${iconStyle}`}
                  />
                  {/* Subtle accent indicator for Community */}
                  {isCommunity && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400 border border-black shadow-[0_0_8px_rgba(56,189,248,1)]"></span>
                    </span>
                  )}
                  {/* Subtle green accent indicator for Withdraw (little touch of green) */}
                  {isWithdraw && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-black shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
                    </span>
                  )}
                  {/* Badge on Quick Code button if active code exists */}
                  {isQuickCode && primaryCode && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-black font-extrabold text-[9px] items-center justify-center">
                        {activeQuickCodes.length}
                      </span>
                    </span>
                  )}
                  {/* Badge on Quick Code button if pending review */}
                  {isQuickCode && !primaryCode && hasPendingQuickCode && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-black font-extrabold text-[9px] items-center justify-center">
                        ⏳
                      </span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <span className={`mt-2 text-xs sm:text-sm transition-colors ${titleStyle}`}>
                  {act.title}
                </span>

                {/* Subtitle */}
                <span className={`text-[10px] sm:text-[11px] mt-0.5 ${
                  isLight
                    ? (isQuickCode && hasPendingQuickCode ? 'text-amber-700 font-bold' : (isWithdraw ? 'text-slate-700 font-semibold inline-flex items-center justify-center gap-1' : (isCommunity ? 'text-slate-700 font-semibold inline-flex items-center justify-center gap-1' : 'text-slate-500 font-normal')))
                    : (isQuickCode && hasPendingQuickCode ? 'text-amber-400 font-bold' : (isWithdraw ? 'text-stone-300 font-semibold inline-flex items-center justify-center gap-1' : (isCommunity ? 'text-stone-300 font-semibold inline-flex items-center justify-center gap-1' : 'text-stone-400 font-normal')))
                }`}>
                  {isWithdraw && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                  {isCommunity && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />}
                  <span>{act.subtitle}</span>
                </span>
              </button>

              {/* Directly under Dashboard Quick Code button: Show Code & Small Copy Button or Pending Status */}
              {isQuickCode && primaryCode && (
                <div className="mt-1.5 w-full max-w-[96px] p-1 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col items-center text-center shadow-sm">
                  <span className="font-extrabold text-[10px] sm:text-[11px] text-amber-400 tracking-wider break-all">
                    {primaryCode.code}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(primaryCode.code, e)}
                    className="mt-1 px-1.5 py-0.5 w-full rounded-md bg-amber-400 hover:bg-amber-300 text-black font-bold text-[9px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Copy Quick Code"
                  >
                    {copiedCode === primaryCode.code ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isQuickCode && !primaryCode && hasPendingQuickCode && (
                <div className="mt-1.5 w-full max-w-[96px] py-1 px-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-bold text-center">
                  Reviewing...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prominent Active Quick Code Notification Card if any active quick codes exist */}
      {activeQuickCodes.length > 0 && (
        <div className="mt-1 p-3 rounded-2xl bg-gradient-to-r from-[#181a22] via-[#1f1d19] to-[#16171d] border border-amber-500/40 shadow-lg shadow-black/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Approved Quick Code Ready
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
              {activeQuickCodes[0].withdrawalsLeft} withdrawal{activeQuickCodes[0].withdrawalsLeft > 1 ? 's' : ''} left
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#111217] border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-widest px-2 py-0.5 bg-[#1b1c24] rounded-lg border border-stone-700">
                {activeQuickCodes[0].code}
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                {activeQuickCodes[0].planName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleCopy(activeQuickCodes[0].code, e)}
                className="py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                {copiedCode === activeQuickCodes[0].code ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onActionClick('withdraw')}
                className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Use code in Withdrawal"
              >
                <span>Withdraw</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
