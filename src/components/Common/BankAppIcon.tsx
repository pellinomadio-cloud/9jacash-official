import React, { useId } from 'react';
import type { BankItem } from '../../utils/bankList.ts';

interface BankAppIconProps {
  bank?: Pick<BankItem, 'code' | 'name'> | null;
  bankName?: string;
  bankCode?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<BankAppIconProps['size']>, string> = {
  xs: 'w-5 h-5 rounded-[6px]',
  sm: 'w-7 h-7 rounded-[8px]',
  md: 'w-8 h-8 rounded-[10px]',
  lg: 'w-10 h-10 rounded-[12px]',
};

const FALLBACK_PALETTES = [
  { bg: '#0F2A5F', accent: '#3B82F6', text: '#FFFFFF' },
  { bg: '#065F46', accent: '#34D399', text: '#FFFFFF' },
  { bg: '#4C1D95', accent: '#A78BFA', text: '#FFFFFF' },
  { bg: '#9F1239', accent: '#FB7185', text: '#FFFFFF' },
  { bg: '#115E59', accent: '#2DD4BF', text: '#FFFFFF' },
  { bg: '#1E3A8A', accent: '#60A5FA', text: '#FFFFFF' },
  { bg: '#7C2D12', accent: '#FB923C', text: '#FFFFFF' },
  { bg: '#312E81', accent: '#818CF8', text: '#FFFFFF' },
  { bg: '#14532D', accent: '#4ADE80', text: '#FFFFFF' },
  { bg: '#701A75', accent: '#E879F9', text: '#FFFFFF' },
  { bg: '#1E293B', accent: '#38BDF8', text: '#FFFFFF' },
  { bg: '#831843', accent: '#F472B6', text: '#FFFFFF' },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getBankMonogram(name: string): string {
  const stopWords = new Set(['microfinance', 'bank', 'plc', 'ltd', 'limited', 'mfb', 'mf', 'of', 'the', 'and', 'for', 'company', 'services', 'financial']);
  const cleaned = name
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
  const meaningful = cleaned.filter((w) => !stopWords.has(w.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : cleaned;

  if (source.length === 0) return 'BK';
  if (source.length === 1) {
    return source[0].slice(0, 2).toUpperCase();
  }
  return (source[0][0] + source[1][0]).toUpperCase();
}

function renderCustomBankSvg(code: string, name: string, uid: string): React.ReactNode | null {
  const normalizedCode = String(code || '').trim();
  const lower = String(name || '').trim().toLowerCase();

  // 1. OPay (100004)
  if (normalizedCode === '100004' || lower === 'opay') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#1DCF9F" />
        <circle cx="21" cy="20" r="10.5" fill="none" stroke="#FFFFFF" strokeWidth="4.6" />
        <path d="M9.5 14.5 A11.5 11.5 0 0 0 9.5 25.5" fill="none" stroke="#210F60" strokeWidth="4.6" strokeLinecap="round" />
      </svg>
    );
  }

  // 2. PalmPay (100033)
  if (normalizedCode === '100033' || lower === 'palmpay') {
    const gradId = `palmpay-g-${uid}`;
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${gradId})`} />
        <path
          d="M14 29V11.5h7.8c4.4 0 7.2 2.4 7.2 6.1 0 3.7-2.8 6.1-7.2 6.1H18.4V29H14zm4.4-8.8h3c1.9 0 3.1-.9 3.1-2.6 0-1.6-1.2-2.5-3.1-2.5h-3v5.1z"
          fill="#FFFFFF"
        />
        <circle cx="27.5" cy="26.5" r="2.6" fill="#C4B5FD" />
      </svg>
    );
  }

  // 3. Moniepoint (090405)
  if (normalizedCode === '090405' || lower.includes('moniepoint')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#0361F0" />
        <path
          d="M9 28V13.5l11 8.5 11-8.5V28h-4.6v-6.8L20 26.2l-6.4-5V28H9z"
          fill="#FFFFFF"
        />
        <path d="M9 13.5L20 22l4.5-3.5L13.6 10.5 9 13.5z" fill="#93C5FD" opacity="0.85" />
      </svg>
    );
  }

  // 4. Kuda (090267)
  if (normalizedCode === '090267' || lower === 'kuda' || lower.includes('kuda')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#40196D" />
        <path
          d="M12.5 10.5h4.4v8.2l7.2-8.2h5.3l-7.5 8.5 8 10.5h-5.4l-5.9-7.9-1.7 1.9v6h-4.4V10.5z"
          fill="#FFFFFF"
        />
        <circle cx="30.5" cy="27.5" r="2.2" fill="#48D38A" />
      </svg>
    );
  }

  // 5. Access Bank (044)
  if (normalizedCode === '044' || lower.includes('access bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#FFFFFF" />
        <rect x="0" y="34.5" width="40" height="5.5" fill="#003883" />
        <polygon points="20,6.5 31.5,18 20,29.5 8.5,18" fill="none" stroke="#F26522" strokeWidth="2.8" />
        <polygon points="20,10.8 27.2,18 20,25.2 12.8,18" fill="none" stroke="#F26522" strokeWidth="2.4" />
        <polygon points="20,14.8 23.2,18 20,21.2 16.8,18" fill="#78BE20" />
      </svg>
    );
  }

  // 6. Guaranty Trust Bank / GTBank (058)
  if (normalizedCode === '058' || lower.includes('guaranty trust') || lower.includes('gtbank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#DD4F05" />
        <rect x="26" y="7" width="7.5" height="7.5" rx="1" fill="#FFFFFF" />
        <text
          x="7"
          y="30"
          fill="#FFFFFF"
          fontSize="13.5"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          GT
        </text>
      </svg>
    );
  }

  // 7. Zenith Bank (057)
  if (normalizedCode === '057' || lower.includes('zenith')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#FFFFFF" />
        <path d="M8 10h24l-4 5.2H18.5L29 24.8 25 30H8l4-5.2h9.5L11 15.2 8 10z" fill="#E30613" />
        <polygon points="26,10 32,10 28,15.2 22,15.2" fill="#808285" />
        <polygon points="8,30 14,30 18,24.8 12,24.8" fill="#808285" />
      </svg>
    );
  }

  // 8. United Bank for Africa / UBA (033)
  if (normalizedCode === '033' || lower.includes('united bank for africa') || lower === 'uba') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#D60812" />
        <path d="M23 7.5c3.5 0 7 1.3 9.8 3.7-3.4-.3-6.5.5-9.8 2.2 1.2-2.2 1.2-3.9 0-5.9z" fill="#FFFFFF" opacity="0.9" />
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          letterSpacing="0.4"
        >
          UBA
        </text>
      </svg>
    );
  }

  // 9. First Bank PLC (011)
  if (normalizedCode === '011' || lower.includes('first bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#002D62" />
        <rect x="0" y="33.5" width="40" height="6.5" fill="#FDB913" />
        <path
          d="M11 26.5v-8.8c0-4.4 3.6-7.7 8.4-7.7h2.5c3.8 0 6.8 2.6 6.8 6.4 0 2.3-1 4.1-2.5 5.1v5h-3.6v-4.2h-4.8v4.2h-3.6v-4.2H11zm15.5-7.2c1.4-.3 2.5-1.3 2.5-2.8 0-1.6-1.1-2.8-2.7-2.8"
          fill="#FFFFFF"
        />
        <path d="M26.5 18.8c2.2 0 3.7 1.4 3.7 3.6 0 1.4-.6 2.4-1.7 3" fill="none" stroke="#FDB913" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  // 10. Fidelity Bank (070)
  if (normalizedCode === '070' || lower.includes('fidelity')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#FFFFFF" />
        <path d="M8 29C11 16 19 9 32 9c-4 6-10 11-16 20H8z" fill="#0B1E59" />
        <path d="M16 31c4-8 10-14 17-16-2 9-8 16-17 16z" fill="#7AC143" />
      </svg>
    );
  }

  // 11. EcoBank PLC (050)
  if (normalizedCode === '050' || lower.includes('ecobank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#005B82" />
        <path d="M7 13.5l14-4.5 12 4.5-12 4.2-14-4.2z" fill="#8DC63F" />
        <path d="M7 20.5l14-4.2 12 4.2-12 4.2-14-4.2z" fill="#00A4E4" />
        <path d="M7 27.5l14-4.2 12 4.2-12 4.2-14-4.2z" fill="#FFFFFF" opacity="0.92" />
      </svg>
    );
  }

  // 12. Wema Bank PLC / ALAT (035)
  if (normalizedCode === '035' || lower.includes('wema')) {
    const gradId = `wema-g-${uid}`;
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B81D76" />
            <stop offset="100%" stopColor="#7C114E" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${gradId})`} />
        <path d="M7.5 13h4.3l3.1 11.2L18.2 13h3.6l3.3 11.2L28.2 13h4.3l-5.2 16h-4l-3.3-10.4L16.7 29h-4l-5.2-16z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 13. Union Bank PLC (032)
  if (normalizedCode === '032' || lower.includes('union bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#009FE3" />
        <path
          d="M12.5 11.5h4.5v10.2c0 2.5 1.3 3.8 3.2 3.8s3.2-1.3 3.2-3.8V11.5h4.5v10.4c0 5-3.2 8-7.7 8s-7.7-3-7.7-8V11.5z"
          fill="#FFFFFF"
        />
        <rect x="11" y="7.5" width="18" height="2" rx="1" fill="#BAE6FD" />
      </svg>
    );
  }

  // 14. Polaris Bank (076)
  if (normalizedCode === '076' || lower.includes('polaris')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#4F1D7F" />
        <path d="M20 6.5L23 17l10.5 3L23 23l-3 10.5L17 23 6.5 20 17 17 20 6.5z" fill="#F5A623" />
        <circle cx="20" cy="20" r="2.6" fill="#FFFFFF" />
      </svg>
    );
  }

