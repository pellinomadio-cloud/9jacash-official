import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Community Channels</span>
            <Users className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-stone-400">
            Join the official 9jacash Telegram &amp; WhatsApp channels
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Community</span>
        </div>
      </div>

      {/* Community Announcement Note if set by Admin */}
      {communityLinks?.announcement && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 shadow-md">
          <BellRing className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              Official Announcement
            </span>
            <p className="text-xs text-stone-200 leading-relaxed font-medium">
              {communityLinks.announcement}
            </p>
          </div>
        </div>
      )}

      {/* Community Stats Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111c26] via-[#121c18] to-[#1a1c24] border border-stone-800 p-4 shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
              OFFICIAL 9JACASH PORTAL
            </span>
            <h3 className="text-base font-extrabold text-white">
              Connect With 14,800+ Earners
            </h3>
            <p className="text-xs text-stone-400">
              Get flash codes, withdrawal alerts &amp; 24/7 platform updates
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ================= 1. TELEGRAM CHANNEL CARD ================= */}
      <div className="p-5 rounded-3xl bg-[#141824] border border-sky-500/40 space-y-4 shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md">
              <Send className="w-6 h-6 fill-sky-400 text-sky-400 stroke-[1.5] -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">9jacash Telegram</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-sky-300/90 font-mono font-bold mt-0.5 flex items-center gap-1.5">
                <span>{telegramHandle}</span>
                <span className="text-[10px] text-stone-400 font-normal">({telegramUrl})</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Copy Handle & Copy Link */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleCopyTelegramHandle}
              className="py-1 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy handle"
            >
              {copiedHandle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
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
              className="py-1 px-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy link"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Telegram Perks */}
        <div className="space-y-2 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Gift className="w-2.5 h-2.5" />
            </div>
            <span>Daily flash giveaways &amp; free Quick Codes dropped randomly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Award className="w-2.5 h-2.5" />
            </div>
            <span>Verified withdrawal proofs and user payout receipts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer block text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4 fill-white" />
            <span>JOIN 9JACASH TELEGRAM CHANNEL ({telegramHandle})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </a>
      </div>

      {/* ================= 2. WHATSAPP CHANNEL CARD ================= */}
      <div className="p-5 rounded-3xl bg-[#14221a] border border-emerald-500/40 space-y-4 shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
              <MessageCircle className="w-6 h-6 fill-emerald-400 text-emerald-400 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">9jacash WhatsApp</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium mt-0.5">
                WhatsApp Broadcast Channel
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Perks */}
        <div className="space-y-2 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Zap className="w-2.5 h-2.5" />
            </div>
            <span>Instant broadcast notifications delivered directly to your WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
            <span>Official verified updates from 9jacash Company Team</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer block text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>JOIN 9JACASH WHATSAPP CHANNEL</span>
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </div>
        </a>
      </div>

      {/* Security Advisory */}
      <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 text-stone-400 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-stone-200">Security Notice:</strong> Official 9jacash company representatives will <strong>never</strong> ask for your 4-digit security PIN or login credentials on Telegram or WhatsApp.
        </p>
      </div>
    </div>
  );
};
