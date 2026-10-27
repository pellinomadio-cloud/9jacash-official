import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  Sparkles,
  Trophy,
  Zap,
  Clock,
  CheckCircle2,
  Award,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface WheelSegment {
  id: number;
  label: string;
  amount: number;
  sublabel: string;
  bgColor: string;
  gradColor: string;
  textColor: string;
  isJackpot?: boolean;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: 0,
    label: '₦500,000',
    amount: 500000,
    sublabel: 'GRAND JACKPOT',
    bgColor: '#064e3b',
    gradColor: '#059669',
    textColor: '#fef08a',
    isJackpot: true,
  },
  {
    id: 1,
    label: '₦10,000',
    amount: 10000,
    sublabel: 'CASH PRIZE',
    bgColor: '#581c87',
    gradColor: '#7e22ce',
    textColor: '#ffffff',
  },
  {
    id: 2,
    label: '₦50,000',
    amount: 50000,
    sublabel: 'BIG WIN',
    bgColor: '#881337',
    gradColor: '#be123c',
    textColor: '#ffffff',
  },
  {
    id: 3,
    label: '₦2,500',
    amount: 2500,
    sublabel: 'FAST CASH',
    bgColor: '#1e3a8a',
    gradColor: '#2563eb',
    textColor: '#ffffff',
  },
  {
    id: 4,
    label: '₦100,000',
    amount: 100000,
    sublabel: 'MEGA PRIZE',
    bgColor: '#78350f',
    gradColor: '#d97706',
    textColor: '#fef08a',
    isJackpot: true,
  },
  {
    id: 5,
    label: '₦5,000',
    amount: 5000,
    sublabel: 'INSTANT CASH',
    bgColor: '#134e4a',
    gradColor: '#0d9488',
    textColor: '#ffffff',
  },
  {
    id: 6,
    label: '₦25,000',
    amount: 25000,
    sublabel: 'SUPER WIN',
    bgColor: '#9a3412',
    gradColor: '#ea580c',
    textColor: '#ffffff',
  },
  {
    id: 7,
    label: '₦250,000',
    amount: 250000,
    sublabel: 'SUPER JACKPOT',
    bgColor: '#312e81',
    gradColor: '#4f46e5',
    textColor: '#fef08a',
    isJackpot: true,
  },
];

const SEGMENT_COUNT = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT; // 45 degrees

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  opacity: number;
}

