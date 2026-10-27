import React, { useState } from 'react';
import { useAuth, TIER_LIMITS } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  User,
  KeyRound,
  FileText,
  LogOut,
  ChevronRight,
  Crown,
  AlertCircle,
  Users,
  Copy,
  Check,
  Gift,
  Share2,
  ShieldCheck,
  Edit2,
  Award,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface MoreTabProps {
  onOpenAccountDetails: () => void;
  onOpenSettings: () => void;
  onOpenTerms: () => void;
  onOpenUpgradeTier: () => void;
  onOpenReferrals: () => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({
  onOpenAccountDetails,
  onOpenSettings,
  onOpenTerms,
  onOpenUpgradeTier,
  onOpenReferrals,
}) => {
  const { user, logout, formatNaira, getUserReferrals, getUserReferralCode, getUserReferralLink, getReferralDisplayLink } = useAuth();
  const { theme, toggleTheme, isLight } = useTheme();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState(false);

  const currentTier = user?.tier || 1;
  const tierLimit = TIER_LIMITS[currentTier] || 400000;
  const isTier1LimitReached = currentTier < 2 && (user?.balance || 0) >= 400000;

  const [sharePlatformTab, setSharePlatformTab] = useState<'whatsapp' | 'telegram'>('whatsapp');

  const referralCode = getUserReferralCode();
  const referralLink = getUserReferralLink();
  const displayLink = getReferralDisplayLink();
  const userReferrals = getUserReferrals();
  const totalEarned = user?.referralEarnings || userReferrals.length * 15000;
  const totalInvited = user?.referralCount || userReferrals.length;

  // Encouraging referral message tailored specifically for WhatsApp
  const whatsappEncouragingMessage =
    "🔥 Don't give up on your financial goals! Join 9jacash today with my referral link to claim your welcome bonus and start earning real cash. Fast withdrawals straight to your Nigerian bank account — take this bold step today and let's succeed together! 💰👇";
  const fullWhatsAppShareText = `${whatsappEncouragingMessage}\n\n${referralLink}`;

  // Telegram attached message
  const telegramMessage = 'join 9jacash using my referral link, I just got a 400k bonus and withdrawal';
  const fullTelegramShareText = `${telegramMessage} ${referralLink}`;

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(telegramMessage)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    const textToShare = sharePlatformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '9jacash Bonus & Referral',
          text: textToShare,
          url: referralLink,
        });
      } catch {
        copyFullShareMessage();
      }
    } else {
      copyFullShareMessage();
    }
  };

  const copyFullShareMessage = () => {
    const textToCopy = sharePlatformTab === 'whatsapp' ? fullWhatsAppShareText : fullTelegramShareText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 2000);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="py-2 space-y-4">
      <div>
        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>More Options</h2>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Account services &amp; referral dashboard</p>
      </div>

      {/* User Profile Card */}
      <div className={`p-4 rounded-3xl border space-y-3 shadow-md ${
        isLight
          ? 'bg-white border-amber-200/90 shadow-amber-500/5 text-slate-900'
          : 'bg-[#16171d] border-amber-500/20 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-bold text-lg shadow-md ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
            }`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  Tier {currentTier}
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{user?.email}</p>
              {user?.referralCode && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] font-semibold font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                    Referral: {user.referralCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30 text-amber-300'
            }`}
            title="Edit profile & username"
          >
            <Edit2 className="w-3 h-3 text-amber-500" />
            <span>Edit</span>
          </button>
        </div>

        {/* Tier Status & Limit Notice if user reached Tier 1 ₦400,000 limit */}
        {isTier1LimitReached && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-300">
                    Tier 1 Limit Reached (₦400,000)
                  </p>
                  <p className="text-[10px] text-stone-300">
                    Earning page locked. Upgrade to Tier 2 to expand wallet capacity to ₦2,000,000.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUpgradeTier}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Tier 2 (₦6,600)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* REFERRAL SYSTEM SECTION ON THE MORE PAGE */}
      <div className={`p-4 rounded-3xl border space-y-3.5 shadow-xl ${
        isLight
          ? 'bg-white border-amber-300 shadow-amber-500/5'
          : 'bg-gradient-to-r from-[#171922] via-[#1a1c25] to-[#171821] border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
            }`}>
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Referral Program
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                  isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  ₦1,500 / Ref
                </span>
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Earn instant cash per invited friend</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenReferrals}
            className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
              isLight ? 'text-amber-700 hover:text-amber-800' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Referral Link & Code Bars */}
        <div className="space-y-2.5">
          {/* Link with Copy & Share */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e0f14] border-amber-500/30'
          }`}>
            <div className="truncate">
              <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                Official Referral Link
              </span>
              <span className={`text-xs font-bold font-mono truncate select-all block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {displayLink}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={copyReferralLink}
                className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className={`py-1.5 px-2.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                    : 'bg-[#1b1d28] hover:bg-[#252838] border-stone-700 text-stone-200'
                }`}
                title="Share referral link"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Social Share with Attached Message Card */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d0e14] border-stone-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}>
                <Share2 className="w-3 h-3 text-amber-500" />
                <span>Share with Message</span>
              </span>

              {/* Platform Switcher */}
              <div className={`flex items-center gap-1 p-0.5 rounded-xl border ${
                isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-[#14151e] border-stone-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setSharePlatformTab('whatsapp')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    sharePlatformTab === 'whatsapp'
                      ? 'bg-[#25D366] text-white shadow-sm'
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-stone-400 hover:text-stone-200')
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setSharePlatformTab('telegram')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    sharePlatformTab === 'telegram'
                      ? 'bg-[#0088cc] text-white shadow-sm'
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-stone-400 hover:text-stone-200')
                  }`}
                >
                  Telegram
                </button>
              </div>
            </div>

            {/* Attached Message Quote */}
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#14151e] border-stone-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-semibold flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  {sharePlatformTab === 'whatsapp' ? (
                    <span className="text-emerald-600 font-bold">✨ Encouraging WhatsApp Message:</span>
                  ) : (
                    <span className="text-sky-600 font-bold">📢 Telegram Message:</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={copyFullShareMessage}
                  className={`text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {copiedFullMessage ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFullMessage ? 'Copied!' : 'Copy Msg + Link'}</span>
                </button>
              </div>
              <p className={`text-xs italic font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-stone-200'}`}>
                &ldquo;{sharePlatformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage}&rdquo;
              </p>
            </div>

            {/* Direct WhatsApp and Telegram Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.076-2.001-.466-1.579-.654-2.587-2.275-2.666-2.381-.078-.105-.635-.845-.635-1.61 0-.764.4-1.14.542-1.295.143-.156.312-.195.416-.195.105 0 .209.001.299.006.096.005.224-.036.35.268.13.313.443 1.077.482 1.155.039.078.065.17.013.273-.052.104-.078.169-.156.26-.078.091-.163.204-.233.274-.078.077-.16.16-.068.317.091.156.406.669.871 1.083.598.533 1.102.698 1.258.776.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.909.429 1.065.507.156.078.26.117.299.182.039.065.039.377-.105.782z" />
                </svg>
                <span>Share WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs shadow-md shadow-[#0088cc]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .34z" />
                </svg>
                <span>Share Telegram</span>
              </button>
            </div>
          </div>

          {/* Special Offer Highlight Notice on More Page */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
            isLight
              ? 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border-amber-300'
              : 'bg-gradient-to-r from-amber-500/15 via-[#1c1a15] to-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className={`text-xs font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                  Special Offer: Free Quick Code
                </p>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                  Refer 50 users to claim a 100% Free Quick Code &amp; withdraw cash!
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-mono font-extrabold shrink-0 px-2 py-1 rounded-lg border ${
              isLight ? 'bg-white border-amber-300 text-amber-900 shadow-xs' : 'bg-black/40 border-amber-500/30 text-amber-400'
            }`}>
              {totalInvited} / 50
            </span>
          </div>

          {/* Code */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e0f14] border-stone-800'
          }`}>
            <div>
              <span className={`text-[9px] uppercase font-semibold block ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                Referral Code
              </span>
              <span className={`text-xs font-extrabold font-mono tracking-wider ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                {referralCode}
              </span>
            </div>

            <button
              type="button"
              onClick={copyReferralCode}
              className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-xs' : 'bg-[#1a1c24] hover:bg-stone-700 text-stone-300'
              }`}
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Referral Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className={`p-2.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#13141b] border-stone-800/80'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Invited Friends</span>
            <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalInvited}</span>
          </div>
          <div className={`p-2.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#13141b] border-stone-800/80'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Total Cash Earned</span>
            <span className={`text-base font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatNaira(totalEarned)}</span>
          </div>
        </div>
      </div>

      {/* App Appearance / Light Mode Toggle Card */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 ${
          isLight
            ? 'bg-white border-amber-300/80 shadow-md shadow-amber-500/10'
            : 'bg-[#16171d] border-stone-800/80 hover:border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-amber-100 text-amber-600 shadow-inner'
                  : 'bg-stone-800/80 text-amber-400'
              }`}
            >
              {isLight ? (
                <Sun className="w-5 h-5 text-amber-600 animate-spin-slow" />
              ) : (
                <Moon className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {isLight ? 'Light Mode (Clear View)' : 'Dark Mode (Obsidian)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border border-amber-300/60'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  {isLight ? 'Active' : 'Standard'}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                {isLight
                  ? 'Crisp daylight contrast with floating ₦1,000 notes'
                  : 'Turn on light mode for clear view across the app'}
              </p>
            </div>
          </div>

          {/* Interactive Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isLight}
            aria-label="Toggle Light Mode"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isLight ? 'bg-amber-500' : 'bg-stone-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isLight ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {isLight ? (
                <Sun className="h-3.5 w-3.5 text-amber-600 stroke-[2.5]" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-stone-700 stroke-[2.5]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {/* Referral Details Menu Item */}
        <button
          type="button"
          onClick={onOpenReferrals}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer group ${
            isLight
              ? 'bg-white border-amber-300/80 hover:bg-amber-50/50 text-slate-800 shadow-xs'
              : 'bg-[#16171d] border-amber-500/20 hover:bg-[#1f212a] text-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-amber-500" />
            <span className={isLight ? 'group-hover:text-amber-800' : 'group-hover:text-white'}>Referral Details &amp; History</span>
          </div>
          <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-stone-500'}`} />
        </button>

        {/* Show Upgrade Tier menu item if Tier 1 limit is reached or user is on Tier 1 */}
        {isTier1LimitReached && (
          <button
            type="button"
            onClick={onOpenUpgradeTier}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer group animate-in fade-in ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-slate-900 shadow-xs'
                : 'bg-[#16171d] border-amber-500/40 hover:bg-[#1f212a] text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isLight ? 'text-amber-900 group-hover:text-amber-700' : 'text-amber-400 group-hover:text-amber-300'}`}>
                    Upgrade to Tier 2
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-bold">
                    Action Required
                  </span>
                </div>
                <p className={`text-[10px] font-normal ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                  Unlock Earning page &amp; expand limit to ₦2,000,000
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </button>
        )}

        {/* Profile & Settings (Change Username) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer group ${
            isLight
              ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-xs'
              : 'bg-[#16171d] border-stone-800/80 hover:bg-[#1f212a] text-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
              isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className={`block font-bold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Profile &amp; Settings</span>
              <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Change username, security PIN &amp; preferences</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 transition-colors ${isLight ? 'text-slate-400 group-hover:text-amber-600' : 'text-stone-500 group-hover:text-amber-400'}`} />
        </button>

        {/* Earner Profile & Pass */}
        <button
          type="button"
          onClick={onOpenAccountDetails}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer group ${
            isLight
              ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-xs'
              : 'bg-[#16171d] border-stone-800/80 hover:bg-[#1f212a] text-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
              isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className={`block font-bold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Earner Profile &amp; Pass</span>
              <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>View official credentials &amp; active quick codes</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 transition-colors ${isLight ? 'text-slate-400 group-hover:text-amber-600' : 'text-stone-500 group-hover:text-amber-400'}`} />
        </button>

        <button
          type="button"
          onClick={onOpenTerms}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-xs'
              : 'bg-[#16171d] border-stone-800/80 hover:bg-[#1f212a] text-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <span>Terms of Service &amp; Privacy</span>
          </div>
          <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-stone-500'}`} />
        </button>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border ${
            isLight
              ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700 shadow-sm'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
          }`}
        >
          <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
