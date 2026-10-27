import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface Bubble {
  id: number;
  left: number; // percentage
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  color: string;
  glow: string;
}

export const CandyAnimatedBackground: React.FC<{ hasLightning?: boolean }> = ({ hasLightning }) => {
  const { isLight } = useTheme();

  // Pre-generate 16 deterministic floating candy bubbles
  const bubbles: Bubble[] = useMemo(() => {
    const colors = [
      { bg: 'bg-rose-500/30', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.35)]' },
      { bg: 'bg-amber-400/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.35)]' },
      { bg: 'bg-emerald-400/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.35)]' },
      { bg: 'bg-sky-400/30', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.35)]' },
      { bg: 'bg-purple-500/30', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.35)]' },
      { bg: 'bg-pink-400/30', glow: 'shadow-[0_0_15px_rgba(244,114,182,0.35)]' },
    ];

    return Array.from({ length: 16 }, (_, i) => {
      const c = colors[i % colors.length];
      return {
        id: i,
        left: 4 + (i * 6) + (Math.sin(i * 1.5) * 5),
        size: 16 + (i % 5) * 8,
        duration: 9 + (i % 6) * 2.2,
        delay: -(i * 1.3),
        color: c.bg,
        glow: c.glow,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Animated nebula aurora gradient */}
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-gradient-to-br from-[#f8fafc] via-[#fdf2f8]/70 to-[#fefce8]/70 opacity-100'
            : 'bg-gradient-to-br from-[#0c0d14] via-[#14121f] to-[#090b10] opacity-95'
        }`}
      />

      {/* Pulsing light orbs in the background */}
      <div
        className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] animate-pulse duration-[6000ms] ${
          isLight ? 'bg-pink-300/25' : 'bg-pink-600/15'
        }`}
      />
      <div
        className={`absolute top-1/3 -right-24 w-96 h-96 rounded-full blur-[110px] animate-pulse duration-[8000ms] ${
          isLight ? 'bg-amber-300/20' : 'bg-amber-500/10'
        }`}
      />
      <div
        className={`absolute -bottom-24 left-1/4 w-80 h-80 rounded-full blur-[100px] animate-pulse duration-[7000ms] ${
          isLight ? 'bg-purple-300/25' : 'bg-purple-600/15'
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-[90px] animate-pulse duration-[9000ms] ${
          isLight ? 'bg-sky-300/25' : 'bg-sky-500/10'
        }`}
      />

      {/* Electric crackle glow when lightning candy is present */}
      {hasLightning && (
        <div className="absolute inset-0 bg-sky-500/5 mix-blend-screen animate-pulse duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,transparent_70%)]" />
        </div>
      )}

      {/* Floating Candy Bubbles */}
      <div className="absolute inset-0">
        {bubbles.map((b) => (
          <div
            key={b.id}
            style={{
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
            className={`absolute rounded-full border border-white/20 backdrop-blur-[1px] animate-float-bubble ${b.color} ${b.glow}`}
          >
            {/* Bubble reflection glint */}
            <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/60 rounded-full -rotate-45" />
          </div>
        ))}
      </div>

      {/* Shimmering Starlight Points */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-12 left-1/6 w-1 h-1 bg-white rounded-full animate-ping duration-[3000ms]" />
        <div className="absolute top-1/4 right-1/5 w-1.5 h-1.5 bg-amber-200 rounded-full animate-pulse duration-[2500ms]" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-cyan-200 rounded-full animate-ping duration-[4000ms]" />
        <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse duration-[3500ms]" />
      </div>
    </div>
  );
};
