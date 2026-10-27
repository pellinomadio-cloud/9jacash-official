import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
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
  CheckCircle2,
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

  const handleSubmitKycPayment = (e: React.FormEvent) => {
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

    const fileName = receiptName || (receiptFile ? receiptFile.name : 'KYC_Payment_Receipt.png');

    setTimeout(() => {
      const req = submitDepositRequest(
        kycFee,
        fileName,
        'kyc',
        `KYC Account Verification Fee (${formatNaira(kycFee)})`,
        undefined,
        receiptUrl
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
            KYC Account Clearance <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </h1>
          <p className="text-xs text-stone-400">
            One-time KYC account activation for instant withdrawal clearance
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171822] via-[#201d16] to-[#14151c] border border-amber-500/40 p-5 shadow-xl text-white">
        <div className="relative z-10 space-y-1.5 max-w-[80%]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> OFFICIAL CENTRAL BANK COMPLIANCE
          </span>
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Account KYC Verification
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            In compliance with digital banking regulations, complete your 1-time KYC verification fee to clear your pending withdrawal and authorize instant lifetime payouts.
          </p>
        </div>

        <div className="absolute -right-3 -bottom-3 w-28 h-28 opacity-90 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 rotate-12 shadow-2xl">
            <ShieldCheck className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* If User Already Verified */}
      {isKycVerified ? (
        <div className="p-6 rounded-3xl bg-[#141620] border border-emerald-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
              <Check className="w-3.5 h-3.5" /> KYC Verified &amp; Active
            </div>
            <h3 className="text-xl font-bold text-white">Your Account is Fully Verified</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Your KYC identity and banking clearance are active. All your withdrawals clear automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      ) : step === 'submitted_pending' ? (
        /* STEP: SUBMITTED & PENDING APPROVAL */
        <div className="p-6 rounded-3xl bg-[#141620] border border-amber-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="relative w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <Clock className="w-8 h-8 animate-spin" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              Awaiting Company Approval
            </div>
            <h3 className="text-xl font-bold text-white">KYC Payment Submitted!</h3>
            <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed">
              Your {formatNaira(kycFee)} KYC payment proof has been submitted to the company dashboard. Once approved by the administrator, your pending withdrawal will automatically show <strong>successful</strong>.
            </p>
          </div>

          {/* Submission Details */}
          <div className="p-4 rounded-2xl bg-[#0e0f14] border border-stone-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">KYC Verification Fee:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">{formatNaira(kycFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Reference:</span>
              <span className="text-stone-300 font-mono font-bold text-[11px]">
                {activeRequest?.reference || 'KYC9JA' + Date.now()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Uploaded Receipt:</span>
              <span className="text-stone-300 truncate max-w-[160px]">
                {activeRequest?.receiptName || receiptName || 'kyc_receipt.png'}
              </span>
            </div>
            {userKycPendingWithdrawal && (
              <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
                <span className="text-stone-400">Withdrawal on Hold:</span>
                <span className="text-white font-bold font-mono">
                  {formatNaira(userKycPendingWithdrawal.amount)} ({userKycPendingWithdrawal.bank})
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
              <span className="text-stone-400">Approval Status:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Under Company Review
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="w-full py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors cursor-pointer"
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
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Pending Withdrawal: {formatNaira(userKycPendingWithdrawal.amount)}
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Destination: {userKycPendingWithdrawal.bank} ({userKycPendingWithdrawal.accountNumber}). Complete KYC to clear!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Bank Account Box */}
          <div className="p-4 rounded-3xl bg-[#161822] border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">Required Fee</span>
                <h3 className="font-bold text-white text-sm">KYC Account Clearance</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400 block">One-Time Fee</span>
                <span className="text-base font-extrabold text-amber-400">{formatNaira(kycFee)}</span>
              </div>
            </div>

            {!isCompanyAccountSet ? (
              <div className="p-4 rounded-2xl bg-[#0f1014] border border-amber-500/30 text-center space-y-2">
                <span className="text-xs font-bold text-amber-400 block">Company Account Not Configured</span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  The official company bank account for receiving KYC clearance payments has not been set yet. Please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Transfer exactly <strong>{formatNaira(kycFee)}</strong> into the official 9jacash company bank account below:
                </p>

                {/* Account Details Box */}
                <div className="p-3.5 rounded-2xl bg-[#0f1014] border border-stone-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Bank Name</span>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      {companyAccount.bankName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-mono font-bold tracking-wider text-sm">
                        {companyAccount.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={copyAccount}
                        className="p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                        title="Copy account number"
                      >
                        {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Account Name</span>
                    <span className="text-white font-semibold">{companyAccount.accountName}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Upload Payment Proof / Receipt Section */}
          <div className="p-4 rounded-3xl bg-[#14151c] border border-stone-800 space-y-3">
            <label className="block text-xs font-semibold text-white">
              Upload Proof of Payment / Transfer Screenshot <span className="text-amber-400">*</span>
            </label>

            {!receiptFile && !receiptUrl ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-700 hover:border-amber-400/70 rounded-2xl bg-[#0e0f14] transition-colors cursor-pointer text-center group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-stone-200">
                  Click to select transfer receipt
                </span>
                <span className="text-[11px] text-stone-400 mt-1">
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
              <div className="p-3.5 rounded-2xl bg-[#0e0f14] border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {receiptUrl && receiptUrl.startsWith('data:image') ? (
                    <img
                      src={receiptUrl}
                      alt="Receipt preview"
                      className="w-12 h-12 object-cover rounded-xl border border-stone-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white truncate max-w-[180px] block">
                      {receiptName || (receiptFile ? receiptFile.name : 'kyc_receipt.png')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready for submission
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sender Name / Note Input */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                Sender Account Name / Note (Optional)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Chukwuma Emmanuel"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#0e0f14] border border-stone-800 text-white text-xs placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#0c0d12] border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Once your {formatNaira(kycFee)} KYC payment is verified by the company, your KYC status will be approved and your pending withdrawal will show successful automatically.
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
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
