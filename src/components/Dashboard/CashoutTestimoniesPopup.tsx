import React, { useState, useEffect } from 'react';
import { Banknote, KeyRound, Crown, Sparkles, CheckCircle2, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

export type TestimonyCategory = 'withdraw' | 'quickcode' | 'upgrade';

export interface CashoutTestimony {
  id: string;
  category: TestimonyCategory;
  name: string;
  headline: string;
  subline: string;
}

const FIRST_NAMES = [
  'Faith', 'Gabriel', 'Chinedu', 'Blessing', 'Emeka', 'Fatima', 'Oluwaseun', 'Ifeanyi',
  'Osas', 'Amina', 'Tunde', 'Ngozi', 'Precious', 'Chioma', 'Yakubu', 'Yetunde',
  'Uchenna', 'Damilola', 'Zainab', 'Femi', 'Victor', 'Halima', 'Kayode', 'Joy',
  'Obinna', 'Maryam', 'Segun', 'Chidinma', 'Kingsley', 'Kemi', 'Amarachi', 'Aisha',
  'Ayomide', 'Bukola', 'Stanley', 'Emmanuel', 'Adaobi', 'Usman', 'Kelvin', 'Ibrahim',
  'Grace', 'Sandra', 'Samuel', 'Deborah', 'Daniel', 'Esther',
];

const SURNAMES = [
  'Okonkwo', 'Adeleke', 'Nwosu', 'Aliyu', 'Bakare', 'Eze', 'Bello', 'Adeyemi',
  'Chukwuma', 'Ogundipe', 'Nnamani', 'Garba', 'Oladipo', 'Obi', 'Kalu', 'Mohammed',
  'Balogun', 'Ajayi', 'Okafor', 'Lawal', 'Adegoke', 'Ojo', 'Umar', 'Nwachukwu',
  'Opara', 'Okoye', 'Abubakar', 'Idowu', 'Bassey', 'Effiong',
];

const LOCATIONS = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Benin City',
  'Kaduna', 'Asaba', 'Abeokuta', 'Warri', 'Owerri', 'Uyo', 'Ilorin', 'Lekki',
];

const BANKS = [
  'Moniepoint', 'OPay', 'GTBank', 'Zenith Bank', 'Access Bank', 'Kuda', 'UBA',
  'First Bank', 'PalmPay', 'Fidelity Bank',
];

const QUICK_CODE_PLANS = [
  'a Quick Code',
  'a Pro Quick Code',
  'a Master Quick Code',
  'an Unlimited Quick Code',
];

const LAST_AMOUNTS_BY_NAME: Record<string, number> = {};
const RECENT_NAMES_QUEUE: string[] = [];
const MAX_RECENT_HISTORY = 35;

function generateRealisticAmount(excludeAmount?: number): number {
  const tiers = [
    { min: 140000, max: 290000, step: 5000 },
    { min: 300000, max: 550000, step: 10000 },
    { min: 560000, max: 850000, step: 15000 },
    { min: 900000, max: 1200000, step: 25000 },
  ];

  const tierWeights = [0.3, 0.45, 0.17, 0.08];
  const rand = Math.random();
  let selectedTier = tiers[1];
  let cum = 0;
  for (let i = 0; i < tiers.length; i++) {
    cum += tierWeights[i];
    if (rand <= cum) {
      selectedTier = tiers[i];
      break;
    }
  }

  const stepsCount = Math.floor((selectedTier.max - selectedTier.min) / selectedTier.step);
  let candidate = selectedTier.min + Math.floor(Math.random() * (stepsCount + 1)) * selectedTier.step;

  if (excludeAmount && Math.abs(candidate - excludeAmount) < 40000) {
    candidate = candidate > 600000 ? candidate - 120000 : candidate + 150000;
  }

  return candidate;
}

