import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BellRing, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';

export const CreditAlertModal: React.FC = () => {
  const { creditAlertModal, dismissCreditAlertModal, user, formatNaira } = useAuth();

  if (!creditAlertModal || !creditAlertModal.isOpen) {
    return null;
  }

  const handleDismiss = () => {
    soundFx.playClick();
    dismissCreditAlertModal();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-[#12141c] border-2 border-emerald-500/50 p-6 space-y-5 shadow-2xl shadow-emerald-500/20 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Bell Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30">
          <div className="w-full h-full rounded-2xl bg-[#0f1017] flex items-center justify-center text-emerald-400">
            <BellRing className="w-8 h-8 animate-bounce text-emerald-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Title & Badge */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Credit Alert</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Account Credited!
          </h2>
          <p className="text-xs text-stone-400">
            Funds deposited successfully to your dashboard
          </p>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-[#161a22] to-[#12141c] border border-emerald-500/40 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-widest block">
            Amount Credited
          </span>
          <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
            +₦{creditAlertModal.amount.toLocaleString()}
          </div>
          <div className="pt-1.5 flex items-center justify-center gap-1.5 text-xs text-stone-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 fill-amber-400" />
            <span>From: <strong className="text-white capitalize">{creditAlertModal.source}</strong></span>
          </div>
        </div>

        {/* Balance info */}
        <div className="text-xs text-stone-400 space-y-1 bg-[#161822] p-3 rounded-xl border border-stone-800">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Recipient:</span>
            <span className="font-semibold text-white">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Reference:</span>
            <span className="font-mono text-stone-300">{creditAlertModal.reference}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-stone-800">
            <span className="text-stone-300 font-bold">New Dashboard Balance:</span>
            <span className="font-bold text-amber-400">{user ? formatNaira(user.balance) : '₦150,000'}</span>
          </div>
        </div>

        {/* Proceed CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <span>View Dashboard Balance</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Automated 9jacash Core Banking Credit</span>
        </p>
      </div>
    </div>
  );
};
