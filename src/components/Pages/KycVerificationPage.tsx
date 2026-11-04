import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Copy,
  Check,
  Upload,
  FileText,
  X,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';

interface KycVerificationPageProps {
  onBack: () => void;
}

export const KycVerificationPage: React.FC<KycVerificationPageProps> = ({ onBack }) => {
  const { isLight } = useTheme();
  const {
    user,
    companyAccount,
    formatNaira,
    submitDepositRequest,
    depositRequests,
    kycPendingWithdrawal,
    refreshAllUsers,
    appPricing,
  } = useAuth();

  const isKycVerified = !!user?.isKycVerified;

  // Ensure KYC withdrawal on hold belongs to this specific user only
  const userKycPendingWithdrawal =
    kycPendingWithdrawal && (!kycPendingWithdrawal.userId || kycPendingWithdrawal.userId === user?.id)
      ? kycPendingWithdrawal
      : null;

  // Find active pending KYC request if exists
  const existingPendingKycReq = depositRequests.find(
    (r) => r.userId === user?.id && r.requestType === 'kyc' && r.status === 'pending'
  );

  const [step, setStep] = useState<'form' | 'submitted_pending'>(
    existingPendingKycReq ? 'submitted_pending' : 'form'
  );
  const [activeRequest, setActiveRequest] = useState<DepositRequest | null>(
    existingPendingKycReq || null
  );
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isCompanyAccountSet = !!(
    companyAccount &&
    companyAccount.isConfigured &&
    companyAccount.accountNumber &&
    companyAccount.bankName
  );

  const kycFee = appPricing?.kycPrice ?? 22000;

  const copyAccount = () => {
    navigator.clipboard.writeText(companyAccount.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptName(file.name);
      setError('');

      try {
        const compressed = await compressImageFile(file, 800, 0.7);
        setReceiptUrl(compressed);
      } catch {
        setError('Could not process receipt image. Please try another image.');
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptName('');
    setReceiptUrl('');
  };

  const handleSubmitKycPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompanyAccountSet) {
      setError('The company account details are not yet set by administration.');
      return;
    }
    if (!receiptFile && !receiptName && !receiptUrl) {
      setError('Please upload your transfer payment receipt / proof of transfer.');
      return;
    }

    setError('');
    setIsProcessing(true);

    let finalReceiptUrl = receiptUrl;
    if (!finalReceiptUrl && receiptFile) {
      try {
        finalReceiptUrl = await compressImageFile(receiptFile, 700, 0.65);
        setReceiptUrl(finalReceiptUrl);
      } catch {
        // Fallback
      }
    }

    const fileName = receiptName || (receiptFile ? receiptFile.name : 'KYC_Payment_Receipt.png');

    setTimeout(() => {
      const req = submitDepositRequest(
        kycFee,
        fileName,
        'kyc',
        `KYC Account Verification Fee (${formatNaira(kycFee)})`,
        undefined,
        finalReceiptUrl
      );

      setIsProcessing(false);
      if (req) {
        setActiveRequest(req);
        setStep('submitted_pending');
      } else {
        setError('Failed to submit KYC verification request. Please try again.');
      }
    }, 1200);
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await refreshAllUsers();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div
      className={`min-h-screen pb-16 space-y-4 animate-in fade-in duration-200 ${
        isLight ? 'text-slate-800' : 'text-stone-200'
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center gap-3 pt-2 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-stone-800'
        }`}
      >
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
          <h1
            className={`text-lg font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            KYC Account Clearance <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            One-time KYC account activation for instant withdrawal clearance
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl transition-all ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-white to-amber-100/70 border-amber-300/80 text-slate-900 shadow-amber-500/5'
            : 'bg-gradient-to-r from-[#171822] via-[#201d16] to-[#14151c] border-amber-500/40 text-white'
        }`}
      >
        <div className="relative z-10 space-y-1.5 max-w-[80%]">
          <span
            className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 ${
              isLight ? 'text-amber-800' : 'text-amber-400'
            }`}
          >
            <Sparkles className="w-3 h-3" /> OFFICIAL CENTRAL BANK COMPLIANCE
          </span>
          <h2 className={`text-xl font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Account KYC Verification
          </h2>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
            In compliance with digital banking regulations, complete your 1-time KYC verification fee to clear your pending withdrawal and authorize instant lifetime payouts.
          </p>
        </div>

        <div className="absolute -right-3 -bottom-3 w-28 h-28 opacity-90 flex items-center justify-center pointer-events-none">
          <div
            className={`w-20 h-20 rounded-3xl border flex items-center justify-center rotate-12 shadow-2xl ${
              isLight
                ? 'bg-amber-100/90 border-amber-300 text-amber-600'
                : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
            }`}
          >
            <ShieldCheck className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* If User Already Verified */}
      {isKycVerified ? (
        <div
          className={`p-6 rounded-3xl border text-center space-y-4 shadow-xl ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-300/80 text-slate-900'
              : 'bg-[#141620] border-emerald-500/40 text-white shadow-2xl'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto shadow-md ${
              isLight
                ? 'bg-emerald-100 text-emerald-600 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xl'
            }`}
          >
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> KYC Verified &amp; Active
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Your Account is Fully Verified
            </h3>
            <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Your KYC identity and banking clearance are active. All your withdrawals clear automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow-md transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      ) : step === 'submitted_pending' ? (
        /* STEP: SUBMITTED & PENDING APPROVAL */
        <div
          className={`p-6 rounded-3xl border text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isLight
              ? 'bg-white border-amber-300/80 text-slate-900 shadow-amber-500/5'
              : 'bg-[#141620] border-amber-500/40 text-white'
          }`}
        >
          <div
            className={`relative w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto shadow-xl ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'bg-amber-400/15 border-amber-400/30 text-amber-400'
            }`}
          >
            <Clock className="w-8 h-8 animate-spin" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              Awaiting Company Approval
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              KYC Payment Submitted!
            </h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
              Your {formatNaira(kycFee)} KYC payment proof has been submitted to the company dashboard. Once approved by the administrator, your pending withdrawal will automatically show <strong>successful</strong>.
            </p>
          </div>

          {/* Submission Details */}
          <div
            className={`p-4 rounded-2xl border text-left space-y-2.5 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e0f14] border-stone-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>KYC Verification Fee:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">{formatNaira(kycFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference:</span>
              <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                {activeRequest?.reference || 'KYC9JA' + Date.now()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Uploaded Receipt:</span>
              <span className={`truncate max-w-[160px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                {activeRequest?.receiptName || receiptName || 'kyc_receipt.png'}
              </span>
            </div>
            {userKycPendingWithdrawal && (
              <div
                className={`flex justify-between items-center pt-1 border-t ${
                  isLight ? 'border-slate-200' : 'border-stone-800/80'
                }`}
              >
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Withdrawal on Hold:</span>
                <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatNaira(userKycPendingWithdrawal.amount)} ({userKycPendingWithdrawal.bank})
                </span>
              </div>
            )}
            <div
              className={`flex justify-between items-center pt-1 border-t ${
                isLight ? 'border-slate-200' : 'border-stone-800/80'
              }`}
            >
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Approval Status:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Under Company Review
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border-stone-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking approval status...' : 'Refresh Status'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors cursor-pointer shadow-lg active:scale-98"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* STEP: PAYMENT & UPLOAD FORM */
        <form onSubmit={handleSubmitKycPayment} className="space-y-4">
          {/* Pending Withdrawal Notice if available */}
          {userKycPendingWithdrawal && (
            <div
              className={`p-4 rounded-3xl border flex items-center justify-between ${
                isLight
                  ? 'bg-amber-50/90 border-amber-300/80 text-amber-950'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                    Pending Withdrawal: {formatNaira(userKycPendingWithdrawal.amount)}
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                    Destination: {userKycPendingWithdrawal.bank} ({userKycPendingWithdrawal.accountNumber}). Complete KYC to clear!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Bank Account Box */}
          <div
            className={`p-4 rounded-3xl border space-y-3 shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100'
                : 'bg-[#161822] border-amber-500/40 text-white'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-2.5 ${
                isLight ? 'border-slate-200' : 'border-stone-800'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-semibold uppercase ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}
                >
                  Required Fee
                </span>
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  KYC Account Clearance
                </h3>
              </div>
              <div className="text-right">
                <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  One-Time Fee
                </span>
                <span
                  className={`text-base font-extrabold ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}
                >
                  {formatNaira(kycFee)}
                </span>
              </div>
            </div>

            {!isCompanyAccountSet ? (
              <div
                className={`p-4 rounded-2xl border text-center space-y-2 ${
                  isLight
                    ? 'bg-amber-50/60 border-amber-200 text-slate-700'
                    : 'bg-[#0f1014] border-amber-500/30 text-stone-400'
                }`}
              >
                <span className={`text-xs font-bold block ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                  Company Account Not Configured
                </span>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  The official company bank account for receiving KYC clearance payments has not been set yet. Please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                  Transfer exactly <strong>{formatNaira(kycFee)}</strong> into the official 9jacash company bank account below:
                </p>

                {/* Account Details Box */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1014] border-stone-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Bank Name</span>
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      {companyAccount.bankName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Number</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold tracking-wider text-sm ${
                          isLight ? 'text-amber-700' : 'text-amber-300'
                        }`}
                      >
                        {companyAccount.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={copyAccount}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-2xs'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                        title="Copy account number"
                      >
                        {copiedAcc ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Name</span>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {companyAccount.accountName}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Upload Payment Proof / Receipt Section */}
          <div
            className={`p-4 rounded-3xl border space-y-3 shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#14151c] border-stone-800 text-white'
            }`}
          >
            <label className={`block text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Upload Proof of Payment / Transfer Screenshot <span className="text-amber-500">*</span>
            </label>

            {!receiptFile && !receiptUrl ? (
              <label
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-colors cursor-pointer text-center group ${
                  isLight
                    ? 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30'
                    : 'border-stone-700 hover:border-amber-400/70 bg-[#0e0f14]'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                    isLight
                      ? 'bg-amber-100 group-hover:bg-amber-200 text-amber-700'
                      : 'bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <Upload className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-stone-200'}`}>
                  Click to select transfer receipt
                </span>
                <span className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  Supports PNG, JPG, JPEG, or PDF screenshots
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            ) : (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight
                    ? 'bg-slate-50 border-amber-300/80 shadow-xs'
                    : 'bg-[#0e0f14] border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {receiptUrl && receiptUrl.startsWith('data:image') ? (
                    <img
                      src={receiptUrl}
                      alt="Receipt preview"
                      className={`w-12 h-12 object-cover rounded-xl border ${
                        isLight ? 'border-slate-300' : 'border-stone-700'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                        isLight
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span
                      className={`text-xs font-bold truncate max-w-[180px] block ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {receiptName || (receiptFile ? receiptFile.name : 'kyc_receipt.png')}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready for submission
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white'
                  }`}
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sender Name / Note Input */}
            <div className="pt-1">
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isLight ? 'text-slate-700' : 'text-stone-300'
                }`}
              >
                Sender Account Name / Note (Optional)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Chukwuma Emmanuel"
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                    : 'bg-[#0e0f14] border-stone-800 text-white placeholder-stone-500 focus:border-amber-400'
                }`}
              />
            </div>

            <div
              className={`p-3 rounded-2xl border text-[11px] flex items-start gap-2 ${
                isLight
                  ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                  : 'bg-[#0c0d12] border-stone-800 text-stone-400'
              }`}
            >
              <Lock
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              />
              <span>
                Once your {formatNaira(kycFee)} KYC payment is verified by the company, your KYC status will be approved and your pending withdrawal will show successful automatically.
              </span>
            </div>
          </div>

          {error && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                isLight
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet
                ? isLight
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20 cursor-pointer active:scale-98'
            }`}
          >
            {isProcessing ? (
              <span>Submitting KYC Payment for Approval...</span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit KYC Payment for Approval ({formatNaira(kycFee)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