function generateDynamicTestimony(preferredCategory?: TestimonyCategory): CashoutTestimony {
  let firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  let surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  let fullName = `${firstName} ${surname}`;
  let attempts = 0;

  while (RECENT_NAMES_QUEUE.includes(fullName) && attempts < 20) {
    firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    fullName = `${firstName} ${surname}`;
    attempts++;
  }

  RECENT_NAMES_QUEUE.push(fullName);
  if (RECENT_NAMES_QUEUE.length > MAX_RECENT_HISTORY) {
    RECENT_NAMES_QUEUE.shift();
  }

  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

  // Weighted mix: ~45% Cashouts, ~30% Quick Code Purchases, ~25% Tier Upgrades
  let category: TestimonyCategory;
  if (preferredCategory) {
    category = preferredCategory;
  } else {
    const roll = Math.random();
    if (roll < 0.45) category = 'withdraw';
    else if (roll < 0.75) category = 'quickcode';
    else category = 'upgrade';
  }

  if (category === 'quickcode') {
    const planLabel = QUICK_CODE_PLANS[Math.floor(Math.random() * QUICK_CODE_PLANS.length)];
    return {
      id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: 'quickcode',
      name: firstName,
      headline: `${firstName} just bought ${planLabel}`,
      subline: `${location} • Instant Withdrawal Ready`,
    };
  }

  if (category === 'upgrade') {
    const targetTier = Math.random() < 0.72 ? 2 : 3;
    return {
      id: `upg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: 'upgrade',
      name: firstName,
      headline: `${firstName} just upgraded to Tier ${targetTier}`,
      subline:
        targetTier === 2
          ? `${location} • ₦2,000,000 Limit Unlocked`
          : `${location} • Zero Pending Account`,
    };
  }

  const previousAmount = LAST_AMOUNTS_BY_NAME[fullName];
  const amount = generateRealisticAmount(previousAmount);
  LAST_AMOUNTS_BY_NAME[fullName] = amount;
  const bank = BANKS[Math.floor(Math.random() * BANKS.length)];

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    category: 'withdraw',
    name: fullName,
    headline: `${fullName} just withdrew ₦${amount.toLocaleString()}`,
    subline: `${location} • ${bank} Credit`,
  };
}

interface CashoutTestimoniesPopupProps {
  isActive?: boolean;
}

const ONE_MINUTE_MS = 60 * 1000;
const VISIBLE_DURATION_MS = 4000;

export const CashoutTestimoniesPopup: React.FC<CashoutTestimoniesPopupProps> = ({
  isActive = true,
}) => {
  const { isLight } = useTheme();
  const [currentTestimony, setCurrentTestimony] = useState<CashoutTestimony>(() =>
    generateDynamicTestimony()
  );
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Shows once every 1 minute (60,000ms), visible briefly for 4 seconds
  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    let isMounted = true;
    let hideTimer: ReturnType<typeof setTimeout>;
    let intervalTimer: ReturnType<typeof setInterval>;

    const categories: TestimonyCategory[] = ['withdraw', 'quickcode', 'upgrade'];
    let stepIndex = 0;

    const triggerPopup = () => {
      if (!isMounted) return;
      const category = categories[stepIndex % categories.length];
      stepIndex++;
      setCurrentTestimony(generateDynamicTestimony(category));
      setIsVisible(true);

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!isMounted) return;
        setIsVisible(false);
      }, VISIBLE_DURATION_MS);
    };

    // Show initial testimony briefly on dashboard arrival, then strictly once every 1 minute
    const initialTimer = setTimeout(() => {
      triggerPopup();
      intervalTimer = setInterval(() => {
        triggerPopup();
      }, ONE_MINUTE_MS);
    }, 1800);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearInterval(intervalTimer);
    };
  }, [isActive]);

  if (!isActive) return null;

  const CategoryIcon =
    currentTestimony.category === 'quickcode'
      ? KeyRound
      : currentTestimony.category === 'upgrade'
      ? Crown
      : Banknote;

  const badgeLabel =
    currentTestimony.category === 'quickcode'
      ? 'QUICK CODE'
      : currentTestimony.category === 'upgrade'
      ? 'TIER UPGRADE'
      : 'LIVE CASHOUT';

  return (
    // Positioned right below the Header (top-[74px]) & compact so it never covers the user's profile avatar or name
    <div
      role="region"
      aria-label="Live Activity & Cashout Alerts"
      className="fixed top-[74px] left-0 right-0 z-30 flex justify-center px-4 pointer-events-none"
    >
      <div
        className={`w-full max-w-[320px] pointer-events-auto transition-all duration-300 ease-out transform ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border backdrop-blur-md px-3 py-2 shadow-xl ${
            isLight
              ? 'bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200/95 border-amber-400 shadow-amber-500/25 text-amber-950'
              : 'bg-gradient-to-r from-[#241a05]/95 via-[#322407]/95 to-[#1d1504]/95 border-amber-400/80 shadow-amber-950/70 text-amber-50'
          }`}
        >
          {/* Golden Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent -translate-x-full animate-[shimmer_2.4s_infinite] pointer-events-none" />

          <div className="relative flex items-center gap-2.5">
            {/* Compact Gold Emblem */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 p-[1px] shadow-md shadow-amber-500/30 shrink-0 flex items-center justify-center">
              <div
                className={`w-full h-full rounded-[11px] flex items-center justify-center ${
                  isLight ? 'bg-amber-50 text-amber-700' : 'bg-[#1a1304] text-amber-300'
                }`}
              >
                <CategoryIcon className="w-4 h-4 stroke-[2.3]" />
              </div>
            </div>

            {/* Compact Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isLight ? 'text-amber-800' : 'text-amber-300'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span>{badgeLabel}</span>
                </span>
                <span
                  className={`text-[9px] font-bold flex items-center gap-0.5 shrink-0 ${
                    isLight ? 'text-amber-700' : 'text-yellow-300'
                  }`}
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Verified</span>
                </span>
              </div>

              <p
                className={`text-[11px] font-extrabold leading-snug ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {currentTestimony.headline}
              </p>

              <p
                className={`text-[10px] font-medium flex items-center gap-1 truncate mt-0.5 ${
                  isLight ? 'text-amber-900/80' : 'text-amber-200/85'
                }`}
              >
                <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                <span className="truncate">{currentTestimony.subline}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