  // 15. Keystone Bank (082)
  if (normalizedCode === '082' || lower.includes('keystone')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#0A2463" />
        <polygon points="10,9 30,9 26.5,31 13.5,31" fill="#0EA5E9" />
        <circle cx="20" cy="17.5" r="3.4" fill="#FFFFFF" />
        <path d="M18.2 19.5h3.6l1 6.5h-5.6l1-6.5z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 16. Globus Bank (000027)
  if (normalizedCode === '000027' || lower.includes('globus')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#C8102E" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
        <ellipse cx="20" cy="20" rx="5.2" ry="11" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="9" y1="20" x2="31" y2="20" stroke="#FFFFFF" strokeWidth="2" />
      </svg>
    );
  }

  // 17. Lotus Bank (000029)
  if (normalizedCode === '000029' || lower.includes('lotus')) {
    const gradId = `lotus-g-${uid}`;
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0046AD" />
            <stop offset="100%" stopColor="#00A3E0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${gradId})`} />
        <path d="M20 9c3.5 4.8 4.4 9.6 0 16.5-4.4-6.9-3.5-11.7 0-16.5z" fill="#FFFFFF" />
        <path d="M11 16.5c4.8 1.2 8.2 4.5 9 10-5.4-1.2-8.4-4.5-9-10z" fill="#BAE6FD" />
        <path d="M29 16.5c-4.8 1.2-8.2 4.5-9 10 5.4-1.2 8.4-4.5 9-10z" fill="#BAE6FD" />
        <path d="M11.5 29h17" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 18. Nomba / Nombank (120004, 090514)
  if (normalizedCode === '120004' || normalizedCode === '090514' || lower.includes('nomba')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#111318" />
        <path d="M11 29V11h4.6l8.8 11.2V11H29v18h-4.4l-9-11.4V29H11z" fill="#FFCC00" />
      </svg>
    );
  }

