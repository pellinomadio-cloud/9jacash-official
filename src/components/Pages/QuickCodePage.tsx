import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import {
  ArrowLeft,
  Hash,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  Upload,
  ArrowRight,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
  X,
  Sparkles,
  Info,
  Volume2,
  VolumeX,
  Headphones,
  Zap,
  Crown,
} from 'lucide-react';

import { PageTransitionLoader } from '../Common/PageTransitionLoader.tsx';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import { voiceGuide, VOICE_GUIDE_TEXT } from '../../utils/voiceGuide.ts';
import { sendCodePurchasedDeviceNotification } from '../../utils/deviceNotifications.ts';

interface QuickCodePageProps {
  onBack: () => void;
  onGoToWithdraw?: () => void;
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  withdrawals: number;
}

export const QuickCodePage: React.FC<QuickCodePageProps> = ({ onBack, onGoToWithdraw }) => {
  const { user, formatNaira, companyAccount, submitDepositRequest, depositRequests, refreshAllUsers, appPricing } = useAuth();
  const { isLight } = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [copied, setCopied] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completedReq, setCompletedReq] = useState<DepositRequest | null>(null);

  const isCompanyAccountSet = !!(
    companyAccount &&
    companyAccount.isConfigured &&
    companyAccount.accountNumber &&
    companyAccount.bankName
  );

  const plans: Plan[] = [
    { id: '1', name: '1 Withdrawal Plan', amount: appPricing?.quickCodePlan1 ?? 7800, withdrawals: 1 },
    { id: '2', name: '3 Withdrawals Plan', amount: appPricing?.quickCodePlan2 ?? 10300, withdrawals: 3 },
    { id: '3', name: '6 Withdrawals Plan', amount: appPricing?.quickCodePlan3 ?? 15600, withdrawals: 6 },
    { id: '4', name: 'Unlimited Withdrawal Plan', amount: appPricing?.quickCodePlanUnlimited ?? 70000, withdrawals: 999 },
  ];

  // Check if user has an active pending request for quick code
  const pendingQuickCodeReq = depositRequests.find(
    (r) => r.userId === user?.id && r.requestType === 'quickcode' && r.status === 'pending'
  );

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [loadingPlanTitle, setLoadingPlanTitle] = useState('');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // Subscribe to voice guide playback state & stop when leaving page
  React.useEffect(() => {
    const unsub = voiceGuide.subscribe((state) => {
      setIsVoicePlaying(state.isPlaying);
    });
    return () => {
      unsub();
      voiceGuide.stop();
    };
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (pendingQuickCodeReq) return;
    // Play female voice explanation immediately on plan selection click
    voiceGuide.play();
    setLoadingPlanTitle(plan.name);
    setIsPlanLoading(true);
    setTimeout(() => {
      setSelectedPlan(plan);
      setSelectedFile(null);
      setReceiptUrl('');
      setStep('payment');
      setIsPlanLoading(false);
    }, 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      try {
        const compressed = await compressImageFile(file, 800, 0.7);
        setReceiptUrl(compressed);
      } catch {
        // Fallback
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setReceiptUrl('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !receiptUrl) return;
    if (!selectedPlan) return;

    setIsUploading(true);
    const fileName = selectedFile ? selectedFile.name : 'QuickCode_Payment_Receipt.png';

    let finalReceiptUrl = receiptUrl;
    if (!finalReceiptUrl && selectedFile) {
      try {
        finalReceiptUrl = await compressImageFile(selectedFile, 700, 0.65);
        setReceiptUrl(finalReceiptUrl);
      } catch {
        // Fallback if compression fails
      }
    }

    const req = submitDepositRequest(
      selectedPlan.amount,
      fileName,
      'quickcode',
      selectedPlan.name,
      selectedPlan.withdrawals,
      finalReceiptUrl
    );

    if (!req) {
      setIsUploading(false);
      return;
    }

    setTimeout(() => {
      setIsUploading(false);
      setCompletedReq(req);
      setStep('success');

      // Send device notification: Quick Code is successfully purchased
      sendCodePurchasedDeviceNotification(req.generatedCode, selectedPlan?.name).catch(console.warn);
    }, 1000);
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
      {/* 3-Second Plan Loading Modal with Voice Notice */}
      <PageTransitionLoader
        isLoading={isPlanLoading}
        targetTitle={loadingPlanTitle}
        durationMs={3000}
        showVoiceNotice={true}
      />

      {/* Top Header */}
      <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <button
          type="button"
          onClick={() => {
            if (step === 'payment') setStep('select');
            else onBack();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm hover:border-amber-400'
              : 'bg-[#16171d] border border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Quick Code Service <Hash className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            {pendingQuickCodeReq
              ? 'Payment under company review'
              : step === 'select'
              ? 'Select plan for your withdrawal code'
              : step === 'payment'
              ? 'Make payment & upload proof'
              : 'Payment Submitted for Approval'}
          </p>
        </div>
      </div>

      {/* ================= 1. PENDING REVIEW AWAITING RESPONSE VIEW ================= */}
      {step !== 'success' && pendingQuickCodeReq ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Pending Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1712] via-[#241c12] to-[#17140f] border-2 border-amber-500/60 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                PENDING REVIEW AWAITING RESPONSE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Payment Under Review
              </h2>
              <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                You have an active Quick Code payment receipt under company review awaiting company approval. A new code cannot be purchased until this pending payment has been attended to.
              </p>
            </div>

            {/* Request Summary Box */}
            <div className="p-4 rounded-2xl bg-[#121319] border border-amber-500/30 space-y-2.5 text-xs text-left">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">Requested Plan</span>
                <span className="font-bold text-amber-300">
                  {pendingQuickCodeReq.planName || 'Withdrawal Plan'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">Amount Paid</span>
                <span className="font-mono font-extrabold text-white text-sm">
                  {formatNaira(pendingQuickCodeReq.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">Reference Number</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-amber-400">
                    {pendingQuickCodeReq.reference}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pendingQuickCodeReq.reference, 'ref_pend')}
                    className="p-1 rounded text-stone-400 hover:text-white"
                  >
                    {copied === 'ref_pend' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">Submitted Time</span>
                <span className="text-stone-300 font-mono text-[11px]">
                  {new Date(pendingQuickCodeReq.submittedAt).toLocaleDateString()} • {new Date(pendingQuickCodeReq.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-stone-400">Uploaded Receipt</span>
                <span className="text-stone-300 font-medium truncate max-w-[180px] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  {pendingQuickCodeReq.receiptName}
                </span>
              </div>

              {/* Receipt Preview if available */}
              {pendingQuickCodeReq.receiptUrl && (
                <div className="pt-2">
                  <div className="w-full max-h-36 rounded-xl overflow-hidden border border-stone-800 bg-black/40 flex items-center justify-center">
                    <img
                      src={pendingQuickCodeReq.receiptUrl}
                      alt="Uploaded Receipt Preview"
                      className="max-h-36 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Notice */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-200/90 flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Our verification team processes submissions rapidly. As soon as the company reviewer approves your receipt, your Quick Code will be automatically issued and activated on your dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking Approval Status...' : 'Check Approval Status'}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 rounded-xl bg-[#171822] hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= 2. NORMAL QUICK CODE PURCHASE FLOW ================= */
        <div className="space-y-4">
          {/* STEP 1: Select Plan */}
          {step === 'select' && (
            <div className="space-y-3">
              {/* If user already has active quick codes, show them */}
              {user?.quickCodes && user.quickCodes.length > 0 && (
                <div className={`p-4 rounded-3xl space-y-3 shadow-lg ${
                  isLight ? 'bg-amber-50/70 border-2 border-amber-300' : 'bg-[#171922] border border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Your Active Quick Code(s)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      Min. Withdrawal ₦100,000
                    </span>
                  </div>

                  <div className="space-y-2">
                    {user.quickCodes.map((item, idx) => {
                      const isStr = typeof item === 'string';
                      const code = isStr ? item : item.code;
                      const planName = isStr ? 'Quick Code' : item.planName;
                      const left = isStr ? 1 : item.withdrawalsLeft;
                      const isUnlimited = !isStr && (item.withdrawalsLeft >= 999 || item.planName?.toLowerCase().includes('unlimited'));

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl flex items-center justify-between border ${
                            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111217] border-stone-800'
                          }`}
                        >
                          <div>
                            <span className={`text-base font-extrabold tracking-widest block font-mono ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {code}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{planName}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                isUnlimited
                                  ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300 font-bold'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              }`}>
                                {isUnlimited ? '⚡ Unlimited Withdrawals' : `${left} withdrawal${left > 1 ? 's' : ''} left`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(code, `page_qc_${idx}`)}
                              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                            >
                              {copied === `page_qc_${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copied === `page_qc_${idx}` ? 'Copied' : 'Copy'}</span>
                            </button>

                            {onGoToWithdraw && (
                              <button
                                type="button"
                                onClick={onGoToWithdraw}
                                className={`py-1.5 px-2.5 rounded-xl font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                                  isLight
                                    ? 'bg-slate-800 hover:bg-slate-900 text-white'
                                    : 'bg-stone-800 hover:bg-stone-700 text-white'
                                }`}
                              >
                                <span>Withdraw</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informative Banner */}
              <div className={`p-4 rounded-3xl border text-xs space-y-1 ${
                isLight
                  ? 'bg-amber-50/80 border-amber-300 text-slate-800 shadow-sm'
                  : 'bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300'
              }`}>
                <h3 className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Withdrawal Quick Code Activation
                </h3>
                <p className={`leading-relaxed text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                  To initiate bank withdrawals on 9jacash, select an activation plan below. After payment, upload your receipt for company approval.
                </p>
              </div>

              {/* Notice if Company Account is not configured by management yet */}
              {!isCompanyAccountSet && (
                <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex gap-3 items-start animate-in fade-in">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-400">Company Payment Account Not Set</p>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      The official company account for receiving Quick Code payments has not been set from the company dashboard yet. Payments cannot be accepted until management sets the account.
                    </p>
                  </div>
                </div>
              )}

              {/* Plans Grid */}
              <div className="space-y-3 pt-1">
                {plans.map((p) => {
                  const isUnlimited = p.withdrawals >= 999;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPlan(p)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                        isUnlimited
                          ? isLight
                            ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-2 border-amber-400 hover:border-amber-500 shadow-md shadow-amber-200/50'
                            : 'bg-gradient-to-r from-amber-950/30 via-[#181922] to-amber-950/20 border-2 border-amber-400/80 hover:border-amber-300 shadow-lg shadow-amber-500/10'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/20'
                          : 'bg-[#15161c] border-stone-800 hover:border-amber-500/50 hover:bg-[#1a1c24]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold transition-colors ${
                            isLight
                              ? 'text-slate-900 group-hover:text-amber-600'
                              : 'text-white group-hover:text-amber-400'
                          }`}>
                            {p.name}
                          </h4>
                          {isUnlimited && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black flex items-center gap-1 shadow-sm">
                              <Crown className="w-3 h-3 fill-black" />
                              CODER VIP
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                          {isUnlimited
                            ? 'Valid for Lifetime Unlimited Withdrawals (Coder VIP)'
                            : `Valid for ${p.withdrawals} successful withdrawal${p.withdrawals > 1 ? 's' : ''}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-amber-500 block font-mono">
                          {formatNaira(p.amount)}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                          isUnlimited
                            ? 'bg-amber-400 text-black group-hover:bg-amber-300 shadow-sm'
                            : isLight
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 group-hover:bg-amber-400 group-hover:text-black'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:bg-amber-400 group-hover:text-black'
                        }`}>
                          Select Plan
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Payment Details & Mandatory Receipt Upload */}
          {step === 'payment' && selectedPlan && (
            !isCompanyAccountSet ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-3xl bg-[#15161c] border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-xs text-stone-400">Selected Plan</span>
                    <span className="text-xs font-bold text-amber-400">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">Amount to Transfer</span>
                    <span className="text-lg font-extrabold text-white font-mono">
                      {formatNaira(selectedPlan.amount)}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#15161c] border border-amber-500/30 text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Clock className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-block">
                      ACCOUNT NOT CONFIGURED
                    </span>
                    <h3 className="text-base font-bold text-white">Company Payment Account Not Set</h3>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                      The official company payment account for Quick Code activation has not been configured by management yet. Please check back shortly or check the community channels once an account is activated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Change Selected Plan
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4 animate-in fade-in">
                <div className={`p-4 rounded-3xl border space-y-3 ${
                  isLight ? 'bg-white border-amber-300 shadow-sm' : 'bg-[#15161c] border-amber-500/40'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-2 ${
                    isLight ? 'border-slate-200' : 'border-stone-800'
                  }`}>
                    <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Selected Plan</span>
                    <span className="text-xs font-bold text-amber-500">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Amount to Transfer</span>
                    <span className={`text-lg font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatNaira(selectedPlan.amount)}
                    </span>
                  </div>
                </div>

                {/* Official Female Voice Guide & Payment Rules Notice */}
                <div
                  className={`p-4 rounded-3xl border transition-all ${
                    isVoicePlaying
                      ? isLight
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-gradient-to-br from-amber-500/15 via-[#1a1712] to-amber-500/5 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                      : isLight
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-[#15161c] border-amber-500/40 shadow-sm'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isVoicePlaying
                            ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30 animate-pulse'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Official Voice Guide</h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                            isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            FEMALE VOICE
                          </span>
                        </div>
                        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                          {isVoicePlaying ? 'Playing explanation...' : 'Security and bank payment instructions'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isVoicePlaying) {
                          voiceGuide.pause();
                        } else {
                          voiceGuide.play();
                        }
                      }}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isVoicePlaying
                          ? 'bg-amber-400 hover:bg-amber-300 text-black'
                          : isLight
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isVoicePlaying ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Headphones className="w-3.5 h-3.5 text-amber-500" />
                          <span>Play Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Animated Soundwave Visualizer when Playing */}
                  {isVoicePlaying && (
                    <div className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-2xl border animate-in fade-in ${
                      isLight ? 'bg-amber-100/70 border-amber-300' : 'bg-black/60 border-amber-500/30'
                    }`}>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mr-2">Speaking:</span>
                      <div className="w-1 h-3.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-1 h-5 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-1 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
                      <div className="w-1 h-4 bg-amber-500 rounded-full animate-bounce [animation-delay:75ms]" />
                      <div className="w-1 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:220ms]" />
                      <span className={`text-[10px] ml-2 italic ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                        "9jacash is 100% legit... Do NOT use OPay or PalmPay..."
                      </span>
                    </div>
                  )}

                  {/* Core Payment Rules from Voice Guide */}
                  <div className={`space-y-1.5 pt-1 text-[11px] border-t ${
                    isLight ? 'border-slate-200' : 'border-stone-800/80'
                  }`}>
                    <div className={`flex items-start gap-2 ${isLight ? 'text-slate-700' : 'text-stone-200'}`}>
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">9jacash is 100% Legit:</strong> Verified platform with instant payout approvals.
                      </span>
                    </div>
                    <div className={`flex items-start gap-2 ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                      <span className="text-red-500 font-bold shrink-0">✕</span>
                      <span>
                        <strong className="text-red-600 dark:text-red-400 font-bold">Do NOT use OPay or PalmPay:</strong> Transfers from OPay or PalmPay are not accepted for Quick Code purchase.
                      </span>
                    </div>
                    <div className={`flex items-start gap-2 ${isLight ? 'text-amber-900' : 'text-amber-300/95'}`}>
                      <span className="text-amber-500 font-bold shrink-0">★</span>
                      <span>
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">Use Moniepoint, POS, or other banks:</strong> Pay using Moniepoint, a POS machine, or commercial banks (Zenith, GTBank, Access, UBA, etc.) for instant confirmation.
                      </span>
                    </div>
                  </div>
                </div>

              {/* Company Account Details Card */}
              <div className={`p-5 rounded-3xl border space-y-3 shadow-lg ${
                isLight ? 'bg-white border-amber-300' : 'bg-[#15161c] border-amber-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                    Official Company Account
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    Verified Account
                  </span>
                </div>

                {/* Account Number */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${
                      isLight ? 'text-slate-500' : 'text-stone-500'
                    }`}>
                      Account Number
                    </span>
                    <span className={`text-lg font-bold tracking-wider font-mono ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {companyAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(companyAccount.accountNumber, 'acc')}
                    className="py-1.5 px-3 rounded-xl bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors cursor-pointer shadow-sm"
                  >
                    {copied === 'acc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'acc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Bank Name */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${
                      isLight ? 'text-slate-500' : 'text-stone-500'
                    }`}>
                      Bank Name
                    </span>
                    <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{companyAccount.bankName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(companyAccount.bankName, 'bank')}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-amber-600' : 'text-stone-400 hover:text-amber-400'
                    }`}
                  >
                    {copied === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Name */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${
                      isLight ? 'text-slate-500' : 'text-stone-500'
                    }`}>
                      Account Name
                    </span>
                    <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{companyAccount.accountName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(companyAccount.accountName, 'name')}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-amber-600' : 'text-stone-400 hover:text-amber-400'
                    }`}
                  >
                    {copied === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Upload Receipt Section with Mandatory Guard */}
              <div className={`p-5 rounded-3xl border space-y-3 shadow-lg ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#15161c] border-stone-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Upload Payment Receipt <span className="text-amber-500">*</span>
                  </span>
                  <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Required for Company Approval</span>
                </div>

                {selectedFile || receiptUrl ? (
                  /* Attached File Preview */
                  <div className="p-3.5 rounded-2xl bg-[#1c1e26] border-2 border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white truncate max-w-[180px] block">
                            {selectedFile ? selectedFile.name : 'Receipt Screenshot'}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Receipt Attached • Ready to Submit
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Remove and select another file"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Change</span>
                      </button>
                    </div>

                    {/* Image Preview */}
                    {receiptUrl && (
                      <div className="w-full max-h-36 rounded-xl overflow-hidden border border-stone-800 bg-black/50 flex items-center justify-center">
                        <img
                          src={receiptUrl}
                          alt="Receipt Preview"
                          className="max-h-36 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Drag & Drop File Selector */
                  <label className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors block group ${
                    isLight
                      ? 'border-amber-400/80 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60'
                      : 'border-amber-500/40 hover:border-amber-400 bg-[#1c1e26]/50'
                  }`}>
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-500 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold transition-colors ${
                        isLight ? 'text-slate-800 group-hover:text-amber-600' : 'text-stone-200 group-hover:text-amber-400'
                      }`}>
                        Click to select payment screenshot
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                        PNG, JPG or PDF transfer receipt from your banking app
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}

                {/* Submit Button Guarded by File Selection */}
                <button
                  type="submit"
                  disabled={(!selectedFile && !receiptUrl) || isUploading}
                  className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg ${
                    !selectedFile && !receiptUrl
                      ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed shadow-none'
                      : isUploading
                      ? 'bg-amber-500/60 text-black cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/20 cursor-pointer active:scale-98'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Submitting to Company Dashboard...</span>
                    </>
                  ) : !selectedFile && !receiptUrl ? (
                    <>
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span>Attach Payment Screenshot First</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Payment for Company Approval</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )
        )}

          {/* STEP 3: Submission Success Confirmation (Auto-Verified or Awaiting Company Review) */}
          {step === 'success' && (
            completedReq?.status === 'approved' && completedReq.generatedCode ? (
              <div className={`p-6 rounded-3xl border-2 border-emerald-500/50 text-center space-y-4 animate-in fade-in shadow-2xl ${
                isLight ? 'bg-white text-slate-900' : 'bg-[#15161c] text-white'
              }`}>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-green-300 p-1 shadow-xl shadow-emerald-500/30 flex items-center justify-center animate-bounce">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-emerald-500 ${
                    isLight ? 'bg-white' : 'bg-[#15161c]'
                  }`}>
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
                    PAYMENT VERIFIED &amp; APPROVED
                  </span>
                  <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Your Quick Code is Ready!
                  </h2>
                  <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                    Your payment receipt has been verified and your withdrawal authorization code is activated immediately.
                  </p>
                </div>

                {/* Display Generated Quick Code Card */}
                <div className={`p-4 rounded-2xl border-2 text-center space-y-3 shadow-lg ${
                  isLight
                    ? 'bg-amber-50/80 border-amber-400 text-slate-900'
                    : 'bg-gradient-to-br from-[#1c1a14] via-[#231e13] to-[#17140f] border-amber-500/50'
                }`}>
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">
                    Withdrawal Authorization Code
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500 tracking-wider">
                      {completedReq.generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(completedReq.generatedCode!, 'succ_qc')}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-md active:scale-95"
                      title="Copy Quick Code"
                    >
                      {copied === 'succ_qc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-black" />
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
                  <div className={`text-[11px] border-t pt-2 flex items-center justify-between ${
                    isLight ? 'border-amber-200 text-slate-700' : 'border-stone-800/80 text-stone-300'
                  }`}>
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Plan:</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {completedReq.planName} ({completedReq.withdrawalsCount && completedReq.withdrawalsCount >= 999 ? 'Unlimited withdrawals authorized' : `${completedReq.withdrawalsCount || 1} withdrawal authorized`})
                    </span>
                  </div>
                </div>

                {/* Minimum withdrawal notice revealed upon purchasing a code */}
                <div className={`p-3 rounded-2xl border text-left text-xs space-y-1 ${
                  isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Minimum Withdrawal Requirement</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                    With your active Quick Code, the minimum withdrawal amount on 9jacash is <strong className="text-amber-500 font-mono">₦100,000</strong>.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  {onGoToWithdraw && (
                    <button
                      type="button"
                      onClick={onGoToWithdraw}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                    >
                      <span>Proceed to Withdraw</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onBack}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        : 'bg-[#1c1e26] hover:bg-stone-800 text-stone-300 hover:text-white border-stone-800'
                    }`}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-3xl border-2 border-amber-500/50 text-center space-y-4 animate-in fade-in shadow-xl ${
                isLight ? 'bg-white text-slate-900' : 'bg-[#15161c] text-white'
              }`}>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-xl shadow-amber-500/30 flex items-center justify-center animate-bounce">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-amber-500 ${
                    isLight ? 'bg-white' : 'bg-[#15161c]'
                  }`}>
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-block">
                    SUBMISSION SUCCESSFUL
                  </span>
                  <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Submitted for Company Approval
                  </h2>
                  <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                    Your payment receipt has been submitted directly to the Company Dashboard for verification.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border text-xs text-left space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Status</span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Awaiting Company Approval
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Plan</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedPlan?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Amount</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatNaira(selectedPlan?.amount || 0)}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
