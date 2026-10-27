import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, Send, Plus, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

interface QuickActionModalProps {
  type: 'transfer' | 'deposit' | 'withdraw' | null;
  onClose: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ type, onClose }) => {
  const { user, addTransaction, formatNaira } = useAuth();

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [targetAccount, setTargetAccount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('GTBank');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{ title: string; subtitle: string; amount: number } | null>(null);
  const [error, setError] = useState<string>('');

  if (!type || !user) return null;

  const handleDeposit = (depositAmount: number) => {
    addTransaction({
      type: 'deposit',
      title: 'Deposit',
      subtitle: 'From: Bank Transfer',
      amount: depositAmount,
      isCredit: true,
      status: 'successful',
    });

    setSuccessDetails({
      title: 'Deposit Successful',
      subtitle: `Credited to ${user.name}`,
      amount: depositAmount,
    });
    setIsSuccess(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    if (type === 'transfer') {
      if (numAmount > user.balance) {
        setError('Insufficient balance. Please deposit funds first.');
        return;
      }

      addTransaction({
        type: 'transfer',
        title: 'Transfer',
        subtitle: `To: ${targetAccount || 'Bank Account'} (${selectedBank})`,
        amount: numAmount,
        isCredit: false,
        status: 'successful',
      });

      setSuccessDetails({
        title: 'Transfer Sent Successfully',
        subtitle: `To ${targetAccount || 'Beneficiary'} • ${selectedBank}`,
        amount: numAmount,
      });
      setIsSuccess(true);
    } else if (type === 'deposit') {
      handleDeposit(numAmount);
    } else if (type === 'withdraw') {
      if (numAmount > user.balance) {
        setError('Insufficient balance. Please deposit funds first.');
        return;
      }

      addTransaction({
        type: 'withdraw',
        title: 'Withdrawal',
        subtitle: `To: ${selectedBank} (${targetAccount || 'Bank Account'})`,
        amount: numAmount,
        isCredit: false,
        status: 'successful',
      });

      setSuccessDetails({
        title: 'Withdrawal Processed',
        subtitle: `Sent to linked ${selectedBank} account`,
        amount: numAmount,
      });
      setIsSuccess(true);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'transfer': return 'Send Money';
      case 'deposit': return 'Add Funds';
      case 'withdraw': return 'Withdraw to Bank';
    }
  };

  const getModalIcon = () => {
    switch (type) {
      case 'transfer': return <Send className="w-5 h-5 text-amber-400 rotate-[-20deg]" />;
      case 'deposit': return <Plus className="w-5 h-5 text-amber-400" />;
      case 'withdraw': return <CreditCard className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#14151b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e2027] border border-amber-500/30 flex items-center justify-center">
              {getModalIcon()}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{getModalTitle()}</h3>
              <p className="text-xs text-stone-400">9jacash Instant Banking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && successDetails ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-bold text-white">{successDetails.title}</h3>
            <p className="text-xs text-stone-400">{successDetails.subtitle}</p>

            <div className="p-4 rounded-2xl bg-[#1c1e26] border border-stone-800 text-2xl font-extrabold text-amber-400">
              {formatNaira(successDetails.amount)}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Balance info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1e26] border border-stone-800 text-xs">
              <span className="text-stone-400">Available Balance</span>
              <span className="font-bold text-white" data-balance-text>{formatNaira(user.balance)}</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Quick deposit presets if in Deposit mode */}
            {type === 'deposit' && (
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2">Quick Top-Up Amounts</label>
                <div className="grid grid-cols-2 gap-2">
                  {[5000, 20000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleDeposit(amt)}
                      className="py-2.5 px-3 rounded-xl bg-[#1c1e26] hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/40 text-xs font-semibold text-stone-200 hover:text-amber-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{formatNaira(amt)}</span>
                    </button>
                  ))}
                </div>
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-800" /></div>
                  <span className="relative bg-[#14151b] px-2 text-[10px] uppercase font-bold text-stone-500">Or Custom Amount</span>
                </div>
              </div>
            )}

            {/* Transfer fields */}
            {type === 'transfer' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Select Destination Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full p-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="Kuda Bank">Kuda Microfinance Bank</option>
                    <option value="OPay">OPay</option>
                    <option value="Palmpay">Palmpay</option>
                    <option value="9jacash MFB">9jacash MFB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Recipient 10-Digit NUBAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0123456789"
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-sm placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">₦</span>
                <input
                  type="number"
                  step="any"
                  min="50"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-base font-bold placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
