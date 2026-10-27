import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface NoteConfig {
  id: number;
  left: number; // percentage 0 - 95
  size: number; // width in px
  duration: number; // seconds
  delay: number; // negative seconds for instant gentle dispersal
  opacity: number;
  swayDistance: number; // px horizontal drift
  rotateStart: number;
  rotateEnd: number;
  blur: number; // px blur for dreamy depth
  tiltY: number; // degrees 3D
}

// Authentic Central Bank of Nigeria ₦1,000 Banknote (Out of focus / soft blurred)
export const Naira1000BankNote: React.FC<{ className?: string; isLight?: boolean }> = ({
  className = '',
  isLight = false,
}) => {
  return (
    <div
      className={`relative select-none overflow-hidden rounded-[5px] transition-all duration-300 ${className}`}
      style={{
        boxShadow: isLight
          ? '0 12px 28px -4px rgba(2, 132, 199, 0.3), 0 4px 10px -2px rgba(15, 23, 42, 0.12)'
          : '0 16px 36px -6px rgba(0, 0, 0, 0.85), 0 0 20px rgba(14, 165, 233, 0.25)',
        border: isLight
          ? '1px solid rgba(186, 230, 253, 0.5)'
          : '1px solid rgba(56, 189, 248, 0.25)',
      }}
    >
      <img
        src="/assets/aistudio/c895d3ca-4712-404a-8344-81b1957583de_516d94f7.jpeg"
        alt="Central Bank of Nigeria ₦1,000 Note"
        className="w-full h-auto block object-cover select-none pointer-events-none transform-gpu"
        loading="eager"
        draggable={false}
      />
      {/* Soft atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%, rgba(14,165,233,0.2) 100%)',
        }}
      />
    </div>
  );
};

export const FloatingNairaNotes: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Only 7 sparse, slow, gently drifting notes (NOT plenty, calm and subtle)
  const notes: NoteConfig[] = useMemo(() => {
    return [
      { id: 1, left: 6, size: 120, duration: 26, delay: -4, opacity: 0.28, swayDistance: 25, rotateStart: -12, rotateEnd: 15, blur: 5, tiltY: 14 },
      { id: 2, left: 24, size: 95, duration: 32, delay: -18, opacity: 0.24, swayDistance: -20, rotateStart: 14, rotateEnd: -16, blur: 6, tiltY: -15 },
      { id: 3, left: 45, size: 140, duration: 28, delay: -9, opacity: 0.32, swayDistance: 30, rotateStart: -16, rotateEnd: 18, blur: 5.5, tiltY: 18 },
      { id: 4, left: 62, size: 110, duration: 35, delay: -24, opacity: 0.22, swayDistance: -24, rotateStart: 18, rotateEnd: -12, blur: 7, tiltY: -16 },
      { id: 5, left: 78, size: 135, duration: 29, delay: -12, opacity: 0.28, swayDistance: 28, rotateStart: -10, rotateEnd: 22, blur: 5, tiltY: 15 },
      { id: 6, left: 91, size: 100, duration: 33, delay: -6, opacity: 0.22, swayDistance: -22, rotateStart: 12, rotateEnd: -18, blur: 6.5, tiltY: -12 },
      { id: 7, left: 34, size: 150, duration: 30, delay: -27, opacity: 0.3, swayDistance: -32, rotateStart: -20, rotateEnd: 20, blur: 6, tiltY: 20 },
    ];
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      style={{ perspective: '1200px' }}
    >
      <style>{`
        @keyframes floatNairaSoft {
          0% {
            transform: translate3d(0, 115vh, 0) rotate(var(--rot-start)) rotateY(var(--tilt-y));
            opacity: 0;
          }
          10% {
            opacity: var(--target-opacity);
          }
          50% {
            transform: translate3d(var(--sway), 50vh, 40px) rotate(calc((var(--rot-start) + var(--rot-end)) / 2)) rotateY(calc(var(--tilt-y) * -0.5));
          }
          90% {
            opacity: var(--target-opacity);
          }
          100% {
            transform: translate3d(calc(var(--sway) * -0.6), -25vh, 80px) rotate(var(--rot-end)) rotateY(var(--tilt-y));
            opacity: 0;
          }
        }
      `}</style>

      {/* Atmospheric Ambient Glow Blobs behind the thick frosted blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-20 left-1/4 w-[420px] h-[420px] rounded-full blur-[90px] pointer-events-none transition-colors duration-500 ${
            isLight ? 'bg-sky-200/40' : 'bg-cyan-500/10'
          }`}
        />
        <div
          className={`absolute top-1/2 -right-20 w-[380px] h-[380px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${
            isLight ? 'bg-amber-100/50' : 'bg-emerald-500/08'
          }`}
        />
        <div
          className={`absolute -bottom-20 left-10 w-[450px] h-[450px] rounded-full blur-[110px] pointer-events-none transition-colors duration-500 ${
            isLight ? 'bg-blue-100/50' : 'bg-blue-600/10'
          }`}
        />
      </div>

      {/* The 7 gently drifting, blurry ₦1,000 banknotes */}
      {notes.map((note) => {
        const effectiveOpacity = isLight
          ? Math.min(0.42, note.opacity * 1.15)
          : Math.min(0.35, note.opacity);

        return (
          <div
            key={note.id}
            className="absolute will-change-transform"
            style={
              {
                left: `${note.left}%`,
                width: `${note.size}px`,
                filter: `blur(${note.blur}px)`,
                animation: `floatNairaSoft ${note.duration}s linear infinite`,
                animationDelay: `${note.delay}s`,
                '--target-opacity': effectiveOpacity,
                '--sway': `${note.swayDistance}px`,
                '--rot-start': `${note.rotateStart}deg`,
                '--rot-end': `${note.rotateEnd}deg`,
                '--tilt-y': `${note.tiltY}deg`,
              } as React.CSSProperties
            }
          >
            <Naira1000BankNote isLight={isLight} />
          </div>
        );
      })}

      {/* Thick Blurry Frosted Glass Backdrop Layer overlaying the notes */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
          isLight
            ? 'bg-[#f4f6fa]/60 backdrop-blur-[24px]'
            : 'bg-[#0b0c0e]/65 backdrop-blur-[24px]'
        }`}
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)',
        }}
      />
    </div>
  );
};
