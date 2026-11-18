import React, { useId } from 'react';

export type CandyPieceType = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'lightning';

interface CandyPieceSvgProps {
  type: CandyPieceType;
  special?: 'striped_h' | 'striped_v' | 'lightning';
  compact?: boolean;
}

export const CandyPieceSvg: React.FC<CandyPieceSvgProps> = React.memo(({ type, special, compact = false }) => {
  const uid = useId().replace(/:/g, '');

  const stripeOverlay =
    special === 'striped_h' ? (
      <g>
        <rect x="16" y="33" width="68" height="6.5" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
        <rect x="13" y="47" width="74" height="6.5" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
        <rect x="16" y="61" width="68" height="6.5" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
      </g>
    ) : special === 'striped_v' ? (
      <g>
        <rect x="33" y="16" width="6.5" height="68" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
        <rect x="47" y="13" width="6.5" height="74" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
        <rect x="61" y="16" width="6.5" height="68" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
      </g>
    ) : null;

  const baseClass = compact
    ? 'w-full h-full block select-none pointer-events-none'
    : 'w-full h-full block select-none pointer-events-none';

  switch (type) {
    case 'lightning':
      return (
        <svg viewBox="0 0 100 100" className={`${baseClass} animate-lightning-pulse`} shapeRendering="geometricPrecision">
          <defs>
            <radialGradient id={`g_bomb_${uid}`} cx="36%" cy="30%" r="68%">
              <stop offset="0%" stopColor="#8f5438" />
              <stop offset="48%" stopColor="#522614" />
              <stop offset="100%" stopColor="#260e05" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="86" rx="30" ry="6" fill="#091a36" fillOpacity="0.28" />
          <circle cx="50" cy="50" r="37" fill={`url(#g_bomb_${uid})`} stroke="#240d04" strokeWidth="2.2" />
          <circle cx="33" cy="35" r="5" fill="#ff243b" />
          <circle cx="66" cy="34" r="5" fill="#1fe03d" />
          <circle cx="31" cy="60" r="5" fill="#ffd900" />
          <circle cx="67" cy="62" r="5" fill="#1fa2ff" />
          <circle cx="50" cy="74" r="4.5" fill="#ff8400" />
          <circle cx="50" cy="25" r="4.5" fill="#d946ef" />
          <polygon
            points="53,21 36,50 49,50 43,79 66,46 52,46 60,21"
            fill="#ffe135"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="37" cy="28" rx="8" ry="3.8" fill="#ffffff" fillOpacity="0.65" transform="rotate(-24 37 28)" />
        </svg>
      );

    case 'red':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <linearGradient id={`g_red_${uid}`} x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor="#ff4757" />
              <stop offset="45%" stopColor="#eb001b" />
              <stop offset="100%" stopColor="#a30012" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="85" rx="28" ry="6" fill="#091a36" fillOpacity="0.25" />
          <g transform="rotate(-38 50 50)">
            <path
              d="M19 46 C19 25, 40 19, 57 25 C73 31, 83 40, 83 54 C83 70, 68 77, 54 71 C41 65, 34 67, 25 63 C17 59, 19 52, 19 46 Z"
              fill={`url(#g_red_${uid})`}
              stroke="#78000d"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M23 56 C33 63, 44 61, 56 67 C68 72, 77 66, 79 56 C76 65, 67 69, 55 64 C43 59, 32 61, 23 56 Z"
              fill="#6e000b"
              fillOpacity="0.55"
            />
            <path
              d="M28 38 C36 29, 52 28, 66 35 C56 35, 42 35, 31 44 Z"
              fill="#ffffff"
              fillOpacity="0.72"
            />
            <ellipse cx="38" cy="35" rx="9.5" ry="3.8" fill="#ffffff" fillOpacity="0.92" transform="rotate(-12 38 35)" />
            <circle cx="67" cy="39" r="2.6" fill="#ffffff" fillOpacity="0.85" />
          </g>
          {stripeOverlay}
        </svg>
      );

    case 'blue':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <radialGradient id={`g_blue_${uid}`} cx="34%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#7ad9ff" />
              <stop offset="30%" stopColor="#1ca3ff" />
              <stop offset="72%" stopColor="#0066e6" />
              <stop offset="100%" stopColor="#00389e" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="87" rx="28" ry="6" fill="#091a36" fillOpacity="0.25" />
          <circle
            cx="50"
            cy="50"
            r="36.5"
            fill={`url(#g_blue_${uid})`}
            stroke="#002b7a"
            strokeWidth="2.2"
          />
          <path
            d="M14.5 52.5 Q 50 61.5 85.5 52.5"
            fill="none"
            stroke="#00328f"
            strokeWidth="4.2"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
          <path
            d="M15.5 48.5 Q 50 57.5 84.5 48.5"
            fill="none"
            stroke="#8be2ff"
            strokeWidth="2.2"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
          <ellipse cx="38" cy="31" rx="13" ry="6.2" fill="#ffffff" fillOpacity="0.82" transform="rotate(-24 38 31)" />
          <ellipse cx="32" cy="28" rx="5" ry="2.4" fill="#ffffff" fillOpacity="0.96" transform="rotate(-24 32 28)" />
          <circle cx="58" cy="26" r="2.8" fill="#ffffff" fillOpacity="0.78" />
          <path d="M32 77 Q 50 83 68 77" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.65" />
          {stripeOverlay}
        </svg>
      );

    case 'orange':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <linearGradient id={`g_orange_${uid}`} x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#ffc845" />
              <stop offset="42%" stopColor="#ff7b00" />
              <stop offset="100%" stopColor="#cc4600" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="22" ry="5.5" fill="#091a36" fillOpacity="0.25" />
          <ellipse
            cx="50"
            cy="50"
            rx="27.5"
            ry="37.5"
            fill={`url(#g_orange_${uid})`}
            stroke="#8a2e00"
            strokeWidth="2.2"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="16"
            ry="25"
            fill="none"
            stroke="#9a3400"
            strokeWidth="3.2"
            strokeOpacity="0.52"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="14.5"
            ry="23.5"
            fill="none"
            stroke="#ffdf9e"
            strokeWidth="1.6"
            strokeOpacity="0.78"
          />
          <ellipse cx="37" cy="29" rx="5.5" ry="11.5" fill="#ffffff" fillOpacity="0.82" transform="rotate(14 37 29)" />
          <circle cx="62" cy="29" r="2.5" fill="#ffffff" fillOpacity="0.82" />
          {stripeOverlay}
        </svg>
      );

    case 'green':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <linearGradient id={`g_green_${uid}`} x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#6bff75" />
              <stop offset="40%" stopColor="#14cc2c" />
              <stop offset="100%" stopColor="#048013" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="88" rx="29" ry="5.5" fill="#091a36" fillOpacity="0.25" />
          <rect
            x="14"
            y="14"
            width="72"
            height="72"
            rx="16"
            fill={`url(#g_green_${uid})`}
            stroke="#02520b"
            strokeWidth="2.2"
          />
          <rect
            x="21.5"
            y="21.5"
            width="57"
            height="57"
            rx="11.5"
            fill="none"
            stroke="#b8ffc2"
            strokeWidth="1.8"
            strokeOpacity="0.55"
          />
          <path d="M24 24 Q 50 18 76 24 L 72 32 Q 50 27 28 32 Z" fill="#ffffff" fillOpacity="0.58" />
          <circle cx="29" cy="27" r="3.4" fill="#ffffff" fillOpacity="0.92" />
          <path d="M23 76 Q 50 82 77 76" stroke="#024a0a" strokeWidth="3.2" strokeLinecap="round" fill="none" strokeOpacity="0.55" />
          {stripeOverlay}
        </svg>
      );

    case 'yellow':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <linearGradient id={`g_yellow_${uid}`} x1="20%" y1="12%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#ffff82" />
              <stop offset="44%" stopColor="#ffd500" />
              <stop offset="100%" stopColor="#de9000" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="89" rx="26" ry="5.5" fill="#091a36" fillOpacity="0.25" />
          <path
            d="M50 12 C67 30, 82 47, 82 64 A 32 28 0 0 1 18 64 C18 47, 33 30, 50 12 Z"
            fill={`url(#g_yellow_${uid})`}
            stroke="#9c5e00"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M50 23 C62 37, 72 50, 72 62 A 22 19 0 0 1 28 62 C28 50, 38 37, 50 23 Z"
            fill="none"
            stroke="#b56f00"
            strokeWidth="2.2"
            strokeOpacity="0.4"
          />
          <path
            d="M47 22 C37 35, 29 49, 30 61 C33 50, 40 37, 49 26 Z"
            fill="#ffffff"
            fillOpacity="0.88"
          />
          <ellipse cx="38" cy="48" rx="4.2" ry="8.5" fill="#ffffff" fillOpacity="0.86" transform="rotate(24 38 48)" />
          <path d="M35 80 Q 50 86 65 80" stroke="#fff8a6" strokeWidth="2.2" strokeLinecap="round" fill="none" strokeOpacity="0.78" />
          {stripeOverlay}
        </svg>
      );

    case 'purple':
      return (
        <svg viewBox="0 0 100 100" className={baseClass} shapeRendering="geometricPrecision">
          <defs>
            <linearGradient id={`g_purple_${uid}`} x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#f0abff" />
              <stop offset="45%" stopColor="#ab36ff" />
              <stop offset="100%" stopColor="#6009a8" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="87" rx="26" ry="5.5" fill="#091a36" fillOpacity="0.25" />
          <path
            d="M50 13 L82 42 L68 83 L32 83 L18 42 Z"
            fill={`url(#g_purple_${uid})`}
            stroke="#420575"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon points="50,24 70,44 61,72 39,72 30,44" fill="none" stroke="#f5d0fe" strokeWidth="1.6" strokeOpacity="0.55" />
          <ellipse cx="40" cy="36" rx="9" ry="4.2" fill="#ffffff" fillOpacity="0.85" transform="rotate(-25 40 36)" />
          {stripeOverlay}
        </svg>
      );
  }
});
CandyPieceSvg.displayName = 'CandyPieceSvg';
