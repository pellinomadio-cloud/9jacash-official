import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, Copy, Check, User, ShieldCheck, Share2, Award } from 'lucide-react';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserName } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  if (!isOpen || !user) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError('Username must be at least 2 characters');
      return;
    }
    if (trimmed === user.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    const ok = await updateUserName(trimmed);
    setIsSavingName(false);
    if (ok) {
      setNameSaved(true);
      setIsEditingName(false);
      setTimeout(() => setNameSaved(false), 3000);
    } else {
      setNameError('Failed to save username');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My 9jacash Profile',
        text: `Name: ${user.name}\nEmail: ${user.email}\nReferral Code: ${user.referralCode || ''}`,
      }).catch(() => {});
    } else {
      copyToClipboard(`Name: ${user.name}\nEmail: ${user.email}\nReferral Code: ${user.referralCode || ''}`, 'all');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#14151b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold shadow-md shadow-amber-400/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Profile Details</h3>
              <p className="text-xs text-stone-400">Your 9jacash Earner Credentials</p>
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

        {/* Info Box */}
        <div className="py-5 space-y-3.5">
          {user.referralCode && (
            <div className="p-3.5 rounded-2xl bg-[#1c1e26] border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                  Referral Code
                </span>
                <span className="text-lg font-bold text-amber-400 tracking-wider font-mono">
                  {user.referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(user.referralCode || '', 'ref')}
                className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'ref' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Full Name / Username */}
          <div className="p-3.5 rounded-2xl bg-[#1c1e26] border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                  Username
                </span>
                <span className="text-sm font-semibold text-white">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {nameSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold">Updated!</span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingName(!isEditingName)}
                  className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isEditingName ? 'Close' : 'Change'}
                </button>
              </div>
            </div>

            {isEditingName && (
              <form onSubmit={handleSaveName} className="pt-2 border-t border-stone-800 space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setNameError('');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#131418] border border-stone-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  placeholder="New username"
                  autoFocus
                />
                {nameError && <p className="text-[10px] text-red-400">{nameError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="flex-1 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs"
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(user.name);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Registered Email */}
          <div className="p-3.5 rounded-2xl bg-[#1c1e26] border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                Registered Email
              </span>
              <span className="text-sm font-semibold text-amber-400">
                {user.email}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 font-semibold">
              Permanent
            </span>
          </div>

          {/* Earner Status */}
          <div className="flex items-center justify-between px-2 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Earner Status</span>
            </span>
            <span>Standard Account</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-stone-800 flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1c1e26] hover:bg-[#252834] border border-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Share Details</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
