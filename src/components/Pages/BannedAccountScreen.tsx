import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  Building2,
  Send,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatTelegramUrl } from '../../utils/telegram.ts';

export const BannedAccountScreen: React.FC = () => {
  const {
    user,
    logout,
    unbanAccountWithCode,
    companyAccount,
    communityLinks,
    formatNaira,
  } = useAuth();

  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!user) return null;

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

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inputCode.trim()) {
      setErrorMsg('Please enter your ₦60,000 Restore Code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const res = unbanAccountWithCode(inputCode);
      setIsVerifying(false);
      if (res.success) {
        setSuccessMsg(res.message || 'Account successfully unbanned!');
      } else {
        setErrorMsg(res.message || 'Invalid recovery code. Please check and try again.');
      }
    }, 800);
  };

  const rawSupportHandle =
    communityLinks?.agentTelegramHandle ||
    communityLinks?.agentTelegramUrl ||
    communityLinks?.telegramUrl ||
    'jacash1';
  const telegramHref = formatTelegramUrl(rawSupportHandle);

  const formattedBannedDate = user.bannedAt
    ? new Date(user.bannedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recent Security Review';

  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] text-stone-200 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient security glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-amber-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xl mx-auto space-y-4 pt-3 pb-8">
        {/* Top Restricted Badge */}
        <div className="flex items-center justify-between gap-3 border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span>Security Enforcement</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono">Gateway Protocol v3.8</div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 hover:text-white hover:bg-red-900/60 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Main Alert Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1b1114] to-[#121217] border border-red-500/40 shadow-2xl shadow-red-950/40 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>Account Banned</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              Your 9jacash account access has been restricted by administration. All account activities, withdrawals, and wallet balances are currently locked.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-[#0f1015] border border-stone-800/80 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
              <span className="text-stone-400 text-[11px]">Account Holder:</span>
              <span className="font-bold text-white text-sm">{user.name}</span>
            </div>
            {user.referralCode && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-[11px]">Referral Code:</span>
                <span className="font-mono text-amber-400 font-bold">{user.referralCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-stone-400 text-[11px]">Registered Email:</span>
              <span className="text-stone-300 font-mono text-[11px]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 text-[11px]">Locked Wallet Balance:</span>
              <span className="font-bold text-emerald-400">{formatNaira(user.balance || 0)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[10px]">
              <span className="text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Restriction Imposed:
              </span>
              <span className="text-stone-400 font-mono">{formattedBannedDate}</span>
            </div>
          </div>
        </div>

        {/* PRICING & RECOVERY CODE INSTRUCTION CARD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1c1813] via-[#151419] to-[#121217] border border-amber-500/40 shadow-xl shadow-amber-950/20 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Account Recovery Requirement
              </h2>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
              Official Unban Service
            </span>
          </div>

          {/* Highlighted Price Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-yellow-500/15 border-2 border-amber-500/50 text-center space-y-1">
            <div className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
              Price of Restore Code
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
              ₦60,000
            </div>
            <div className="text-xs font-semibold text-amber-300/90">
              Sixty Thousand Naira Only
            </div>
            <p className="text-[11px] text-stone-400 pt-1 leading-relaxed max-w-sm mx-auto">
              To lift the ban and restore full access to your account and wallet balance, you are required to input a valid ₦60,000 Restore Code.
            </p>
          </div>

          {/* Input Restore Code Form */}
          <form onSubmit={handleVerifyCode} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Enter Your Restore Code:
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="e.g. RC60-XXXX-XXXX"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d0e12] border border-stone-700 focus:border-amber-400 rounded-xl text-white font-mono font-bold tracking-widest text-sm placeholder:text-stone-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !inputCode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Restore Code...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify Code &amp; Restore Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* HOW TO GET RECOVERY CODE (OFFICIAL PAYMENT DETAILS) */}
        <div className="p-5 rounded-3xl bg-[#131418] border border-stone-800 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              How to Purchase Your ₦60,000 Restore Code
            </h3>
          </div>

          <div className="space-y-3 text-xs text-stone-300">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-[#191a22] border border-stone-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] flex items-center justify-center text-amber-300">
                  1
                </span>
                <span>Transfer ₦60,000 to Company Account</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0f1015] border border-stone-800 font-mono space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Bank Name:</span>
                  <span className="font-bold text-white">{companyAccount?.bankName || 'Access Bank'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 text-sm tracking-wider">
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
                  <span className="text-stone-400">Account Name:</span>
                  <span className="font-bold text-stone-200 text-right uppercase">
                    {companyAccount?.accountName || '9jaCash Official Services'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-stone-800 text-[10px]">
                  <span className="text-stone-400">Payment Ref / Description:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">{user.referralCode || user.email}</span>
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
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-[#191a22] border border-stone-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] flex items-center justify-center text-amber-300">
                  2
                </span>
                <span>Send Transfer Proof to Support Agent</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                After making the ₦60,000 transfer, message our official verification agent on Telegram with your payment receipt to receive your unique Restore Code.
              </p>

              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border border-[#229ed9]/40 text-[#229ed9] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact Agent on Telegram to Get Code</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-[#191a22] border border-stone-800 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] flex items-center justify-center text-amber-300">
                  3
                </span>
                <span>Enter Code to Restore Account Immediately</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Enter the verified recovery code in the field above to instantly remove the restriction and resume accessing your funds.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Notice */}
        <div className="text-center pt-2 text-[11px] text-stone-500 space-y-1">
          <p>9jacash Security &amp; Compliance Center</p>
          <p className="text-[10px]">
            If you believe this restriction was made in error, contact the official agent via Telegram for dispute resolution.
          </p>
        </div>
      </div>
    </div>
  );
};
