import React, { useState } from 'react';
import bundledBrandIcon from '../../assets/9jacash-icon.png';

interface BrandIconProps {
  className?: string;
  alt?: string;
}

const FALLBACK_SOURCES = [
  bundledBrandIcon,
  '/pwa-192x192.png',
  '/icon-192.png',
  '/icon.svg',
];

export const BrandIcon: React.FC<BrandIconProps> = ({
  className = 'w-full h-full object-cover',
  alt = '9jacash',
}) => {
  const [srcIndex, setSrcIndex] = useState(0);

  if (srcIndex >= FALLBACK_SOURCES.length) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#090d16] flex flex-col items-center justify-center select-none"
      >
        <span className="text-lg font-black tracking-tight text-amber-400 leading-none">
          9ja
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/90 leading-none mt-0.5">
          cash
        </span>
      </div>
    );
  }

  return (
    <img
      src={FALLBACK_SOURCES[srcIndex]}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => setSrcIndex((idx) => idx + 1)}
      className={className}
    />
  );
};
