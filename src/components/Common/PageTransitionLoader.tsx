import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Volume2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface PageTransitionLoaderProps {
  isLoading: boolean;
  targetTitle?: string;
  durationMs?: number;
  showVoiceNotice?: boolean;
}

export const PageTransitionLoader: React.FC<PageTransitionLoaderProps> = ({
  isLoading,
  targetTitle = 'Page',
  durationMs = 3000,
  showVoiceNotice = false,
}) => {
  const { isLight } = useTheme();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setTimeLeft(Math.ceil(durationMs / 1000));
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      const remainingSecs = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setTimeLeft(remainingSecs);

      if (elapsed >= durationMs) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isLoading, durationMs]);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200 ${
        isLight ? 'bg-[#f4f6fa]/95 text-slate-800' : 'bg-[#0b0c0e]/95 text-white'
      }`}
    >
      {/* Background ambient radial glow */}
      <div
        className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-amber-400/15' : 'bg-amber-500/10'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center max-w-xs w-full space-y-6">
        {/* Animated Brand Emblem & Spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer rotating dashed ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 animate-spin ${
              isLight
                ? 'border-amber-400/30 border-t-amber-500'
                : 'border-amber-500/20 border-t-amber-400'
            }`}
          />

          {/* Inner reverse rotating glowing ring */}
          <div
            className={`absolute inset-2 rounded-full border-2 animate-spin [animation-direction:reverse] [animation-duration:1.5s] ${
              isLight
                ? 'border-amber-300/40 border-b-amber-600'
                : 'border-amber-400/30 border-b-yellow-300'
            }`}
          />

          {/* Center glowing badge */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isLight
                ? 'bg-white border-2 border-amber-400/70 shadow-lg shadow-amber-500/15 text-amber-600'
                : 'bg-gradient-to-tr from-[#1f1a10] via-[#2a2211] to-[#15161c] border border-amber-500/60 shadow-lg shadow-amber-500/20 text-amber-400'
            }`}
          >
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-1.5">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full inline-flex items-center gap-1 border ${
              isLight
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Loading Page
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Opening {targetTitle}...
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            Please wait while the page loads securely
          </p>
        </div>

        {/* Voice Guide Notice if active */}
        {showVoiceNotice && (
          <div
            className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-center gap-2.5 text-xs shadow-lg animate-in fade-in duration-300 border ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-500/5'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
            <div className="text-left text-[11px] leading-tight">
              <span className={`font-bold block ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Playing Voice Guide 🔊</span>
              <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Please listen to important payment instructions
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar & Countdown */}
        <div className="w-full space-y-2">
          <div
            className={`w-full h-2 rounded-full overflow-hidden p-0.5 shadow-inner border ${
              isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#181a22] border-stone-800'
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-75 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div
            className={`flex items-center justify-between text-[11px] font-mono ${
              isLight ? 'text-slate-600' : 'text-stone-400'
            }`}
          >
            <span className="font-semibold">{progress}%</span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                isLight ? 'text-amber-800' : 'text-amber-300/90'
              }`}
            >
              <span>Opening in {timeLeft}s</span>
            </span>
          </div>
        </div>

        {/* Security badge at bottom */}
        <div
          className={`flex items-center gap-1.5 text-[10px] pt-2 ${
            isLight ? 'text-slate-500' : 'text-stone-500'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted 9jacash Network Connection</span>
        </div>
      </div>
    </div>
  );
};