  // 19. Paga (100002, 327)
  if (normalizedCode === '100002' || normalizedCode === '327' || lower === 'paga') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#F15A24" />
        <circle cx="21" cy="18.5" r="7.5" fill="none" stroke="#FFFFFF" strokeWidth="4.2" />
        <path d="M13.5 18.5V31" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 20. PremiumTrust Bank (000031)
  if (normalizedCode === '000031' || lower.includes('premiumtrust')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#6E0D25" />
        <path d="M20 7.5L31 12v8.5c0 5.5-4.3 9.7-11 12-6.7-2.3-11-6.5-11-12V12l11-4.5z" fill="none" stroke="#E5B84B" strokeWidth="2.4" />
        <text
          x="20"
          y="24.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="13.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          P
        </text>
      </svg>
    );
  }

  // 21. Titan Trust Bank (000025)
  if (normalizedCode === '000025' || lower.includes('titan trust')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#0F172A" />
        <rect x="9.5" y="10" width="21" height="4.8" rx="1.2" fill="#22D3EE" />
        <rect x="17.4" y="15.5" width="5.2" height="14.5" rx="1.2" fill="#FFFFFF" />
      </svg>
    );
  }

  // 22. Standard Chartered (068)
  if (normalizedCode === '068' || lower.includes('standard chat') || lower.includes('standard chart')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#FFFFFF" />
        <path d="M24.5 9c-4.5 1.5-8.5 5-8.5 9.5 0 2.7 1.8 4.4 5 5.4l4-3.2c-2-.9-3.2-1.8-3.2-3 0-2.4 2.4-4.7 5.5-6L24.5 9z" fill="#0072AA" />
        <path d="M15.5 31c4.5-1.5 8.5-5 8.5-9.5 0-2.7-1.8-4.4-5-5.4l-4 3.2c2 .9 3.2 1.8 3.2 3 0 2.4-2.4 4.7-5.5 6L15.5 31z" fill="#00A859" />
      </svg>
    );
  }

  // 23. Citi Bank (023)
  if (normalizedCode === '023' || lower.includes('citi')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#003B70" />
        <path d="M13 15.5c3.5-4.5 10.5-4.5 14 0" fill="none" stroke="#EE1C25" strokeWidth="3.2" strokeLinecap="round" />
        <text
          x="20"
          y="27.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          citi
        </text>
      </svg>
    );
  }

  // 24. VFD / VBank (090110)
  if (normalizedCode === '090110' || lower.includes('vfd')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#16A34A" />
        <path d="M10 11h5.2L20 24.6 24.8 11H30l-7.6 19h-4.8L10 11z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 25. Sparkle (090325)
  if (normalizedCode === '090325' || lower === 'sparkle') {
    const gradId = `sparkle-g-${uid}`;
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${gradId})`} />
        <path d="M20 7l2.8 9.2L32 19l-9.2 2.8L20 31l-2.8-9.2L8 19l9.2-2.8L20 7z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 26. Rubies (090175)
  if (normalizedCode === '090175' || lower.includes('rubies')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#BE123C" />
        <polygon points="14,11 26,11 31,17.5 20,30.5 9,17.5" fill="#FFFFFF" />
        <polygon points="14,11 26,11 20,17.5" fill="#FDA4AF" />
      </svg>
    );
  }

  // 27. Eyowo (090328)
  if (normalizedCode === '090328' || lower.includes('eyowo')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#F59E0B" />
        <circle cx="20" cy="20" r="9.5" fill="none" stroke="#111827" strokeWidth="4.2" />
        <line x1="12" y1="20" x2="28" y2="20" stroke="#111827" strokeWidth="3.6" />
      </svg>
    );
  }

  // 28. Mint-Finex / Mintyn (090281)
  if (normalizedCode === '090281' || lower.includes('mint-finex') || lower.includes('mintyn')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#047857" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="#D1FAE5" strokeWidth="2" />
        <path d="M13 26V14h3.5l3.5 5.6L23.5 14H27v12h-3.3v-6.3L20 25l-3.7-5.3V26H13z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 29. FCMB MFB (090409)
  if (normalizedCode === '090409' || lower.includes('fcmb')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#5C2483" />
        <rect x="8" y="10" width="24" height="3.2" rx="1.6" fill="#F59E0B" />
        <rect x="8" y="26.8" width="24" height="3.2" rx="1.6" fill="#F59E0B" />
        <text
          x="20"
          y="23.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          FCMB
        </text>
      </svg>
    );
  }

  // 30. eNaira (000033) & Central Bank of Nigeria (000028)
  if (normalizedCode === '000033' || lower === 'enaira') {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#008751" />
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="20"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          ₦
        </text>
      </svg>
    );
  }

  if (normalizedCode === '000028' || lower.includes('central bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#006B3F" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="#EAB308" strokeWidth="2.2" />
        <text
          x="20"
          y="24"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          CBN
        </text>
      </svg>
    );
  }

  // 31. Parallex Bank (000030, 090004)
  if (normalizedCode === '000030' || normalizedCode === '090004' || lower.includes('parallex') || lower.includes('parralex')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#1D4ED8" />
        <path d="M12 28L18.5 12h4.2L16.2 28H12z" fill="#FFFFFF" />
        <path d="M19.5 28L26 12h4.2L23.7 28h-4.2z" fill="#FBBF24" />
      </svg>
    );
  }

  // 32. Optimus Bank (000036)
  if (normalizedCode === '000036' || lower.includes('optimus')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#0F766E" />
        <circle cx="20" cy="20" r="9.5" fill="none" stroke="#A3E635" strokeWidth="4.2" />
        <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
      </svg>
    );
  }

  // 33. Signature Bank (000034)
  if (normalizedCode === '000034' || lower.includes('signature bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#111827" />
        <path
          d="M26 14.5c0-2-2.4-3.5-6-3.5-3.4 0-5.8 1.5-5.8 3.8 0 2.5 2.5 3.4 6 4.2 3.8.8 6.4 2 6.4 5 0 3-2.9 5-6.8 5-4 0-6.8-1.7-7-4.5"
          fill="none"
          stroke="#E5B84B"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 34. Alternative Bank (000037)
  if (normalizedCode === '000037' || lower.includes('alternative bank')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#DC2626" />
        <path d="M20 9.5L30 29.5h-4.6l-5.4-11.2-5.4 11.2H10L20 9.5z" fill="#FFFFFF" />
        <circle cx="20" cy="25.5" r="2.5" fill="#FDE047" />
      </svg>
    );
  }

  // 35. Tajwallet (080002)
  if (normalizedCode === '080002' || lower.includes('taj')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#B91C1C" />
        <polygon points="20,8 31,20 20,32 9,20" fill="none" stroke="#FCD34D" strokeWidth="2.4" />
        <text
          x="20"
          y="23.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          TAJ
        </text>
      </svg>
    );
  }

  // 36. Branch (050006)
  if (normalizedCode === '050006' || lower.includes('branch')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#0EA5E9" />
        <path d="M13 28c0-9 6-15 15-16-1 9-7 15-15 16z" fill="#FFFFFF" />
        <path d="M13 28l9-9" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 37. Tangerine Bank (090426)
  if (normalizedCode === '090426' || lower.includes('tangerine')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#F97316" />
        <circle cx="20" cy="21" r="9.5" fill="#FFFFFF" />
        <path d="M20 11.5c1-2.5 3.5-4 6-3.5-1 2.4-3.3 3.8-6 3.5z" fill="#4ADE80" />
        <circle cx="20" cy="21" r="5" fill="#F97316" />
      </svg>
    );
  }

  // 38. RenMoney (090198)
  if (normalizedCode === '090198' || lower.includes('renmoney')) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill="#15803D" />
        <path d="M12 27l6.5-6.5 4.2 4.2L29 15" fill="none" stroke="#A3E635" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23.5 14.5H29.5V20.5" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return null;
}

export const BankAppIcon: React.FC<BankAppIconProps> = ({
  bank,
  bankName,
  bankCode,
  size = 'md',
  className = '',
}) => {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const code = String(bank?.code ?? bankCode ?? '');
  const name = String(bank?.name ?? bankName ?? 'Bank');
  const customSvg = renderCustomBankSvg(code, name, uid);

  if (customSvg) {
    return (
      <span
        className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/15 select-none ${SIZE_MAP[size]} ${className}`}
        title={name}
      >
        {customSvg}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/10"
        />
      </span>
    );
  }

  // Deterministic branded app icon for every microfinance, mortgage, or finance bank
  const palette = FALLBACK_PALETTES[hashString(`${code}_${name}`) % FALLBACK_PALETTES.length];
  const monogram = getBankMonogram(name);
  const lower = name.toLowerCase();
  const isMortgage = lower.includes('mortgage') || lower.includes('savings');

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/15 select-none ${SIZE_MAP[size]} ${className}`}
      title={name}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect width="40" height="40" fill={palette.bg} />
        {isMortgage ? (
          <path d="M6 12L20 5l14 7v2H6v-2z" fill={palette.accent} opacity="0.35" />
        ) : (
          <circle cx="34" cy="7" r="9" fill={palette.accent} opacity="0.28" />
        )}
        <rect x="0" y="35.5" width="40" height="4.5" fill={palette.accent} opacity="0.85" />
        <text
          x="20"
          y="24.5"
          textAnchor="middle"
          fill={palette.text}
          fontSize="13.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          letterSpacing="0.3"
        >
          {monogram}
        </text>
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/10"
      />
    </span>
  );
};
