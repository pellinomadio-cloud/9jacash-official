import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, MapPin, ArrowUpRight, Banknote } from 'lucide-react';

export interface CashoutTestimony {
  id: string;
  name: string;
  amount: number;
  location: string;
  bank: string;
}

// Authentic Nigerian First Names (Balanced across Yoruba, Igbo, Hausa/Fulani, Edo, Delta, North-Central)
const FIRST_NAMES = [
  'Chinedu', 'Blessing', 'Emeka', 'Fatima', 'Oluwaseun', 'Ifeanyi', 'Osas', 'Amina',
  'Tunde', 'Ngozi', 'Kehinde', 'Precious', 'Babajide', 'Chioma', 'Yakubu', 'Eseoghene',
  'Yetunde', 'Uchenna', 'Damilola', 'Anayo', 'Zainab', 'Femi', 'Folashade', 'Ebele',
  'Victor', 'Halima', 'Kayode', 'Joy', 'Obinna', 'Maryam', 'Segun', 'Chidinma',
  'Kingsley', 'Kemi', 'Faruk', 'Amarachi', 'Tochukwu', 'Omolara', 'Nonso', 'Aisha',
  'Ayomide', 'Bukola', 'Stanley', 'Ronke', 'Emmanuel', 'Adaobi', 'Usman', 'Faith',
  'Kelvin', 'Titilayo', 'Ibrahim', 'Nkechi', 'Chuka', 'Grace', 'Sadiq', 'Sandra',
];

// Authentic Nigerian Surnames
const SURNAMES = [
  'Okonkwo', 'Adeleke', 'Nwosu', 'Aliyu', 'Bakare', 'Eze', 'Igbinedion', 'Bello',
  'Adeyemi', 'Chukwuma', 'Ogundipe', 'Jumbo', 'Martins', 'Nnamani', 'Garba', 'Akpore',
  'Oladipo', 'Obi', 'Fashola', 'Kalu', 'Mohammed', 'Balogun', 'Ajayi', 'Nkemdilim',
  'Okafor', 'Danjuma', 'Bamidele', 'Soludo', 'Lawal', 'Braimoh', 'Adegoke', 'Ojo',
  'Umar', 'Nwachukwu', 'Yahaya', 'Momoh', 'Olatunji', 'Agbo', 'Opara', 'Sanusi',
  'Briggs', 'Okoye', 'Abubakar', 'Idowu', 'Onwuka', 'Daramola', 'Bassey', 'Effiong',
];

// Major Nigerian cities and commercial centers
const LOCATIONS = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Benin City', 'Kaduna',
  'Asaba', 'Abeokuta', 'Warri', 'Owerri', 'Onitsha', 'Aba', 'Jos', 'Akure', 'Ilorin',
  'Calabar', 'Uyo', 'Lekki, Lagos', 'Ikeja, Lagos', 'Wuse, Abuja', 'Surulere, Lagos',
];

// Major Nigerian Commercial Banks & Licensed Fintechs
const BANKS = [
  'Moniepoint', 'Zenith Bank', 'Access Bank', 'GTBank', 'First Bank', 'OPay',
  'Kuda Bank', 'UBA', 'Fidelity Bank', 'Stanbic IBTC', 'PalmPay', 'Union Bank',
  'Sterling Bank', 'FCMB', 'Wema Bank',
];

// In-memory / session tracking to prevent repeating recent names and to guarantee different amounts per name
const LAST_AMOUNTS_BY_NAME: Record<string, number> = {};
const RECENT_NAMES_QUEUE: string[] = [];
const MAX_RECENT_HISTORY = 40;

// Generate realistic cashout amounts ending in clean figures (e.g., ₦185,000, ₦370,000, ₦620,000, ₦850,000)
function generateRealisticAmount(excludeAmount?: number): number {
  // Common realistic Nigerian withdrawal bands: ₦140,000 to ₦1,250,000
  const tiers = [
    { min: 140000, max: 290000, step: 5000 },
    { min: 300000, max: 550000, step: 10000 },
    { min: 560000, max: 880000, step: 15000 },
    { min: 900000, max: 1250000, step: 25000 },
  ];

  // Pick a weighted tier (more medium withdrawals)
  const tierWeights = [0.25, 0.45, 0.2, 0.1];
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

  // Ensure it's distinctly different from previous amount for this user
  if (excludeAmount && Math.abs(candidate - excludeAmount) < 40000) {
    candidate = candidate > 600000 ? candidate - 120000 : candidate + 160000;
  }

  return candidate;
}

