import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Transaction } from '../../types/index.ts';
import { sortTransactionsNewestFirst } from '../../utils/transactionSort.ts';
import { ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, Smartphone, CreditCard, Sparkles, Hash, Trash2, CheckCircle2 } from 'lucide-react';

interface TransactionHistoryPageProps {
  onBack: () => void;
  initialSelectedTx?: Transaction | null;
}

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({
  onBack,
  initialSelectedTx,
}) => {
  const { transactions, formatNaira, clearTransactions } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(initialSelectedTx || null);

  const sortedTransactions = sortTransactionsNewestFirst(transactions);
  const filteredTransactions = sortedTransactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTxIcon = (type: Transaction['type'], isCredit: boolean) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'earn':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'quickcode':
        return (
          <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-amber-400">
            <Hash className="w-5 h-5" />
          </div>
        );
      case 'upgrade':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
          </div>
        );
      case 'withdraw':
        return (
          <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <CreditCard className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2 pb-3 border-b border-stone-800">
        <button
          type="button"
          onClick={() => {
            if (activeReceipt) {
              setActiveReceipt(null);
            } else {
              onBack();
            }
          }}
          className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">
            {activeReceipt ? 'Transaction Receipt' : 'Transaction History'}
          </h1>
          <p className="text-xs text-stone-400">
            {activeReceipt ? 'Official transaction receipt' : 'All incoming and outgoing activity'}
          </p>
        </div>
      </div>

      {activeReceipt ? (
        /* Detailed Receipt View */
        <div className="space-y-4 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#15161c] border border-amber-500/30 text-center space-y-3 shadow-xl">
            <div
              className={`w-14 h-14 mx-auto rounded-full border-2 flex items-center justify-center ${
                activeReceipt.status === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
                  : activeReceipt.status === 'failed'
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {activeReceipt.status === 'pending' ? (
                <span className="text-xl font-bold">⏳</span>
              ) : activeReceipt.status === 'failed' ? (
                <span className="text-xl font-bold">✕</span>
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>
            <span
              className={`text-[10px] uppercase font-bold tracking-widest ${
                activeReceipt.status === 'pending'
                  ? 'text-amber-400'
                  : activeReceipt.status === 'failed'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {activeReceipt.status === 'pending'
                ? 'TRANSACTION PENDING'
                : activeReceipt.status === 'failed'
                ? 'TRANSACTION DECLINED'
                : 'TRANSACTION SUCCESSFUL'}
            </span>
            <h2 className="text-3xl font-bold text-white">
              {activeReceipt.isCredit ? `+ ${formatNaira(activeReceipt.amount)}` : `- ${formatNaira(activeReceipt.amount)}`}
            </h2>
            <p className="text-xs text-amber-400 font-semibold">{activeReceipt.title}</p>
          </div>

          <div className="p-5 rounded-3xl bg-[#15161c] border border-stone-800 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400">Recipient / Details</span>
              <span className="font-bold text-white text-right">{activeReceipt.subtitle}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400">Date &amp; Time</span>
              <span className="font-bold text-white">{activeReceipt.date} • {activeReceipt.time}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400">Transaction Reference</span>
              <span className="font-bold text-amber-400">{activeReceipt.reference}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400">Status</span>
              <span
                className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full border ${
                  activeReceipt.status === 'pending'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : activeReceipt.status === 'failed'
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                {activeReceipt.status === 'pending' ? 'Waiting Company Approval' : activeReceipt.status}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Channel</span>
              <span className="font-bold text-white">9jacash Instant Settlement</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-400/20 cursor-pointer"
            >
              Back to Transactions List
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search by title, description or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#15161c] border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'deposit', label: 'Deposits' },
              { id: 'earn', label: 'Earn Rewards' },
              { id: 'quickcode', label: 'Quick Code' },
              { id: 'withdraw', label: 'Withdrawals' },
              { id: 'airtime', label: 'Airtime' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                    : 'bg-[#15161c] text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2.5 pt-2">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#14151b] border border-stone-800 p-6 space-y-2">
                <p className="text-xs text-stone-400">No transactions recorded in your account history yet.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setActiveReceipt(tx)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#15161c] border border-stone-800 hover:border-amber-500/40 hover:bg-[#1a1c24] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {getTxIcon(tx.type, tx.isCredit)}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
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
                      <p className="text-[11px] text-stone-400">{tx.subtitle}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-sm font-bold ${
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
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      {tx.date} • {tx.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Actions */}
          {transactions.length > 0 && (
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={clearTransactions}
                className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
              <span className="text-[11px] text-stone-500">
                {filteredTransactions.length} transaction(s)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
