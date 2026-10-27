import React from 'react';
import { Wallet, FileText, ChevronRight } from 'lucide-react';

interface AccountCardsProps {
  onOpenAccountDetails: () => void;
  onOpenTransactionHistory: () => void;
}

export const AccountCards: React.FC<AccountCardsProps> = ({
  onOpenAccountDetails,
  onOpenTransactionHistory,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
      {/* Account Details Card */}
      <button
        type="button"
        onClick={onOpenAccountDetails}
        className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#16171d] border border-stone-800/90 hover:border-amber-500/40 hover:bg-[#1b1c24] transition-all group text-left cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {/* Yellow Rounded Square Icon */}
          <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              User Profile
            </h3>
            <p className="text-[11px] text-stone-400">View your profile details</p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>

      {/* Transaction History Card */}
      <button
        type="button"
        onClick={onOpenTransactionHistory}
        className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#16171d] border border-stone-800/90 hover:border-amber-500/40 hover:bg-[#1b1c24] transition-all group text-left cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {/* Yellow Rounded Square Icon */}
          <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              Transaction History
            </h3>
            <p className="text-[11px] text-stone-400">See all transactions</p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>
    </div>
  );
};
