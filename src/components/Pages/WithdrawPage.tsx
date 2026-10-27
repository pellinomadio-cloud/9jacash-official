import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Hash,
  Clock,
  Zap,
  ShoppingCart,
  Users,
  Info,
  Sparkles,
} from 'lucide-react';
import { BankVerificationWidget } from '../Common/BankVerificationWidget.tsx';
import { sendWithdrawalDeviceNotification } from '../../utils/deviceNotifications.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface WithdrawPageProps {
  onBack: () => void;
  onProceedToKyc?: () => void;
  onNavigateToQuickCode?: () => void;
  onProceedToTaxClearance?: () => void;
  onProceedToMembership?: () => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({
  onBack,
  onProceedToKyc,
  onNavigateToQuickCode,
  onProceedToTaxClearance,
  onProceedToMembership,
}) => {
  const { user, formatNaira, withdrawFunds, depositRequests, appPricing } = useAuth();
  const { isLight } = useTheme();
  const kycFee = appPricing?.kycPrice ?? 22000;
  const [selectedBank, setSelectedBank] = useState('GTBank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingKyc, setIsPendingKyc] = useState(false);
  const [isRequiresTax, setIsRequiresTax] = useState(false);
  const [successReference, setSuccessReference] = useState('');
  const [withdrawnAmount, setWithdrawnAmount] = useState<number | null>(null);

  const hasPendingQuickCode = (depositRequests || []).some(
    (r) => r.userId === user?.id && r.requestType === 'quickcode' && r.status === 'pending'
  );

  const hasPurchasedCode = Boolean(
    (user?.quickCodes && user.quickCodes.length > 0) ||
    (depositRequests || []).some(
      (r) => r.userId === user?.id && r.requestType === 'quickcode' && r.status === 'approved'
    )
  );

  if (!user) return null;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount < 100000) {
      setError('Minimum withdrawal amount is ₦100,000');
      return;
    }
    if (numAmount > user.balance) {
      setError('Insufficient funds in your 9jacash balance');
      return;
    }
    if (accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit NUBAN account number');
      return;
    }
    if (!accountName.trim()) {
      setError('Please enter the account name');
      return;
    }
    if (!quickCode.trim()) {
      setError('Please enter your Quick Code to authorize withdrawal');
      return;
    }

    // Process withdrawal atomically (verifies quick code, decrements usage/expires it, updates balance & logs tx)
    const result = withdrawFunds({
      bank: selectedBank,
      accountNumber,
      accountName,
      amount: numAmount,
      quickCode,
    });

    if (!result.success) {
      setError(result.message || 'Invalid or expired Quick Code. Please enter a valid active Quick Code.');
      return;
    }

    setWithdrawnAmount(numAmount);
    setIsPendingKyc(!!result.requiresKyc);
    setIsRequiresTax(!!result.requiresTax);
    setSuccessReference(result.lastWithdrawal?.reference || ('TX9JA' + Math.floor(1000000000 + Math.random() * 9000000000)));
    setIsSuccess(true);
  };

  const setPresetPercentage = (pct: number) => {
    const val = Math.floor(user.balance * pct);
    setAmount(val.toString());
  };

  return (
    <div className="min-h-screen pb-12 space-y-4">
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
            Withdraw to Bank <CreditCard className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Transfer funds using your Quick Code authorization</p>
        </div>
      </div>

      {isSuccess && withdrawnAmount ? (
        isPendingKyc ? (
          /* Normal User Pending KYC Notice Screen */
          <div className={`p-6 rounded-3xl border text-center space-y-4 animate-in fade-in shadow-2xl ${
            isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-[#14151b] border-amber-500/40 text-white'
          }`}>
            <div className="relative w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500">
              <Clock className="w-8 h-8 animate-spin" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <Clock className="w-3 h-3 text-amber-500" /> Withdrawal on Pending Hold
              </div>
              <h2 className={`text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Activate KYC to Complete</h2>
              <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Your withdrawal of <strong className="text-amber-600 font-bold">{formatNaira(withdrawnAmount)}</strong> is in pending status. Activate your account KYC verification ({formatNaira(kycFee)}) to clear and complete disbursement.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 text-left text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#1c1e26] border-stone-800 text-stone-300'
            }`}>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Withdrawal Amount:</span>
                <span className="text-amber-600 font-extrabold text-base font-mono">
                  {formatNaira(withdrawnAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Destination:</span>
                <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedBank} ({accountNumber})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Name:</span>
                <span className={`font-medium truncate max-w-[170px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {accountName.toUpperCase()}
                </span>
              </div>
              <div className={`flex justify-between items-center pt-1 border-t ${isLight ? 'border-slate-200' : 'border-stone-800/80'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Withdrawal Status:</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending KYC Clearance
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onProceedToKyc) {
                    onProceedToKyc();
                  } else {
                    onBack();
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Activate KYC ({formatNaira(kycFee)})</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                type="button"
                onClick={onBack}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs border cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
                }`}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : isRequiresTax ? (
          /* ACTION REQUIRED SCREEN FOR KYC VERIFIED USER */
          <div className={`p-6 rounded-3xl border-2 text-center space-y-4 animate-in fade-in shadow-2xl ${
            isLight ? 'bg-white border-amber-400 text-slate-900' : 'bg-[#14151b] border-amber-500/50 text-white'
          }`}>
            <div className="relative w-16 h-16 mx-auto rounded-full bg-amber-500/15 border-2 border-amber-500/60 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/20">
              <ShieldAlert className="w-8 h-8 animate-pulse text-amber-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-[10px] shadow-md animate-bounce">
                !
              </div>
            </div>

            <div className="space-y-1.5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${
                isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>ACTION REQUIRED • 99% COMPLETED</span>
              </div>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Action Required on Withdrawal</h2>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Your withdrawal has been registered and is <strong className="text-amber-600 font-mono">99% approved</strong>. Statutory financial clearing regulations require an <strong>11.9% tax fee ({formatNaira(Math.round(withdrawnAmount * 0.119))})</strong> remittance to the company account before bank disbursement.
              </p>
            </div>

            {/* Withdrawal & Tax Fee Breakdown Card */}
            <div className={`p-4 rounded-2xl border space-y-2.5 text-left text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e28] border-stone-800'
            }`}>
              <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Withdrawal Amount:</span>
                <span className={`font-extrabold text-base font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatNaira(withdrawnAmount)}
                </span>
              </div>
              <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Destination Bank:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedBank} ({accountNumber})
                </span>
              </div>
              <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Account Name:</span>
                <span className="text-emerald-600 font-bold truncate max-w-[170px]">
                  {accountName.toUpperCase()}
                </span>
              </div>
              <div className={`flex justify-between items-center pt-2 border-t font-sans font-bold ${
                isLight ? 'border-slate-200 text-amber-800' : 'border-stone-800 text-amber-300'
              }`}>
                <span>Statutory Tax Fee (11.9%):</span>
                <span className="text-amber-600 font-black text-base font-mono">
                  {formatNaira(Math.round(withdrawnAmount * 0.119))}
                </span>
              </div>
              <div className={`flex justify-between items-center pt-1 border-t ${isLight ? 'border-slate-200' : 'border-stone-800/80'}`}>
                <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Withdrawal Status:</span>
                <span className="text-amber-600 font-bold font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Action Required: Tax Clearance
                </span>
              </div>
            </div>

            {/* Proceed to Tax Clearance Page CTA */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onProceedToTaxClearance) {
                    onProceedToTaxClearance();
                  } else if (onProceedToMembership) {
                    onProceedToMembership();
                  } else {
                    onBack();
                  }
                }}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] border border-amber-200"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Proceed to Tax Clearance (99% Done)</span>
                <ArrowRight className="w-4 h-4 ml-auto stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={onBack}
                className={`w-full py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-colors ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
                }`}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* SMOOTH SUCCESSFUL WITHDRAWAL SCREEN */
          <div className={`p-6 rounded-3xl border text-center space-y-5 animate-in fade-in shadow-2xl ${
            isLight ? 'bg-white border-emerald-300 text-slate-900' : 'bg-[#14151b] border-emerald-500/40 text-white'
          }`}>
            <div className="relative w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
                ✓
              </div>
            </div>

            <div className="space-y-1.5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Withdrawal Successful</span>
              </div>
              <h2 className={`text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Funds Transferred Successfully!</h2>
              <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Your withdrawal request of <strong className="text-emerald-600 font-bold">{formatNaira(withdrawnAmount)}</strong> has been authorized and disbursed to your bank account.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className={`p-4 rounded-2xl border space-y-2.5 text-left text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Amount Paid:</span>
                <span className="text-emerald-600 font-extrabold text-lg font-mono">
                  {formatNaira(withdrawnAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Destination Bank:</span>
                <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedBank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Number:</span>
                <span className={`font-mono font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Name:</span>
                <span className={`font-medium truncate max-w-[180px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {accountName.toUpperCase()}
                </span>
              </div>
              {successReference && (
                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Transaction Ref:</span>
                  <span className={`font-mono text-[11px] truncate max-w-[170px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                    {successReference}
                  </span>
                </div>
              )}
              <div className={`flex justify-between items-center pt-2 border-t ${isLight ? 'border-slate-200' : 'border-stone-800/80'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Payment Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Disbursed / Completed
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>
        )
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Balance card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#15161c] border-stone-800'
          }`}>
            <div>
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Available for Withdrawal
              </span>
              <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`} data-balance-text>
                {formatNaira(user.balance)}
              </span>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              Instant Settlement
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bank Verification Widget */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#15161c] border-stone-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              Destination Bank Account
            </span>
            <BankVerificationWidget
              onVerified={(data) => {
                setSelectedBank(data.bank.name);
                setAccountNumber(data.accountNumber);
                setAccountName(data.accountName);
                setError('');
              }}
              onClear={() => {
                setAccountName('');
              }}
            />
          </div>

          {/* Amount */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#15161c] border-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>Amount (₦)</label>
              <div className="flex gap-1">
                {[0.25, 0.5, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPresetPercentage(pct)}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer border ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-stone-800 hover:bg-amber-500/20 text-amber-400 border-stone-700'
                    }`}
                  >
                    {pct === 1 ? '100%' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            {hasPurchasedCode && (
              <div className={`mb-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Minimum withdrawal: <strong className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>₦100,000</strong></span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  Code Active
                </span>
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-amber-500">₦</span>
              <input
                type="number"
                min={hasPurchasedCode ? "100000" : "100"}
                max={user.balance}
                placeholder={hasPurchasedCode ? "100000" : "0.00"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-9 pr-4 py-3 rounded-xl text-base font-bold focus:outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-[#1c1e26] border-stone-800 text-white placeholder-stone-500 focus:border-amber-500'
                }`}
                required
              />
            </div>
            {hasPurchasedCode && (
              <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Withdrawal requests must be at least ₦100,000.
              </p>
            )}
          </div>

          {/* Quick Code Authorization */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#15161c] border-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                Quick Code Authorization
              </label>
              {onNavigateToQuickCode ? (
                <button
                  type="button"
                  onClick={onNavigateToQuickCode}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 shadow-md ${
                    hasPendingQuickCode
                      ? 'text-amber-300 bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30'
                      : 'text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border-amber-200 shadow-amber-400/30'
                  }`}
                >
                  {hasPendingQuickCode ? (
                    <>
                      <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Code Under Review</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3 h-3" />
                      <span>Buy Quick Code</span>
                    </>
                  )}
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              ) : (
                <span className="text-[11px] text-amber-500 font-semibold">
                  {hasPendingQuickCode ? 'Code Under Review' : 'Buy Quick Code'}
                </span>
              )}
            </div>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input
                type="text"
                placeholder="Enter Quick Code"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold tracking-widest focus:outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-[#1c1e26] border-stone-800 text-white placeholder-stone-500 focus:border-amber-500'
                }`}
                required
              />
            </div>

            {/* Notice if user has a pending Quick Code request */}
            {hasPendingQuickCode && (
              <div className={`mt-2 p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200/90'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Quick Code payment pending review. Cannot purchase another code until attended to.</span>
                </div>
                {onNavigateToQuickCode && (
                  <button
                    type="button"
                    onClick={onNavigateToQuickCode}
                    className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors"
                  >
                    View Status
                  </button>
                )}
              </div>
            )}
            {/* Quick autofill helper chips if user has active quick codes */}
            {user?.quickCodes && user.quickCodes.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Tap to insert:</span>
                {user.quickCodes.map((item, idx) => {
                  const isStr = typeof item === 'string';
                  const code = isStr ? item : item.code;
                  const left = isStr ? 1 : item.withdrawalsLeft;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickCode(code)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        quickCode === code
                          ? 'bg-amber-400 text-black border-amber-400'
                          : isLight
                          ? 'bg-slate-100 text-slate-800 border-slate-200 hover:border-amber-400'
                          : 'bg-[#181920] text-amber-400 border-amber-500/30 hover:border-amber-400'
                      }`}
                    >
                      <span>{code}</span>
                      <span className="text-[9px] opacity-80">({left} left)</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Withdrawal Button: Bold, high-contrast, perfectly matched for both light and dark mode with little touch of green */}
          <button
            type="submit"
            className={`w-full mt-2 py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all group shadow-xl ${
              isLight
                ? 'bg-slate-950 hover:bg-black text-white border-2 border-emerald-400 ring-2 ring-emerald-400/60 shadow-emerald-500/15'
                : 'bg-black hover:bg-stone-900 text-white border-2 border-white ring-2 ring-emerald-400/60 shadow-black/80'
            }`}
          >
            <span className="text-white font-extrabold tracking-wide">Complete Withdrawal</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      )}
    </div>
  );
};
