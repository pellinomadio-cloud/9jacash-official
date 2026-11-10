import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  Upload,
  FileText,
  X,
  Clock,
  Building2,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';

interface UpgradeTierPageProps {
  onBack: () => void;
  initialSelectedTier?: number;
  initialStep?: 'plans' | 'payment';
}

export const UpgradeTierPage: React.FC<UpgradeTierPageProps> = ({
  onBack,
  initialSelectedTier,
  initialStep,
}) => {
  const { isLight } = useTheme();
  const { user, companyAccount, formatNaira, submitDepositRequest, depositRequests, refreshAllUsers } = useAuth();
  const currentTier = user?.tier || 1;

  // Active pending request if user already submitted
  const pendingUpgradeReq = depositRequests.find(
    (r) => r.userId === user?.id && r.requestType === 'upgrade' && r.status === 'pending'
  );

  const defaultSelectedTier =
    initialSelectedTier || (currentTier === 1 ? (initialStep === 'payment' ? 3 : 2) : 3);

  const [selectedTier, setSelectedTier] = useState<number>(defaultSelectedTier);
  const [step, setStep] = useState<'plans' | 'payment' | 'submitted_pending'>(
    pendingUpgradeReq ? 'submitted_pending' : initialStep || 'plans'
  );
  const [activeRequest, setActiveRequest] = useState<DepositRequest | null>(pendingUpgradeReq || null);
  const [copied, setCopied] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const isCompanyAccountSet = !!(
    companyAccount &&
    companyAccount.isConfigured &&
    companyAccount.accountNumber &&
    companyAccount.bankName
  );

  const tierDetails: Record<
    number,
    {
      title: string;
      price: number;
      holdingLimit: number;
      holdingLimitFormatted: string;
      badge: string;
      features: string[];
    }
  > = {
    1: {
      title: 'Tier 1 Account',
      price: 0,
      holdingLimit: 400000,
      holdingLimitFormatted: '₦400,000',
      badge: 'Starter Level',
      features: [
        'Maximum wallet holding: ₦400,000',
        'Earning page locked once ₦400,000 balance is reached',
        'Standard bank transfers',
      ],
    },
    2: {
      title: 'Tier 2 Account',
      price: 4500,
      holdingLimit: 2000000,
      holdingLimitFormatted: '₦2,000,000 (2 Million)',
      badge: 'Tier 2 Upgrade',
      features: [
        'Maximum wallet holding: ₦2,000,000',
        'Instant unlock of the Earning Page (Snake 3D, Candy Crush, Wheel, Claim & Quiz)',
        'Priority Quick Code clearing queue',
        'Higher daily task rewards capacity',
      ],
    },
    3: {
      title: 'Tier 3 Account (VIP)',
      price: 15000,
      holdingLimit: Infinity,
      holdingLimitFormatted: 'Unlimited Wallet Capacity',
      badge: 'VIP Level 3',
      features: [
        '100% direct credit of all earnings to available balance',
        'Unlimited wallet holding without restrictions (holds up to ₦5,000,000+)',
        'VIP priority bank withdrawal clearance',
        'Full unrestricted lifetime access to all platform earnings',
      ],
    },
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptName(file.name);
      setUpgradeError('');

      try {
        const compressed = await compressImageFile(file, 800, 0.7);
        setReceiptUrl(compressed);
      } catch {
        setUpgradeError('Could not process receipt image. Please try another image.');
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptName('');
    setReceiptUrl('');
  };

  const handleSubmitUpgradePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompanyAccountSet) {
      setUpgradeError('The company account details are not yet set by administration.');
      return;
    }
    if (!receiptFile && !receiptName && !receiptUrl) {
      setUpgradeError('Please upload your payment receipt / transfer proof to proceed.');
      return;
    }

    setUpgradeError('');
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

    const activePlan = tierDetails[selectedTier];
    const fileName = receiptName || (receiptFile ? receiptFile.name : `Upgrade_Tier_${selectedTier}_receipt.png`);

    setTimeout(() => {
      const req = submitDepositRequest(
        activePlan.price,
        fileName,
        'upgrade',
        activePlan.title,
        undefined,
        finalReceiptUrl,
        selectedTier
      );

      setIsProcessing(false);
      if (req) {
        setActiveRequest(req);
        setStep('submitted_pending');
      } else {
        setUpgradeError('Failed to submit upgrade request. Please try again.');
      }
    }, 1000);
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await refreshAllUsers();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const activePlan = tierDetails[selectedTier];

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
          onClick={() => {
            if (step === 'payment') setStep('plans');
            else onBack();
          }}
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
            Account Tier Upgrade <Crown className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            {step === 'plans' && 'Increase your wallet holding capacity & unlock unlimited earnings'}
            {step === 'payment' && `Pay to Company for Tier ${selectedTier} Upgrade (${formatNaira(activePlan?.price || 0)})`}
            {step === 'submitted_pending' && 'Upgrade Submitted for Company Approval'}
          </p>
        </div>
      </div>

      {/* Tier 1 400,000 Limit Notice if reached */}
      {currentTier < 2 && (user?.balance || 0) >= 400000 && (
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between animate-in fade-in ${
            isLight
              ? 'bg-amber-50 border-amber-300/80 text-amber-950'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                Tier 1 Limit Reached (₦400,000)
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                The earning page is currently locked. Upgrade to Tier 2 or Tier 3 to unlock all earning games &amp; expand holding limit!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: PLANS SELECTION */}
      {step === 'plans' && (
        <div className="space-y-3.5">
          {/* Active Pending Upgrade Banner if exists */}
          {pendingUpgradeReq && (
            <div
              className={`p-4 rounded-3xl border space-y-2 ${
                isLight
                  ? 'bg-amber-50/90 border-amber-300/80'
                  : 'bg-amber-500/15 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isLight ? 'text-amber-900' : 'text-amber-300'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                  Upgrade Request Under Review
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase ${
                    isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Pending Approval
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                You have a submitted upgrade payment for <strong>Tier {pendingUpgradeReq.targetTier || 3}</strong> awaiting company approval.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveRequest(pendingUpgradeReq);
                  setStep('submitted_pending');
                }}
                className="mt-1 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>View Submitted Request Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Current Status Card */}
          <div
            className={`p-4 rounded-3xl border flex items-center justify-between shadow-xs ${
              isLight
                ? 'bg-white border-slate-200'
                : 'bg-[#14161f] border-stone-800'
            }`}
          >
            <div>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold block ${
                  isLight ? 'text-slate-500' : 'text-stone-400'
                }`}
              >
                Current Level
              </span>
              <h3
                className={`text-base font-bold flex items-center gap-1.5 mt-0.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Tier {currentTier} Account
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  Active
                </span>
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                Balance Limit: <strong className="text-amber-600 dark:text-amber-400">{tierDetails[currentTier]?.holdingLimitFormatted || '₦400,000'}</strong>
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <Crown className="w-6 h-6" />
            </div>
          </div>

          <h3
            className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isLight ? 'text-slate-500' : 'text-stone-400'
            }`}
          >
            Choose Upgrade Tier
          </h3>

          {/* Tier 2 Option */}
          <div
            onClick={() => currentTier < 2 && setSelectedTier(2)}
            className={`p-4 rounded-3xl border transition-all relative ${
              currentTier >= 2
                ? isLight
                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default'
                  : 'bg-[#111216] border-stone-800 opacity-60 cursor-default'
                : selectedTier === 2
                ? isLight
                  ? 'bg-white border-2 border-amber-500 shadow-lg shadow-amber-500/10 cursor-pointer'
                  : 'bg-[#1a1b24] border-amber-400 shadow-xl shadow-amber-500/10 cursor-pointer'
                : isLight
                ? 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                : 'bg-[#14151c] border-stone-800/90 hover:border-stone-700 cursor-pointer'
            }`}
          >
            {currentTier < 2 && (
              <span className="absolute -top-2.5 right-4 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-bold uppercase tracking-wide shadow-sm">
                Standard
              </span>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Tier 2 Account
                  </h4>
                  {currentTier >= 2 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isLight ? 'bg-slate-200 text-slate-600' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      Already Unlocked
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Balance holding capacity up to <strong className={isLight ? 'text-slate-900' : 'text-white'}>₦2,000,000</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">₦4,500</span>
                <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                  Pay to Company
                </span>
              </div>
            </div>

            <div
              className={`mt-3 pt-3 border-t space-y-1.5 text-[11px] ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-stone-800/80 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Wallet holds up to ₦2,000,000 Naira</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Immediately credits held pending earnings upon approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Priority processing for all bank withdrawals</span>
              </div>
            </div>

            {currentTier < 2 && (
              <div className="mt-3 pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier(2);
                    setStep('payment');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Pay &amp; Upgrade to Tier 2 (₦4,500)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tier 3 Option (₦15,000) - VIP HIGH PRIORITY */}
          <div
            onClick={() => currentTier < 3 && setSelectedTier(3)}
            className={`p-4 rounded-3xl border transition-all relative ${
              currentTier >= 3
                ? isLight
                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default'
                  : 'bg-[#111216] border-stone-800 opacity-60 cursor-default'
                : selectedTier === 3
                ? isLight
                  ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50 border-2 border-amber-500 shadow-xl shadow-amber-500/15 cursor-pointer ring-1 ring-amber-400'
                  : 'bg-[#1e1c28] border-amber-400 shadow-xl shadow-amber-500/20 cursor-pointer'
                : isLight
                ? 'bg-white border-slate-200 hover:border-amber-300 cursor-pointer'
                : 'bg-[#14151c] border-stone-800/90 hover:border-stone-700 cursor-pointer'
            }`}
          >
            <span className="absolute -top-2.5 right-4 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> VIP Recommended
            </span>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Tier 3 Account (VIP) <Crown className="w-4 h-4 text-amber-500" />
                  </h4>
                  {currentTier >= 3 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isLight ? 'bg-slate-200 text-slate-600' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      Already Unlocked
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Unlimited holding capacity up to <strong className={isLight ? 'text-slate-900' : 'text-white'}>₦5,000,000+</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {formatNaira(tierDetails[3].price)}
                </span>
                <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                  Pay to Company
                </span>
              </div>
            </div>

            <div
              className={`mt-3 pt-3 border-t space-y-1.5 text-[11px] ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-stone-800/80 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Unlimited wallet capacity: No balance caps or freezing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>100% direct credit of all earnings &amp; rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>VIP fast-track automated withdrawals directly to your bank</span>
              </div>
            </div>

            {currentTier < 3 && (
              <div className="mt-3 pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier(3);
                    setStep('payment');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Pay &amp; Upgrade to Tier 3 ({formatNaira(tierDetails[3].price)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT INTO COMPANY ACCOUNT & UPLOAD PROOF */}
      {step === 'payment' && activePlan && (
        <form onSubmit={handleSubmitUpgradePayment} className="space-y-4">
          <div
            className={`p-4 rounded-3xl border space-y-3 shadow-xs ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
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
                  Selected Tier
                </span>
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activePlan.title}
                </h3>
              </div>
              <div className="text-right">
                <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  Upgrade Amount
                </span>
                <span
                  className={`text-base font-extrabold ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}
                >
                  {formatNaira(activePlan.price)}
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
                  The company account for receiving tier upgrade transfers has not been set yet. Please check back shortly or contact support.
                </p>
              </div>
            ) : (
              <>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                  Transfer exactly <strong>{formatNaira(activePlan.price)}</strong> into the official 9jacash company bank account below:
                </p>

                {/* Company Account Box */}
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
                        onClick={() => copyToClipboard(companyAccount.accountNumber, 'acc_num')}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-2xs'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                        title="Copy account number"
                      >
                        {copied === 'acc_num' ? (
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
              Upload Payment Receipt / Proof of Transfer <span className="text-amber-500">*</span>
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
                  Click to select payment receipt
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
                      {receiptName || (receiptFile ? receiptFile.name : 'payment_receipt.png')}
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
                Your payment and uploaded receipt will be submitted directly to the company dashboard for verification. Your Tier {selectedTier} account is activated immediately once approved.
              </span>
            </div>
          </div>

          {upgradeError && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                isLight
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{upgradeError}</span>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isProcessing || (!receiptFile && !receiptUrl) || !isCompanyAccountSet
                  ? isLight
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-400/20 cursor-pointer active:scale-98'
              }`}
            >
              {isProcessing ? (
                <span>Submitting Payment to Company Dashboard...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit Payment for Company Approval ({formatNaira(activePlan.price)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('plans')}
              className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-stone-900/60 hover:bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              Back to Plans
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUBMITTED & PENDING COMPANY APPROVAL */}
      {step === 'submitted_pending' && (
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
              <Crown className="w-3.5 h-3.5" />
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
              Pending Company Approval
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Upgrade Payment Submitted!
            </h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Your payment receipt has been submitted to the 9jacash company dashboard. An administrator will verify your payment and activate your upgraded tier shortly.
            </p>
          </div>

          {/* Details Card */}
          <div
            className={`p-4 rounded-2xl border text-left space-y-2.5 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e0f14] border-stone-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Target Level:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                Tier {activeRequest?.targetTier || selectedTier} Account
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Upgrade Amount:</span>
              <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {formatNaira(activeRequest?.amount || activePlan?.price || 15000)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference:</span>
              <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                {activeRequest?.reference || 'UPG9JA' + Date.now()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Uploaded Receipt:</span>
              <span className={`truncate max-w-[160px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                {activeRequest?.receiptName || receiptName || 'payment_receipt.png'}
              </span>
            </div>
            <div
              className={`flex justify-between items-center pt-1 border-t ${
                isLight ? 'border-slate-200' : 'border-stone-800/80'
              }`}
            >
              <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Review Status:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Awaiting Company Admin
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
      )}
    </div>
  );
};
