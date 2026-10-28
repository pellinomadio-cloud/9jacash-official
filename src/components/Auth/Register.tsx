import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { TermsModal } from './TermsModal.tsx';
import {
  extractReferralCodeFromEmail,
  getIncomingReferralCode,
  cleanReferralCodeInput,
  SITE_DOMAIN,
} from '../../utils/referral.ts';
import { canRegisterAccountOnDevice } from '../../utils/deviceLimit.ts';
import {
  Landmark,
  User as UserIcon,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Check,
  Gift,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { isLight } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [hasIncomingRef, setHasIncomingRef] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeviceLimitReached, setIsDeviceLimitReached] = useState(false);

  useEffect(() => {
    // Check if device has reached maximum 10 accounts
    const check = canRegisterAccountOnDevice();
    if (!check.allowed) {
      setIsDeviceLimitReached(true);
      setError(check.message || 'Device registration limit reached. A maximum of 10 accounts can be created on this device.');
    }

    const incoming = getIncomingReferralCode();
    if (incoming) {
      setReferralCode(incoming);
      setHasIncomingRef(true);
    }
  }, []);

  const handleReferralInput = (val: string) => {
    const clean = cleanReferralCodeInput(val);
    setReferralCode(clean);
  };

  const prospectiveReferralCode = email.includes('@') ? extractReferralCodeFromEmail(email) : '';

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Enforce 10 accounts limit per device
    const deviceCheck = canRegisterAccountOnDevice();
    if (!deviceCheck.allowed) {
      setIsDeviceLimitReached(true);
      setError(deviceCheck.message || 'Device registration limit reached. A maximum of 10 accounts can be created on this device.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (pin.length !== 4) {
      setError('Please create a 4-digit security PIN/password');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the terms and services to continue');
      return;
    }

    const finalRefCode = cleanReferralCodeInput(referralCode) || getIncomingReferralCode() || undefined;
    setIsLoading(true);
    const result = await register(name, email, pin, finalRefCode);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message || 'Failed to create account');
      if (result.message?.includes('Device registration limit')) {
        setIsDeviceLimitReached(true);
      }
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors ${isLight ? 'bg-[#f4f6fa]' : 'bg-[#0b0c0e]'}`}>
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-15%] right-[-10%] w-96 h-96 rounded-full blur-3xl ${isLight ? 'bg-amber-400/10' : 'bg-amber-500/10'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full blur-3xl ${isLight ? 'bg-amber-300/15' : 'bg-amber-600/10'}`} />
      </div>

      <div className={`relative w-full max-w-md rounded-3xl p-7 shadow-2xl backdrop-blur-md my-4 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-slate-900/10 text-slate-800'
          : 'bg-[#131418] border-stone-800 text-stone-200'
      }`}>
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 shadow-lg ${
            isLight
              ? 'bg-gradient-to-b from-amber-50 to-amber-100/60 border-amber-300 shadow-amber-500/10 text-amber-700'
              : 'bg-gradient-to-b from-[#22242b] to-[#121316] border-amber-500/30 shadow-amber-500/10 text-amber-400'
          }`}>
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            9ja<span className="text-amber-500">cash</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Your goals. Our priority.</p>
        </div>

        <div className="mb-5 text-center">
          <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Create your account</h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Instant digital banking in seconds</p>
        </div>

        {isDeviceLimitReached ? (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Device Registration Limit Reached</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              A maximum of 10 accounts can be created on this device. You can log in to your existing account.
            </p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>Log in to Existing Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : error ? (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs text-center font-bold animate-shake">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <UserIcon className="w-4 h-4 text-amber-500/80" />
              </div>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    : 'bg-[#1c1e24] border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50'
                }`}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Mail className="w-4 h-4 text-amber-500/80" />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    : 'bg-[#1c1e24] border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50'
                }`}
                required
              />
            </div>
          </div>

          {/* 4-digit PIN password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>4-Digit Password / PIN</label>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>For login &amp; transactions</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <KeyRound className="w-4 h-4 text-amber-500/80" />
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-base tracking-widest font-bold transition-all border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    : 'bg-[#1c1e24] border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50'
                }`}
                required
              />
            </div>
            {/* PIN digits indicator */}
            <div className="flex gap-2 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i < pin.length
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : isLight ? 'bg-slate-200' : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Referral Code (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
                <span>Referral Code or Link</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>(Optional)</span>
              </label>
              <span className={`text-[10px] font-bold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <Gift className="w-3 h-3" /> Get ₦7,000 Welcome Bonus
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Gift className="w-4 h-4 text-amber-500/80" />
              </div>
              <input
                type="text"
                placeholder="Enter referral code or link"
                value={referralCode}
                onChange={(e) => handleReferralInput(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs lowercase tracking-wider font-mono font-semibold transition-all border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    : 'bg-[#1c1e24] border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50'
                }`}
              />
            </div>

            {/* Referral confirmation badge if code is applied */}
            {referralCode && (
              <div className={`mt-1.5 px-3 py-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
                isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Referral code active: <strong className={`font-mono ${isLight ? 'text-amber-900' : 'text-white'}`}>{referralCode}</strong>
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  {SITE_DOMAIN}?ref={referralCode}
                </span>
              </div>
            )}

            {/* Prospective user referral code preview */}
            {prospectiveReferralCode && (
              <p className={`mt-1 text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                <span>Your referral link will be:</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                  {SITE_DOMAIN}?ref={prospectiveReferralCode}
                </span>
              </p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                  acceptedTerms
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : isLight
                    ? 'bg-white border-slate-300 hover:border-amber-500'
                    : 'bg-[#1c1e24] border-stone-700 hover:border-amber-500/50'
                }`}
              >
                {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className={`text-xs leading-tight ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTermsOpen(true);
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                >
                  Terms and Services
                </button>{' '}
                and Privacy Policy of 9jacash.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
            ) : (
              <>
                <span>Open Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className={`mt-5 pt-4 border-t text-center ${isLight ? 'border-slate-200' : 'border-stone-800/80'}`}>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Already have a 9jacash account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline ml-1 cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>

        {/* Security watermark */}
        <div className={`mt-4 flex items-center justify-center gap-1.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Safe • Secure • Licensed Banking Infrastructure</span>
        </div>
      </div>

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />
    </div>
  );
};
