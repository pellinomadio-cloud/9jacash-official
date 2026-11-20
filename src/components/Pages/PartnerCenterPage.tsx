import React, { useState, useEffect, useRef } from 'react';
import {
  useAuth,
  PARTNER_CENTER_FEE,
  PARTNER_CENTER_PAYOUT,
} from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import { soundFx } from '../../utils/sound.ts';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  X,
  FileText,
  Crown,
  ShieldCheck,
  Wallet,
  MessageSquare,
} from 'lucide-react';

interface PartnerCenterPageProps {
  onBack: () => void;
  onGoToWithdraw?: () => void;
  onOpenSupport?: () => void;
}

export const PartnerCenterPage: React.FC<PartnerCenterPageProps> = ({
  onBack,
  onGoToWithdraw,
  onOpenSupport,
}) => {
  const { isLight } = useTheme();
  const {
    user,
    companyAccount,
    isCompanyAccountLoading,
    refreshCompanyAccount,
    formatNaira,
    submitDepositRequest,
    depositRequests,
    refreshAllUsers,
  } = useAuth();

  // Locate any existing Partner Center request for this user
  const userPartnerRequests = [
    ...(depositRequests || []),
    ...(user?.submittedRequests || []),
  ].filter((r) => r && r.userId === user?.id && r.requestType === 'partner_center');

  const existingPendingReq = userPartnerRequests.find((r) => r.status === 'pending') || null;
  const existingApprovedReq = userPartnerRequests.find((r) => r.status === 'approved') || null;
  const existingDeclinedReq = userPartnerRequests.find((r) => r.status === 'declined') || null;

  const isActivated = user?.partnerCenterStatus === 'approved' || !!existingApprovedReq;
  const isPending =
    !isActivated && (user?.partnerCenterStatus === 'pending' || !!existingPendingReq);
  const isDeclined =
    !isActivated && !isPending && (user?.partnerCenterStatus === 'declined' || !!existingDeclinedReq);

  const [activeRequest, setActiveRequest] = useState<DepositRequest | null>(
    existingPendingReq || existingApprovedReq || null
  );
  const [senderBank, setSenderBank] = useState('');
  const [senderAccountName, setSenderAccountName] = useState(user?.name || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingAccount, setIsRefreshingAccount] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompanyAccountSet = Boolean(
    companyAccount &&
      companyAccount.isConfigured &&
      companyAccount.accountNumber &&
      companyAccount.bankName
  );

  // Refresh company account automatically if not configured yet on entry
  useEffect(() => {
    if (!isCompanyAccountSet) {
      refreshCompanyAccount().catch(() => {});
    }
  }, [isCompanyAccountSet]);

  useEffect(() => {
    if (existingPendingReq) {
      setActiveRequest(existingPendingReq);
    } else if (existingApprovedReq) {
      setActiveRequest(existingApprovedReq);
    }
  }, [existingPendingReq?.id, existingApprovedReq?.id]);

  const handleCopy = (value: string, field: string) => {
    if (!value) return;
    soundFx.playClick();
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleRefreshCompanyBank = async () => {
    setIsRefreshingAccount(true);
    try {
      await refreshCompanyAccount();
    } finally {
      setTimeout(() => setIsRefreshingAccount(false), 500);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    soundFx.playClick();
    try {
      await refreshAllUsers();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image receipt (JPG, PNG) or PDF transfer receipt.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Receipt file is too large. Please keep it under 15MB.');
      return;
    }

    setError('');
    setReceiptFile(file);
    setReceiptName(file.name);

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, 800, 0.7);
        if (compressed) {
          setReceiptUrl(compressed);
          return;
        }
      } catch {
        setError('Could not process receipt image. Please try another screenshot.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result as string;
        if (raw && raw.length < 700000) {
          setReceiptUrl(raw);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptName('');
    setReceiptUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCompanyAccountSet) {
      setError('Company bank account details are still loading. Tap Refresh Account and try again.');
      return;
    }

    if (!receiptFile && !receiptUrl && !receiptName) {
      setError('Please upload a screenshot or proof of your ₦180,000 bank transfer.');
      return;
    }

    setIsSubmitting(true);
    soundFx.playClick();

    let finalReceiptUrl = receiptUrl;
    if (!finalReceiptUrl && receiptFile && receiptFile.type.startsWith('image/')) {
      try {
        finalReceiptUrl = await compressImageFile(receiptFile, 700, 0.65);
        setReceiptUrl(finalReceiptUrl);
      } catch {
        // Proceed with filename
      }
    }

    const fileName = receiptName || receiptFile?.name || `Partner_Center_Receipt_${Date.now()}.png`;
    const resolvedSenderName = (senderAccountName.trim() || user?.name || 'Account Holder').trim();

    setTimeout(() => {
      const created = submitDepositRequest(
        PARTNER_CENTER_FEE,
        fileName,
        'partner_center',
        'Partners Cashout Line (₦2,000,000) — Activation Fee (₦180,000)',
        undefined,
        finalReceiptUrl,
        undefined,
        {
          senderBank: senderBank.trim() || undefined,
          senderAccountName: resolvedSenderName,
        }
      );

      setIsSubmitting(false);
      if (created) {
        soundFx.playSuccess();
        setActiveRequest(created);
      } else {
        soundFx.playError();
        setError('Unable to submit payment proof right now. Please try again.');
      }
    }, 700);
  };

  const displayRequest = existingPendingReq || activeRequest || existingApprovedReq;
  const displayReceiptUrl = displayRequest?.receiptUrl || receiptUrl;
  const declineReason =
    user?.partnerCenterDeclinedReason ||
    existingDeclinedReq?.declineReason ||
    'Your previous payment proof could not be verified. Please upload a clear transfer receipt.';

  return (
    <div
      className={`min-h-screen pb-16 space-y-5 animate-in fade-in duration-200 ${
        isLight ? 'text-slate-800' : 'text-stone-100'
      }`}
    >
      {/* Top Bar */}
      <div
        className={`flex items-center justify-between pt-2 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-stone-800'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-[#16171f] border-stone-800 text-stone-300 hover:text-white hover:border-purple-500/50'
            }`}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight truncate ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Partners Cashout Line
            </h1>
            <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Partnership Center · ₦2,000,000 Instant Credit
            </p>
          </div>
        </div>
      </div>

      {/* Hero Summary Card */}
      <section
        className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all ${
          isLight
            ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-violet-950 border-purple-500/40 text-white shadow-xl shadow-purple-900/15'
            : 'bg-gradient-to-br from-[#2a1246] via-[#1c0f32] to-[#120b20] border-purple-500/40 text-white shadow-2xl shadow-purple-950/40'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-purple-200 tracking-wide">
              9jacash Partnership Center
            </p>
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2
              className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug text-white"
              style={{ textWrap: 'balance' }}
            >
              Partners Cashout Line of ₦2,000,000
            </h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-amber-300 pt-1">
              {formatNaira(PARTNER_CENTER_PAYOUT)}
            </p>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-purple-100/90">
            Activate your Partnership Center by paying the{' '}
            <strong className="text-white font-bold">{formatNaira(PARTNER_CENTER_FEE)}</strong>{' '}
            activation fee into the official company bank account below and waiting for approval.{' '}
            <strong className="text-amber-300 font-bold">
              Once the Partnership Center is activated for your account, you will be credited{' '}
              {formatNaira(PARTNER_CENTER_PAYOUT)} instantly.
            </strong>
          </p>

          {/* Key Figures Strip */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
            <div>
              <span className="text-[11px] text-purple-200/80 block">Activation Fee</span>
              <span className="text-base sm:text-lg font-extrabold tabular-nums text-white">
                {formatNaira(PARTNER_CENTER_FEE)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-purple-200/80 block">Instant Credit on Approval</span>
              <span className="text-base sm:text-lg font-extrabold tabular-nums text-emerald-300">
                {formatNaira(PARTNER_CENTER_PAYOUT)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATE 1: ACTIVATED */}
      {isActivated ? (
        <section
          className={`rounded-3xl border p-6 text-center space-y-5 ${
            isLight
              ? 'bg-white border-emerald-200 shadow-lg'
              : 'bg-[#131a18] border-emerald-500/35 shadow-2xl'
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <p
              className={`text-xs font-bold tracking-wide ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              Partnership Center Activated · Instant Credit Delivered
            </p>
            <h3
              className={`text-xl font-extrabold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              ₦2,000,000 Credited to Your Account
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto ${
                isLight ? 'text-slate-600' : 'text-stone-300'
              }`}
            >
              Your Partnership Center activation has been approved.{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {formatNaira(PARTNER_CENTER_PAYOUT)}
              </strong>{' '}
              has been credited instantly to your wallet balance.
            </p>
          </div>

          <div
            className={`rounded-2xl border p-4 text-left space-y-2.5 text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[#101318] border-stone-800 text-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Status</span>
              <span className="font-bold text-emerald-500">Activated &amp; Credited</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Instant Credit</span>
              <span className="font-bold tabular-nums text-emerald-500">
                +{formatNaira(PARTNER_CENTER_PAYOUT)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Current Wallet Balance</span>
              <span
                className={`font-extrabold tabular-nums ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {formatNaira(user?.balance || 0)}
              </span>
            </div>
            {(displayRequest?.reference || user?.partnerCenterReference) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-stone-800">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference</span>
                <span className="font-mono font-semibold">
                  {displayRequest?.reference || user?.partnerCenterReference}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {onGoToWithdraw && (
              <button
                type="button"
                onClick={onGoToWithdraw}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <Wallet className="w-4 h-4" />
                <span>Withdraw Funds</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl font-bold text-sm border transition-colors cursor-pointer active:scale-[0.98] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border-stone-700'
              }`}
            >
              Return to Dashboard
            </button>
          </div>
        </section>
      ) : isPending ? (
        /* STATE 2: WAITING FOR APPROVAL */
        <section
          className={`rounded-3xl border p-6 text-center space-y-5 ${
            isLight
              ? 'bg-white border-purple-200 shadow-lg'
              : 'bg-[#151422] border-purple-500/35 shadow-2xl'
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center ${
              isLight
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-purple-500/15 border-purple-500/35 text-purple-300'
            }`}
          >
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <p
              className={`text-xs font-bold tracking-wide ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}
            >
              Payment Submitted · Awaiting Company Approval
            </p>
            <h3
              className={`text-xl font-extrabold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Waiting for Partnership Center Approval
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto ${
                isLight ? 'text-slate-600' : 'text-stone-300'
              }`}
            >
              We have received your{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {formatNaira(PARTNER_CENTER_FEE)}
              </strong>{' '}
              payment proof. Once the Partnership Center is activated for your account, you will be
              credited{' '}
              <strong className="text-emerald-500 font-bold">
                {formatNaira(PARTNER_CENTER_PAYOUT)} instantly
              </strong>
              .
            </p>
          </div>

          <div
            className={`rounded-2xl border p-4 text-left space-y-2.5 text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[#10101a] border-stone-800 text-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Activation Fee Paid</span>
              <span className="font-bold tabular-nums">{formatNaira(PARTNER_CENTER_FEE)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Instant Payout Upon Approval</span>
              <span className="font-bold tabular-nums text-emerald-500">
                {formatNaira(PARTNER_CENTER_PAYOUT)}
              </span>
            </div>
            {(displayRequest?.reference || user?.partnerCenterReference) && (
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference</span>
                <span className="font-mono font-semibold text-purple-500 dark:text-purple-300">
                  {displayRequest?.reference || user?.partnerCenterReference}
                </span>
              </div>
            )}
            {displayRequest?.receiptName && (
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Receipt</span>
                <span className="font-semibold truncate max-w-[180px] text-emerald-500">
                  {displayRequest.receiptName}
                </span>
              </div>
            )}
          </div>

          {displayReceiptUrl && (
            <div
              className={`rounded-2xl border p-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-stone-800'
              }`}
            >
              <p
                className={`text-[11px] font-semibold mb-2 ${
                  isLight ? 'text-slate-600' : 'text-stone-400'
                }`}
              >
                Uploaded Payment Receipt
              </p>
              <img
                src={displayReceiptUrl}
                alt="Partnership Center Payment Receipt"
                className="max-h-52 mx-auto rounded-xl object-contain"
              />
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Approval Status...' : 'Refresh Approval Status'}</span>
            </button>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl font-semibold text-xs border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                }`}
              >
                Return to Dashboard
              </button>
              {onOpenSupport && (
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border-purple-500/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Support</span>
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* STATE 3: PAYMENT INSTRUCTIONS & PROOF UPLOAD FORM */
        <div className="space-y-5">
          {/* Declined Notice (if previously declined) */}
          {isDeclined && (
            <div
              className={`rounded-2xl border p-4 space-y-1.5 text-xs ${
                isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Previous Payment Proof Declined</span>
              </div>
              <p className="leading-relaxed">{declineReason}</p>
            </div>
          )}

          {/* Step 1: Company Bank Account Details */}
          <section
            className={`rounded-3xl border p-5 space-y-4 ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#141520] border-stone-800 shadow-xl'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isLight
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`text-sm font-bold ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    1. Pay {formatNaira(PARTNER_CENTER_FEE)} into Company Account
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    Official 9jacash Partnership Center Account
                  </p>
                </div>
              </div>
            </div>

            {isCompanyAccountSet ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Bank Name</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {companyAccount.bankName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(companyAccount.bankName, 'bank')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight
                          ? 'hover:bg-slate-100 text-slate-500'
                          : 'hover:bg-stone-800 text-stone-400'
                      }`}
                      aria-label="Copy bank name"
                    >
                      {copiedField === 'bank' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between gap-2 py-2.5 border-y ${
                    isLight ? 'border-slate-100' : 'border-stone-800/80'
                  }`}
                >
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                    Account Number
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base sm:text-lg tracking-wider tabular-nums text-purple-600 dark:text-purple-300">
                      {companyAccount.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(companyAccount.accountNumber, 'acc')}
                      className="min-h-[34px] px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 py-1">
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                    Account Name
                  </span>
                  <span
                    className={`font-bold text-right ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {companyAccount.accountName}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between gap-2 pt-2.5 border-t ${
                    isLight ? 'border-slate-100' : 'border-stone-800/80'
                  }`}
                >
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>
                    Exact Amount to Transfer
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatNaira(PARTNER_CENTER_FEE)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(PARTNER_CENTER_FEE), 'amount')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight
                          ? 'hover:bg-slate-100 text-slate-500'
                          : 'hover:bg-stone-800 text-stone-400'
                      }`}
                      aria-label="Copy transfer amount"
                    >
                      {copiedField === 'amount' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  {isCompanyAccountLoading || isRefreshingAccount
                    ? 'Loading official company bank account...'
                    : 'Company bank account is not loaded yet.'}
                </p>
                <button
                  type="button"
                  onClick={handleRefreshCompanyBank}
                  disabled={isRefreshingAccount}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAccount ? 'animate-spin' : ''}`} />
                  <span>Refresh Company Account</span>
                </button>
              </div>
            )}

            {/* Instant Credit Assurance */}
            <div
              className={`rounded-2xl border p-3.5 flex items-start gap-2.5 text-xs ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-950'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Instant ₦2,000,000 Credit Guarantee:</strong> Once your{' '}
                <strong>{formatNaira(PARTNER_CENTER_FEE)}</strong> transfer is confirmed and the
                Partnership Center is activated for your account, you will be credited{' '}
                <strong>{formatNaira(PARTNER_CENTER_PAYOUT)} instantly</strong>.
              </p>
            </div>
          </section>

          {/* Step 2: Upload Payment Receipt & Submit */}
          <form
            onSubmit={handleSubmitPayment}
            className={`rounded-3xl border p-5 space-y-4 ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#141520] border-stone-800 shadow-xl'
            }`}
          >
            <div
              className={`pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-stone-800'
              }`}
            >
              <h3
                className={`text-sm font-bold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                2. Submit Payment Proof for Approval
              </h3>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Upload your transfer screenshot after paying {formatNaira(PARTNER_CENTER_FEE)}
              </p>
            </div>

            {error && (
              <div
                className={`rounded-2xl border p-3.5 text-xs flex items-start gap-2 ${
                  isLight
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="partner-sender-name"
                className={`text-xs font-semibold block ${
                  isLight ? 'text-slate-700' : 'text-stone-300'
                }`}
              >
                Sender Account Name
              </label>
              <input
                id="partner-sender-name"
                type="text"
                value={senderAccountName}
                onChange={(e) => setSenderAccountName(e.target.value)}
                placeholder="Name on the bank account you paid from"
                className={`w-full min-h-[46px] px-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                    : 'bg-[#1a1b28] border-stone-700 text-white focus:border-purple-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="partner-sender-bank"
                className={`text-xs font-semibold block ${
                  isLight ? 'text-slate-700' : 'text-stone-300'
                }`}
              >
                Sender Bank (Optional)
              </label>
              <input
                id="partner-sender-bank"
                type="text"
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                placeholder="e.g. GTBank, Zenith, Access, Moniepoint, Kuda"
                className={`w-full min-h-[46px] px-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                    : 'bg-[#1a1b28] border-stone-700 text-white focus:border-purple-400'
                }`}
              />
            </div>

            {/* Receipt Upload Dropzone */}
            <div className="space-y-1.5">
              <label
                className={`text-xs font-semibold block ${
                  isLight ? 'text-slate-700' : 'text-stone-300'
                }`}
              >
                Payment Receipt Screenshot
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!receiptName ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer space-y-2 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 hover:border-purple-400 hover:bg-purple-50/40'
                      : 'bg-[#181926] border-stone-700 hover:border-purple-400 hover:bg-purple-500/5'
                  }`}
                >
                  <div
                    className={`w-11 h-11 mx-auto rounded-2xl flex items-center justify-center ${
                      isLight
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-purple-500/15 text-purple-300'
                    }`}
                  >
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p
                    className={`text-xs font-bold ${
                      isLight ? 'text-slate-800' : 'text-white'
                    }`}
                  >
                    Tap to upload ₦180,000 payment receipt
                  </p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    Supports JPG, PNG, or PDF (Max 15MB)
                  </p>
                </button>
              ) : (
                <div
                  className={`rounded-2xl border p-3.5 space-y-3 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#181926] border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold truncate">{receiptName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 flex items-center justify-center shrink-0 cursor-pointer"
                      aria-label="Remove uploaded receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {receiptUrl && receiptUrl.startsWith('data:image') && (
                    <img
                      src={receiptUrl}
                      alt="Uploaded payment receipt preview"
                      className="max-h-48 w-full object-contain rounded-xl bg-black/20"
                    />
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isCompanyAccountSet}
              className="w-full min-h-[50px] px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting for Approval...</span>
                </>
              ) : (
                <>
                  <span>I Have Paid ₦180,000 — Submit for Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
