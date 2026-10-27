import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Transaction } from '../../types/index.ts';
import { sortTransactionsNewestFirst } from '../../utils/transactionSort.ts';
import { ArrowUpRight, ArrowDownLeft, Smartphone, CreditCard, ChevronRight, Inbox, PlusCircle } from 'lucide-react';

interface RecentTransactionsProps {
  onSeeAll: () => void;
  onQuickDeposit: () => void;
  onViewTransaction?: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onSeeAll,
  onQuickDeposit,
  onViewTransaction,
}) => {
  const { transactions, formatNaira } = useAuth();

  const getTransactionIcon = (type: Transaction['type'], isCredit: boolean) => {
    switch (type) {
      case 'transfer':
        return (
          <div className="w-11 h-11 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <ArrowUpRight className="w-5 h-5 text-stone-300" />
          </div>
        );
      case 'deposit':
        return (
          <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          </div>
        );
      case 'upgrade':
        return (
          <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
          </div>
        );
      case 'withdraw':
        return (
          <div className="w-11 h-11 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <CreditCard className="w-5 h-5 text-stone-300" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <ArrowUpRight className="w-5 h-5 text-stone-300" />
          </div>
        );
    }
  };

  return (
    <div className="py-2 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Recent Transactions
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors focus:outline-none cursor-pointer"
        >
          <span>See All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Transaction list or Empty State */}
      {transactions.length === 0 ? (
        <div className="rounded-2xl bg-[#14151b] border border-stone-800/80 p-6 sm:p-8 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mb-3">
            <Inbox className="w-7 h-7 text-stone-500" />
          </div>
          <h4 className="text-sm font-semibold text-stone-300">No transactions yet</h4>
          <p className="text-xs text-stone-500 max-w-xs mt-1 leading-relaxed">
            Your transfer, deposit, and airtime top-up history will appear here once you make your first transaction.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onQuickDeposit}
              className="py-2.5 px-4 rounded-xl bg-black hover:bg-stone-900 text-white font-black text-xs border-2 border-white shadow-xl shadow-black/80 ring-2 ring-emerald-400/60 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.8] text-white" />
              <span>Make First Deposit</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortTransactionsNewestFirst(transactions).slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              onClick={() => onViewTransaction && onViewTransaction(tx)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#15161c] border border-stone-800/70 hover:border-stone-700 hover:bg-[#1a1c24] transition-all cursor-pointer group"
            >
              {/* Left: Icon + Title & Subtitle */}
              <div className="flex items-center gap-3">
                {getTransactionIcon(tx.type, tx.isCredit)}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tx.title}
                    </h4>
                    {tx.status === 'pending' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                        Pending
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                        Declined
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">{tx.subtitle}</p>
                </div>
              </div>

              {/* Right: Amount & Date/Time */}
              <div className="text-right">
                <p
                  className={`text-sm sm:text-base font-bold ${
                    tx.status === 'pending'
                      ? 'text-amber-400'
                      : tx.status === 'failed'
                      ? 'text-stone-400 line-through'
                      : tx.isCredit
                      ? 'text-emerald-400'
                      : 'text-white'
                  }`}
                >
                  {tx.isCredit ? `+ ${formatNaira(tx.amount)}` : `- ${formatNaira(tx.amount)}`}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {tx.date} • {tx.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
