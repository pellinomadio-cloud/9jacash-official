import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Eye, EyeOff } from 'lucide-react';

interface BalanceCardProps {
  onNavigateToWithdraw?: () => void;
  onNavigateToDeposit?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  onNavigateToWithdraw,
}) => {
  const { user, isBalanceHidden, toggleBalanceVisibility, formatNaira } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const balance = user?.balance ?? 0;
  const availableBalance = user?.availableBalance ?? 0;

  const formattedBalance = isBalanceHidden ? '₦ •••••••' : formatNaira(balance);

  // Dynamic font sizing: clearly bold and visible while ensuring large amounts stay straight on one line
  const getBalanceFontSize = (text: string) => {
    if (text.length >= 16) return 'text-lg sm:text-xl md:text-2xl';  // e.g. ₦ 100,000,000.00
    if (text.length >= 13) return 'text-xl sm:text-2xl md:text-3xl'; // e.g. ₦ 1,450,000.00
    return 'text-2xl sm:text-3xl md:text-4xl';                       // e.g. ₦ 50,000.00 or ₦ •••••••
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
        isLight
          ? 'bg-white border-2 border-slate-200 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.1),0_4px_12px_rgba(0,0,0,0.04)] text-slate-900'
          : 'bg-gradient-to-r from-[#111215] via-[#16171d] to-[#121316] border border-stone-800/80 shadow-2xl text-white'
      }`}
    >
      {/* Keyframe animations for the cute eye and gesturing hand */}
      <style>{`
        @keyframes cuteEyeBlink {
          0%, 86%, 100% {
            transform: scaleY(1);
          }
          90%, 93% {
            transform: scaleY(0.08);
          }
        }
        @keyframes gazeAtBalance {
          0%, 100% {
            transform: translate(-14px, 3px);
          }
          15%, 35% {
            transform: translate(-20px, 5px) scale(1.08);
          }
          45%, 60% {
            transform: translate(-10px, 0px) scale(1);
          }
          70%, 90% {
            transform: translate(-18px, 4px) scale(1.06);
          }
        }
        @keyframes cuteHandBeckon {
          0%, 100% {
            transform: translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateX(-12px) rotate(-16deg);
          }
          50% {
            transform: translateX(-4px) rotate(-6deg);
          }
          75% {
            transform: translateX(-14px) rotate(-20deg);
          }
        }
        @keyframes floatCashSparkle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(0.95);
            opacity: 0.85;
          }
          50% {
            transform: translateY(-9px) rotate(-10deg) scale(1.15);
            opacity: 1;
          }
        }
        @keyframes cuteBubblePulse {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.06);
          }
        }
        @keyframes cuteCheekPulse {
          0%, 100% {
            opacity: 0.75;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>

      {/* Subtle background glow and lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-10 -right-10 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-sky-200/40' : 'bg-emerald-500/10'
          }`}
        />
        <div
          className={`absolute -bottom-10 left-10 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-emerald-100/40' : 'bg-amber-500/10'
          }`}
        />
      </div>

      {/* ANIMATED CUTE EYE MASCOT IN THE BACKGROUND:
          Positioned directly in the background looking right at the balance digits,
          with animated pupils gazing at the balance and an animated hand gesturing to withdraw */}
      <div
        onClick={onNavigateToWithdraw}
        className={`absolute right-1 sm:right-6 top-1/2 -translate-y-1/2 z-0 flex flex-col items-center select-none ${
          onNavigateToWithdraw ? 'cursor-pointer group' : ''
        }`}
        title={onNavigateToWithdraw ? 'Tap to withdraw your balance' : undefined}
      >
        {/* The Cute Eye Mascot Creature Artwork */}
        <div className="relative w-24 h-20 sm:w-32 sm:h-26 flex items-center justify-center">
          {/* Ambient Glow behind mascot */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl pointer-events-none ${
              isLight ? 'bg-emerald-300/25' : 'bg-emerald-400/15'
            }`}
          />

          {/* SVG Artwork: Cute Expressive Eyes Looking at Balance & Pointing Hand */}
          <svg
            viewBox="0 0 130 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full ${
              isLight
                ? 'drop-shadow-[0_4px_14px_rgba(15,23,42,0.12)]'
                : 'drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
            }`}
          >
            {/* Soft Mascot Head silhouette / background body */}
            <ellipse
              cx="65"
              cy="50"
              rx="52"
              ry="40"
              fill={isLight ? '#f1f5f9' : '#14151b'}
              stroke={isLight ? '#cbd5e1' : '#ffffff'}
              strokeWidth="1.8"
              strokeOpacity={isLight ? 1 : 0.35}
            />

            {/* Kawaii Blushing Cheeks (Pulsing gently) */}
            <ellipse
              cx="28"
              cy="63"
              rx="8"
              ry="4.5"
              fill="#f472b6"
              fillOpacity="0.8"
              style={{ transformOrigin: '28px 63px', animation: 'cuteCheekPulse 3s ease-in-out infinite' }}
            />
            <ellipse
              cx="102"
              cy="63"
              rx="8"
              ry="4.5"
              fill="#f472b6"
              fillOpacity="0.8"
              style={{ transformOrigin: '102px 63px', animation: 'cuteCheekPulse 3s ease-in-out infinite' }}
            />

            {/* Cute Little Smile */}
            <path
              d="M 57 65 Q 65 72 73 65"
              stroke={isLight ? '#1e293b' : '#ffffff'}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
              opacity={isLight ? 0.95 : 0.9}
            />

            {/* LEFT EYE (Blinking animated group) */}
            <g style={{ transformOrigin: '46px 42px', animation: 'cuteEyeBlink 3.6s ease-in-out infinite' }}>
              {/* White Sclera with crisp outline */}
              <ellipse
                cx="46"
                cy="42"
                rx="17"
                ry="22"
                fill="#ffffff"
                stroke={isLight ? '#94a3b8' : '#18191f'}
                strokeWidth="1.5"
              />

              {/* Animated Pupil / Iris Group that shifts LEFT looking straight at the balance digits */}
              <g style={{ transformOrigin: '46px 42px', animation: 'gazeAtBalance 4s ease-in-out infinite' }}>
                {/* Iris (rich multi-stop gradient) */}
                <ellipse cx="46" cy="42" rx="11" ry="15" fill="url(#cuteEyeIrisGrad)" />
                {/* Dark Pupil */}
                <ellipse cx="46" cy="42" rx="7" ry="10" fill="#090a0f" />
                {/* Big Starry Cute Specular Highlight */}
                <circle cx="43" cy="35" r="4.5" fill="#ffffff" />
                {/* Second Mini Specular Highlight Bubble */}
                <circle cx="50" cy="46" r="2.4" fill="#ffffff" />
                {/* Little emerald sparkle star */}
                <polygon points="44,48 45,50 47,50 45,51 46,53 44,52 42,53 43,51 41,50 43,50" fill="#34d399" />
              </g>

              {/* Cute Eyelashes */}
              <path
                d="M 31 31 Q 37 24 44 26"
                stroke={isLight ? '#1e293b' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 49 26 Q 55 27 60 33"
                stroke={isLight ? '#1e293b' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* RIGHT EYE (Blinking animated group) */}
            <g style={{ transformOrigin: '84px 42px', animation: 'cuteEyeBlink 3.6s ease-in-out infinite' }}>
              {/* White Sclera with crisp outline */}
              <ellipse
                cx="84"
                cy="42"
                rx="17"
                ry="22"
                fill="#ffffff"
                stroke={isLight ? '#94a3b8' : '#18191f'}
                strokeWidth="1.5"
              />

              {/* Animated Pupil / Iris Group that shifts LEFT looking straight at the balance digits */}
              <g style={{ transformOrigin: '84px 42px', animation: 'gazeAtBalance 4s ease-in-out infinite' }}>
                {/* Iris */}
                <ellipse cx="84" cy="42" rx="11" ry="15" fill="url(#cuteEyeIrisGrad)" />
                {/* Dark Pupil */}
                <ellipse cx="84" cy="42" rx="7" ry="10" fill="#090a0f" />
                {/* Big Starry Cute Specular Highlight */}
                <circle cx="81" cy="35" r="4.5" fill="#ffffff" />
                {/* Second Mini Specular Highlight Bubble */}
                <circle cx="88" cy="46" r="2.4" fill="#ffffff" />
                {/* Little emerald sparkle star */}
                <polygon points="82,48 83,50 85,50 83,51 84,53 82,52 80,53 81,51 79,50 81,50" fill="#34d399" />
              </g>

              {/* Cute Eyelashes */}
              <path
                d="M 70 32 Q 76 26 82 26"
                stroke={isLight ? '#1e293b' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 87 26 Q 93 25 99 32"
                stroke={isLight ? '#1e293b' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* GESTURING HAND / PAW: Reaches left directly towards balance with animated beckoning */}
            <g style={{ transformOrigin: '30px 76px', animation: 'cuteHandBeckon 2.4s ease-in-out infinite' }}>
              {/* White Cartoon Glove/Hand pointing towards balance */}
              <ellipse
                cx="22"
                cy="76"
                rx="12"
                ry="9"
                fill="#ffffff"
                stroke={isLight ? '#1e293b' : '#000000'}
                strokeWidth="1.6"
              />
              {/* Pointing index finger gesturing left at balance */}
              <path
                d="M 18 73 C 8 72 4 74 1 76 C 4 79 10 80 19 79"
                fill="#ffffff"
                stroke={isLight ? '#1e293b' : '#000000'}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Glove Cuff with little touch of green */}
              <rect
                x="25"
                y="70"
                width="5"
                height="12"
                rx="2.5"
                fill="#10b981"
                stroke={isLight ? '#1e293b' : '#000000'}
                strokeWidth="1"
              />
            </g>

            {/* FLOATING CASH / NAIRA SPARKLE near gesturing hand */}
            <g style={{ transformOrigin: '10px 48px', animation: 'floatCashSparkle 2.4s ease-in-out infinite' }}>
              {/* Golden/White Coin with Naira symbol */}
              <circle cx="12" cy="48" r="8" fill="url(#cuteCoinGrad)" stroke="#ffffff" strokeWidth="1.2" />
              <text x="8.5" y="52" fill="#000000" fontSize="9" fontWeight="900" fontFamily="sans-serif">₦</text>
              {/* Little sparkle star with touch of green */}
              <polygon points="20,40 22,43 25,43 23,45 24,48 21,46 18,48 19,45 17,43 20,43" fill="#34d399" />
            </g>

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="cuteEyeIrisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="35%" stopColor="#10b981" />
                <stop offset="75%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
              <linearGradient id="cuteCoinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Subtext under cute eye mascot: Tap to Withdraw */}
        <span
          className={`text-[10px] font-bold whitespace-nowrap tracking-wide flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full border transition-colors ${
            isLight
              ? 'bg-emerald-50/95 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'bg-black/75 text-stone-300 border-stone-800'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
          <span>Tap to Withdraw</span>
        </span>
      </div>

      {/* Foreground Left: Balance details */}
      <div className="relative z-10 w-full max-w-[76%] sm:max-w-[80%] md:max-w-[85%] space-y-1">
        {/* Total Balance label with Eye toggle icon */}
        <div
          className={`flex items-center gap-2 transition-colors ${
            isLight ? 'text-slate-500 font-semibold' : 'text-stone-400 font-medium'
          }`}
        >
          <span className="text-xs sm:text-sm tracking-wide">Total Balance</span>
          <button
            type="button"
            onClick={toggleBalanceVisibility}
            className={`p-1 rounded-md transition-colors focus:outline-none cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
            title={isBalanceHidden ? 'Show balance' : 'Hide balance'}
          >
            {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Amount in Naira: bold and clearly visible, stays straight on one line */}
        <div className="py-0.5 overflow-hidden">
          <h2
            className={`font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
              isLight
                ? 'text-[#0f172a] drop-shadow-none'
                : 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]'
            } ${getBalanceFontSize(formattedBalance)}`}
            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
          >
            {formattedBalance}
          </h2>
        </div>

        {/* Available Balance */}
        <div className="pt-0.5">
          <p
            className={`text-xs sm:text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
              isLight ? 'text-slate-500' : 'text-stone-400'
            }`}
          >
            Available Balance:{' '}
            <span
              className={`font-bold ${
                isLight ? 'text-emerald-700' : 'text-stone-200'
              }`}
              style={{ color: isLight ? '#047857' : undefined }}
            >
              {isBalanceHidden ? '₦ ••••' : formatNaira(availableBalance)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
