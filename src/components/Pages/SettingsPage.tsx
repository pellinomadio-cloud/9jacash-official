import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  ArrowLeft,
  KeyRound,
  Shield,
  FileText,
  LogOut,
  CheckCircle2,
  User,
  ChevronRight,
  Lock,
  Edit2,
  Check,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onOpenTerms: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onOpenTerms }) => {
  const { user, logout, updateUserName, updateUserPin } = useAuth();
  const { theme, toggleTheme, isLight } = useTheme();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameSaved, setNameSaved] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [pinChangeOpen, setPinChangeOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChanged, setPinChanged] = useState(false);
  const [emailLockedNotice, setEmailLockedNotice] = useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  if (!user) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Username cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Username must be at least 2 characters');
      return;
    }
    if (trimmed === user.name) {
      setNameError('This is already your current username');
      return;
    }
    setIsUpdatingName(true);
    const ok = await updateUserName(trimmed);
    setIsUpdatingName(false);
    if (ok) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3500);
    } else {
      setNameError('Failed to update username. Please try again.');
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      const ok = await updateUserPin(newPin);
      if (ok) {
        setPinChanged(true);
        setTimeout(() => {
          setPinChanged(false);
          setPinChangeOpen(false);
          setNewPin('');
        }, 1500);
      }
    }
  };

  const isNameChanged = nameInput.trim() !== user.name && nameInput.trim().length >= 2;

  return (
    <div className="min-h-screen pb-12 space-y-4 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <button
          type="button"
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-400 shadow-sm'
              : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Profile &amp; Settings</h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Change your username, PIN, and account preferences</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className={`p-5 rounded-3xl border flex items-center gap-4 ${
        isLight ? 'bg-white border-amber-300 shadow-md shadow-amber-500/5' : 'bg-[#15161c] border-amber-500/30'
      }`}>
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-extrabold text-xl shadow-md ${
          isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
        }`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h3 className={`font-bold text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h3>
          <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
              Tier {user.tier || 1} Account
            </span>
            {user.referralCode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                Ref: {user.referralCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information: Change Username & Locked Email */}
      <div className="p-5 rounded-3xl bg-[#15161c] border border-stone-800 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Profile Settings
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            Change Username
          </span>
        </div>

        {/* Change Username Form */}
        <form onSubmit={handleUpdateName} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Username / Display Name</span>
              <span className="text-amber-400">*</span>
            </label>
            {nameSaved ? (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Username Saved!
              </span>
            ) : (
              <span className="text-[10px] text-stone-400">Can be changed anytime</span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setNameError('');
              }}
              placeholder="Enter your username"
              className="w-full px-3.5 py-3 pr-24 rounded-xl bg-[#1c1e26] border border-stone-700 focus:border-amber-400 text-white text-xs sm:text-sm font-bold focus:outline-none transition-colors"
            />
            {isNameChanged && (
              <button
                type="submit"
                disabled={isUpdatingName}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                {isUpdatingName ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>

          {nameError && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {nameError}
            </p>
          )}

          {isNameChanged ? (
            <button
              type="submit"
              disabled={isUpdatingName}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isUpdatingName ? 'Updating Username...' : 'Save New Username'}</span>
            </button>
          ) : (
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <span>Tap the box above and type a new name to change your username.</span>
            </p>
          )}
        </form>

        {/* Email Address - Permanently Locked & Read-Only */}
        <div
          className="space-y-1.5 pt-3 border-t border-stone-800/80"
          onClick={() => {
            setEmailLockedNotice(true);
            setTimeout(() => setEmailLockedNotice(false), 4000);
          }}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <span>Registered Email Address</span>
              <Lock className="w-3.5 h-3.5 text-stone-400" />
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-semibold border border-stone-700/60">
              Locked &bull; Cannot be changed
            </span>
          </div>

          <div className="relative">
            <input
              type="email"
              value={user.email}
              disabled
              readOnly
              className="w-full px-3.5 py-3 rounded-xl bg-[#14151b] border border-stone-800 text-stone-400 text-xs sm:text-sm font-mono cursor-not-allowed select-none opacity-85"
            />
            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          </div>

          {emailLockedNotice && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Email cannot be modified. It is permanently locked to secure your wallet and payouts.</span>
            </div>
          )}

          <p className="text-[10px] text-stone-500 flex items-center gap-1 leading-relaxed">
            <Lock className="w-2.5 h-2.5 flex-shrink-0" />
            <span>Email address cannot be changed to protect your wallet balance and ensure fraud security.</span>
          </p>
        </div>
      </div>

      {/* App Appearance / Light Mode Toggle */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-amber-300 shadow-md shadow-amber-500/10'
            : 'bg-[#15161c] border-stone-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-stone-800/80 text-amber-400'
              }`}
            >
              {isLight ? (
                <Sun className="w-5 h-5 text-amber-600 animate-spin-slow" />
              ) : (
                <Moon className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isLight ? 'Light Mode (Clear View)' : 'Dark Mode (Obsidian)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border border-amber-300/60'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  {isLight ? 'Active' : 'Standard'}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                {isLight
                  ? 'High contrast & daylight clear viewing with floating ₦1,000 notes'
                  : 'Switch to light mode for crisp and clear viewing'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isLight}
            aria-label="Toggle Light Mode"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isLight ? 'bg-amber-500' : 'bg-stone-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isLight ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {isLight ? (
                <Sun className="h-3.5 w-3.5 text-amber-600 stroke-[2.5]" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-stone-700 stroke-[2.5]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Security & PIN Options */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => setPinChangeOpen(!pinChangeOpen)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#15161c] border border-stone-800 hover:bg-[#1a1c24] text-xs font-bold text-stone-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Change 4-Digit Password / PIN</span>
          </div>
          <span className="text-stone-500">{pinChangeOpen ? 'Close' : 'Update'}</span>
        </button>

        {pinChangeOpen && (
          <form onSubmit={handleUpdatePin} className="p-4 rounded-2xl bg-[#1a1c24] border border-amber-500/30 space-y-3 animate-in fade-in">
            <label className="block text-xs font-semibold text-stone-300">Enter New 4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="w-full py-3 px-3 bg-[#131418] border border-stone-700 rounded-xl text-center text-xl tracking-widest text-white focus:border-amber-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={newPin.length !== 4}
              className="w-full py-3 bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {pinChanged ? 'PIN Updated Successfully!' : 'Save New 4-Digit PIN'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onOpenTerms}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#15161c] border border-stone-800 hover:bg-[#1a1c24] text-xs font-bold text-stone-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Terms and Services &amp; Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#15161c] border border-stone-800 text-xs font-bold text-stone-200">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Two-Factor Authentication</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Enabled
          </span>
        </div>
      </div>

      {/* Logout */}
      <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-xs transition-colors cursor-pointer border ${
            isLight
              ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700 shadow-sm'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
          }`}
        >
          <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>Sign Out of 9jacash</span>
        </button>
      </div>
    </div>
  );
};
