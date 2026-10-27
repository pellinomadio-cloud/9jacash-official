import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
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
} from 'lucide-react';

interface UpgradeTierPageProps {
  onBack: () => void;
}

export const UpgradeTierPage: React.FC<UpgradeTierPageProps> = ({ onBack }) => {
  const { user, companyAccount, formatNaira, submitDepositRequest, depositRequests, refreshAllUsers } = useAuth();
  const currentTier = user?.tier || 1;

  // Active pending request if user already submitted
  const pendingUpgradeReq = depositRequests.find(
    (r) => r.userId === user?.id && r.requestType === 'upgrade' && r.status === 'pending'
  );

  const [selectedTier, setSelectedTier] = useState<number>(currentTier === 1 ? 2 : 3);
  const [step, setStep] = useState<'plans' | 'payment' | 'submitted_pending'>(
    pendingUpgradeReq ? 'submitted_pending' : 'plans'
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
      color: string;
      badge: string;
      features: string[];
    }
  > = {
    1: {
      title: 'Tier 1 Account',
      price: 0,
      holdingLimit: 400000,
      holdingLimitFormatted: '₦400,000',
      color: 'from-stone-700 to-stone-900',
      badge: 'Starter Level',
      features: [
        'Maximum wallet holding: ₦400,000',
        'Earning page locked once ₦400,000 balance is reached',
        'Standard bank transfers',
      ],
    },
    2: {
      title: 'Tier 2 Account',
      price: 6600,
      holdingLimit: 2000000,
      holdingLimitFormatted: '₦2,000,000 (2 Million)',
      color: 'from-amber-600 to-amber-900',
      badge: 'Most Popular Upgrade',
      features: [
        'Maximum wallet holding: ₦2,000,000',
        'Instant unlock of the Earning Page (Snake 3D, Candy Crush, Wheel, Claim & Quiz)',
        'Priority Quick Code clearing queue',
        'Higher daily task rewards capacity',
      ],
    },
    3: {
      title: 'Tier 3 Account (VIP)',
      price: 8000,
      holdingLimit: Infinity,
      holdingLimitFormatted: 'Unlimited Wallet Capacity',
      color: 'from-yellow-500 via-amber-600 to-stone-950',
      badge: 'VIP Level 3',
      features: [
        '100% direct credit of all earnings to available balance',
        'Unlimited wallet holding without restrictions',
        'VIP priority bank withdrawal clearance',
        'Full unlimited access to all platform earnings',
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

  const handleSubmitUpgradePayment = (e: React.FormEvent) => {
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

    const activePlan = tierDetails[selectedTier];
    const fileName = receiptName || (receiptFile ? receiptFile.name : `Upgrade_Tier_${selectedTier}_receipt.png`);

    setTimeout(() => {
      const req = submitDepositRequest(
        activePlan.price,
        fileName,
        'upgrade',
        activePlan.title,
        undefined,
        receiptUrl,
        selectedTier
      );

      setIsProcessing(false);
      if (req) {
        setActiveRequest(req);
        setStep('submitted_pending');
      } else {
        setUpgradeError('Failed to submit upgrade request. Please try again.');
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

  const activePlan = tierDetails[selectedTier];
  const pendingFunds = user?.pendingEarnings || 0;

  return (
    <div className="min-h-screen pb-16 space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2 pb-3 border-b border-stone-800">
        <button
          type="button"
          onClick={() => {
            if (step === 'payment') setStep('plans');
            else onBack();
          }}
          className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            Account Tier Upgrade <Crown className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-stone-400">
            {step === 'plans' && 'Increase your wallet holding capacity & unlock the earning page'}
            {step === 'payment' && `Pay to Company for Tier ${selectedTier} Upgrade`}
            {step === 'submitted_pending' && 'Upgrade Submitted for Company Approval'}
          </p>
        </div>
      </div>

      {/* Tier 1 400,000 Limit Notice if reached */}
      {currentTier < 2 && (user?.balance || 0) >= 400000 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                Tier 1 Limit Reached (₦400,000)
              </h4>
              <p className="text-[11px] text-stone-300">
                The earning page is currently locked. Upgrade to Tier 2 to unlock all earning games &amp; expand holding limit to ₦2,000,000!
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
            <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  Upgrade Request Under Review
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">
                  Pending Approval
                </span>
              </div>
              <p className="text-xs text-stone-300">
                You have a submitted upgrade payment for <strong>Tier {pendingUpgradeReq.targetTier || 2}</strong> awaiting company approval.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveRequest(pendingUpgradeReq);
                  setStep('submitted_pending');
                }}
                className="mt-1 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Submitted Request Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Current Status Card */}
          <div className="p-4 rounded-3xl bg-[#14161f] border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold block">
                Current Level
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                Tier {currentTier} Account
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Active
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Balance Limit: <strong className="text-amber-400">{tierDetails[currentTier]?.holdingLimitFormatted || '₦400,000'}</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Crown className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
            Choose Upgrade Tier
          </h3>

          {/* Tier 2 Option */}
          <div
            onClick={() => currentTier < 2 && setSelectedTier(2)}
            className={`p-4 rounded-3xl border transition-all relative ${
              currentTier >= 2
                ? 'bg-[#111216] border-stone-800 opacity-60 cursor-default'
                : selectedTier === 2
                ? 'bg-[#1a1b24] border-amber-400 shadow-xl shadow-amber-500/10 cursor-pointer'
                : 'bg-[#14151c] border-stone-800/90 hover:border-stone-700 cursor-pointer'
            }`}
          >
            {currentTier < 2 && (
              <span className="absolute -top-2.5 right-4 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-bold uppercase tracking-wide shadow-sm">
                Recommended
              </span>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Tier 2 Account</h4>
                  {currentTier >= 2 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                      Already Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Balance holding capacity up to <strong className="text-white">₦2,000,000</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-amber-400">₦6,600</span>
                <span className="block text-[10px] text-stone-500">Pay to Company</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-1.5 text-[11px] text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Wallet holds up to ₦2,000,000 Naira</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Immediately credits any held pending earnings upon approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
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
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Pay &amp; Upgrade to Tier 2 (₦6,600)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tier 3 Option */}
          <div
            onClick={() => currentTier < 3 && setSelectedTier(3)}
            className={`p-4 rounded-3xl border transition-all relative ${
              currentTier >= 3
                ? 'bg-[#111216] border-stone-800 opacity-60 cursor-default'
                : selectedTier === 3
                ? 'bg-[#1e1c28] border-amber-400 shadow-xl shadow-amber-500/10 cursor-pointer'
                : 'bg-[#14151c] border-stone-800/90 hover:border-stone-700 cursor-pointer'
            }`}
          >
            <span className="absolute -top-2.5 right-4 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold uppercase tracking-wide shadow-sm">
              VIP Unlimited
            </span>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Tier 3 Account (VIP)</h4>
                  {currentTier >= 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                      Already Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Balance holding capacity up to <strong className="text-white">₦5,000,000</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-amber-400">₦8,000</span>
                <span className="block text-[10px] text-stone-500">Pay to Company</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-1.5 text-[11px] text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Maximum wallet capacity: ₦5,000,000 Naira</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Unrestricted daily earning &amp; task limits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>VIP fast-track automated withdrawals</span>
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
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Pay &amp; Upgrade to Tier 3 (₦8,000)</span>
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
          <div className="p-4 rounded-3xl bg-[#161822] border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">Selected Tier</span>
                <h3 className="font-bold text-white text-sm">{activePlan.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400 block">Upgrade Amount</span>
                <span className="text-base font-extrabold text-amber-400">
                  {formatNaira(activePlan.price)}
                </span>
              </div>
            </div>

            {!isCompanyAccountSet ? (
              <div className="p-4 rounded-2xl bg-[#0f1014] border border-amber-500/30 text-center space-y-2">
                <span className="text-xs font-bold text-amber-400 block">Company Account Not Configured</span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  The company account for receiving tier upgrade transfers has not been set yet. Please check back shortly or contact support.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Transfer exactly <strong>{formatNaira(activePlan.price)}</strong> into the official 9jacash company bank account below:
                </p>

                {/* Company Account Box */}
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
                        onClick={() => copyToClipboard(companyAccount.accountNumber, 'acc_num')}
                        className="p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                        title="Copy account number"
                      >
                        {copied === 'acc_num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              Upload Payment Receipt / Proof of Transfer <span className="text-amber-400">*</span>
            </label>

            {!receiptFile && !receiptUrl ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-700 hover:border-amber-400/70 rounded-2xl bg-[#0e0f14] transition-colors cursor-pointer text-center group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-stone-200">
                  Click to select payment receipt
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
                      {receiptName || (receiptFile ? receiptFile.name : 'payment_receipt.png')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready for submission
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
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Your payment and uploaded receipt will be submitted directly to the company dashboard for verification. Your account tier is activated once approved.
              </span>
            </div>
          </div>

          {upgradeError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {upgradeError}
            </div>
          )}

          <div className="space-y-2">
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
                <span>Submitting Payment to Company Dashboard...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit Payment for Company Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('plans')}
              className="w-full py-2.5 rounded-2xl bg-stone-900/60 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Plans
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUBMITTED & PENDING COMPANY APPROVAL */}
      {step === 'submitted_pending' && (
        <div className="p-6 rounded-3xl bg-[#141620] border border-amber-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="relative w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <Clock className="w-8 h-8 animate-spin" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              Pending Company Approval
            </div>
            <h3 className="text-xl font-bold text-white">Upgrade Payment Submitted!</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              Your payment receipt has been submitted to the 9jacash company dashboard. An administrator will verify your payment and activate your upgraded tier shortly.
            </p>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-[#0e0f14] border border-stone-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Target Level:</span>
              <span className="text-amber-400 font-bold">
                Tier {activeRequest?.targetTier || selectedTier} Account
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Upgrade Amount:</span>
              <span className="text-white font-bold font-mono">
                {formatNaira(activeRequest?.amount || activePlan?.price || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Reference:</span>
              <span className="text-stone-300 font-mono font-bold text-[11px]">
                {activeRequest?.reference || 'UPG9JA' + Date.now()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Uploaded Receipt:</span>
              <span className="text-stone-300 truncate max-w-[160px]">
                {activeRequest?.receiptName || receiptName || 'payment_receipt.png'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
              <span className="text-stone-400">Review Status:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Awaiting Company Admin
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
      )}
    </div>
  );
};
