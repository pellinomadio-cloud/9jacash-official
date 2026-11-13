import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { compressImage } from '../../utils/imageCompressor.ts';
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
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onOpenTerms: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onOpenTerms }) => {
  const { user, logout, updateUserName, updateUserPin, updateProfilePicture } = useAuth();
  const { theme, toggleTheme, isLight } = useTheme();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameSaved, setNameSaved] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [picSavedMsg, setPicSavedMsg] = useState('');
  const [picErrorMsg, setPicErrorMsg] = useState('');
  const picInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPicErrorMsg('Please select a valid image file.');
      return;
    }
    setPicErrorMsg('');
    setPicSavedMsg('');
    setIsUploadingPic(true);
    try {
      const compressed = await compressImage(file, 320, 320, 0.75);
      if (!compressed) {
        setPicErrorMsg('Unable to process that image.');
        return;
      }
      const ok = await updateProfilePicture(compressed);
      if (ok) {
        setPicSavedMsg('Profile picture updated!');
        setTimeout(() => setPicSavedMsg(''), 3500);
      } else {
        setPicErrorMsg('Failed to update profile picture.');
      }
    } catch {
      setPicErrorMsg('Failed to upload image.');
    } finally {
      setIsUploadingPic(false);
      if (picInputRef.current) picInputRef.current.value = '';
    }
  };

  const handleRemoveProfilePic = async () => {
    setPicErrorMsg('');
    setPicSavedMsg('');
    setIsUploadingPic(true);
    try {
      const ok = await updateProfilePicture('');
      if (ok) {
        setPicSavedMsg('Profile picture removed.');
        setTimeout(() => setPicSavedMsg(''), 3000);
      }
    } finally {
      setIsUploadingPic(false);
    }
  };

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
        <button
          type="button"
          onClick={() => picInputRef.current?.click()}
          className="relative group shrink-0 cursor-pointer focus:outline-none"
          title="Change profile picture"
        >
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-extrabold text-xl shadow-md overflow-hidden ${
            isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
          }`}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center border-2 shadow-xs ${
              isLight ? 'border-white' : 'border-[#15161c]'
            }`}
          >
            <Camera className="w-2.5 h-2.5 stroke-[2.5]" />
          </span>
        </button>
        <div className="overflow-hidden">
          <h3 className={`font-bold text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h3>
          <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              Tier {user.tier || 1} Account
            </span>
            {user.referralCode && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-stone-800 text-stone-400'
              }`}>
                Ref: {user.referralCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information: Profile Picture, Change Username & Locked Email */}
      <div className="p-5 rounded-3xl bg-[#15161c] border border-stone-800 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Profile Settings
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            Photo &amp; Name
          </span>
        </div>

        {/* Profile Picture Section */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#1a1c24] border-stone-800'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 ${
                isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              }`}
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Profile Picture</p>
              <p className={`text-[10px] truncate ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                {picSavedMsg || (user.profilePicture ? 'Photo uploaded & synced' : 'No profile picture added yet')}
              </p>
              {picErrorMsg && (
                <p className="text-[10px] text-red-500 font-semibold">{picErrorMsg}</p>
              )}
            </div>
          </div>

          <input
            ref={picInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePicUpload}
            className="hidden"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => picInputRef.current?.click()}
              disabled={isUploadingPic}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3 stroke-[2.5]" />
              <span>{isUploadingPic ? 'Saving...' : user.profilePicture ? 'Change' : 'Upload'}</span>
            </button>
            {user.profilePicture && (
              <button
                type="button"
                onClick={handleRemoveProfilePic}
                disabled={isUploadingPic}
                className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                    : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                }`}
                title="Remove profile picture"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
