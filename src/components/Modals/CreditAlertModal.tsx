import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { BellRing, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';

export const CreditAlertModal: React.FC = () => {
  const { isLight } = useTheme();
  const { creditAlertModal, dismissCreditAlertModal, user, formatNaira } = useAuth();

  if (!creditAlertModal || !creditAlertModal.isOpen) {
    return null;
  }

  const handleDismiss = () => {
    soundFx.playClick();
    dismissCreditAlertModal();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300 ${
        isLight ? 'bg-slate-900/55' : 'bg-black/85'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border-2 p-6 space-y-5 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-gradient-to-b from-emerald-50 via-white to-amber-50/70 border-emerald-400 text-slate-900 shadow-emerald-500/20'
            : 'bg-[#12141c] border-emerald-500/50 text-white shadow-emerald-500/20'
        }`}
      >
        {/* Glow ambient background */}
        <div
          className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-emerald-400/30' : 'bg-emerald-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-16 -left-16 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-amber-400/25' : 'bg-amber-500/15'
          }`}
        />

        {/* Animated Bell Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30">
          <div
            className={`w-full h-full rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-white text-emerald-600' : 'bg-[#0f1017] text-emerald-400'
            }`}
          >
            <BellRing className="w-8 h-8 animate-bounce" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Title & Badge */}
        <div className="relative z-10 space-y-1">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${
              isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>Official Credit Alert</span>
          </div>
          <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Account Credited!
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-stone-400'}`}>
            Funds deposited successfully to your dashboard
          </p>
        </div>

        {/* Amount Box */}
        <div
          className={`relative z-10 p-4 rounded-2xl border space-y-1.5 ${
            isLight
              ? 'bg-gradient-to-b from-emerald-100/70 via-white to-emerald-50 border-emerald-300 shadow-xs'
              : 'bg-gradient-to-b from-emerald-500/15 via-[#161a22] to-[#12141c] border-emerald-500/40'
          }`}
        >
          <span
            className={`text-[10px] uppercase font-bold tracking-widest block ${
              isLight ? 'text-emerald-700' : 'text-emerald-400/80'
            }`}
          >
            Amount Credited
          </span>
          <div
            className={`text-3xl font-black tracking-tight font-mono ${
              isLight ? 'text-emerald-600' : 'text-emerald-400'
            }`}
          >
            +₦{creditAlertModal.amount.toLocaleString()}
          </div>
          <div
            className={`pt-1.5 flex items-center justify-center gap-1.5 text-xs font-medium ${
              isLight ? 'text-slate-700' : 'text-stone-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />
            <span>
              From: <strong className={`${isLight ? 'text-slate-900' : 'text-white'} capitalize`}>{creditAlertModal.source}</strong>
            </span>
          </div>
        </div>

        {/* Balance info */}
        <div
          className={`relative z-10 text-xs space-y-1 p-3 rounded-xl border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#161822] border-stone-800 text-stone-400'
          }`}
        >
          <div className="flex justify-between items-center text-[11px]">
            <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Recipient:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className={isLight ? 'text-slate-500' : 'text-stone-400'}>Reference:</span>
            <span className={`font-mono ${isLight ? 'text-slate-800 font-semibold' : 'text-stone-300'}`}>
              {creditAlertModal.reference}
            </span>
          </div>
          <div
            className={`flex justify-between items-center text-[11px] pt-1 border-t ${
              isLight ? 'border-slate-200' : 'border-stone-800'
            }`}
          >
            <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-stone-300'}`}>
              New Dashboard Balance:
            </span>
            <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
              {user ? formatNaira(user.balance) : '₦150,000'}
            </span>
          </div>
        </div>

        {/* Proceed CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="relative z-10 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <span>View Dashboard Balance</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p
          className={`relative z-10 text-[10px] flex items-center justify-center gap-1 ${
            isLight ? 'text-slate-500 font-medium' : 'text-stone-500'
          }`}
        >
          <ShieldCheck className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <span>Automated 9jacash Core Banking Credit</span>
        </p>
      </div>
    </div>
  );
};