// Generate a brand new, unique testimony that hasn't appeared recently
function generateDynamicTestimony(): CashoutTestimony {
  // Pick a name not in recent queue
  let firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  let surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  let fullName = `${firstName} ${surname}`;
  let attempts = 0;

  while (RECENT_NAMES_QUEUE.includes(fullName) && attempts < 25) {
    firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    fullName = `${firstName} ${surname}`;
    attempts++;
  }

  // Track recent names
  RECENT_NAMES_QUEUE.push(fullName);
  if (RECENT_NAMES_QUEUE.length > MAX_RECENT_HISTORY) {
    RECENT_NAMES_QUEUE.shift();
  }

  // Ensure withdrawal amount is different each time a name appears
  const previousAmount = LAST_AMOUNTS_BY_NAME[fullName];
  const amount = generateRealisticAmount(previousAmount);
  LAST_AMOUNTS_BY_NAME[fullName] = amount;

  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const bank = BANKS[Math.floor(Math.random() * BANKS.length)];

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fullName,
    amount,
    location,
    bank,
  };
}

interface CashoutTestimoniesPopupProps {
  isActive?: boolean;
}

export const CashoutTestimoniesPopup: React.FC<CashoutTestimoniesPopupProps> = ({
  isActive = true,
}) => {
  // Dynamically generate a fresh, unique testimony on every dashboard refresh/mount
  const [currentTestimony, setCurrentTestimony] = useState<CashoutTestimony>(() =>
    generateDynamicTestimony()
  );
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Timing Cycle:
  // Show for 3 seconds, remove/hide, wait 10 seconds, then show a fresh dynamic testimony.
  // Never discloses seconds or countdowns to the user.
  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    let isMounted = true;
    let hideTimer: NodeJS.Timeout;
    let nextTimer: NodeJS.Timeout;

    const runCycle = () => {
      if (!isMounted) return;

      // Generate fresh non-repeating name & guaranteed different amount
      const freshTestimony = generateDynamicTestimony();
      setCurrentTestimony(freshTestimony);
      setIsVisible(true);

      // Remove after 3 seconds
      hideTimer = setTimeout(() => {
        if (!isMounted) return;
        setIsVisible(false);

        // A new one should show after 10 seconds
        nextTimer = setTimeout(() => {
          if (!isMounted) return;
          runCycle();
        }, 10000); // 10 seconds hidden interval
      }, 3000); // 3 seconds visible duration
    };

    // Initial show after 1.2s on dashboard mount/refresh
    const initialTimer = setTimeout(() => {
      runCycle();
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    // Overlapping fixed overlay: sits at top without pushing or bringing down the dashboard layout
    <div
      role="region"
      aria-label="Live Cashout Alerts"
      className="fixed top-2.5 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none"
    >
      <div
        className={`w-full max-w-md pointer-events-auto transition-all duration-300 ease-out transform ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100 drop-shadow-2xl'
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#06180e]/95 via-[#0b2818]/95 to-[#06180e]/95 border border-emerald-500/70 shadow-2xl shadow-emerald-950/90 backdrop-blur-md p-3 sm:p-3.5">
          {/* Subtle Cash Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none" />

          {/* Top Info Bar */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                CONGRATULATIONS • LIVE CASHOUT
              </span>
            </div>

            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
              Disbursed
            </span>
          </div>

          {/* Main Cashout Statement */}
          <div className="flex items-center gap-3">
            {/* Real Nigerian Naira Cash Icon Box */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 p-[1px] shadow-lg shadow-emerald-600/30 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#081f13] rounded-[15px] flex flex-col items-center justify-center text-emerald-400">
                <Banknote className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
                <span className="text-[8px] font-black text-emerald-300 leading-none">₦ CASH</span>
              </div>
            </div>

            {/* Cashout Text: Congratulations to (Nigeria Name)! Just withdrew (Amount) naira from (Location) */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-stone-200 leading-snug">
                <span className="text-emerald-300 font-semibold">Congratulations to </span>
                <span className="font-extrabold text-white">{currentTestimony.name}</span>!{' '}
                <span className="text-stone-300 font-medium">Just withdrew</span>{' '}
                <span className="font-black text-emerald-400 drop-shadow-sm text-sm sm:text-base">
                  ₦{currentTestimony.amount.toLocaleString()} naira
                </span>{' '}
                <span className="text-stone-300 font-medium">from</span>{' '}
                <span className="font-bold text-emerald-200 inline-flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400 inline -mt-0.5" />
                  {currentTestimony.location}
                </span>
              </p>

              {/* Sub-meta: Bank transfer & Real-time status without disclosing any seconds countdown */}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-300/80 font-mono flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <ArrowUpRight className="w-3 h-3" />
                  {currentTestimony.bank}
                </span>
                <span>•</span>
                <span className="text-stone-400">Instant Bank Credit</span>
                <span>•</span>
                <span className="text-emerald-300/90 font-bold">100% Real Payout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
