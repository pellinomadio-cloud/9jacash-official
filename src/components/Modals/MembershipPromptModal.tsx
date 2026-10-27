import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  ArrowRight,
  Send,
  ExternalLink,
  Sparkles,
  Zap,
  Info,
  X,
  Building2,
} from 'lucide-react';
import { formatTelegramUrl } from '../../utils/telegram.ts';

interface MembershipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  withdrawalAmount?: number;
}

export const MembershipPromptModal: React.FC<MembershipPromptModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  withdrawalAmount,
}) => {
  const { user, formatNaira, communityLinks } = useAuth();

  // V Mode users are exempt from joining membership group after withdrawing unless admin explicitly required it
  if (!isOpen || !user || (user.isVMode && !user.requireMembership)) return null;

  const isAdminRequired = !!user.requireMembership;

  const rawSupportHandle =
    communityLinks?.agentTelegramHandle ||
    communityLinks?.agentTelegramUrl ||
    communityLinks?.telegramUrl ||
    'jacash1';
  const telegramHref = formatTelegramUrl(rawSupportHandle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#181924] via-[#14151e] to-[#0f1016] border border-amber-500/40 shadow-2xl shadow-amber-950/40 p-5 sm:p-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative space-y-4">
          {/* Header Icon & Status */}
          <div className="text-center space-y-2 pt-1">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 via-emerald-500/20 to-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
                <Users className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Withdrawal Success Highlight */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAdminRequired ? 'MEMBERSHIP MANDATORY • OFFICIAL NOTICE' : 'Withdrawal Successful • KYC Approved'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              Join the Membership Group to Confirm Your Bank Disbursement
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
              {isAdminRequired ? (
                <>
                  The 9jacash administration has enabled membership verification for your profile. To finalize clearance and disburse funds directly and instantly into your bank account, please join our official{' '}
                  <strong className="text-amber-300 font-bold">Membership Group</strong>.
                </>
              ) : (
                <>
                  Your withdrawal {withdrawalAmount ? `of ${formatNaira(withdrawalAmount)} ` : ''}is marked{' '}
                  <strong className="text-emerald-400 font-bold">Successful</strong>! To finalize clearance and disburse funds directly and instantly into your bank account, please join our official{' '}
                  <strong className="text-amber-300 font-bold">Membership Group</strong>.
                </>
              )}
            </p>
          </div>

          {/* Pricing Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300/80">
              One-Time Clearance Registration
            </span>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              ₦9,200 <span className="text-xs font-semibold text-stone-300">Only</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Pay into the official company account &amp; your withdrawal will be confirmed and sent directly to your bank instantly.
            </p>
          </div>

          {/* Quick Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-[#1b1c26] border border-stone-800 text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Zap className="w-3.5 h-3.5" /> Instant Bank Credit
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                Funds delivered straight to your verified NUBAN account.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1b1c26] border border-stone-800 text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Clearance
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                CBN interbank settlement protocol verification.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1b1c26] border border-stone-800 text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> Priority Earner
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                Active member status with 24/7 dedicated support.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onProceed}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>Proceed to Join Membership (₦9,200)</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Direct Agent Contact Button */}
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border border-[#229ed9]/40 text-[#229ed9] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-[#229ed9] text-black flex items-center justify-center text-[10px] font-black">
                <Info className="w-2.5 h-2.5" />
              </div>
              <span>Contact Agent Directly for Info ℹ️</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-80" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-300 font-medium transition-colors cursor-pointer"
            >
              Remind Me Later (Disbursement Will Remain Queued)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
