import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Zap,
  HelpCircle,
  Award,
  Check,
  X,
  Clock,
  Brain,
  Coins,
  Trophy,
  Shuffle,
  RefreshCw,
  Flame,
  Lock,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { soundFx } from '../../utils/sound.ts';
import {
  generatePersonalizedQuizDeck,
  QuizQuestion,
  markQuestionAnsweredForUser,
  getStoredAnsweredQuestionIds,
} from '../../utils/quizEngine.ts';
import { LuckySpinWheel } from '../Earn/LuckySpinWheel.tsx';
import { CandyCrushGame } from '../Earn/CandyCrushGame.tsx';
import { NeoSnakeGame3D } from '../Earn/NeoSnakeGame3D.tsx';
import { safeLocalStorageSet } from '../../utils/storage.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface EarnPageProps {
  onBack: () => void;
  onUpgradeTier?: () => void;
}

export const EarnPage: React.FC<EarnPageProps> = ({ onBack, onUpgradeTier }) => {
  const { isLight } = useTheme();
  const { user, formatNaira, claimDailyReward, transactions, addTransaction, getDailySpinsLeft } = useAuth();
  const userId = user?.id || user?.email || 'default_user';
  const spinsLeft = getDailySpinsLeft ? getDailySpinsLeft() : 3;

  // Active sub-tab inside Earn Page: null initially so user selects a game first before playing
  const [activeEarnTab, setActiveEarnTab] = useState<'candy' | 'snake' | 'wheel' | 'claim' | 'quiz' | null>(null);

  // Helper to determine the true last claim time strictly isolated for THIS user
  const getResolvedLastClaimTime = (): number | null => {
    if (!user) return null;
    let resolvedTime: number | null = null;

    // 1. Direct from Firestore user profile
    if (user.lastDailyClaim && typeof user.lastDailyClaim === 'number' && user.lastDailyClaim > 0) {
      resolvedTime = user.lastDailyClaim;
    }

    // 2. User-scoped localStorage key
    const userLocal = localStorage.getItem(`9jacash_daily_claim_${userId}`);
    if (userLocal) {
      const parsed = parseInt(userLocal, 10);
      if (!isNaN(parsed) && parsed > (resolvedTime || 0)) {
        resolvedTime = parsed;
      }
    }

    // 3. User's transactions history from Firestore
    const userDailyClaimTxs = transactions.filter((t) => t.title === 'Daily Claim Reward');
    if (userDailyClaimTxs.length > 0) {
      const latestTx = userDailyClaimTxs[0];
      if (latestTx.id.startsWith('tx_')) {
        const txTimestamp = parseInt(latestTx.id.replace('tx_', ''), 10);
        if (!isNaN(txTimestamp) && txTimestamp > (resolvedTime || 0)) {
          resolvedTime = txTimestamp;
        }
      }
    }

    return resolvedTime;
  };

  // Helper to get today's quiz count strictly scoped to THIS user
  const getUserTodayQuizCount = (uid: string): number => {
    const todayStr = new Date().toDateString();
    const key = `9jacash_quiz_count_${uid}_${todayStr}`;
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0;
  };

  // Daily Claim state
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(getResolvedLastClaimTime);

  // Sync state if user.lastDailyClaim or transactions update from Firestore
  useEffect(() => {
    const resolved = getResolvedLastClaimTime();
    setLastClaimTime(resolved);
  }, [user?.id, user?.lastDailyClaim, transactions]);

  // Account switch listener: Whenever userId changes, reset all state to match current user
  useEffect(() => {
    const resolved = getResolvedLastClaimTime();
    setLastClaimTime(resolved);
    setTodayQuestionsAnswered(getUserTodayQuizCount(userId));
    setSessionEarnings(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsCorrectAnswer(null);
    setCurrentQuizIndex(0);
    setSuccessBanner(null);
  }, [userId]);

  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    const initialTime = getResolvedLastClaimTime();
    if (!initialTime) return '';
    const elapsed = Date.now() - initialTime;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (elapsed >= twentyFourHours || elapsed < 0) return '';
    const diff = twentyFourHours - elapsed;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  });

  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(() => {
    const initialTime = getResolvedLastClaimTime();
    if (!initialTime) return true;
    const elapsed = Date.now() - initialTime;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return elapsed >= twentyFourHours;
  });

  // Dynamic user-seeded quiz deck: changes over time and differs per user
  const [deckSalt, setDeckSalt] = useState<string>(() => {
    const savedSalt = localStorage.getItem(`9jacash_quiz_salt_${userId}`);
    return savedSalt || Date.now().toString();
  });

  const quizDeck = useMemo(() => {
    return generatePersonalizedQuizDeck(userId, 50, deckSalt);
  }, [userId, deckSalt]);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [todayQuestionsAnswered, setTodayQuestionsAnswered] = useState<number>(() => {
    return getUserTodayQuizCount(userId);
  });
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleShuffleQuestions = () => {
    if (isAnswerSubmitted) return;
    soundFx.playClick();
    const newSalt = Date.now().toString();
    setDeckSalt(newSalt);
    safeLocalStorageSet(`9jacash_quiz_salt_${userId}`, newSalt);
    setSelectedOption(null);
    setCurrentQuizIndex(0);
    setSuccessBanner('🎲 Question deck refreshed with new unrepeated questions personalized for your account!');
  };

  // Check strict 24-hour cooldown for Daily Claim
  useEffect(() => {
    const checkCooldown = () => {
      const effectiveTime = lastClaimTime ?? getResolvedLastClaimTime();
      if (!effectiveTime) {
        setCanClaimDaily(true);
        setTimeRemaining('');
        return;
      }
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const elapsed = now - effectiveTime;

      if (elapsed >= twentyFourHours || elapsed < 0) {
        setCanClaimDaily(true);
        setTimeRemaining('');
      } else {
        setCanClaimDaily(false);
        const diff = Math.max(0, twentyFourHours - elapsed);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    checkCooldown();
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [lastClaimTime, userId]);

  const handleClaimDaily = () => {
    if (!canClaimDaily) return;
    const result = claimDailyReward();
    if (result.success) {
      soundFx.playWinChime();
      const now = Date.now();
      setLastClaimTime(now);
      setCanClaimDaily(false);
      setSuccessBanner(result.message || `🎉 Successfully claimed +${formatNaira(result.amount || 5000)} daily reward!`);
    } else {
      soundFx.playLoseSound();
      setCanClaimDaily(false);
      setSuccessBanner(`⏳ ${result.message || 'Daily claim is on cooldown. Please wait 24 hours.'}`);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    soundFx.playClick();
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    if (todayQuestionsAnswered >= 50) {
      setSuccessBanner('You have reached the daily limit of 50 quiz questions. Come back tomorrow!');
      return;
    }

    const currentQ = quizDeck[currentQuizIndex % Math.max(1, quizDeck.length)];
    if (!currentQ) return;

    const correct = selectedOption === currentQ.correctIndex;
    setIsAnswerSubmitted(true);
    setIsCorrectAnswer(correct);

    // Record question as answered so this user never sees it again
    markQuestionAnsweredForUser(userId, currentQ.id);

    const reward = 1000; // ₦1,000 per correct answer win

    if (correct) {
      soundFx.playWinChime();
      setSessionEarnings((prev) => prev + reward);
      addTransaction({
        type: 'earn',
        title: 'Quiz Correct Answer Reward',
        subtitle: `Answered correctly: ${currentQ.question}`,
        amount: reward,
        isCredit: true,
        status: 'successful',
      });
      setSuccessBanner(`🏆 Correct! +${formatNaira(reward)} credited to your balance.`);
    } else {
      soundFx.playLoseSound();
      setSuccessBanner(`❌ Incorrect! The correct answer was "${currentQ.options[currentQ.correctIndex]}". Try the next question!`);
    }

    const newAnsweredCount = todayQuestionsAnswered + 1;
    setTodayQuestionsAnswered(newAnsweredCount);
    // User-scoped storage key
    safeLocalStorageSet(`9jacash_quiz_count_${userId}_${new Date().toDateString()}`, newAnsweredCount.toString());

    // Advance to next question after 2.5 seconds
    setTimeout(() => {
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsCorrectAnswer(null);

      // If at end of loaded batch, refresh with fresh unanswered questions
      if (currentQuizIndex + 1 >= quizDeck.length) {
        const newSalt = Date.now().toString();
        setDeckSalt(newSalt);
        safeLocalStorageSet(`9jacash_quiz_salt_${userId}`, newSalt);
        setCurrentQuizIndex(0);
      } else {
        setCurrentQuizIndex((prev) => prev + 1);
      }
    }, 2500);
  };

  const currentQ = quizDeck[currentQuizIndex % Math.max(1, quizDeck.length)] || quizDeck[0];
  const questionsLeftToday = Math.max(0, 50 - todayQuestionsAnswered);
  const isTier1Locked = (user?.tier || 1) < 2 && (user?.balance || 0) >= 400000;

  if (isTier1Locked) {
    return (
      <div className="min-h-screen pb-20 space-y-4 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onBack();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-500/50 shadow-sm'
                : 'bg-[#16171d] border border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Upgrade to Tier 2 <Crown className="w-4 h-4 text-amber-500" />
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Tier 1 Limit Reached (₦400,000) • Earning Page Locked
            </p>
          </div>
        </div>

        {/* Locked Hero Card */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 text-center space-y-4 ${
            isLight
              ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300 shadow-xl shadow-amber-500/10'
              : 'bg-gradient-to-br from-[#231a10] via-[#1b1510] to-[#121118] border-2 border-amber-500/50 shadow-2xl'
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/25">
            <div
              className={`w-full h-full rounded-3xl flex items-center justify-center ${
                isLight ? 'bg-amber-50 text-amber-600' : 'bg-[#14121a] text-amber-400'
              }`}
            >
              <Lock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isLight
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span>TIER 1 LIMIT REACHED</span>
            </span>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Earning Page Locked
            </h2>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
              Your dashboard balance has hit{' '}
              <strong className="text-amber-500 font-mono text-sm">{formatNaira(user?.balance || 400000)}</strong>. The
              earning page is locked until you upgrade to Tier 2.
            </p>
          </div>

          {/* Current Balance Display */}
          <div
            className={`p-4 rounded-2xl text-center space-y-1 ${
              isLight
                ? 'bg-white border-2 border-amber-200 shadow-sm'
                : 'bg-[#0f1016] border border-amber-500/30'
            }`}
          >
            <span className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Current Dashboard Balance
            </span>
            <div className="text-2xl font-black text-amber-500 font-mono">
              {formatNaira(user?.balance || 400000)}
            </div>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>
              Maximum Tier 1 Capacity Reached (₦400,000)
            </span>
          </div>

          {/* Upgrade To Tier 2 Benefits */}
          <div
            className={`p-4 rounded-2xl text-left space-y-2.5 ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm text-slate-700'
                : 'bg-[#161722] border border-stone-800 text-stone-300'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Tier 2 Account Benefits
              </span>
              <span className="text-xs font-black text-amber-500 font-mono">₦6,600 Upgrade Fee</span>
            </div>
            <div className={`space-y-2 text-xs ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  Wallet holding capacity expanded to <strong>₦2,000,000 (2 Million Naira)</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Unlock</strong> of all earning games: Neo Snake 3D, Candy Crush, Lucky Wheel, Daily Claim &amp; Quiz
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Priority queue processing for Quick Codes &amp; bank withdrawals</span>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              if (onUpgradeTier) {
                onUpgradeTier();
              }
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Crown className="w-4 h-4 fill-black" />
            <span>Upgrade to Tier 2 (₦6,600)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onBack();
            }}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 space-y-4">
      {/* Top Header */}
      <div className={`flex items-center justify-between gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              if (activeEarnTab !== null) {
                setActiveEarnTab(null);
              } else {
                onBack();
              }
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-emerald-500/50 shadow-sm'
                : 'bg-[#16171d] border border-stone-800 text-stone-300 hover:text-white hover:border-emerald-500/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Cash Earning Center <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              {activeEarnTab === null
                ? 'Select a game below first to start playing & earning cash'
                : 'Play Candy Crush Saga, Neo Snake 3D, spin the Lucky Wheel, claim daily cash & solve trivia quizzes'}
            </p>
          </div>
        </div>

        {activeEarnTab !== null && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab(null);
            }}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-stone-800/90 hover:bg-stone-700 border-stone-700 text-amber-300'
            }`}
          >
            All Games
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-500/10'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className={`ml-2 text-xs font-bold cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-stone-400 hover:text-white'}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Switcher Tabs (5 Tabs: 1st Candy Crush, 2nd Snake 3D, 3rd Wheel, 4th Daily, 5th Quiz) */}
      <div
        className={`grid grid-cols-5 gap-1 p-1 rounded-2xl text-center border ${
          isLight ? 'bg-slate-100/90 border-slate-200 shadow-sm' : 'bg-[#14151b] border-stone-800'
        }`}
      >
        {/* Tab 1: Candy Crush Saga (1st Place) */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveEarnTab('candy');
          }}
          className={`py-2 px-0.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeEarnTab === 'candy'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Sparkles className={`w-3.5 h-3.5 ${activeEarnTab === 'candy' ? 'fill-white text-white' : 'text-pink-500'}`} />
            <span className="truncate text-[11px]">Candy</span>
          </div>
          <span className={`text-[8px] font-bold ${activeEarnTab === 'candy' ? 'text-white/90' : isLight ? 'text-pink-600' : 'text-pink-400'}`}>
            ₦16k Win
          </span>
        </button>

        {/* Tab 2: Neo Snake 3D (2nd Place) */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveEarnTab('snake');
          }}
          className={`py-2 px-0.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
            activeEarnTab === 'snake'
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-black shadow-lg shadow-emerald-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Coins className={`w-3.5 h-3.5 ${activeEarnTab === 'snake' ? 'fill-black text-black' : 'text-emerald-500'}`} />
            <span className="truncate text-[11px]">Snake 3D</span>
          </div>
          <span className={`text-[8px] font-bold ${activeEarnTab === 'snake' ? 'text-black/80' : isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            ₦500 / Coin
          </span>
        </button>

        {/* Tab 3: Lucky Spin */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveEarnTab('wheel');
          }}
          className={`py-2 px-0.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeEarnTab === 'wheel'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Flame className={`w-3.5 h-3.5 ${activeEarnTab === 'wheel' ? 'fill-black' : 'text-amber-500'}`} />
            <span className="truncate text-[11px]">Wheel</span>
          </div>
          <span className={`text-[8px] font-bold ${activeEarnTab === 'wheel' ? 'text-black/80' : isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            {spinsLeft} Spins
          </span>
        </button>

        {/* Tab 4: Daily Claim */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveEarnTab('claim');
          }}
          className={`py-2 px-0.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeEarnTab === 'claim'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Zap className={`w-3.5 h-3.5 ${activeEarnTab === 'claim' ? 'fill-black' : 'text-emerald-500'}`} />
            <span className="truncate text-[11px]">Daily</span>
          </div>
          <span className={`text-[8px] font-bold ${activeEarnTab === 'claim' ? 'text-black/80' : isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            ₦5,000
          </span>
        </button>

        {/* Tab 5: Quiz Trivia */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveEarnTab('quiz');
          }}
          className={`py-2 px-0.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeEarnTab === 'quiz'
              ? 'bg-gradient-to-r from-sky-500 to-blue-400 text-black shadow-lg shadow-sky-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Brain className={`w-3.5 h-3.5 ${activeEarnTab === 'quiz' ? 'fill-black' : 'text-sky-500'}`} />
            <span className="truncate text-[11px]">Quiz</span>
          </div>
          <span className={`text-[8px] font-bold ${activeEarnTab === 'quiz' ? 'text-black/80' : isLight ? 'text-sky-700' : 'text-sky-400'}`}>
            ₦1k / Q
          </span>
        </button>
      </div>

      {/* ================= GAME SELECTION HUB (Shown first until user selects a game) ================= */}
      {activeEarnTab === null && (
        <div className="space-y-3">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between border ${
              isLight
                ? 'bg-white border-amber-300 shadow-sm'
                : 'bg-[#14161f] border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}
              >
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Select a Game to Start Playing
                </h2>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  Choose any game below to launch and earn instant Naira rewards
                </p>
              </div>
            </div>
          </div>

          {/* 1st Place: Candy Crush Saga */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab('candy');
            }}
            className={`w-full p-4 rounded-3xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
              isLight
                ? 'bg-gradient-to-r from-pink-50 via-rose-50/60 to-white border-pink-300 hover:border-pink-400 shadow-md shadow-pink-500/10'
                : 'bg-gradient-to-r from-[#281224] via-[#1c1322] to-[#14151c] border-pink-500/50 hover:border-pink-400 shadow-xl shadow-pink-500/15'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/30 flex-shrink-0">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isLight ? 'bg-white' : 'bg-[#161019]'
                  }`}
                >
                  <Sparkles className="w-7 h-7 text-pink-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                      isLight
                        ? 'bg-pink-100 border-pink-300 text-pink-700'
                        : 'bg-pink-500/25 border-pink-400/40 text-pink-300'
                    }`}
                  >
                    #1 Featured Game
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-pink-700' : 'text-amber-300'}`}>
                    Up to ₦16,000 / Match
                  </span>
                </div>
                <h3 className={`text-base font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Candy Crush Saga
                </h3>
                <p className={`text-xs line-clamp-1 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Match 3+ candies across 1,000 levels &amp; win instant wallet cash
                </p>
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black text-xs flex items-center gap-1 flex-shrink-0 shadow-md">
              <span>Play</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 2nd Place: Neo Snake 3D */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab('snake');
            }}
            className={`w-full p-4 rounded-3xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
              isLight
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-emerald-300 hover:border-emerald-400 shadow-md shadow-emerald-500/10'
                : 'bg-gradient-to-r from-[#0e221c] via-[#111b1d] to-[#14151c] border-emerald-500/50 hover:border-emerald-400 shadow-xl shadow-emerald-500/15'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 p-0.5 shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isLight ? 'bg-white' : 'bg-[#0d1614]'
                  }`}
                >
                  <Coins className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                      isLight
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-emerald-500/25 border-emerald-400/40 text-emerald-300'
                    }`}
                  >
                    #2 Cyber Arcade
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    ₦500 – ₦1,000 / Coin
                  </span>
                </div>
                <h3 className={`text-base font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Neo Snake 3D
                </h3>
                <p className={`text-xs line-clamp-1 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Slither in 3D &amp; eat golden Naira coins for instant balance credit
                </p>
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-xs flex items-center gap-1 flex-shrink-0 shadow-md">
              <span>Play</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 3rd Place: Lucky Spin Wheel */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab('wheel');
            }}
            className={`w-full p-4 rounded-3xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
              isLight
                ? 'bg-white border-2 border-amber-300/80 hover:border-amber-400 shadow-md'
                : 'bg-[#15161e] border border-amber-500/30 hover:border-amber-400/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-600'
                    : 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
                }`}
              >
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lucky Spin Wheel
                </h3>
                <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  {spinsLeft} free daily spins remaining • Guaranteed cash prizes
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 flex-shrink-0 border ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              <span>Spin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 4th Place: Daily Claim */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab('claim');
            }}
            className={`w-full p-4 rounded-3xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
              isLight
                ? 'bg-white border-2 border-emerald-300/80 hover:border-emerald-400 shadow-md'
                : 'bg-[#15161e] border border-emerald-500/30 hover:border-emerald-400/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  isLight
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                    : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                }`}
              >
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Daily ₦5,000 Cash Claim
                </h3>
                <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Claim free ₦5,000 earner dividend every 24 hours
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 flex-shrink-0 border ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <span>Claim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 5th Place: Quiz Trivia */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveEarnTab('quiz');
            }}
            className={`w-full p-4 rounded-3xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
              isLight
                ? 'bg-white border-2 border-sky-300/80 hover:border-sky-400 shadow-md'
                : 'bg-[#15161e] border border-sky-500/30 hover:border-sky-400/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  isLight
                    ? 'bg-sky-100 border-sky-300 text-sky-600'
                    : 'bg-sky-500/15 border border-sky-500/40 text-sky-400'
                }`}
              >
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Trivia Quiz &amp; Earn
                </h3>
                <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Earn ₦1,000 per correct answer • {questionsLeftToday} questions left today
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 flex-shrink-0 border ${
                isLight
                  ? 'bg-sky-100 border-sky-300 text-sky-800'
                  : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
              }`}
            >
              <span>Play</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* ================= TAB 1: CANDY CRUSH SAGA (1ST PLACE) ================= */}
      {activeEarnTab === 'candy' && (
        <div className="space-y-4">
          <CandyCrushGame />
        </div>
      )}

      {/* ================= TAB 2: NEO SNAKE GAME 3D (2ND PLACE) ================= */}
      {activeEarnTab === 'snake' && (
        <div className="space-y-4">
          <NeoSnakeGame3D />
        </div>
      )}

      {/* ================= TAB 3: LUCKY SPIN WHEEL ================= */}
      {activeEarnTab === 'wheel' && (
        <div className="space-y-4">
          <LuckySpinWheel />
        </div>
      )}

      {/* ================= TAB 4: DAILY CLAIM REWARD ================= */}
      {activeEarnTab === 'claim' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Claim Hero */}
          <div
            className={`relative overflow-hidden rounded-3xl p-5 shadow-2xl text-white ${
              isLight
                ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 border border-emerald-400/60 shadow-emerald-500/15'
                : 'bg-gradient-to-r from-emerald-950 via-[#14231b] to-[#1c2317] border border-emerald-500/40'
            }`}
          >
            <div className="relative z-10 space-y-2 max-w-[70%]">
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-md bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                DAILY EARNER DIVIDEND
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                Claim <span className="text-amber-300">₦5,000</span> Free Every 24 Hours
              </h2>
              <p className="text-xs text-white/90 leading-relaxed">
                Active earner incentive credited straight to your 9jacash available balance.
              </p>
            </div>

            <div className="absolute -right-2 -bottom-2 w-28 h-28 opacity-95 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-400 to-amber-400 flex items-center justify-center text-black font-extrabold shadow-2xl rotate-12">
                <Zap className="w-10 h-10 fill-black stroke-black" />
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl space-y-4 shadow-xl border ${
              isLight
                ? 'bg-white border-2 border-emerald-300 shadow-emerald-500/10'
                : 'bg-[#15161c] border border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isLight
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                      : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Daily ₦5,000 Cash Claim
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    Refreshes every 24 hours per account
                  </p>
                </div>
              </div>
              <span className={`text-sm font-black font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                ₦5,000
              </span>
            </div>

            {canClaimDaily ? (
              <button
                type="button"
                onClick={handleClaimDaily}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm border-2 border-emerald-400/80 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span>CLAIM ₦5,000 FREE REWARD NOW</span>
              </button>
            ) : (
              <div
                className={`p-4 rounded-2xl space-y-2 border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a1c24] border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                    <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>Next claim unlocks in:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-500 text-sm">{timeRemaining}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-stone-800'}`}>
                  <div className="w-2/3 h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: TRIVIA QUIZ & EARN ================= */}
      {activeEarnTab === 'quiz' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div
            className={`p-5 rounded-3xl space-y-4 shadow-xl border ${
              isLight
                ? 'bg-white border-2 border-sky-300 shadow-sky-500/10'
                : 'bg-[#15161c] border border-sky-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Brain className="w-4 h-4 text-sky-500" />
                <span>Quiz &amp; Earn (₦1,000 / Question)</span>
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isLight
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                }`}
              >
                {questionsLeftToday} / 50 Left Today
              </span>
            </div>

            {/* Quiz Progress & Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}
              >
                <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  Answered Today
                </span>
                <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {todayQuestionsAnswered} / 50
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-sky-50/80 border-sky-200' : 'bg-[#1c1e26] border-sky-500/30'
                }`}
              >
                <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  Session Earnings
                </span>
                <span className={`text-base font-black ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                  {formatNaira(sessionEarnings)}
                </span>
              </div>
            </div>

            {/* Quiz Card */}
            {questionsLeftToday <= 0 ? (
              <div
                className={`p-8 text-center rounded-2xl space-y-3 border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}
              >
                <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Daily Quiz Limit Reached!
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  You have completed all 50 questions for today. Come back tomorrow for more quiz earnings!
                </p>
              </div>
            ) : (
              <div
                className={`p-4 rounded-2xl space-y-4 border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1e26] border-stone-800'
                }`}
              >
                <div className={`flex items-center justify-between text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold border ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-700'
                          : 'bg-stone-800 border-stone-700 text-stone-300'
                      }`}
                    >
                      {currentQ.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                        isLight
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Unique Question #{todayQuestionsAnswered + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShuffleQuestions}
                      disabled={isAnswerSubmitted}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700'
                      }`}
                      title="Randomize and load fresh questions"
                    >
                      <Shuffle className="w-3 h-3 text-sky-500" />
                      <span>Shuffle</span>
                    </button>
                    <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      Reward: ₦1,000
                    </span>
                  </div>
                </div>

                <h4 className={`text-sm sm:text-base font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentQ.question}
                </h4>

                {/* Options */}
                <div className="space-y-2">
                  {currentQ.options.map((opt, idx) => {
                    let btnStyle = isLight
                      ? 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/40 shadow-sm'
                      : 'bg-[#121318] border-stone-700 text-stone-200 hover:border-sky-500';
                    if (selectedOption === idx) {
                      btnStyle = isLight
                        ? 'bg-sky-100 border-sky-400 text-sky-900 shadow-md ring-2 ring-sky-300'
                        : 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md';
                    }
                    if (isAnswerSubmitted) {
                      if (idx === currentQ.correctIndex) {
                        btnStyle = 'bg-emerald-500 text-black border-emerald-500 font-bold';
                      } else if (selectedOption === idx && !isCorrectAnswer) {
                        btnStyle = isLight
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-red-500/20 border-red-500 text-red-300';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswerSubmitted}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isLight
                              ? 'border-slate-300 bg-slate-100 text-slate-700'
                              : 'border-stone-600 text-stone-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={selectedOption === null || isAnswerSubmitted}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer active:scale-98"
                >
                  {isAnswerSubmitted ? 'Processing Answer...' : 'Submit Answer & Earn ₦1,000'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
