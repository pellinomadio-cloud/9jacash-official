import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Check,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';

interface TaxApprovedTier3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToUpgrade: () => void;
  withdrawalAmount?: number;
  destinationBank?: string;
  destinationAccountNumber?: string;
  reference?: string;
}

export const TaxApprovedTier3Modal: React.FC<TaxApprovedTier3ModalProps> = ({
  isOpen,
  onClose,
  onProceedToUpgrade,
  withdrawalAmount,
  destinationBank,
  destinationAccountNumber,
  reference,
}) => {
  const { isLight } = useTheme();
  const { user, formatNaira, depositRequests } = useAuth();

  const existingApprovedTaxReq = depositRequests.find(
    (r) => r.userId === user?.id && r.requestType === 'tax_payment' && r.status === 'approved'
  );

  const amount =
    withdrawalAmount ||
    user?.lastWithdrawal?.amount ||
    existingApprovedTaxReq?.withdrawalAmount ||
    user?.withdrawalAccount?.amount ||
    100000;

  const bank =
    destinationBank ||
    user?.lastWithdrawal?.bank ||
    existingApprovedTaxReq?.destinationBank ||
    user?.withdrawalAccount?.bank ||
    'Bank Account';

  const accNumber =
    destinationAccountNumber ||
    user?.lastWithdrawal?.accountNumber ||
    existingApprovedTaxReq?.destinationAccountNumber ||
    user?.withdrawalAccount?.accountNumber ||
    '';

  const txRef =
    reference ||
    user?.lastWithdrawal?.reference ||
    existingApprovedTaxReq?.reference ||
    `TX-${(user?.id || '9JA').slice(0, 6).toUpperCase()}`;

  useEffect(() => {
    if (isOpen) {
      soundFx.playSuccess();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`relative w-full max-w-md rounded-3xl border-2 p-5 sm:p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-white border-amber-400 text-slate-900 shadow-amber-500/20'
            : 'bg-gradient-to-b from-[#181926] via-[#12131e] to-[#0d0e17] border-amber-500/50 text-white shadow-2xl'
        }`}
      >
        {/* Glow Spheres */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-amber-300/30' : 'bg-amber-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-emerald-300/30' : 'bg-emerald-500/15'
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-colors cursor-pointer z-20 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
              : 'bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white border-stone-700'
          }`}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 space-y-4">
          {/* Header Celebratory Badge */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Tax Approved &amp; Disbursed
              </div>
              <h2 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Withdrawal Successful! 🎉
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Your 11.9% statutory tax payment has been approved and your withdrawal has been cleared to your bank!
              </p>
            </div>
          </div>

          {/* Transaction Summary Card */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151622] border-stone-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Amount Disbursed:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-base">
                {formatNaira(amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Destination:</span>
              <span className={`font-semibold flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                {bank} {accNumber ? `(${accNumber})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference:</span>
              <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                {txRef}
              </span>
            </div>
            <div
              className={`flex justify-between items-center pt-1.5 border-t ${
                isLight ? 'border-slate-200' : 'border-stone-800/80'
              }`}
            >
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Disbursement Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Credited Successfully
              </span>
            </div>
          </div>

          {/* Tier 3 Upgrade Notice Card */}
          <div
            className={`p-4 rounded-3xl border-2 space-y-3 ${
              isLight
                ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/80 border-amber-300 text-slate-900 shadow-sm'
                : 'bg-gradient-to-br from-[#1d1b28] via-[#171622] to-[#12131d] border-amber-500/50 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-amber-950' : 'text-amber-400'}`}>
                    Account Upgrade Recommended
                  </h4>
                  <p className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Upgrade to Tier 3 Account (VIP)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  One-time Fee
                </span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  ₦15,000
                </span>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              To unlock <strong>unlimited wallet capacity</strong>, prevent holding caps, and guarantee instant automated priority payouts on all your subsequent withdrawals, please upgrade your 9jacash account to <strong>Tier 3</strong>.
            </p>

            <div
              className={`p-2.5 rounded-2xl border space-y-1.5 text-[11px] ${
                isLight ? 'bg-white border-amber-200 text-slate-700' : 'bg-black/30 border-amber-500/20 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Unlimited wallet capacity: No balance caps or freeze</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Instant automated lifetime withdrawal clearance</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>100% direct credit of all earnings &amp; quiz rewards</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onProceedToUpgrade}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-98 border border-amber-200"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Tier 3 Now (₦15,000)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
