import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Headphones, PhoneCall, ShieldCheck, Bot, Send, ArrowUpRight } from 'lucide-react';
import { formatTelegramUrl, formatTelegramHandle } from '../../utils/telegram.ts';

interface SupportTabProps {
  onStartLiveChat: () => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({ onStartLiveChat }) => {
  const { communityLinks } = useAuth();
  const { isLight } = useTheme();

  // Strictly use the Agent Telegram URL (do not fall back to the Telegram community channel)
  const agentHref = formatTelegramUrl(communityLinks?.agentTelegramUrl);
  const agentHandle = formatTelegramHandle(communityLinks?.agentTelegramHandle || communityLinks?.agentTelegramUrl);

  return (
    <div className="py-2 space-y-4">
      <div>
        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Help &amp; Support</h2>
        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>24/7 dedicated customer care for 9jacash</p>
      </div>

      {/* Support Card Banner */}
      <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border-amber-300 shadow-sm'
          : 'bg-gradient-to-r from-[#181920] to-[#221f18] border-amber-500/30'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-amber-400/20">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Priority Support Active</h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Average response time under 2 minutes</p>
        </div>
      </div>

      {/* Primary In-App Live Chat CTA Button */}
      <button
        type="button"
        onClick={onStartLiveChat}
        className={`w-full p-4 rounded-3xl border flex items-center justify-between text-left group transition-all cursor-pointer ${
          isLight
            ? 'bg-gradient-to-r from-white via-amber-50/40 to-white border-2 border-amber-300 hover:border-amber-400 shadow-md hover:shadow-lg'
            : 'bg-gradient-to-tr from-[#161822] via-[#1c1f2b] to-[#241f16] border border-amber-500/50 hover:border-amber-400 shadow-xl hover:shadow-amber-500/10'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className={`text-sm font-bold transition-colors ${
                isLight ? 'text-slate-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-300'
              }`}>
                In-App Live Chat Assistant
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                Online
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Ask how 9jacash works, Quick Code purchases &amp; withdrawals
            </p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          isLight
            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
            : 'bg-amber-400/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-400 group-hover:text-black'
        }`}>
          Chat Now →
        </div>
      </button>

      {/* Other Channels */}
      <div className="space-y-2.5">
        {/* Support Agent on Telegram */}
        <a
          href={agentHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group cursor-pointer block ${
            isLight
              ? 'bg-white border-slate-200 hover:border-[#229ED9] hover:bg-sky-50/40 shadow-sm'
              : 'bg-[#16171d] border-stone-800/80 hover:border-[#229ED9]/50 hover:bg-[#1c1e27]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className={`text-xs font-bold transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-[#229ED9]' : 'text-white group-hover:text-[#229ED9]'
                }`}>
                  Message Support Agent
                </h4>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                  isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                }`}>
                  Telegram
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                {agentHandle ? `Chat with verified agent on ${agentHandle}` : 'Instant 1-on-1 assistance on Telegram'}
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/20 text-[11px] font-bold group-hover:bg-[#229ED9] group-hover:text-white transition-all flex items-center gap-1">
            <span>Message</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* Phone Support Line */}
        <div
          onClick={() => {
            navigator.clipboard.writeText('+2347009522274');
          }}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-sm'
              : 'bg-[#16171d] border-stone-800/80 hover:border-amber-500/40 hover:bg-[#1c1e27]'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isLight
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-[#1f212a] text-amber-400'
          }`}>
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-xs font-bold transition-colors ${
              isLight ? 'text-slate-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-300'
            }`}>
              Phone Support Line
            </h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              +234 (0) 700 9JACASH (Click to copy)
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
          : 'bg-[#121317] border-stone-800/80 text-stone-400'
      }`}>
        <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
          Security reminder: 9jacash customer care and support agents will NEVER ask for your secret password, PIN, or bank OTP.
        </p>
      </div>
    </div>
  );
};
