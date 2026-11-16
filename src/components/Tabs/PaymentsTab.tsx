import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface PaymentsTabProps {
  onQuickAction: (action: 'transfer' | 'deposit' | 'withdraw' | 'admin') => void;
  onOpenAdmin?: () => void;
  onOpenBankVerification?: () => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  onQuickAction,
  onOpenAdmin,
}) => {
  const [toastMsg, setToastMsg] = React.useState('');

  const handleOpenAdmin = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      onQuickAction('admin');
    }
  };

  const paymentCategories = [
    {
      title: 'Betting & Lottery',
      desc: 'Bet9ja, SportyBet, 1xBet & BangBet Wallets',
      icon: ShoppingBag,
      action: () => {
        setToastMsg('Betting wallet top-up gateway integration coming soon in next release.');
        setTimeout(() => setToastMsg(''), 3500);
      },
    },
  ];

  return (
    <div className="py-2 min-h-[65vh] flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Bill Payments &amp; Utilities</h2>
          <p className="text-xs text-stone-400">Pay verified Nigerian utility bills with zero fees</p>
        </div>

        {toastMsg && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-in fade-in">
            {toastMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5">
          {paymentCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#16171d] border border-stone-800/80 hover:border-amber-500/40 hover:bg-[#1c1e27] transition-all text-left group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1f212a] border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-400">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Small Red Dot at the bottom for Admin Login */}
      <div className="pt-16 pb-4 flex justify-center">
        <button
          type="button"
          onClick={handleOpenAdmin}
          aria-label="Admin Portal"
          className="p-2 flex items-center justify-center cursor-pointer group focus:outline-none"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 group-hover:bg-red-500 group-active:scale-90 transition-all shadow-[0_0_8px_rgba(220,38,38,0.75)] block" />
        </button>
      </div>
    </div>
  );
};

