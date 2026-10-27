import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  ArrowLeft, 
  Plus, 
  Landmark, 
  Copy, 
  Check, 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { DepositRequest } from '../../types/index.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';

interface DepositPageProps {
  onBack: () => void;
}

export const DepositPage: React.FC<DepositPageProps> = ({ onBack }) => {
  const { user, formatNaira, companyAccount, submitDepositRequest, depositRequests } = useAuth();
  
  // Steps: 'amount' | 'payment' | 'submitted_pending'
  const [step, setStep] = useState<'amount' | 'payment' | 'submitted_pending'>('amount');
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeRequest, setActiveRequest] = useState<DepositRequest | null>(null);

  const isCompanyAccountSet = !!(
    companyAccount &&
    companyAccount.isConfigured &&
    companyAccount.accountNumber &&
    companyAccount.bankName
  );

  if (!user) return null;

  // Check if current user has any active pending request or recently declined
  const userPendingReq = depositRequests.find((r) => r.userId === user.id && r.status === 'pending');
  const userRecentDeclinedReq = depositRequests.find((r) => r.userId === user.id && r.status === 'declined');

  const copyAccount = () => {
    navigator.clipboard.writeText(companyAccount.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isCompanyAccountSet) {
      setError('The company deposit account has not been set by management yet.');
      return;
    }
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 100) {
      setError('Minimum deposit amount is ₦100');
      return;
    }
    setStep('payment');
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

  const handleSubmitForApproval = () => {
    if (!receiptFile && !receiptName) {
      setError('Please upload your payment receipt / proof of transfer to proceed');
      return;
    }

    const amt = parseFloat(depositAmount);
    const req = submitDepositRequest(
      amt,
      receiptName || 'transfer_receipt.png',
      'deposit',
      undefined,
      undefined,
      receiptUrl
    );
    if (req) {
      setActiveRequest(req);
      setStep('submitted_pending');
      setError('');
    }
  };

  return (
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2 pb-3 border-b border-stone-800">
        <button
          type="button"
          onClick={() => {
            if (step === 'payment') setStep('amount');
            else onBack();
          }}
          className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            Deposit to Wallet <Plus className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-stone-400">
            {step === 'amount' && 'Enter deposit amount to begin'}
            {step === 'payment' && 'Transfer funds & upload receipt for approval'}
            {step === 'submitted_pending' && 'Deposit submitted • Waiting company approval'}
          </p>
        </div>
      </div>

      {/* Declined Warning Banner if previous request was declined */}
      {step === 'amount' && userRecentDeclinedReq && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Previous Deposit Verification Notice</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Your previous deposit of {formatNaira(userRecentDeclinedReq.amount)} was declined.
          </p>
          <p className="text-[11px] text-red-300 font-semibold">
            Reason: {userRecentDeclinedReq.declineReason || 'Receipt could not be verified'}.
          </p>
          <p className="text-[10px] text-stone-400">
            Please ensure you make the exact transfer and upload a full, clear screenshot of your bank receipt.
          </p>
        </div>
      )}

      {/* STEP 1: Enter Amount */}
      {step === 'amount' && (
        <form onSubmit={handleProceedToPayment} className="space-y-4">
          {/* Current Balance card */}
          <div className="p-4 rounded-2xl bg-[#15161c] border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-400 block">Current Balance</span>
              <span className="text-xl font-bold text-white" data-balance-text>{formatNaira(user.balance)}</span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              0% Transfer Fee
            </span>
          </div>

          {/* Pending Request Alert if one already exists */}
          {userPendingReq && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Pending Deposit in Review</span>
                  <span className="text-[11px] text-amber-400 font-semibold">{formatNaira(userPendingReq.amount)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveRequest(userPendingReq);
                  setStep('submitted_pending');
                }}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-400 text-black font-bold"
              >
                Track Status
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Simulation Amounts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-300 block">Select Quick Amount</span>
            <div className="grid grid-cols-3 gap-2">
              {[2000, 5000, 10000, 20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(amt.toString())}
                  className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    depositAmount === amt.toString()
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20'
                      : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/30'
                  }`}
                >
                  {formatNaira(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Deposit Amount */}
          <div className="p-4 rounded-2xl bg-[#15161c] border border-stone-800 space-y-2.5">
            <label className="text-xs font-bold text-stone-300 block">Or Enter Specific Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-amber-400">₦</span>
              <input
                type="number"
                min="100"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-base font-bold placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Warning Notice if Company Account is not configured yet */}
          {!isCompanyAccountSet && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex gap-2.5 items-start">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold text-white">Company Deposit Account Not Available</p>
                <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5">
                  The company account for receiving deposits has not been set by company management from the control center yet. Deposits are temporarily on hold until the company account is set.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isCompanyAccountSet}
            className={`w-full mt-2 py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              !isCompanyAccountSet
                ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                : 'bg-black hover:bg-stone-900 text-white border-2 border-white shadow-xl shadow-black/80 ring-2 ring-emerald-400/60 cursor-pointer active:scale-98 group'
            }`}
          >
            <span>{isCompanyAccountSet ? 'Continue to Payment Account' : 'Company Deposit Account Not Set Yet'}</span>
            {isCompanyAccountSet && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
            )}
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      )}

      {/* STEP 2: App Account Payment & Receipt Upload */}
      {step === 'payment' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Target Amount */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-300 block font-semibold">Amount to Pay</span>
              <span className="text-2xl font-black text-white">{formatNaira(parseFloat(depositAmount))}</span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-400 text-black font-bold">
              Direct Bank Transfer
            </span>
          </div>

          {/* If company account is not configured by admin yet */}
          {!isCompanyAccountSet ? (
            <div className="p-6 rounded-3xl bg-[#15161c] border border-amber-500/30 text-center space-y-3.5 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-block">
                  ACCOUNT NOT CONFIGURED
                </span>
                <h3 className="text-base font-bold text-white">Company Deposit Account Not Available</h3>
                <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                  The company account for receiving deposits has not been set by management from the control center yet. Please check back shortly or check our community channels for official updates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('amount')}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Change Deposit Amount
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic App Account Details Card */}
              <div className="p-5 rounded-3xl bg-[#15161c] border border-stone-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>App Deposit Account</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                {/* Account Number with Copy */}
                <div className="p-4 rounded-2xl bg-[#1c1e26] border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-stone-500 block font-semibold">Account Number</span>
                    <span className="text-xl font-black text-amber-400 tracking-wider font-mono">
                      {companyAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccount}
                    className="py-1.5 px-3 rounded-xl bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors shadow-sm"
                  >
                    {copiedAcc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Bank Name & Account Name */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-[#1c1e26] border border-stone-800">
                    <span className="text-stone-400 text-[10px] block font-medium">Bank Name</span>
                    <span className="font-bold text-white mt-0.5 block">{companyAccount.bankName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1e26] border border-stone-800">
                    <span className="text-stone-400 text-[10px] block font-medium">Account Name</span>
                    <span className="font-bold text-white mt-0.5 block truncate">{companyAccount.accountName}</span>
                  </div>
                </div>
              </div>

              {/* Payment Receipt Upload Section */}
              <div className="p-5 rounded-3xl bg-[#15161c] border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>Upload Payment Proof</span>
                </span>
                <p className="text-[11px] text-stone-400">
                  Transfer exactly {formatNaira(parseFloat(depositAmount))} to the company account above, then attach your receipt for company verification.
                </p>

                <div className="relative border-2 border-dashed border-stone-700 hover:border-amber-400/60 rounded-2xl p-4 text-center transition-colors bg-[#1c1e26]/50">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    {receiptName ? (
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{receiptName}</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-stone-200">Tap to browse or drop receipt file</span>
                        <span className="text-[10px] text-stone-500">Supports JPG, PNG, PDF (Max 10MB)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button: Bold, more of white and black, little touch of green */}
              <button
                type="button"
                onClick={handleSubmitForApproval}
                className="w-full py-3.5 rounded-xl bg-black hover:bg-stone-900 text-white font-black text-xs border-2 border-white shadow-xl shadow-black/80 ring-2 ring-emerald-400/60 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all group"
              >
                <span>Submit Payment for Approval</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Submitted - Pending Approval View */}
      {step === 'submitted_pending' && (
        <div className="p-6 rounded-3xl bg-[#14151b] border border-amber-500/30 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div className="text-center space-y-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
              Waiting Company Approval
            </span>
            <h2 className="text-lg font-bold text-white pt-1">Deposit Under Verification</h2>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Your payment receipt has been submitted for company verification. Once verified, your wallet will be credited immediately.
            </p>
          </div>

          {/* Request Details Card */}
          <div className="p-4 rounded-2xl bg-[#1c1e26] border border-stone-800 space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-stone-400">Deposit Amount</span>
              <span className="font-extrabold text-amber-400 text-sm">
                {formatNaira(activeRequest ? activeRequest.amount : parseFloat(depositAmount))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Payment To</span>
              <span className="text-white font-medium">{companyAccount.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Receipt File</span>
              <span className="text-stone-300 truncate max-w-[170px]">
                {activeRequest ? activeRequest.receiptName : receiptName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Tracking Reference</span>
              <span className="font-mono text-stone-300">{activeRequest?.reference || 'DEP9JA82910'}</span>
            </div>
          </div>

          {/* Verification Status Timeline */}
          <div className="p-4 rounded-2xl bg-[#181922] border border-stone-800 space-y-3">
            <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
              Approval Progress
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Payment receipt uploaded &amp; queued</span>
              </div>
              <div className="flex items-center gap-2.5 text-amber-400">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex-shrink-0" />
                <span className="font-semibold">Waiting company approval &amp; verification</span>
              </div>
              <div className="flex items-center gap-2.5 text-stone-500">
                <div className="w-4 h-4 rounded-full border border-stone-700 flex-shrink-0" />
                <span>Automatic wallet credit upon approval</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('amount');
                setDepositAmount('5000');
                setReceiptFile(null);
                setReceiptName('');
                setActiveRequest(null);
              }}
              className="flex-1 py-3 rounded-xl bg-[#1c1e26] border border-stone-700 text-stone-200 text-xs font-semibold hover:bg-stone-800"
            >
              New Deposit
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-400/20 hover:bg-amber-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
