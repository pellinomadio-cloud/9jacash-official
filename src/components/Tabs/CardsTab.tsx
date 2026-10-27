import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { CreditCard, Plus, ShieldCheck, Eye, EyeOff, Lock, Copy, Check, Sparkles } from 'lucide-react';

export const CardsTab: React.FC = () => {
  const { user } = useAuth();
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const virtualCardNumber = '5399 8291 0492 8841';
  const expiry = '08/29';
  const cvv = '924';

  const copyNumber = () => {
    navigator.clipboard.writeText(virtualCardNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-2 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">9jacash Cards</h2>
          <p className="text-xs text-stone-400">Virtual Mastercard &amp; Physical Cards</p>
        </div>
        <button
          type="button"
          onClick={() => {}}
          className="py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Card</span>
        </button>
      </div>

      {/* Luxury Gold/Onyx Virtual Card */}
      <div className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden p-6 text-white shadow-2xl border border-amber-500/40 bg-gradient-to-tr from-[#121316] via-[#1a1c24] to-[#2a2316]">
        {/* Gold card chip & contactless waves */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white flex items-center">
              9ja<span className="text-amber-400">cash</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
              VIRTUAL
            </span>
          </div>

          <span className="text-xs font-bold text-stone-400">Debit</span>
        </div>

        {/* Card Chip */}
        <div className="mt-4 flex items-center justify-between">
          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-300 shadow-sm flex items-center justify-center">
            <div className="w-6 h-4 border border-stone-800/40 rounded-sm grid grid-cols-2 gap-0.5" />
          </div>
          {isFrozen && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" /> Frozen
            </span>
          )}
        </div>

        {/* Card Number */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-base sm:text-lg tracking-widest font-bold text-stone-100">
              {showCardNumber ? virtualCardNumber : '•••• •••• •••• 8841'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCardNumber(!showCardNumber)}
                className="text-stone-400 hover:text-white p-1"
                title="Toggle Card Details"
              >
                {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={copyNumber}
                className="text-stone-400 hover:text-amber-400 p-1"
                title="Copy Card Number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Card Holder & Expiry */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] uppercase text-stone-400 block">Card Holder</span>
            <span className="font-semibold text-white tracking-wide uppercase">{user?.name || 'Customer'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-[9px] uppercase text-stone-400 block">Expires</span>
              <span className="font-semibold text-white">{expiry}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-stone-400 block">CVV</span>
              <span className="font-semibold text-white">{showCardNumber ? cvv : '•••'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setIsFrozen(!isFrozen)}
          className="p-3.5 rounded-2xl bg-[#16171d] border border-stone-800 hover:border-stone-700 flex items-center gap-3 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-white block">{isFrozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
            <span className="text-[10px] text-stone-400">Instant protection</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {}}
          className="p-3.5 rounded-2xl bg-[#16171d] border border-stone-800 hover:border-stone-700 flex items-center gap-3 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-white block">Online Payments</span>
            <span className="text-[10px] text-emerald-400">Enabled</span>
          </div>
        </button>
      </div>
    </div>
  );
};
