import React from 'react';

export const CandyAnimatedBackground: React.FC<{ hasLightning?: boolean }> = ({ hasLightning }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Bright Storybook Blue Sky Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #2fb5f7 0%, #5fd0ff 28%, #a6e9ff 55%, #dff8ff 72%, #b5f07c 88%, #7ed957 100%)',
        }}
      />

      {/* Soft Fluffy Clouds */}
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cloudWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e8f7ff" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="hillBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8ce649" />
            <stop offset="100%" stopColor="#5cc227" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7ad938" />
            <stop offset="100%" stopColor="#46aa18" />
          </linearGradient>
          <linearGradient id="cottageRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff88c9" />
            <stop offset="100%" stopColor="#ec4098" />
          </linearGradient>
          <linearGradient id="candyPath" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffd8eb" />
            <stop offset="50%" stopColor="#ff9bd0" />
            <stop offset="100%" stopColor="#ffd8eb" />
          </linearGradient>
        </defs>

        {/* Sky Clouds */}
        <g opacity="0.9">
          <circle cx="95" cy="95" r="46" fill="url(#cloudWhite)" />
          <circle cx="145" cy="88" r="56" fill="url(#cloudWhite)" />
          <circle cx="200" cy="100" r="42" fill="url(#cloudWhite)" />
          <circle cx="48" cy="108" r="34" fill="url(#cloudWhite)" />
        </g>
        <g opacity="0.78">
          <circle cx="590" cy="115" r="40" fill="url(#cloudWhite)" />
          <circle cx="645" cy="105" r="52" fill="url(#cloudWhite)" />
          <circle cx="705" cy="115" r="42" fill="url(#cloudWhite)" />
        </g>

        {/* Distant Rolling Green Hills */}
        <path
          d="M-40 330 Q 140 245 340 310 T 840 280 L 840 520 L -40 520 Z"
          fill="url(#hillBack)"
        />

        {/* Cute Candy Cottage on the Right */}
        <g transform="translate(650, 145) scale(0.95)">
          {/* Polka-dot Mushroom Candy Roof */}
          <path
            d="M0 78 Q 68 -10 136 78 Z"
            fill="url(#cottageRoof)"
            stroke="#fff0f8"
            strokeWidth="3"
          />
          {/* White Roof Frosting Trim */}
          <path
            d="M-4 78 Q 14 90 32 78 Q 50 90 68 78 Q 86 90 104 78 Q 122 90 140 78 L 136 70 L 0 70 Z"
            fill="#ffffff"
          />
          {/* Roof Polka Dots */}
          <circle cx="38" cy="48" r="7" fill="#ffffff" opacity="0.92" />
          <circle cx="70" cy="30" r="8" fill="#ffffff" opacity="0.92" />
          <circle cx="100" cy="52" r="6.5" fill="#ffffff" opacity="0.92" />
          <circle cx="56" cy="58" r="5.5" fill="#ffffff" opacity="0.9" />
          {/* Cottage Wall */}
          <rect x="16" y="76" width="104" height="82" rx="10" fill="#fff7fa" stroke="#ffd2e8" strokeWidth="2.5" />
          {/* Arched Sky Window */}
          <path d="M52 108 A 16 16 0 0 1 84 108 L 84 126 L 52 126 Z" fill="#67c7ff" stroke="#ffffff" strokeWidth="3" />
          <line x1="68" y1="92" x2="68" y2="126" stroke="#ffffff" strokeWidth="2.5" />
          <line x1="52" y1="110" x2="84" y2="110" stroke="#ffffff" strokeWidth="2.5" />
          {/* Red Candy Door */}
          <path d="M54 158 L 54 138 A 14 14 0 0 1 82 138 L 82 158 Z" fill="#ff4d6d" stroke="#ffe1ea" strokeWidth="2.5" />
          <circle cx="75" cy="147" r="2.5" fill="#ffd84d" />
          {/* Lollipop Bushes */}
          <circle cx="-6" cy="108" r="22" fill="#92e33b" />
          <circle cx="140" cy="126" r="20" fill="#ff74be" />
        </g>

        {/* Midground Lush Green Hills */}
        <path
          d="M-30 385 Q 180 325 410 385 T 840 365 L 840 520 L -30 520 Z"
          fill="url(#hillFront)"
        />

        {/* Pastel Candy Foreground Hills & Lollipops */}
        <path
          d="M-40 445 Q 190 400 420 448 T 840 428 L 840 520 L -40 520 Z"
          fill="url(#candyPath)"
          opacity="0.95"
        />
        <ellipse cx="75" cy="455" rx="75" ry="38" fill="#ff73b8" opacity="0.9" />
        <ellipse cx="265" cy="472" rx="90" ry="34" fill="#ffe169" opacity="0.85" />
        <ellipse cx="645" cy="465" rx="95" ry="38" fill="#ff84c7" opacity="0.88" />
      </svg>

      {/* Subtle golden flash overlay when lightning color bomb activates */}
      {hasLightning && (
        <div className="absolute inset-0 bg-amber-300/10 animate-pulse duration-700" />
      )}
    </div>
  );
};
