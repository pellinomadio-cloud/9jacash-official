import React from 'react';
import { Camera, Sparkles, ArrowRight, X, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { soundFx } from '../../utils/sound.ts';

interface ProfilePicturePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPicture: () => void;
  userName?: string;
}

export const ProfilePicturePromptModal: React.FC<ProfilePicturePromptModalProps> = ({
  isOpen,
  onClose,
  onAddPicture,
  userName,
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  const handleAddClick = () => {
    soundFx.playClick();
    onAddPicture();
  };

  const handleLaterClick = () => {
    soundFx.playClick();
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[65] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/50' : 'bg-black/85'
      }`}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl border-2 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden transition-colors ${
          isLight
            ? 'bg-gradient-to-b from-amber-50 via-white to-amber-50/70 border-amber-300 text-slate-900 shadow-amber-500/20'
            : 'bg-[#14151b] border-amber-500/40 text-white shadow-black/70'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-56 h-32 blur-2xl pointer-events-none ${
            isLight
              ? 'bg-gradient-to-b from-amber-300/35 via-yellow-200/20 to-transparent'
              : 'bg-gradient-to-b from-amber-500/20 via-amber-400/10 to-transparent'
          }`}
        />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleLaterClick}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 border ${
            isLight
              ? 'bg-white hover:bg-amber-50 text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs'
              : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
          }`}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar & Camera Badge */}
        <div className="relative z-10 flex flex-col items-center text-center pt-2 space-y-3">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-lg ${
                isLight
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-50 border-amber-400 text-amber-700 shadow-amber-500/15'
                  : 'bg-gradient-to-br from-amber-500/20 to-[#1b1d26] border-amber-400/70 text-amber-400 shadow-amber-500/20'
              }`}
            >
              <UserCircle2 className="w-11 h-11 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-md border-2 border-white">
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold tracking-wide uppercase ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>Complete Your Profile</span>
            </div>

            <h2 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Add Your Profile Picture
            </h2>

            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-stone-300'}`}>
              {userName ? `Hi ${userName}! ` : 'Hi there! '}
              Add a profile picture to personalize and verify your 9jacash account. You can upload or update it anytime from the{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>More</strong> page under{' '}
              <strong className={isLight ? 'text-amber-700' : 'text-amber-400'}>Edit</strong>.
            </p>
          </div>
        </div>

        {/* Helpful Info Pill */}
        <div
          className={`relative z-10 p-3 rounded-2xl border flex items-center gap-2.5 text-xs ${
            isLight
              ? 'bg-white border-amber-200 text-slate-700 shadow-xs'
              : 'bg-[#1a1c24] border-stone-800 text-stone-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] leading-snug">
            Tap <strong className={isLight ? 'text-slate-900' : 'text-white'}>Add Profile Picture</strong> below or go to{' '}
            <strong className={isLight ? 'text-amber-700' : 'text-amber-300'}>More &rarr; Edit</strong> to pick a photo from your device.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleAddClick}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Add Profile Picture</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          <button
            type="button"
            onClick={handleLaterClick}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
