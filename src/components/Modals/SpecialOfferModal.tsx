import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Gift,
  KeyRound,
  Users,
  Copy,
  Check,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SpecialOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToReferrals: () => void;
}

export const SpecialOfferModal: React.FC<SpecialOfferModalProps> = ({
  isOpen,
  onClose,
  onNavigateToReferrals,
}) => {
  const { user, getUserReferrals, getUserReferralLink, getReferralDisplayLink, claimFreeReferralQuickCode } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{ success?: boolean; message?: string; code?: string } | null>(null);
  const [platformTab, setPlatformTab] = useState<'whatsapp' | 'telegram'>('whatsapp');

  if (!isOpen) return null;

  const referralLink = getUserReferralLink();
  const displayLink = getReferralDisplayLink();
  const userReferrals = getUserReferrals();
  const currentCount = user?.referralCount ?? userReferrals.length;
  const targetCount = 50;
  const remaining = Math.max(0, targetCount - currentCount);
  const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const hasAchievedGoal = currentCount >= targetCount;

  // Encouraging referral message tailored specifically for WhatsApp
  const whatsappEncouragingMessage =
    "🔥 Don't give up on your financial goals! Join 9jacash today with my referral link to claim your welcome bonus and start earning real cash. Fast withdrawals straight to your Nigerian bank account — take this bold step today and let's succeed together! 💰👇";
  const fullWhatsAppShareText = `${whatsappEncouragingMessage}\n\n${referralLink}`;

  // Telegram message (as requested previously)
  const telegramMessage = 'join 9jacash using my referral link, I just got a 400k bonus and withdrawal';
  const fullTelegramShareText = `${telegramMessage} ${referralLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFullMessage = () => {
    const textToCopy = platformTab === 'whatsapp' ? fullWhatsAppShareText : fullTelegramShareText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(telegramMessage)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    const textToShare = platformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '9jacash 400k Bonus & Free Quick Code',
          text: textToShare,
          url: referralLink,
        });
      } catch {
        handleCopyFullMessage();
      }
    } else {
      handleCopyFullMessage();
    }
  };

  const handleClaimCode = () => {
    if (claimFreeReferralQuickCode) {
      const res = claimFreeReferralQuickCode();
      setClaimStatus(res);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1b1c27] via-[#14151e] to-[#0e0f15] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/20 text-stone-200 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow artwork */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors z-20 cursor-pointer"
          title="Close offer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Visual Badge */}
        <div className="text-center pt-1 pb-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SPECIAL OFFER • FREE QUICK CODE</span>
          </div>

          <div className="relative w-20 h-20 mx-auto mb-3">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-3xl blur-md opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-[#12131a] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent" />
                <Gift className="w-9 h-9 text-amber-400 stroke-[2.2]" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-400 text-black flex items-center justify-center shadow-md">
                  <KeyRound className="w-4 h-4 stroke-[2.8]" />
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Get a Free Quick Code! 🎁
          </h3>
          <p className="text-xs sm:text-[13px] text-stone-300 mt-1.5 leading-relaxed max-w-sm mx-auto">
            Refer <strong className="text-amber-400 font-extrabold">50 users</strong> to join 9jacash and unlock a <strong className="text-white">100% Free Quick Code</strong> to withdraw your balance directly to your bank account without purchasing a code!
          </p>
        </div>

        {/* 50 Referrals Progress Bar */}
        <div className="p-3.5 rounded-2xl bg-[#0f1017] border border-amber-500/30 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Referral Progress</span>
            </span>
            <span className="font-mono font-extrabold text-amber-400">
              {currentCount} / {targetCount} ({progressPercent}%)
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-3 rounded-full bg-stone-900 border border-stone-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            {hasAchievedGoal ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>50 Referrals Completed! You can claim your free code!</span>
              </span>
            ) : (
              <span className="text-stone-400">
                Invite <strong className="text-amber-300 font-bold">{remaining} more</strong> friends to unlock your free code
              </span>
            )}
            <span className="text-[10px] text-amber-400/90 font-medium font-mono">
              +₦15,000 / Ref
            </span>
          </div>
        </div>

        {/* Claim Code Button (If Goal reached) */}
        {hasAchievedGoal && !claimStatus?.success && (
          <div className="pt-2 relative z-10">
            <button
              type="button"
              onClick={handleClaimCode}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Claim Free Quick Code Now</span>
            </button>
          </div>
        )}

        {/* Claim Status Message */}
        {claimStatus && (
          <div
            className={`p-3 rounded-2xl border text-xs relative z-10 ${
              claimStatus.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            }`}
          >
            <p className="font-bold">{claimStatus.message}</p>
            {claimStatus.code && (
              <div className="mt-2 p-2 rounded-xl bg-black/60 border border-emerald-500/50 flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {claimStatus.code}
                </span>
                <span className="text-[10px] text-stone-400">Ready for Withdrawal</span>
              </div>
            )}
          </div>
        )}

        {/* Attached Message Preview Card */}
        <div className="pt-2 space-y-2 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0c0d12] border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                {platformTab === 'whatsapp' ? '✨ WhatsApp Encouraging Msg' : '📢 Telegram Msg'}
              </span>

              {/* Platform Switcher */}
              <div className="flex items-center gap-1 bg-[#14151e] p-0.5 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setPlatformTab('whatsapp')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    platformTab === 'whatsapp'
                      ? 'bg-[#25D366] text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('telegram')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    platformTab === 'telegram'
                      ? 'bg-[#0088cc] text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Telegram
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-200 italic font-medium bg-[#14151d] p-2.5 rounded-xl border border-stone-800/80 leading-relaxed">
              &ldquo;{platformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage}&rdquo;
            </p>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="text-[11px] font-mono text-amber-300/80 truncate">
                {displayLink}
              </div>
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                {copiedFullMessage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFullMessage ? 'Copied' : 'Copy Msg + Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.076-2.001-.466-1.579-.654-2.587-2.275-2.666-2.381-.078-.105-.635-.845-.635-1.61 0-.764.4-1.14.542-1.295.143-.156.312-.195.416-.195.105 0 .209.001.299.006.096.005.224-.036.35.268.13.313.443 1.077.482 1.155.039.078.065.17.013.273-.052.104-.078.169-.156.26-.078.091-.163.204-.233.274-.078.077-.16.16-.068.317.091.156.406.669.871 1.083.598.533 1.102.698 1.258.776.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.909.429 1.065.507.156.078.26.117.299.182.039.065.039.377-.105.782z" />
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* Telegram Share */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="py-2.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs shadow-lg shadow-[#0088cc]/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .34z" />
              </svg>
              <span>Telegram</span>
            </button>
          </div>

          {/* Quick Copy Link & Native Share row */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-xl bg-[#181924] hover:bg-[#222433] border border-stone-800 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2 px-3 rounded-xl bg-[#181924] hover:bg-[#222433] border border-stone-800 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="More share options"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 mt-3 border-t border-stone-800/80 flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800/60 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToReferrals();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Referrals Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
