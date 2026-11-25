import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Lock,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface KycNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToKyc: () => void;
  pendingWithdrawal?: {
    amount: number;
    bank: string;
    accountNumber: string;
    reference: string;
    date?: string;
  } | null;
  userName?: string;
}

export const KycNoticeModal: React.FC<KycNoticeModalProps> = ({
  isOpen,
  onClose,
  onProceedToKyc,
  pendingWithdrawal,
  userName,
}) => {
  const { appPricing, formatNaira } = useAuth();
  const { isLight } = useTheme();
  const kycFee = appPricing?.kycPrice ?? 22000;
  if (!isOpen) return null;

  const formattedAmount = pendingWithdrawal?.amount
    ? `₦${pendingWithdrawal.amount.toLocaleString()}`
    : 'your withdrawal';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/50' : 'bg-black/85'
      }`}
    >
      {/* Container Card */}
      <div
        className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-amber-400 text-slate-900 shadow-amber-500/15'
            : 'bg-[#14151c] border-amber-500/40 text-white'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-2xl pointer-events-none ${
            isLight
              ? 'bg-gradient-to-b from-amber-300/35 via-amber-200/15 to-transparent'
              : 'bg-gradient-to-b from-amber-500/25 via-amber-600/10 to-transparent'
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer z-10 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              : 'bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white'
          }`}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center pt-1 space-y-2.5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 text-black font-extrabold border border-white/20">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>
            {/* Pulsing Alert Dot */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              Withdrawal on Pending Status
            </div>
            <h2
              className={`text-xl font-extrabold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Activate Account KYC
            </h2>
            <p
              className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${
                isLight ? 'text-slate-600 font-medium' : 'text-stone-300'
              }`}
            >
              {userName ? `Hello ${userName}, ` : ''}
              Your withdrawal of{' '}
              <strong className={isLight ? 'text-amber-700' : 'text-amber-400'}>
                {formattedAmount}
              </strong>{' '}
              is on pending hold. Complete your one-time KYC verification to release and disburse funds.
            </p>
          </div>
        </div>

        {/* Withdrawal Details Summary */}
        {pendingWithdrawal && (
          <div
            className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0f1014] border-stone-800/90'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                Pending Withdrawal:
              </span>
              <span
                className={`font-extrabold font-mono text-sm ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                {formattedAmount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                Destination Account:
              </span>
              <span
                className={`font-medium truncate max-w-[170px] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {pendingWithdrawal.bank} ({pendingWithdrawal.accountNumber})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                Required Action:
              </span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isLight ? 'text-amber-700' : 'text-amber-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                KYC Account Clearance
              </span>
            </div>
          </div>
        )}

        {/* Security / Value Highlights */}
        <div
          className={`p-3 rounded-2xl border space-y-2 text-[11px] ${
            isLight
              ? 'bg-amber-50/60 border-amber-200 text-slate-700'
              : 'bg-[#181922] border-amber-500/20 text-stone-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isLight
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <span>
              <strong>Immediate Clearance:</strong> Your pending withdrawal will be approved and sent to your bank.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isLight
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <Zap className="w-3 h-3" />
            </div>
            <span>
              <strong>One-Time Activation:</strong> KYC clearance fee of <strong>{formatNaira(kycFee)}</strong> covers lifetime unlimited payouts.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isLight
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              <Lock className="w-3 h-3" />
            </div>
            <span>
              <strong>Bank-Grade Safety:</strong> Protects your account against unauthorized external transfers.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Proceed Button */}
          <button
            type="button"
            onClick={onProceedToKyc}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer transform active:scale-[0.98]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Proceed to Activate KYC ({formatNaira(kycFee)})</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          {/* Continue / Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-stone-800/70 hover:bg-stone-700/80 text-stone-300 hover:text-white border-stone-700/60'
            }`}
          >
            <span>Remind Me Later</span>
          </button>
        </div>

        {/* Small Footnote */}
        <p className={`text-[10px] text-center ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
          Official 9jacash Security Compliance • 24/7 Verification
        </p>
      </div>
    </div>
  );
};
