import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  Users,
  Send,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
  Gift,
  BellRing,
  Award,
  Link as LinkIcon,
} from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';

export const CommunityTab: React.FC = () => {
  const { communityLinks } = useAuth();
  const { isLight } = useTheme();
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Dynamic live links configured exclusively by Admin in Admin Dashboard
  const telegramUrl = communityLinks?.telegramUrl || 'https://t.me/jacash1';
  const telegramHandle = communityLinks?.telegramHandle || '@jacash1';
  const whatsappUrl = communityLinks?.whatsappUrl || 'https://whatsapp.com/channel/0029Va9jacashOfficial';

  const handleCopyTelegramHandle = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(telegramHandle);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleCopyTelegramUrl = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(telegramUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="py-2 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>Community Channels</span>
            <Users className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Join the official 9jacash Telegram &amp; WhatsApp channels
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Community</span>
        </div>
      </div>

      {/* Community Announcement Note if set by Admin */}
      {communityLinks?.announcement && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 shadow-md ${
            isLight
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-500/10'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <BellRing className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <div className="space-y-0.5">
            <span
              className={`text-[10px] font-black uppercase tracking-wider block ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}
            >
              Official Announcement
            </span>
            <p className={`text-xs leading-relaxed font-medium ${isLight ? 'text-slate-700' : 'text-stone-200'}`}>
              {communityLinks.announcement}
            </p>
          </div>
        </div>
      )}

      {/* Community Stats Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-4 shadow-xl transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-white to-sky-50 border-amber-200 shadow-slate-200/60'
            : 'bg-gradient-to-r from-[#111c26] via-[#121c18] to-[#1a1c24] border-stone-800'
        }`}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span
              className={`text-[10px] uppercase font-bold tracking-widest ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}
            >
              OFFICIAL 9JACASH PORTAL
            </span>
            <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Connect With 14,800+ Earners
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Get flash codes, withdrawal alerts &amp; 24/7 platform updates
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ================= 1. TELEGRAM CHANNEL CARD ================= */}
      <div
        className={`p-5 rounded-3xl border space-y-4 shadow-xl relative overflow-hidden transition-colors ${
          isLight
            ? 'bg-gradient-to-br from-sky-50 via-white to-blue-50/70 border-sky-300 shadow-sky-500/10'
            : 'bg-[#141824] border-sky-500/40'
        }`}
      >
        {/* Ambient glow */}
        <div
          className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
            isLight ? 'bg-sky-400/15' : 'bg-sky-500/10'
          }`}
        />

        <div className="flex items-start justify-between relative z-10 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-md shrink-0 ${
                isLight
                  ? 'bg-sky-100 border-sky-300 text-sky-600 shadow-sky-500/10'
                  : 'bg-sky-500/20 border-sky-400/40 text-sky-400'
              }`}
            >
              <Send
                className={`w-6 h-6 stroke-[1.5] -translate-x-0.5 translate-y-0.5 ${
                  isLight ? 'fill-sky-600 text-sky-600' : 'fill-sky-400 text-sky-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  9jacash Telegram
                </h3>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                    isLight
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}
                >
                  OFFICIAL
                </span>
              </div>
              <p
                className={`text-xs font-mono font-bold mt-0.5 flex items-center gap-1.5 flex-wrap ${
                  isLight ? 'text-sky-700' : 'text-sky-300/90'
                }`}
              >
                <span>{telegramHandle}</span>
                <span className={`text-[10px] font-normal truncate ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  ({telegramUrl})
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons: Copy Handle & Copy Link */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
            <button
              type="button"
              onClick={handleCopyTelegramHandle}
              className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-sky-100/80 hover:bg-sky-200/80 border-sky-300 text-sky-800'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30 text-sky-300'
              }`}
              title="Copy handle"
            >
              {copiedHandle ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyTelegramUrl}
              className={`py-1 px-2 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                  : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
              }`}
              title="Copy link"
            >
              {copiedUrl ? (
                <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              ) : (
                <LinkIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Telegram Perks */}
        <div className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              <Gift className="w-2.5 h-2.5" />
            </div>
            <span>Daily flash giveaways &amp; free Quick Codes dropped randomly</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              <Award className="w-2.5 h-2.5" />
            </div>
            <span>Verified withdrawal proofs and user payout receipts</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
            </div>
            <span>Fast real-time announcements &amp; maintenance notices</span>
          </div>
        </div>

        {/* Native Telegram Action Link */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => soundFx.playClick()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4 fill-white" />
            <span>JOIN 9JACASH TELEGRAM CHANNEL ({telegramHandle})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </a>
      </div>

      {/* ================= 2. WHATSAPP CHANNEL CARD ================= */}
      <div
        className={`p-5 rounded-3xl border space-y-4 shadow-xl relative overflow-hidden transition-colors ${
          isLight
            ? 'bg-gradient-to-br from-emerald-50 via-white to-green-50/70 border-emerald-300 shadow-emerald-500/10'
            : 'bg-[#14221a] border-emerald-500/40'
        }`}
      >
        {/* Ambient glow */}
        <div
          className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
            isLight ? 'bg-emerald-400/15' : 'bg-emerald-500/10'
          }`}
        />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-md ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-600 shadow-emerald-500/10'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
              }`}
            >
              <MessageCircle
                className={`w-6 h-6 stroke-[1.5] ${
                  isLight ? 'fill-emerald-600 text-emerald-600' : 'fill-emerald-400 text-emerald-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  9jacash WhatsApp
                </h3>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  OFFICIAL
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-300/80'}`}>
                WhatsApp Broadcast Channel
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Perks */}
        <div className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
            </div>
            <span>Instant broadcast notifications delivered directly to your WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
            <span>Official verified updates from 9jacash Company Team</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <BellRing className="w-2.5 h-2.5" />
            </div>
            <span>New feature releases, tier promotions &amp; earning tips</span>
          </div>
        </div>

        {/* Native WhatsApp Action Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => soundFx.playClick()}
          className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-center ${
            isLight ? 'text-white' : 'text-black'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className={`w-4 h-4 ${isLight ? 'fill-white' : 'fill-black'}`} />
            <span>JOIN 9JACASH WHATSAPP CHANNEL</span>
            <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-black'}`} />
          </div>
        </a>
      </div>

      {/* Security Advisory */}
      <div
        className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-600 shadow-xs'
            : 'bg-[#14151b] border-stone-800 text-stone-400'
        }`}
      >
        <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
        <p className="text-[11px] leading-relaxed">
          <strong className={isLight ? 'text-slate-900' : 'text-stone-200'}>Security Notice:</strong> Official 9jacash company representatives will <strong>never</strong> ask for your 4-digit security PIN or login credentials on Telegram or WhatsApp.
        </p>
      </div>
    </div>
  );
};