export const LuckySpinWheel: React.FC = () => {
  const { isLight } = useTheme();
  const { user, spinWheel, getDailySpinsLeft, formatNaira } = useAuth();

  const [spinsLeft, setSpinsLeft] = useState<number>(() => getDailySpinsLeft());
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [modalResult, setModalResult] = useState<{ amount: number; message: string; credited: number; pending: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [pointerFlutter, setPointerFlutter] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const confettiParticles = useRef<ConfettiPiece[]>([]);

  // Sync spins left with user profile/local storage per user account
  useEffect(() => {
    setSpinsLeft(getDailySpinsLeft());
  }, [user?.id, user?.spinsToday, user?.lastSpinDate]);

  // Live countdown to midnight reset (24:00 local time)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('00h 00m 00s');
        setSpinsLeft(getDailySpinsLeft());
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilReset(
          `${hours.toString().padStart(2, '0')}h ${minutes
            .toString()
            .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Confetti Animation Loop
  useEffect(() => {
    if (!showWinModal) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    // Spawn 120 vibrant celebratory confetti pieces
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#ffffff'];
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 15,
        opacity: 1,
      });
    }
    confettiParticles.current = pieces;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gravity = 0.35;
      const friction = 0.985;

      confettiParticles.current.forEach((p) => {
        p.vy += gravity;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.opacity = Math.max(0, p.opacity - 0.005);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      confettiParticles.current = confettiParticles.current.filter((p) => p.y < canvas.height + 20 && p.opacity > 0);

      if (confettiParticles.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [showWinModal]);

  // Main Spin Action
  const handleSpinClick = () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setWinningSegment(null);
    setShowWinModal(false);
    setPointerFlutter(true);

    // Pick a winning segment: Exciting probabilities with big prizes guaranteed to hit!
    // Weights: high-stake prizes have realistic, rewarding payout rates
    const weights = [8, 22, 14, 18, 10, 15, 12, 9]; // Total = 108
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      if (randomNum < weights[i]) {
        selectedIndex = i;
        break;
      }
      randomNum -= weights[i];
    }

    const selectedPrize = WHEEL_SEGMENTS[selectedIndex];

    // The needle pointer sits at top (12 o'clock = 270 deg / -90 deg or 0 deg in SVG polar coordinates)
    // In our SVG layout, Segment 0 starts at 0 deg (3 o'clock).
    // The top indicator is at 270 degrees (or -90 deg).
    // To have segment `i` centered under the top pointer:
    // Segment i center angle = i * 45 + 22.5 deg.
    // When wheel rotates by R, a point originally at angle A ends at (A + R) % 360.
    // We want (A + R) % 360 = 270 deg (top).
    // Therefore R % 360 = (270 - A + 360) % 360.
    const segmentCenterAngle = selectedIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const targetBaseRotation = (270 - segmentCenterAngle + 360) % 360;

    // Add 6 to 8 full 360-degree rotations for high-velocity real-time physics feel
    const fullSpins = 360 * (7 + Math.floor(Math.random() * 2));
    // Subtle jitter within segment (-14 to +14 deg) so it doesn't always hit dead center
    const randomJitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);

    const totalDegrees = fullSpins + targetBaseRotation + randomJitter;

    // Keep cumulative rotation forward so it never spins backwards
    const nextRotation = currentRotation + totalDegrees;
    setCurrentRotation(nextRotation);

    // Realistic ticking sound engine synced with deceleration curve
    if (soundEnabled) {
      const totalSpinTimeMs = 5200;
      const startTime = Date.now();

      const tickLoop = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= totalSpinTimeMs) return;

        const progress = elapsed / totalSpinTimeMs;
        // Frequency slows down from 40ms to 450ms as it decelerates
        const delay = 40 + Math.pow(progress, 3.2) * 420;

        soundFx.playWheelPegTick(1.0 - progress * 0.35);

        if (elapsed < totalSpinTimeMs - 80) {
          setTimeout(tickLoop, delay);
        }
      };

      setTimeout(tickLoop, 50);
    }

    // When spin finishes at 5.2 seconds:
    setTimeout(() => {
      setIsSpinning(false);
      setPointerFlutter(false);
      setWinningSegment(selectedPrize);

      if (soundEnabled) {
        if (selectedPrize.isJackpot) {
          soundFx.playJackpotFanfare();
        } else {
          soundFx.playWinChime();
        }
      }

      // Credit the real money to the user's account & persist in Firestore
      const res = spinWheel(selectedPrize.amount);
      setSpinsLeft(getDailySpinsLeft());

      setModalResult({
        amount: selectedPrize.amount,
        message: res.message || `Won +${formatNaira(selectedPrize.amount)}!`,
        credited: res.creditedAmount ?? selectedPrize.amount,
        pending: res.pendingAmount ?? 0,
      });
      setShowWinModal(true);
    }, 5250);
  };

  return (
    <div className="space-y-4">
      {/* Real-time Status Card & Spins Counter */}
      <div
        className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 shadow-2xl border ${
          isLight
            ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-2 border-amber-300 shadow-amber-500/10'
            : 'bg-gradient-to-br from-[#121318] via-[#1a1c24] to-[#121318] border-amber-500/40'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                DAILY BIG CASH SPIN
              </span>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Twice / Day
              </span>
            </div>
            <h2 className={`text-lg sm:text-xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Spin &amp; Win Up To</span>
              <span className="text-amber-500 font-mono tracking-tight">₦500,000</span>
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
              Real-time cash prizes instantly credited to your 9jacash balance.
            </p>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
                : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:text-white'
            }`}
            title={soundEnabled ? 'Mute spin sound' : 'Enable spin sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-stone-500'}`} />}
          </button>
        </div>

        {/* Daily Spins Left Indicator */}
        <div className={`mt-4 pt-3.5 border-t flex items-center justify-between flex-wrap gap-2 text-xs ${isLight ? 'border-slate-200' : 'border-stone-800/90'}`}>
          <div className="flex items-center gap-2.5">
            <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>Spins Today:</span>
            <div className="flex items-center gap-1.5">
              {[0, 1].map((idx) => {
                const isActive = idx < spinsLeft;
                return (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                      isActive
                        ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                        : isLight
                        ? 'bg-slate-200 text-slate-500 border-slate-300'
                        : 'bg-stone-800/60 text-stone-500 border-stone-700/50'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
            <span className={`font-extrabold ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {spinsLeft} / 2 Left
            </span>
          </div>

          {spinsLeft <= 0 ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-stone-900/80 text-stone-400 border-stone-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Resets in: <strong className="font-mono text-amber-500">{timeUntilReset}</strong></span>
            </div>
          ) : (
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Spin
            </span>
          )}
        </div>
      </div>

      {/* ================= WHEEL CONTAINER & STAGE ================= */}
      <div className="relative flex flex-col items-center justify-center py-4 px-2 select-none">
        {/* Glow Halo Background */}
        <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-amber-500/20 via-emerald-500/15 to-purple-500/20 blur-2xl pointer-events-none" />

        {/* Top Pointer Needle / Flapper */}
        <div
          className={`relative z-30 -mb-5 transition-transform duration-100 ${
            pointerFlutter ? 'scale-110 -rotate-3' : 'rotate-0'
          }`}
        >
          {/* 3D Pointer SVG */}
          <svg width="44" height="52" viewBox="0 0 44 52" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="needleGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="needleRuby" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="100%" stopColor="#990000" />
              </linearGradient>
            </defs>
            {/* Shadow & Outline */}
            <polygon points="22,50 4,14 40,14" fill="#000000" opacity="0.4" transform="translate(0, 2)" />
            {/* Main Needle Blade */}
            <polygon points="22,48 6,12 38,12" fill="url(#needleRuby)" stroke="#ffffff" strokeWidth="1.5" />
            {/* Center Golden Pivot */}
            <circle cx="22" cy="12" r="10" fill="url(#needleGold)" stroke="#ffffff" strokeWidth="2" />
            <circle cx="22" cy="12" r="4" fill="#1e1e24" />
          </svg>
        </div>

        {/* Outer Wheel Golden Bezel */}
        <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] rounded-full p-2.5 bg-gradient-to-tr from-amber-700 via-amber-400 to-yellow-200 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.35)] border-4 border-[#121316]">
          {/* Inner Rim with LED Light Studs */}
          <div className="relative w-full h-full rounded-full bg-[#0d0e12] p-1.5 overflow-hidden shadow-inner">
            {/* Glowing Perimeter LED lights */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16;
                const rad = (angle * Math.PI) / 180;
                const r = 48.5; // percentage
                const x = 50 + r * Math.cos(rad);
                const y = 50 + r * Math.sin(rad);
                const isLit = isSpinning ? (i + Math.floor(Date.now() / 150)) % 2 === 0 : i % 2 === 0;

                return (
                  <div
                    key={i}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-black/40 transition-colors duration-150 ${
                      isLit
                        ? 'bg-amber-300 shadow-[0_0_8px_rgba(253,224,71,1)]'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    }`}
                  />
                );
              })}
            </div>

            {/* ROTATING SVG WHEEL */}
            <div
              className="w-full h-full rounded-full overflow-hidden"
              style={{
                transform: `rotate(${currentRotation}deg)`,
                transition: isSpinning
                  ? 'transform 5.2s cubic-bezier(0.12, 0.82, 0.14, 1)'
                  : 'none',
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  {WHEEL_SEGMENTS.map((seg) => (
                    <linearGradient
                      key={`grad-${seg.id}`}
                      id={`seg-grad-${seg.id}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={seg.gradColor} />
                      <stop offset="100%" stopColor={seg.bgColor} />
                    </linearGradient>
                  ))}
                  <radialGradient id="hubGold">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>
                </defs>

                {/* 8 Segments */}
                {WHEEL_SEGMENTS.map((seg, idx) => {
                  const startAngle = idx * SEGMENT_ANGLE;
                  const endAngle = startAngle + SEGMENT_ANGLE;

                  // Convert polar to cartesian
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const cx = 200;
                  const cy = 200;
                  const r = 196;

                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);

                  const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                  // Text rotation angle
                  const midAngle = startAngle + SEGMENT_ANGLE / 2;

                  return (
                    <g key={seg.id}>
                      {/* Wedge Slice */}
                      <path
                        d={pathData}
                        fill={`url(#seg-grad-${seg.id})`}
                        stroke="#fef08a"
                        strokeWidth="2.5"
                        strokeOpacity="0.4"
                      />

                      {/* Cash Label & Sublabel */}
                      <g transform={`translate(${cx}, ${cy}) rotate(${midAngle})`}>
                        <text
                          x={r * 0.64}
                          y="-3"
                          fill={seg.textColor}
                          fontSize={seg.isJackpot ? '16' : '15'}
                          fontWeight="900"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          letterSpacing="0.2px"
                          style={{
                            filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.8))',
                          }}
                        >
                          {seg.label}
                        </text>

                        <text
                          x={r * 0.65}
                          y="14"
                          fill={seg.isJackpot ? '#fef08a' : '#d1d5db'}
                          fontSize="7.5"
                          fontWeight="800"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          letterSpacing="0.8px"
                          style={{
                            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.9))',
                          }}
                        >
                          {seg.sublabel}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Perimeter Brass Pins */}
                {WHEEL_SEGMENTS.map((_, idx) => {
                  const angle = idx * SEGMENT_ANGLE;
                  const rad = (angle * Math.PI) / 180;
                  const px = 200 + 192 * Math.cos(rad);
                  const py = 200 + 192 * Math.sin(rad);
                  return (
                    <circle
                      key={`pin-${idx}`}
                      cx={px}
                      cy={py}
                      r="4"
                      fill="#fef08a"
                      stroke="#92400e"
                      strokeWidth="1.5"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Center Metallic Hub Cap */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-yellow-200 p-1 shadow-[0_4px_16px_rgba(0,0,0,0.8)] border-2 border-[#15161c]">
                <div className="w-full h-full rounded-full bg-[#16171e] border border-amber-400/60 flex flex-col items-center justify-center text-center shadow-inner">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-[9px] font-black text-amber-300 tracking-tighter uppercase leading-tight mt-0.5">
                    9JACASH
                  </span>
                  <span className="text-[7px] font-extrabold text-stone-400 tracking-widest uppercase">
                    SPIN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: SPIN NOW */}
        <div className="mt-5 w-full max-w-xs space-y-2">
          <button
            type="button"
            onClick={handleSpinClick}
            disabled={isSpinning || spinsLeft <= 0}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
              isSpinning
                ? 'bg-amber-600/60 text-amber-200 cursor-not-allowed animate-pulse'
                : spinsLeft > 0
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed shadow-none'
            }`}
          >
            {isSpinning ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin text-black" />
                <span>SPINNING WHEEL...</span>
              </>
            ) : spinsLeft > 0 ? (
              <>
                <Zap className="w-5 h-5 fill-black" />
                <span>SPIN FOR BIG CASH ({spinsLeft} LEFT)</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-stone-500" />
                <span>DAILY SPINS USED (2/2)</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-stone-400">
            {spinsLeft > 0 ? (
              <span>Tap to spin. Real cash credited to your balance instantly.</span>
            ) : (
              <span>You have used your 2 spins for today. Next spins unlock at midnight!</span>
            )}
          </p>
        </div>
      </div>

      {/* ================= CELEBRATION WIN POPUP MODAL ================= */}
      {showWinModal && modalResult && winningSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          {/* Confetti Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />

          <div
            className={`relative z-20 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 border-2 ${
              isLight
                ? 'bg-gradient-to-b from-white via-amber-50/30 to-white border-amber-400 text-slate-900 shadow-amber-500/10'
                : 'bg-gradient-to-b from-[#1c1e28] to-[#121319] border-amber-500/60 text-white'
            }`}
          >
            {/* Header Badge */}
            <div className="mx-auto -mt-12 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-2xl shadow-amber-500/50 flex items-center justify-center animate-bounce">
              <div
                className={`w-full h-full rounded-full flex items-center justify-center text-amber-500 ${
                  isLight ? 'bg-white' : 'bg-[#121319]'
                }`}
              >
                <Trophy className="w-10 h-10 fill-amber-400/20 stroke-amber-500 stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}
              >
                {winningSegment.isJackpot ? '🌟 JACKPOT WINNER! 🌟' : '🎉 CASH PRIZE WON! 🎉'}
              </span>
              <h3 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Congratulations!
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Your spin landed on the lucky cash sector!
              </p>
            </div>

            {/* Prize Display Card */}
            <div
              className={`my-5 p-4 rounded-2xl border space-y-1 ${
                isLight
                  ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                  : 'bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-amber-500/40'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Prize Amount
              </span>
              <div className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                {formatNaira(modalResult.amount)}
              </div>
              <p className={`text-[11px] font-semibold flex items-center justify-center gap-1 mt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Credited to your 9jacash account</span>
              </p>
            </div>

            {/* Pending Notice if user hit tier limit */}
            {modalResult.pending > 0 && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs text-left border ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <strong>Tier Limit Reached:</strong> {formatNaira(modalResult.credited)} was credited to your main balance, and {formatNaira(modalResult.pending)} is safely stored in your Pending Earnings.
              </div>
            )}

            {/* Spins Remaining Status */}
            <div
              className={`mb-5 text-xs flex items-center justify-center gap-1.5 p-2.5 rounded-xl border ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#171822] border-stone-800 text-stone-300'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                Daily Spins Remaining: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white font-bold'}>{spinsLeft} / 2</strong>
              </span>
            </div>

            {/* Collect & Continue Button */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowWinModal(false);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-black font-black text-sm shadow-lg shadow-emerald-500/30 cursor-pointer transition-transform active:scale-98"
            >
              COLLECT REWARD &amp; CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
