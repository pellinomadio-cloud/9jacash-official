import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
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
    <div className="min-h-screen pb-16 space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2 pb-3 border-b border-stone-800">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            Tax Clearance <ShieldCheck className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-stone-400">First Withdrawal Approval • 11.9% Statutory Clearance</p>
        </div>
      </div>

      {/* 99% DONE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1c2b] via-[#141522] to-[#0d0e17] border-2 border-amber-500/50 p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>99% APPROVAL REACHED</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              You are <span className="text-amber-400 font-mono">99% Done</span> with First Withdrawal Approval
            </h2>

            <p className="text-xs text-stone-300 leading-relaxed">
              Your withdrawal of <strong className="text-amber-400 font-mono">{formatNaira(withdrawalAmount)}</strong> is in its final approval stage. In compliance with statutory financial clearing regulations, a mandatory <strong>11.9% tax fee ({formatNaira(taxFeeAmount)})</strong> must be remitted to the company account before bank disbursement.
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
                stroke="#1f2433"
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
              <span className="text-2xl font-black text-amber-400 font-mono leading-none">99%</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 mt-0.5">COMPLETED</span>
            </div>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 grid grid-cols-4 gap-2 text-center select-none">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-5 h-5 mx-auto rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-[10px] mb-1">
              ✓
            </div>
            <span className="text-[10px] font-bold text-emerald-400 block truncate">1. Quick Code</span>
            <span className="text-[9px] text-stone-400">Verified</span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-5 h-5 mx-auto rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-[10px] mb-1">
              ✓
            </div>
            <span className="text-[10px] font-bold text-emerald-400 block truncate">2. KYC Check</span>
            <span className="text-[9px] text-stone-400">Approved</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/20 border-2 border-amber-500/60 shadow-lg shadow-amber-500/20">
            <div className="w-5 h-5 mx-auto rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-[10px] mb-1 animate-pulse">
              3
            </div>
            <span className="text-[10px] font-black text-amber-300 block truncate">3. Tax Fee</span>
            <span className="text-[9px] text-amber-400 font-extrabold">99% Done</span>
          </div>

          <div className="p-2 rounded-xl bg-[#11131c] border border-stone-800 opacity-60">
            <div className="w-5 h-5 mx-auto rounded-full bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-[10px] mb-1">
              4
            </div>
            <span className="text-[10px] font-bold text-stone-400 block truncate">4. Bank Payout</span>
            <span className="text-[9px] text-stone-500">Final Step</span>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL TRANSACTION SUMMARY */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#13151f] border border-stone-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Your Withdrawal Details
          </span>
          <span className="text-[11px] font-mono text-stone-400">Ref: {withdrawalRef}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#1a1c28] border border-stone-800/80">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Withdrawal Amount</span>
            <span className="text-lg font-black text-white font-mono">{formatNaira(withdrawalAmount)}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 block flex items-center gap-1">
              <span>Required Tax Fee (11.9%)</span>
            </span>
            <span className="text-lg font-black text-amber-400 font-mono">{formatNaira(taxFeeAmount)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181a24] border border-stone-800 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-stone-300">
            <span className="text-stone-400">Destination Bank:</span>
            <span className="text-white font-bold">{destinationBank}</span>
          </div>
          <div className="flex justify-between items-center text-stone-300">
            <span className="text-stone-400">Account Number:</span>
            <span className="text-white font-bold">{destinationAccountNumber}</span>
          </div>
          <div className="flex justify-between items-center text-stone-300">
            <span className="text-stone-400">Account Name:</span>
            <span className="text-emerald-400 font-bold truncate max-w-[190px]">{destinationAccountName}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-stone-800/80">
            <span className="text-stone-400 font-sans">Current Status:</span>
            <span className="text-amber-400 font-bold font-sans flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Action Required: 11.9% Tax Fee Payment
            </span>
          </div>
        </div>
      </div>

      {/* STRICT NO OPAY / PALMPAY WARNING BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/70 via-red-900/40 to-red-950/70 border-2 border-red-500 text-left space-y-2 shadow-xl shadow-red-950/40 animate-pulse">
        <div className="flex items-center gap-2 text-red-400 font-black text-xs sm:text-sm uppercase tracking-wide">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>STRICT NOTICE: DO NOT USE OPAY OR PALMPAY</span>
        </div>
        <p className="text-xs text-red-200 leading-relaxed font-medium">
          Payments made using <strong>OPay</strong> or <strong>PalmPay</strong> are <strong>strictly NOT accepted</strong> and will be rejected automatically by the statutory tax settlement network.
        </p>
        <p className="text-[11px] text-stone-300 leading-relaxed">
          Please transfer strictly using commercial banks or other approved financial institutions (e.g., <strong>GTBank, Zenith, Access, First Bank, UBA, Kuda, Moniepoint, Stanbic, FCMB</strong>). Any transfer initiated from OPay or PalmPay will fail automated verification.
        </p>
      </div>

      {/* OFFICIAL COMPANY ACCOUNT FOR TAX PAYMENT */}
      <div className="p-5 rounded-2xl bg-[#141622] border border-amber-500/40 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            Official Company Tax Clearing Account
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
            Direct Escrow
          </span>
        </div>

        <p className="text-[11px] text-stone-300 leading-relaxed">
          Transfer the exact <strong>11.9% tax fee of {formatNaira(taxFeeAmount)}</strong> to the designated company account below. Do not round up or down.
        </p>

        {/* Account Details Box */}
        <div className="p-4 rounded-xl bg-[#1a1c29] border border-stone-800/80 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400 font-sans">Bank Name:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{companyAccount?.bankName || 'Access Bank'}</span>
              <button
                type="button"
                onClick={() => handleCopy(companyAccount?.bankName || 'Access Bank', 'bank')}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
                title="Copy Bank Name"
              >
                {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-400 font-sans">Account Number:</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-400 text-base tracking-wider">
                {companyAccount?.accountNumber || '0123456789'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(companyAccount?.accountNumber || '0123456789', 'acc')}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedField === 'acc' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
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
            <span className="text-stone-400 font-sans">Account Name:</span>
            <span className="font-bold text-white text-xs truncate max-w-[200px]">
              {companyAccount?.accountName || '9jaCash Official Services'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <span className="text-stone-400 font-sans">Exact Tax Fee (11.9%):</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-400 text-base">{formatNaira(taxFeeAmount)}</span>
              <button
                type="button"
                onClick={() => handleCopy(taxFeeAmount.toString(), 'tax_amt')}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
                title="Copy Amount"
              >
                {copiedField === 'tax_amt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION / REVIEW STATUS SECTION */}
      {isPendingReview ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#191b29] to-[#121320] border-2 border-amber-500/60 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 text-amber-400" /> UNDER COMPLIANCE REVIEW (99% DONE)
            </div>
            <h3 className="text-lg font-black text-white">Tax Payment Submitted!</h3>
            <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
              Your 11.9% tax fee proof of <strong className="text-amber-400 font-mono">{formatNaira(taxFeeAmount)}</strong> is being verified by our compliance desk. Once confirmed, your withdrawal of <strong className="text-white font-mono">{formatNaira(withdrawalAmount)}</strong> will disburse directly to {destinationBank} ({destinationAccountNumber}).
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="p-3.5 rounded-xl bg-[#161824] border border-stone-800 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-stone-300">
              <span className="text-stone-400">Sender Bank:</span>
              <span className="text-white font-bold">{withdrawal?.taxSenderBank || existingPendingTaxReq?.senderBank || senderBank || 'Bank Transfer'}</span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span className="text-stone-400">Sender Name:</span>
              <span className="text-white font-bold">{withdrawal?.taxSenderName || existingPendingTaxReq?.senderAccountName || senderAccountName || user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span className="text-stone-400">Tax Proof:</span>
              <span className="text-emerald-400 font-bold truncate max-w-[180px]">{withdrawal?.taxReceiptName || existingPendingTaxReq?.receiptName || receiptName || 'Receipt Attached'}</span>
            </div>
            {(withdrawal?.taxSubmittedAt || existingPendingTaxReq?.submittedAt) && (
              <div className="flex justify-between items-center text-stone-400 pt-1 border-t border-stone-800/80 text-[11px]">
                <span>Submitted At:</span>
                <span>{new Date(withdrawal?.taxSubmittedAt || existingPendingTaxReq?.submittedAt || Date.now()).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              </div>
            )}
          </div>

          {(withdrawal?.taxProofUrl || existingPendingTaxReq?.receiptUrl || receiptUrl) && (
            <div className="p-2 rounded-xl bg-black/40 border border-stone-800">
              <span className="text-[10px] text-stone-400 block mb-1.5 font-sans font-bold">Uploaded Receipt Screenshot</span>
              <img
                src={withdrawal?.taxProofUrl || existingPendingTaxReq?.receiptUrl || receiptUrl}
                alt="Tax Payment Receipt"
                className="max-h-48 mx-auto rounded-lg object-contain border border-stone-700/60 shadow-md"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Return to Dashboard
            </button>
            {onNavigateToSupport && (
              <button
                type="button"
                onClick={onNavigateToSupport}
                className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Live Chat Support</span>
              </button>
            )}
          </div>
        </div>
      ) : isApproved ? (
        <div className="p-6 rounded-2xl bg-[#121c18] border-2 border-emerald-500/50 text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Tax Clearance Approved!</h3>
            <p className="text-xs text-stone-300">
              Your 11.9% statutory tax payment has been verified. Your withdrawal of {formatNaira(withdrawalAmount)} has been cleared and sent to {destinationBank} ({destinationAccountNumber}).
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs shadow-lg cursor-pointer"
          >
            Done • Back to Dashboard
          </button>
        </div>
      ) : (
        /* PROOF OF PAYMENT UPLOAD FORM */
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-[#13151f] border border-stone-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              Upload Tax Payment Receipt (Proof)
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              Amount: {formatNaira(taxFeeAmount)}
            </span>
          </div>

          {withdrawal?.taxDeclinedReason && !justSubmitted && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs space-y-1.5 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Previous Payment Proof Declined by Compliance Desk
              </div>
              <p className="text-[11px] text-stone-200">
                <strong>Reason given:</strong> {withdrawal.taxDeclinedReason}
              </p>
              <p className="text-[10px] text-stone-400">
                Please ensure you transfer from an authorized commercial bank (strictly no OPay or PalmPay) and upload a clear screenshot of your transfer receipt below.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sender Bank */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 block">
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
              className="w-full py-3 px-3.5 rounded-xl bg-[#1a1c28] border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
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
            <p className="text-[10px] text-stone-400">Strictly no OPay or PalmPay transfers allowed.</p>
          </div>

          {/* Sender Account Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 block">
              Sender Account Name (as shown on transfer)
            </label>
            <input
              type="text"
              value={senderAccountName}
              onChange={(e) => setSenderAccountName(e.target.value)}
              placeholder="e.g., ADENIJI BABATUNDE JOHN"
              className="w-full py-3 px-3.5 rounded-xl bg-[#1a1c28] border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-stone-500 uppercase"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">
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
                className="w-full py-6 px-4 rounded-xl border-2 border-dashed border-stone-700 hover:border-amber-400/70 bg-[#161824] hover:bg-[#1a1d2c] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Click to select receipt screenshot</span>
                  <span className="text-[10px] text-stone-400">PNG, JPG, or PDF up to 15MB</span>
                </div>
              </div>
            ) : (
              <div className="relative p-3 rounded-xl bg-[#161824] border border-stone-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={receiptUrl}
                    alt="Receipt thumbnail"
                    className="w-12 h-12 rounded-lg object-cover border border-stone-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{receiptName || 'tax_receipt.jpg'}</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
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
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer"
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
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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
      <div className="p-3.5 rounded-xl bg-[#10121a] border border-stone-800/80 text-center text-xs text-stone-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
          Need assistance with statutory tax remittance?
        </span>
        {onNavigateToSupport && (
          <button
            type="button"
            onClick={onNavigateToSupport}
            className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            Chat with Agent
          </button>
        )}
      </div>
    </div>
  );
};
