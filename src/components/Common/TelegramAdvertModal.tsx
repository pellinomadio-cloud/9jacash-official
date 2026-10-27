import React from 'react';
import { Send, CheckCircle2, ArrowRight, X, ShieldCheck, Sparkles, Users, Gift } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleJoinTelegram = () => {
    const url = telegramUrl || 'https://t.me/jacash1';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Container Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-[#14151b] border border-amber-500/30 p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-b from-[#229ED9]/25 via-amber-500/15 to-transparent blur-2xl pointer-events-none" />

        {/* Close "✕" Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Continue to Dashboard"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Telegram Header Badge */}
        <div className="flex flex-col items-center text-center pt-2 space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#229ED9] to-[#0088cc] flex items-center justify-center shadow-lg shadow-[#229ED9]/30 border border-white/20">
              {/* Telegram Paper Plane Icon */}
              <Send className="w-8 h-8 text-white translate-x-[-1px] translate-y-[-1px]" />
            </div>
            {/* Sparkling Gold Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              Welcome to 9jacash
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Join Our Telegram Channel
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {userName ? `Welcome aboard, ${userName}! ` : 'Welcome! '}
              Join thousands of smart earners on our official Telegram channel for daily cash drops, withdrawal proof, and 24/7 priority support.
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="p-3.5 rounded-2xl bg-[#1b1d25] border border-stone-800 space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-stone-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>Daily cash rewards &amp; secret promo codes</span>
          </div>
          <div className="flex items-center gap-2.5 text-stone-300">
            <div className="w-5 h-5 rounded-full bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span>Live withdrawal receipts &amp; payout alerts</span>
          </div>
          <div className="flex items-center gap-2.5 text-stone-300">
            <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>Direct access to verified 9jacash admins</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* 1. Join Telegram Button */}
          <a
            href={telegramUrl || 'https://t.me/jacash1'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#229ED9] to-[#0088cc] hover:from-[#1b8ec5] hover:to-[#0077b3] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/25 hover:shadow-[#229ED9]/40 transition-all cursor-pointer transform active:scale-[0.98] text-center"
          >
            <Send className="w-4 h-4" />
            <span>Join Telegram Channel</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </a>

          {/* 2. Continue to Dashboard Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-700/60 transition-all cursor-pointer"
          >
            <span>Continue to Dashboard</span>
          </button>
        </div>

        {/* Small Trust Footnote */}
        <p className="text-[10px] text-stone-500 text-center">
          Official 9jacash Community • Free to Join
        </p>
      </div>
    </div>
  );
};
