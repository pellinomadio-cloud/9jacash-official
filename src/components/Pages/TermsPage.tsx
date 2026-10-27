import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  const { isLight } = useTheme();

  return (
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <button
          type="button"
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-400 shadow-sm'
              : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Terms &amp; Services <ShieldCheck className="w-4 h-4 text-amber-500" />
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            9jacash Digital Financial Services Agreement
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div
          className={`p-4 rounded-2xl border space-y-1.5 shadow-sm ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#15161c] border-stone-800 text-stone-300'
          }`}
        >
          <h3 className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            1. Account Security &amp; PIN
          </h3>
          <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            Your 4-digit password/PIN is strictly confidential. You are responsible for all transfers, withdrawals, and commands authorized using your secret credentials.
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border space-y-1.5 shadow-sm ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#15161c] border-stone-800 text-stone-300'
          }`}
        >
          <h3 className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            2. Instant Transfers &amp; Settlements
          </h3>
          <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            All transfers and deposits made through 9jacash are processed via the Central Bank of Nigeria NIP settlement network and licensed settlement banks.
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border space-y-1.5 shadow-sm ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#15161c] border-stone-800 text-stone-300'
          }`}
        >
          <h3 className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            3. 5% Cashback Rewards Program
          </h3>
          <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            Cashback bonuses accumulated through airtime purchases are credited in real-time as spendable funds in your 9jacash balance.
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border space-y-1.5 shadow-sm ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#15161c] border-stone-800 text-stone-300'
          }`}
        >
          <h3 className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            4. Privacy &amp; Data Encryption
          </h3>
          <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            We employ bank-grade encryption protocols to safeguard your personal data, balance information, and transaction records.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-400/20 cursor-pointer active:scale-98 transition-all"
        >
          I Understand &amp; Agree
        </button>
      </div>
    </div>
  );
};
