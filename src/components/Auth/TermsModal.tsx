import React from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all ${
          isLight
            ? 'bg-white border border-slate-200 text-slate-800 shadow-slate-900/15'
            : 'bg-[#141518] border border-amber-500/20 text-stone-200'
        }`}
      >
        <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Terms &amp; Services
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                9jacash Digital Financial Services Agreement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 max-h-[60vh] overflow-y-auto text-sm pr-2">
          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1a1c21] border-stone-800 text-stone-300'
            }`}
          >
            <h4 className={`font-bold mb-1 text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              1. Account Security &amp; 4-Digit PIN
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              You are responsible for keeping your 4-digit PIN confidential. 9jacash will never call, message, or email you to request your security PIN.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1a1c21] border-stone-800 text-stone-300'
            }`}
          >
            <h4 className={`font-bold mb-1 text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              2. Transactions &amp; Funds
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              All transfers, deposits, and airtime transactions processed via 9jacash are governed by standard regulatory banking and consumer protection standards.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1a1c21] border-stone-800 text-stone-300'
            }`}
          >
            <h4 className={`font-bold mb-1 text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              3. Privacy &amp; Data Protection
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              We encrypt your personal credentials and banking details with high-level encryption to ensure end-to-end data security.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1a1c21] border-stone-800 text-stone-300'
            }`}
          >
            <h4 className={`font-bold mb-1 text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              4. Cashback &amp; Special Promotions
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Cashback rewards earned on eligible airtime and data purchases are credited directly to your main 9jacash balance.
            </p>
          </div>
        </div>

        <div className={`pt-4 border-t flex gap-3 ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white shadow-xs'
                : 'border-stone-700 text-stone-300 hover:bg-stone-800'
            }`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Accept Terms</span>
          </button>
        </div>
      </div>
    </div>
  );
};
