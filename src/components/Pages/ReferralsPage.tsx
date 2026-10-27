import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  TrendingUp,
  Sparkles,
  UserCheck,
  Calendar,
  Hash,
} from 'lucide-react';

interface ReferralsPageProps {
  onBack: () => void;
}

export const ReferralsPage: React.FC<ReferralsPageProps> = ({ onBack }) => {
  const {
    user,
    formatNaira,
    getUserReferrals,
    getUserReferralCode,
    getUserReferralLink,
    getReferralDisplayLink,
  } = useAuth();
  const { isLight } = useTheme();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState(false);
  const [sharePlatformTab, setSharePlatformTab] = useState<'whatsapp' | 'telegram'>('whatsapp');

  const referralCode = getUserReferralCode();
  const referralLink = getUserReferralLink();
  const displayLink = getReferralDisplayLink();
  const referralsList = getUserReferrals();

  const totalReferralEarnings = user?.referralEarnings || referralsList.length * 15000;
  const totalInvited = Math.max(user?.referralCount || 0, referralsList.length);

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

  // Encouraging referral message tailored specifically for WhatsApp
  const whatsappEncouragingMessage =
    "🔥 Don't give up on your financial goals! Join 9jacash today with my referral link to claim your welcome bonus and start earning real cash. Fast withdrawals straight to your Nigerian bank account — take this bold step today and let's succeed together! 💰👇";
  const fullWhatsAppShareText = `${whatsappEncouragingMessage}\n\n${referralLink}`;

  // Telegram attached message
  const telegramMessage = 'join 9jacash using my referral link, I just got a 400k bonus and withdrawal';
  const fullTelegramShareText = `${telegramMessage} ${referralLink}`;

  const shareReferral = () => {
    const textToShare = sharePlatformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage;
    if (navigator.share) {
      navigator.share({
        title: '9jacash 400k Bonus & Free Quick Code',
        text: textToShare,
        url: referralLink,
      }).catch(() => {
        copyFullShareText();
      });
    } else {
      copyFullShareText();
    }
  };

  const copyFullShareText = () => {
    const textToCopy = sharePlatformTab === 'whatsapp' ? fullWhatsAppShareText : fullTelegramShareText;
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

  return (
    <div className="min-h-screen pb-16 space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <button
          type="button"
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
              : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Refer &amp; Earn Rewards <Sparkles className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Earn ₦15,000 per friend &amp; your friend gets ₦7,000
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-5 shadow-xl text-white ${
        isLight
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 border border-amber-400'
          : 'bg-gradient-to-r from-[#17181f] via-[#241f16] to-[#2c2212] border border-amber-500/40'
      }`}>
        <div className="relative z-10 space-y-2 max-w-[70%]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
            REFERRAL PROGRAM
          </span>
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Get ₦15,000 Instant Bonus
          </h2>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            Give your unique code to friends. When they register, you receive ₦15,000 cash and they receive a ₦7,000 welcome bonus straight to their wallet!
          </p>
        </div>

        <div className="absolute -right-2 -bottom-2 w-28 h-28 opacity-90 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-white/20 border border-white/30 flex items-center justify-center text-white rotate-12 shadow-2xl backdrop-blur-xs">
            <Gift className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Referral Link & Code Box */}
      <div className={`p-4 rounded-3xl border space-y-4 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141620] border-stone-800'
      }`}>
        {/* Main Referral Link */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              Your Unique Referral Link
            </label>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              Auto-Fills Code
            </span>
          </div>

          <div className={`p-3 rounded-2xl flex items-center justify-between gap-2 border ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-[#0d0e13] border-stone-700/80 shadow-inner'
          }`}>
            <span className={`font-mono text-xs font-bold truncate select-all ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              {displayLink}
            </span>
            <button
              type="button"
              onClick={copyReferralLink}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Unique Referral Code */}
        <div>
          <label className={`text-xs font-semibold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            Your Referral Code
          </label>
          <div className={`p-3 rounded-2xl flex items-center justify-between gap-2 border ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-[#0d0e13] border-stone-700/80 shadow-inner'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-400/15 border-amber-400/30 text-amber-400'
              }`}>
                <Hash className="w-3.5 h-3.5" />
              </div>
              <span className={`font-mono text-sm font-black tracking-wider select-all ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={copyReferralCode}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-transparent'
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Pre-formatted Share Message Box with Platform Toggle */}
        <div className={`p-3.5 rounded-2xl border space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e0f14] border-stone-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>Share with Friends:</span>
            
            {/* Platform Selector Tabs */}
            <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-[10px] ${
              isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-stone-900 border-stone-800'
            }`}>
              <button
                type="button"
                onClick={() => setSharePlatformTab('whatsapp')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  sharePlatformTab === 'whatsapp'
                    ? 'bg-[#25D366] text-white shadow-sm'
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-stone-400 hover:text-white')
                }`}
              >
                WhatsApp Message
              </button>
              <button
                type="button"
                onClick={() => setSharePlatformTab('telegram')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  sharePlatformTab === 'telegram'
                    ? 'bg-[#0088cc] text-white shadow-sm'
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-stone-400 hover:text-white')
                }`}
              >
                Telegram Message
              </button>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border text-xs italic leading-relaxed ${
            isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#14151b] border-stone-800 text-stone-300'
          }`}>
            &ldquo;{sharePlatformTab === 'whatsapp' ? whatsappEncouragingMessage : telegramMessage}&rdquo;
          </div>

          {/* Direct Share Buttons */}
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyFullShareText}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-transparent'
              }`}
            >
              {copiedFullMessage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFullMessage ? 'Copied Full Message!' : 'Copy Full Message'}</span>
            </button>

            <button
              type="button"
              onClick={shareReferral}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-transparent'
              }`}
              title="More Share Options"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Special Offer Highlight Notice on Referrals Page */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border-amber-300'
            : 'bg-gradient-to-r from-amber-500/15 via-[#1c1a15] to-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-2.5">
            <Gift className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className={`text-xs font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                Special Offer: Free Quick Code
              </p>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Invite 50 friends to claim a 100% Free Quick Code &amp; withdraw cash!
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-extrabold shrink-0 px-2 py-1 rounded-lg border ${
            isLight ? 'bg-white border-amber-300 text-amber-900 shadow-xs' : 'bg-black/40 border-amber-500/30 text-amber-400'
          }`}>
            {totalInvited} / 50
          </span>
        </div>

        {user?.referredBy && (
          <div className={`pt-2 border-t text-[11px] flex items-center gap-1.5 ${
            isLight ? 'border-slate-200 text-slate-500' : 'border-stone-800/80 text-stone-400'
          }`}>
            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>You were referred by: <strong className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.referredBy}</strong></span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-3xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14151b] border-stone-800'
        }`}>
          <div className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Referrals</span>
          </div>
          <h3 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalInvited}</h3>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-stone-500'}`}>Friends registered</p>
        </div>

        <div className={`p-4 rounded-3xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14151b] border-stone-800'
        }`}>
          <div className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Earned</span>
          </div>
          <h3 className={`text-2xl font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {formatNaira(totalReferralEarnings)}
          </h3>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-stone-500'}`}>Paid to your balance</p>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            Referred Users ({referralsList.length})
          </h3>
        </div>

        {referralsList.length === 0 ? (
          <div className={`p-6 rounded-3xl border text-center space-y-2 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14151c] border-stone-800/80'
          }`}>
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
              isLight ? 'bg-slate-100 text-slate-400' : 'bg-stone-800/80 text-stone-500'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>No referrals yet</p>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Share your referral code above to start earning ₦15,000 per friend!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referralsList.map((refItem) => (
              <div
                key={refItem.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#14151c] border-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {refItem.referredUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{refItem.referredUserName}</h4>
                    <p className={`text-[10px] flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{refItem.date} • {refItem.time}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-extrabold block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    +{formatNaira(refItem.bonusAmount)}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                    isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    Bonus Credited
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
