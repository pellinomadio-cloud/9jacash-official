import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  CreditCard,
  History,
  ExternalLink,
  Info,
} from 'lucide-react';
import { BankVerificationWidget } from '../Common/BankVerificationWidget.tsx';
import { BankItem } from '../../utils/bankVerification.ts';

interface BankVerificationPageProps {
  onBack: () => void;
  onProceedToWithdraw?: () => void;
}

interface VerifiedHistoryItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  timestamp: string;
}

export const BankVerificationPage: React.FC<BankVerificationPageProps> = ({
  onBack,
  onProceedToWithdraw,
}) => {
  const [history, setHistory] = useState<VerifiedHistoryItem[]>([]);

  const handleVerified = (data: {
    bank: BankItem;
    accountNumber: string;
    accountName: string;
  }) => {
    const newItem: VerifiedHistoryItem = {
      id: `${data.bank.code}_${data.accountNumber}_${Date.now()}`,
      bankName: data.bank.name,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [newItem, ...prev.filter((item) => item.accountNumber !== data.accountNumber).slice(0, 5)]);
  };

  return (
    <div className="min-h-screen pb-12 space-y-4 animate-in fade-in duration-200">
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
            Bank Account Verification <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </h1>
          <p className="text-xs text-stone-400">
            Instant NUBAN verification &amp; account name resolution
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#17181f] via-[#1d241c] to-[#12241b] border border-emerald-500/40 p-5 shadow-xl text-white">
        <div className="relative z-10 space-y-2 max-w-[75%]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> OFFICIAL NUBAN VERIFICATION API
          </span>
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Verify Any Nigerian Bank Account
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            Select your financial institution and enter the 10-digit account number. Our API automatically validates the account holder&apos;s name in real time.
          </p>
        </div>

        <div className="absolute -right-2 -bottom-2 w-24 h-24 opacity-80 flex items-center justify-center pointer-events-none">
          <div className="w-18 h-18 rounded-3xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 rotate-12 shadow-2xl">
            <Building2 className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Verification Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#14151c] border border-stone-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
              Real-Time Account Validator
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
            Live API Active
          </span>
        </div>

        <BankVerificationWidget onVerified={handleVerified} />

        {onProceedToWithdraw && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onProceedToWithdraw}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Use Details for Withdrawal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Verified History Feed */}
      {history.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#14151c] border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Recently Verified Accounts</span>
            </h3>
            <span className="text-[10px] text-stone-500">{history.length} verified</span>
          </div>

          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#1a1c24] border border-stone-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">{item.accountName}</h4>
                  <p className="text-[10px] text-stone-400 font-mono">
                    {item.bankName} • {item.accountNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                  <span className="text-[9px] text-stone-500 font-mono">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported Banks Info Box */}
      <div className="p-4 rounded-3xl bg-[#121318] border border-stone-800/80 space-y-2 text-xs text-stone-400">
        <div className="flex items-center gap-2 text-stone-300 font-bold">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Supported Banking Networks</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Supports all commercial banks (GTBank, Access Bank, Zenith Bank, UBA, FirstBank, etc.) and leading fintech platforms (OPay, PalmPay, Kuda, Moniepoint, Nomba, Paga) licensed by the Central Bank of Nigeria (CBN).
        </p>
      </div>
    </div>
  );
};
