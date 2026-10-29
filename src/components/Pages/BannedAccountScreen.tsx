import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
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
  const { isLight } = useTheme();
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
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0a0a0d] text-stone-200'
    }`}>
      {/* Background ambient security glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full blur-[120px] ${
          isLight ? 'bg-red-500/10' : 'bg-red-600/10'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full blur-[100px] ${
          isLight ? 'bg-amber-500/10' : 'bg-amber-600/10'
        }`} />
      </div>

      <div className="relative w-full max-w-xl mx-auto space-y-4 pt-3 pb-8">
        {/* Top Restricted Badge */}
        <div className={`flex items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-red-200' : 'border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-red-600' : 'text-red-400'
              }`}>
                <span>Security Enforcement</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>Gateway Protocol v3.8</div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              isLight
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800'
                : 'bg-red-950/40 border-red-500/40 text-red-300 hover:text-white hover:bg-red-900/60'
            }`}
          >
            <LogOut className={`w-3.5 h-3.5 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Main Alert Banner */}
        <div className={`p-5 sm:p-6 rounded-3xl border text-center space-y-3 ${
          isLight
            ? 'bg-white border-red-200 shadow-xl shadow-red-500/5'
            : 'bg-gradient-to-b from-[#1b1114] to-[#121217] border-red-500/40 shadow-2xl shadow-red-950/40'
        }`}>
          <div className={`w-16 h-16 mx-auto rounded-2xl border-2 flex items-center justify-center shadow-lg ${
            isLight
              ? 'bg-red-50 border-red-300 text-red-600 shadow-red-500/10'
              : 'bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/20'
          }`}>
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>Account Banned</span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-stone-400'
            }`}>
              Your 9jacash account access has been restricted by administration. All account activities, withdrawals, and wallet balances are currently locked.
            </p>
          </div>

          {/* User Profile Card */}
          <div className={`p-3.5 rounded-2xl border text-left space-y-2 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1015] border-stone-800/80'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-slate-200' : 'border-stone-800/80'
            }`}>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Account Holder:</span>
              <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</span>
            </div>
            {user.referralCode && (
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Referral Code:</span>
                <span className="font-mono text-amber-600 font-bold">{user.referralCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Registered Email:</span>
              <span className={`font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Locked Wallet Balance:</span>
              <span className="font-bold text-emerald-600">{formatNaira(user.balance || 0)}</span>
            </div>
            <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
              isLight ? 'border-slate-200' : 'border-stone-800/80'
            }`}>
              <span className={`flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                <Clock className="w-3 h-3" /> Restriction Imposed:
              </span>
              <span className={`font-mono ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>{formattedBannedDate}</span>
            </div>
          </div>
        </div>

        {/* PRICING & RECOVERY CODE INSTRUCTION CARD */}
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 ${
          isLight
            ? 'bg-white border-amber-300 shadow-amber-500/10'
            : 'bg-gradient-to-br from-[#1c1813] via-[#151419] to-[#121217] border-amber-500/40 shadow-amber-950/20'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <h2 className={`text-sm font-bold tracking-wide uppercase ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Account Recovery Requirement
              </h2>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              isLight
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
            }`}>
              Official Unban Service
            </span>
          </div>

          {/* Highlighted Price Badge */}
          <div className={`p-4 rounded-2xl border-2 text-center space-y-1 ${
            isLight
              ? 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border-amber-300'
              : 'bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-yellow-500/15 border-amber-500/50'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'text-amber-900' : 'text-stone-300'
            }`}>
              Price of Restore Code
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
              ₦60,000
            </div>
            <div className={`text-xs font-semibold ${
              isLight ? 'text-amber-800' : 'text-amber-300/90'
            }`}>
              Sixty Thousand Naira Only
            </div>
            <p className={`text-[11px] pt-1 leading-relaxed max-w-sm mx-auto ${
              isLight ? 'text-slate-600' : 'text-stone-400'
            }`}>
              To lift the ban and restore full access to your account and wallet balance, you are required to input a valid ₦60,000 Restore Code.
            </p>
          </div>

          {/* Input Restore Code Form */}
          <form onSubmit={handleVerifyCode} className="space-y-3 pt-1">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${
                isLight ? 'text-slate-700' : 'text-stone-300'
              }`}>
                Enter Your Restore Code:
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g. RC60-XXXX-XXXX"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl font-mono font-bold tracking-widest text-sm focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white'
                      : 'bg-[#0d0e12] border-stone-700 focus:border-amber-400 text-white placeholder:text-stone-600'
                  }`}
                />
              </div>
            </div>

            {errorMsg && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}>
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !inputCode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
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
        <div className={`p-5 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-[#131418] border-stone-800'
        }`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              How to Purchase Your ₦60,000 Restore Code
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191a22] border-stone-800'
            }`}>
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-black ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                }`}>
                  1
                </span>
                <span>Transfer ₦60,000 to Company Account</span>
              </div>

              <div className={`p-3 rounded-xl border font-mono space-y-2 text-[11px] ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0f1015] border-stone-800'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Bank Name:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{companyAccount?.bankName || 'Access Bank'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600 text-sm tracking-wider">
                      {companyAccount?.accountNumber || '0123456789'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(companyAccount?.accountNumber || '', 'acc')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                      }`}
                    >
                      {copiedAcc ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
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
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Account Name:</span>
                  <span className={`font-bold text-right uppercase ${
                    isLight ? 'text-slate-800' : 'text-stone-200'
                  }`}>
                    {companyAccount?.accountName || '9jaCash Official Services'}
                  </span>
                </div>

                <div className={`flex justify-between items-center pt-1 border-t text-[10px] ${
                  isLight ? 'border-slate-200' : 'border-stone-800'
                }`}>
                  <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Payment Ref / Description:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">{user.referralCode || user.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user.referralCode || user.email, 'ref')}
                      className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-stone-400 hover:text-white'}
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191a22] border-stone-800'
            }`}>
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-black ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                }`}>
                  2
                </span>
                <span>Send Transfer Proof to Support Agent</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                After making the ₦60,000 transfer, message our official verification agent on Telegram with your payment receipt to receive your unique Restore Code.
              </p>

              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 border-sky-600 text-white shadow-sky-500/20'
                    : 'bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border-[#229ed9]/40 text-[#229ed9]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact Agent on Telegram to Get Code</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191a22] border-stone-800'
            }`}>
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-black ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                }`}>
                  3
                </span>
                <span>Enter Code to Restore Account Immediately</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                Enter the verified recovery code in the field above to instantly remove the restriction and resume accessing your funds.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Notice */}
        <div className={`text-center pt-2 text-[11px] space-y-1 ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
          <p className="font-semibold">9jacash Security &amp; Compliance Center</p>
          <p className="text-[10px]">
            If you believe this restriction was made in error, contact the official agent via Telegram for dispute resolution.
          </p>
        </div>
      </div>
    </div>
  );
};
