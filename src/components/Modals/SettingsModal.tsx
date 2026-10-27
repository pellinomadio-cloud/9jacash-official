import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  X,
  User,
  KeyRound,
  Shield,
  FileText,
  LogOut,
  CheckCircle2,
  Check,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { TermsModal } from '../Auth/TermsModal.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateUserName, updateUserPin } = useAuth();
  const { isLight } = useTheme();
  const [showTerms, setShowTerms] = useState(false);

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

  if (!isOpen || !user) return null;

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
      setNameError('Already your current username');
      return;
    }
    setIsUpdatingName(true);
    const ok = await updateUserName(trimmed);
    setIsUpdatingName(false);
    if (ok) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#14151b] border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg text-white">Profile &amp; Settings</h3>
            <p className="text-xs text-stone-400">Change your username &amp; account settings</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="my-4 p-4 rounded-2xl bg-[#1c1e26] border border-stone-800 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-lg shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                Tier {user.tier || 1} Account
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information: Change Username & Locked Email */}
        <div className="p-4 rounded-2xl bg-[#171920] border border-stone-800/80 space-y-3.5 my-3">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Profile Information
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Change Username
            </span>
          </div>

          {/* Change Username Form */}
          <form onSubmit={handleUpdateName} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-stone-300">
                Username / Display Name
              </label>
              {nameSaved && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Updated
                </span>
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
                placeholder="Enter username"
                className="w-full px-3 py-2.5 rounded-xl bg-[#131418] border border-stone-700 focus:border-amber-500 text-white text-xs font-bold focus:outline-none transition-colors"
              />
              {isNameChanged && (
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] transition-all cursor-pointer shadow-sm"
                >
                  {isUpdatingName ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            {isNameChanged && (
              <button
                type="submit"
                disabled={isUpdatingName}
                className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isUpdatingName ? 'Updating...' : 'Save New Username'}</span>
              </button>
            )}

            {nameError && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {nameError}
              </p>
            )}
          </form>

          {/* Locked Email Address */}
          <div
            className="space-y-1 pt-1.5 border-t border-stone-800/80"
            onClick={() => {
              setEmailLockedNotice(true);
              setTimeout(() => setEmailLockedNotice(false), 3500);
            }}
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
                <span>Email Address</span>
                <Lock className="w-3 h-3 text-stone-500" />
              </label>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-semibold border border-stone-700">
                Permanent &bull; Locked
              </span>
            </div>

            <div className="relative">
              <input
                type="email"
                value={user.email}
                disabled
                readOnly
                className="w-full px-3 py-2 rounded-xl bg-[#131418] border border-stone-800 text-stone-400 text-xs font-mono cursor-not-allowed select-none opacity-80"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
            </div>

            {emailLockedNotice && (
              <p className="text-[10px] text-amber-300/90 pt-1 animate-in fade-in">
                Email address cannot be changed for account and withdrawal security.
              </p>
            )}

            <p className="text-[10px] text-stone-500 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 flex-shrink-0" />
              <span>Email address cannot be changed for account security.</span>
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-2 py-1">
          {/* Change PIN toggle */}
          <button
            type="button"
            onClick={() => setPinChangeOpen(!pinChangeOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#171920] border border-stone-800/80 hover:bg-[#1f212a] text-xs font-semibold text-stone-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Change 4-Digit Password / PIN</span>
            </div>
            <span className="text-stone-500 text-[11px]">{pinChangeOpen ? 'Hide' : 'Edit'}</span>
          </button>

          {pinChangeOpen && (
            <form onSubmit={handleUpdatePin} className="p-3.5 rounded-2xl bg-[#1c1e26] border border-amber-500/30 space-y-3 animate-in fade-in">
              <label className="block text-[11px] text-stone-300">Enter New 4-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full py-2 px-3 bg-[#131418] border border-stone-700 rounded-xl text-center text-lg tracking-widest text-white font-bold focus:border-amber-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={newPin.length !== 4}
                className="w-full py-2 bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {pinChanged ? 'PIN Updated Successfully!' : 'Save New PIN'}
              </button>
            </form>
          )}

          {/* Terms & Privacy */}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#171920] border border-stone-800/80 hover:bg-[#1f212a] text-xs font-semibold text-stone-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Terms and Services</span>
            </div>
            <span className="text-stone-500 text-[11px]">View</span>
          </button>

          {/* Security details */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#171920] border border-stone-800/80 text-xs font-semibold text-stone-200">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Two-Factor Authentication (PIN)</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
        </div>

        {/* Logout */}
        <div className={`pt-4 mt-2 border-t ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border ${
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

      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => setShowTerms(false)}
      />
    </div>
  );
};
