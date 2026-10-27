import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

interface OfflineScreenProps {
  onRetry: () => Promise<boolean>;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');

  const handleRetry = async () => {
    setIsChecking(true);
    setRetryMsg('');
    const online = await onRetry();
    setIsChecking(false);
    if (!online) {
      setRetryMsg('Still offline. Please enable mobile data or Wi-Fi to continue.');
      setTimeout(() => setRetryMsg(''), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0c0d12] flex flex-col items-center justify-center p-5 text-center select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-sm shadow-lg shadow-amber-500/20">
            9J
          </div>
          <span className="text-lg font-black tracking-wider text-white">9JACASH</span>
        </div>

        {/* Pulsing Offline Graphic */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-red-500/10 border border-red-500/30" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#181924] border border-red-500/40 flex items-center justify-center text-red-400 shadow-xl shadow-red-950/50">
            <WifiOff className="w-8 h-8" />
          </div>
        </div>

        {/* Heading & Notice */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Connection Required</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            You Are Currently Offline
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed max-w-xs mx-auto">
            9jacash requires an active internet connection to access your digital wallet, verify transactions, and secure your account.
          </p>
        </div>

        {/* Troubleshooting Box */}
        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 text-left space-y-2 text-xs text-stone-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Please Check Your Connection:
          </span>
          <ul className="space-y-1 text-[11px] text-stone-400 pl-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Turn on Cellular Mobile Data or Wi-Fi
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Ensure Airplane Mode is switched OFF
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Verify your SIM data subscription is active
            </li>
          </ul>
        </div>

        {retryMsg && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium animate-in fade-in">
            {retryMsg}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Connection...' : 'Try Reconnecting Now'}</span>
          </button>
          <span className="text-[10px] text-stone-500 block mt-2">
            The app will automatically resume as soon as internet connection is restored.
          </span>
        </div>
      </div>
    </div>
  );
};
