import React from 'react';
import { Send, CheckCircle2, ArrowRight, X, ShieldCheck, Sparkles, Users, Gift } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface TelegramAdvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUrl: string;
  userName?: string;
}

export const TelegramAdvertModal: React.FC<TelegramAdvertModalProps> = ({
  isOpen,
  onClose,
  telegramUrl,
  userName,
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/55' : 'bg-black/85'
      }`}
    >
      {/* Container Card */}
      <div
        className={`relative w-full max-w-sm rounded-3xl border-2 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden transition-colors ${
          isLight
            ? 'bg-gradient-to-b from-sky-50 via-white to-amber-50/80 border-[#229ED9]/60 text-slate-900 shadow-[#229ED9]/20'
            : 'bg-[#14151b] border-amber-500/40 text-white shadow-black/60'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-56 h-36 blur-2xl pointer-events-none ${
            isLight
              ? 'bg-gradient-to-b from-[#229ED9]/35 via-amber-400/20 to-transparent'
              : 'bg-gradient-to-b from-[#229ED9]/25 via-amber-500/15 to-transparent'
          }`}
        />

        {/* Close "✕" Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 border ${
            isLight
              ? 'bg-white hover:bg-amber-50 text-slate-700 hover:text-slate-950 border-slate-200 shadow-xs'
              : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
          }`}
          title="Continue to Dashboard"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Telegram Header Badge */}
        <div className="relative z-10 flex flex-col items-center text-center pt-2 space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#229ED9] to-[#0088cc] flex items-center justify-center shadow-lg shadow-[#229ED9]/35 border border-white/30">
              {/* Telegram Paper Plane Icon */}
              <Send className="w-8 h-8 text-white translate-x-[-1px] translate-y-[-1px]" />
            </div>
            {/* Sparkling Gold Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-md border border-white/60">
              <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
            </div>
          </div>

          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold tracking-wide uppercase mb-2 ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              <Gift className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              Welcome to 9jacash
            </div>
            <h2
              className={`text-xl font-extrabold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Join Our Telegram Channel
            </h2>
            <p
              className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${
                isLight ? 'text-slate-600 font-medium' : 'text-stone-300'
              }`}
            >
              {userName ? `Welcome aboard, ${userName}! ` : 'Welcome! '}
              Join thousands of smart earners on our official Telegram channel for daily cash drops, withdrawal proof, and 24/7 priority support.
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div
          className={`relative z-10 p-3.5 rounded-2xl border space-y-2.5 text-xs ${
            isLight
              ? 'bg-white/95 border-sky-200/90 shadow-sm text-slate-800 font-medium'
              : 'bg-[#1b1d25] border-stone-800 text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Daily cash rewards &amp; secret promo codes</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight
                  ? 'bg-sky-100 text-[#0088cc] border border-sky-200'
                  : 'bg-[#229ED9]/15 text-[#229ED9]'
              }`}
            >
              <Users className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Live withdrawal receipts &amp; payout alerts</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight
                  ? 'bg-amber-100 text-amber-600 border border-amber-200'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Direct access to verified 9jacash admins</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 space-y-2.5 pt-1">
          {/* 1. Join Telegram Button (Active Vibrant Sky Blue) */}
          <a
            href={telegramUrl || 'https://t.me/jacash1'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#229ED9] via-[#0088cc] to-[#0077b5] hover:from-[#1b8ec5] hover:to-[#006699] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/30 hover:shadow-[#229ED9]/45 transition-all cursor-pointer transform active:scale-[0.98] text-center"
          >
            <Send className="w-4 h-4" />
            <span>Join Telegram Channel</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </a>

          {/* 2. Continue to Dashboard Button (Active Vibrant Gold/Amber) */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-[0.98] shadow-md ${
              isLight
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border border-amber-300 shadow-amber-500/25'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black border border-amber-300/60 shadow-amber-500/20'
            }`}
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Small Trust Footnote */}
        <p
          className={`relative z-10 text-[10px] font-semibold text-center ${
            isLight ? 'text-slate-500' : 'text-stone-400'
          }`}
        >
          Official 9jacash Community • Free to Join
        </p>
      </div>
    </div>
  );
};
