import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ArrowLeft, User, Copy, Check, Share2, ShieldCheck, Award, Edit2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccountDetailsPageProps {
  onBack: () => void;
  onOpenSettings?: () => void;
}

export const AccountDetailsPage: React.FC<AccountDetailsPageProps> = ({ onBack, onOpenSettings }) => {
  const { user, formatNaira, updateUserName } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.name || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [emailLockedNotice, setEmailLockedNotice] = useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setNewUsername(user.name);
    }
  }, [user?.name]);

  if (!user) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    const trimmed = newUsername.trim();
    if (!trimmed) {
      setUsernameError('Username cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setUsernameError('Username must be at least 2 characters');
      return;
    }
    if (trimmed === user.name) {
      setIsEditingUsername(false);
      return;
    }
    setIsSavingUsername(true);
    const ok = await updateUserName(trimmed);
    setIsSavingUsername(false);
    if (ok) {
      setUsernameSaved(true);
      setIsEditingUsername(false);
      setTimeout(() => setUsernameSaved(false), 3000);
    } else {
      setUsernameError('Failed to save username. Try again.');
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
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2 pb-3 border-b border-stone-800">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            Profile Details <User className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-stone-400">Your official 9jacash earner credentials</p>
        </div>
      </div>

      {/* Luxury Earner Card Pass */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-[#14151b] via-[#1a1c24] to-[#252015] border border-amber-500/40 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-extrabold shadow-lg shadow-amber-400/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block">
                9JACASH EARNER
              </span>
              <span className="text-xs text-stone-400">Rewards &amp; Cash Earner</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Active Earner
          </span>
        </div>

        {/* Profile Details */}
        <div className="space-y-3 text-xs">
          {user.referralCode && (
            <div className="p-3.5 rounded-2xl bg-[#131418] border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Referral Code</span>
                <span className="text-lg font-bold text-amber-400 tracking-wider font-mono">{user.referralCode}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(user.referralCode || '', 'ref')}
                className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedField === 'ref' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'ref' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Full Name / Username with In-place Edit */}
          <div className="p-3.5 rounded-2xl bg-[#131418] border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                  Username / Display Name
                </span>
                <span className="text-sm font-bold text-white">{user.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {usernameSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Updated
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(!isEditingUsername)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingUsername ? 'Close' : 'Change'}</span>
                </button>
              </div>
            </div>

            {isEditingUsername && (
              <form onSubmit={handleSaveUsername} className="pt-2 border-t border-stone-800 space-y-2 animate-in fade-in">
                <div className="relative">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setUsernameError('');
                    }}
                    placeholder="Enter new username"
                    className="w-full px-3 py-2 rounded-xl bg-[#1a1b22] border border-stone-700 focus:border-amber-400 text-white text-xs font-bold focus:outline-none"
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {usernameError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSavingUsername}
                    className="flex-1 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    {isSavingUsername ? 'Saving...' : 'Save New Username'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(false);
                      setNewUsername(user.name);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Registered Email - Permanently Locked */}
          <div
            className="p-3.5 rounded-2xl bg-[#131418] border border-stone-800 space-y-1"
            onClick={() => {
              setEmailLockedNotice(true);
              setTimeout(() => setEmailLockedNotice(false), 3500);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold flex items-center gap-1">
                  Registered Email <Lock className="w-2.5 h-2.5 text-stone-500" />
                </span>
                <span className="text-sm font-bold text-amber-400">{user.email}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800/80 text-stone-400 border border-stone-700/50 font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-stone-400" /> Permanent
              </span>
            </div>
            {emailLockedNotice && (
              <p className="text-[10px] text-amber-300/90 pt-1 border-t border-stone-800/60 animate-in fade-in">
                Email address cannot be changed to prevent unauthorized takeovers.
              </p>
            )}
          </div>
        </div>

        {/* Earning Level & Quick Codes */}
        <div className="pt-2 border-t border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Level {user.tier || 1} Earner {(user.tier || 1) >= 3 ? '• Zero Pending' : ''}</span>
            </div>
            <span className="text-amber-400 font-semibold">Balance: {formatNaira(user.balance)}</span>
          </div>

          {/* Active Quick Codes list */}
          <div className="p-3.5 rounded-2xl bg-[#131418] border border-amber-500/30 space-y-2">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
              Your Active Withdrawal Quick Codes
            </span>
            {user.quickCodes && user.quickCodes.length > 0 ? (
              <div className="space-y-2 pt-1">
                {user.quickCodes.map((item, idx) => {
                  const isStr = typeof item === 'string';
                  const code = isStr ? item : item.code;
                  const planName = isStr ? 'Quick Code' : item.planName;
                  const withdrawalsLeft = isStr ? 1 : item.withdrawalsLeft;

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-[#1c1e26] border border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm tracking-widest">{code}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(code, `qc_${idx}`)}
                          className="py-1 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedField === `qc_${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === `qc_${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-stone-400 font-medium">{planName}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                          {withdrawalsLeft} withdrawal{withdrawalsLeft > 1 ? 's' : ''} left
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 italic py-1">
                No active quick codes yet. Purchase and get admin approval to receive your withdrawal quick code here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full p-3.5 rounded-2xl bg-[#16171d] border border-amber-500/30 hover:border-amber-500/60 hover:bg-[#1a1c24] text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Profile &amp; Settings (Change Username / PIN)</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="p-3.5 rounded-2xl bg-[#16171d] border border-stone-800 hover:border-amber-500/40 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Share Profile</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
