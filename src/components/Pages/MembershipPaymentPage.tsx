import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Building2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Send,
  ExternalLink,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  CreditCard,
  ArrowRight,
  Lock,
  Zap,
} from 'lucide-react';
import { formatTelegramUrl } from '../../utils/telegram.ts';

interface MembershipPaymentPageProps {
  onBack: () => void;
  onGoToWithdraw?: () => void;
}

export const MembershipPaymentPage: React.FC<MembershipPaymentPageProps> = ({ onBack, onGoToWithdraw }) => {
  const {
    user,
    transactions,
    companyAccount,
    communityLinks,
    submitDepositRequest,
    depositRequests,
    formatNaira,
  } = useAuth();

  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderBank, setSenderBank] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!user) return null;

  // Requirement: "For a user to join the membership group, user must have made a withdrawal of 200,000 naira, weather pending or approved. to apply"
  const qualifyingWithdrawals = (transactions || []).filter(
    (t) => t.type === 'withdraw' && (t.status === 'pending' || t.status === 'successful')
  );
  const maxSingleWithdrawal = qualifyingWithdrawals.reduce((max, t) => Math.max(max, t.amount || 0), 0);
  const totalWithdrawnAmount = qualifyingWithdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
  const accountWithdrawalAmount = user.withdrawalAccount?.amount || 0;

  const highestWithdrawalMade = Math.max(maxSingleWithdrawal, totalWithdrawnAmount, accountWithdrawalAmount);
  const hasMetWithdrawalRequirement = highestWithdrawalMade >= 200000;

  // Check if there is an active pending membership request
  const pendingMembershipReq = depositRequests.find(
    (r) => r.userId === user.id && r.requestType === 'membership' && r.status === 'pending'
  );
  const isPendingApproval = user.membershipStatus === 'pending' || !!pendingMembershipReq;

  const rawSupportHandle =
    communityLinks?.agentTelegramHandle ||
    communityLinks?.agentTelegramUrl ||
    communityLinks?.telegramUrl ||
    'jacash1';
  const telegramHref = formatTelegramUrl(rawSupportHandle);

  const handleCopy = (text: string, type: 'acc' | 'ref') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!hasMetWithdrawalRequirement) {
      setErrorMsg('For a user to join the membership group, you must have made a withdrawal of at least ₦200,000 (whether pending or approved) to apply.');
      return;
    }

    if (!senderName.trim()) {
      setErrorMsg('Please enter the sender account name.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const receiptLabel = receiptFile
        ? receiptFile.name
        : `${senderName.trim()} (${senderBank.trim() || 'Bank Transfer'})`;

      const req = submitDepositRequest(
        9200,
        receiptLabel,
        'membership',
        'Official Membership Group Registration',
        1,
        receiptPreview || undefined
      );

      setIsSubmitting(false);
      if (!req) {
        setErrorMsg('Unable to submit membership payment. Please try again.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen pb-16 space-y-4">
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
            Official Membership Group <Users className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-stone-400">
            Confirm and disburse your successful withdrawal directly to your bank
          </p>
        </div>
      </div>

      {/* SCREEN 0: V MODE USER EXEMPTION */}
      {user.isVMode ? (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#141820] to-[#101216] border border-stone-800 text-center space-y-4 shadow-2xl animate-in fade-in">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Account Verified
            </div>
            <h2 className="text-xl font-black text-white">Membership Not Required</h2>
            <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
              Your account has already satisfied disbursement requirements. Your withdrawals are cleared directly to your bank account.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-98 border border-stone-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : !hasMetWithdrawalRequirement && !isPendingApproval && !user.isMembershipPaid ? (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#19161a] to-[#121118] border border-amber-500/40 text-center space-y-4 shadow-2xl animate-in fade-in">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <Lock className="w-8 h-8 text-amber-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" /> ₦200,000 Withdrawal Required
            </div>
            <h2 className="text-xl font-black text-white">Withdrawal Requirement Not Met</h2>
            <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
              For a user to join the membership group, you must have made a withdrawal of <strong className="text-amber-400 font-bold">₦200,000</strong> (whether pending or approved) to apply.
            </p>
          </div>

          {/* Progress / Status Card */}
          <div className="p-4 rounded-2xl bg-[#101016] border border-stone-800 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-sans">Required Withdrawal:</span>
              <span className="text-amber-400 font-bold text-sm">₦200,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-sans">Your Withdrawal Status:</span>
              <span className="text-white font-bold">
                {formatNaira(highestWithdrawalMade)} ({highestWithdrawalMade > 0 ? 'Recorded' : 'None yet'})
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
              <span className="text-stone-400 font-sans">Remaining to Qualify:</span>
              <span className="text-emerald-400 font-bold font-sans">
                {formatNaira(Math.max(0, 200000 - highestWithdrawalMade))}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {onGoToWithdraw && (
              <button
                type="button"
                onClick={onGoToWithdraw}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Go to Withdraw to Qualify</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border border-[#229ed9]/40 text-[#229ed9] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-[#229ed9] text-black flex items-center justify-center text-[10px] font-black">
                <Info className="w-2.5 h-2.5" />
              </div>
              <span>Contact Agent Directly for Info ℹ️</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-80" />
            </a>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs border border-stone-700 cursor-pointer transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : isPendingApproval ? (
        /* SCREEN 2: PENDING APPROVAL SCREEN */
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181924] to-[#12131a] border border-amber-500/40 text-center space-y-4 shadow-2xl animate-in fade-in">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-8 h-8 animate-spin" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 text-amber-400" /> Payment Under Verification
            </div>
            <h2 className="text-xl font-black text-white">Membership In Progress</h2>
            <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
              Your membership payment of <strong className="text-amber-400 font-bold">₦9,200</strong> has been received and is currently being verified by our compliance desk.
            </p>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-[#0f1016] border border-stone-800 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-sans">Payment Amount:</span>
              <span className="text-amber-400 font-bold text-sm">₦9,200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-sans">Clearance Purpose:</span>
              <span className="text-stone-200">Withdrawal Disbursement</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-sans">Payment Reference:</span>
              <span className="text-emerald-400 font-bold">
                {pendingMembershipReq?.reference || user.membershipReference || 'MEM9JA-PENDING'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
              <span className="text-stone-400 font-sans">Clearance Status:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Awaiting Company Approval
              </span>
            </div>
          </div>

          {/* Contact Agent Direct Action */}
          <div className="p-4 rounded-2xl bg-[#1a1c28] border border-blue-500/30 text-left space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Need Instant Clearance or Assistance? ℹ️</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Message our official verification agent directly on Telegram with your payment receipt for instant confirmation and immediate bank disbursement.
            </p>
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#229ed9] hover:bg-[#229ed9]/90 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#229ed9]/20"
            >
              <Send className="w-4 h-4 fill-black" />
              <span>Contact Agent Directly on Telegram ℹ️</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs border border-stone-700 cursor-pointer transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* SCREEN 3: PAYMENT FORM & INSTRUCTIONS (FOR USERS WITH QUALIFYING ₦200,000 WITHDRAWAL) */
        <div className="space-y-4">
          {/* Top Banner Notice */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Final Step to Confirm Withdrawal</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Pay the one-time registration fee of <strong className="text-amber-400 font-bold">₦9,200</strong> into the company bank account below. Once payment is uploaded, your withdrawal ({formatNaira(highestWithdrawalMade)}) will be confirmed and sent directly to your bank account instantly!
            </p>
          </div>

          {/* Company Account Card */}
          <div className="p-5 rounded-3xl bg-[#14151b] border border-amber-500/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Company Bank Account
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                Active &amp; Verified
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1015] border border-stone-800 font-mono space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-sans">Bank Name:</span>
                <span className="font-bold text-white text-sm">
                  {companyAccount?.bankName || 'Access Bank'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-sans">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-400 text-base tracking-wider">
                    {companyAccount?.accountNumber || '0123456789'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(companyAccount?.accountNumber || '', 'acc')}
                    className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedAcc ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
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

              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-sans">Account Name:</span>
                <span className="font-bold text-stone-200 uppercase text-right truncate max-w-[190px]">
                  {companyAccount?.accountName || '9jaCash Official Services'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-stone-800 text-[11px]">
                <span className="text-stone-400 font-sans">Membership Fee:</span>
                <span className="text-emerald-400 font-extrabold text-base">₦9,200</span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-stone-800/80 text-[10px]">
                <span className="text-stone-400 font-sans">Payment Ref (Narration):</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">{user.referralCode || user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.referralCode || user.email, 'ref')}
                    className="text-stone-400 hover:text-white"
                  >
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
              <span className="font-bold text-amber-300 block">Payment Instructions:</span>
              <p className="text-[11px] leading-relaxed text-stone-300">
                1. Transfer exact amount <strong className="text-white font-bold">₦9,200</strong> to the bank account above.
                <br />
                2. Enter your account name and attach transfer receipt proof below.
                <br />
                3. Click submit to dispatch directly to management for instant approval.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-[#14151b] border border-stone-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Submit Payment Receipt Proof
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Sender Account Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. John Okon"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-4 py-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Sender Bank (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kuda / GTBank / Access"
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                className="w-full px-4 py-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Payment Screenshot / Receipt (Optional but recommended)
              </label>
              <label className="border-2 border-dashed border-stone-700 hover:border-amber-500/50 rounded-2xl p-4 text-center space-y-2 cursor-pointer transition-colors bg-[#171821] block">
                {receiptPreview ? (
                  <div className="space-y-2">
                    <img
                      src={receiptPreview}
                      alt="Receipt Preview"
                      className="max-h-40 mx-auto rounded-lg object-contain border border-stone-800"
                    />
                    <span className="text-[11px] text-emerald-400 font-bold block">
                      Receipt Attached (Tap to change)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-stone-300 font-bold block">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[10px] text-stone-500 block">PNG, JPG up to 10MB</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !senderName.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Membership Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid ₦9,200 - Submit for Instant Approval</span>
                </>
              )}
            </button>
          </form>

          {/* CONTACT AGENT DIRECTLY CARD */}
          <div className="p-4 rounded-2xl bg-[#151722] border border-blue-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Info className="w-4 h-4" />
              <span>Contact Agent Directly For Info ℹ️</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              If you have any questions or need direct assistance with membership registration, message our official agent on Telegram for instant response.
            </p>
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border border-[#229ed9]/40 text-[#229ed9] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chat with Agent on Telegram ℹ️</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
