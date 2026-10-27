import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Transaction } from '../../types/index.ts';
import { sortTransactionsNewestFirst } from '../../utils/transactionSort.ts';
import { X, Search, ArrowUpRight, ArrowDownLeft, Smartphone, CreditCard, Filter, Trash2, CheckCircle2, Download } from 'lucide-react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTx?: Transaction | null;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedTx,
}) => {
  const { transactions, formatNaira, clearTransactions } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(selectedTx || null);

  if (!isOpen) return null;

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
      case 'transfer':
        return (
          <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <ArrowUpRight className="w-5 h-5 text-stone-300" />
          </div>
        );
      case 'deposit':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
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
            <CreditCard className="w-5 h-5 text-stone-300" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-stone-800 flex items-center justify-center text-stone-300">
            <ArrowUpRight className="w-5 h-5 text-stone-300" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#14151b] border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg text-white">Transaction History</h3>
            <p className="text-xs text-stone-400">View and track all past activity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt View if clicked */}
        {activeReceipt ? (
          <div className="py-4 space-y-4 overflow-y-auto">
            <div className="p-5 rounded-2xl bg-[#1a1c24] border border-amber-500/20 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                Transaction Successful
              </span>
              <h2 className="text-2xl font-bold text-white">
                {activeReceipt.isCredit ? `+ ${formatNaira(activeReceipt.amount)}` : `- ${formatNaira(activeReceipt.amount)}`}
              </h2>
              <p className="text-sm text-amber-400 font-semibold">{activeReceipt.title}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#191b22] border border-stone-800 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Description / Recipient</span>
                <span className="font-semibold text-white">{activeReceipt.subtitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Date &amp; Time</span>
                <span className="font-semibold text-white">{activeReceipt.date} • {activeReceipt.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Reference Number</span>
                <span className="text-amber-400 font-semibold">{activeReceipt.reference}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-400">Payment Channel</span>
                <span className="font-semibold text-white">9jacash Instant Settlement</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-semibold"
              >
                Back to List
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="py-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search by title, recipient, reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1b1d24] border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filter Badges */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'transfer', label: 'Transfers' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'airtime', label: 'Airtime' },
                  { id: 'withdraw', label: 'Withdrawals' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterType(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      filterType === f.id
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                        : 'bg-[#1b1d24] text-stone-400 hover:text-white border border-stone-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  <p>No transactions found for this filter.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setActiveReceipt(tx)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#181920] border border-stone-800 hover:border-stone-700 hover:bg-[#1f212a] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {getTxIcon(tx.type, tx.isCredit)}
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {tx.title}
                        </h4>
                        <p className="text-[11px] text-stone-400">{tx.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs sm:text-sm font-bold ${
                          tx.isCredit ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {tx.isCredit ? `+ ${formatNaira(tx.amount)}` : `- ${formatNaira(tx.amount)}`}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {tx.date} • {tx.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
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
    </div>
  );
};
