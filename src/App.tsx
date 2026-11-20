/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { FloatingNairaNotes } from './components/Common/FloatingNairaNotes.tsx';
import { Register } from './components/Auth/Register.tsx';
import { Login } from './components/Auth/Login.tsx';
import { Header } from './components/Dashboard/Header.tsx';
import { BalanceCard } from './components/Dashboard/BalanceCard.tsx';
import { PendingKycBanner } from './components/Dashboard/PendingKycBanner.tsx';
import { QuickActions } from './components/Dashboard/QuickActions.tsx';
import { AccountCards } from './components/Dashboard/AccountCards.tsx';
import { CashbackBanner } from './components/Dashboard/CashbackBanner.tsx';
import { RecentTransactions } from './components/Dashboard/RecentTransactions.tsx';
import { CashoutTestimoniesPopup } from './components/Dashboard/CashoutTestimoniesPopup.tsx';
import { DeviceNotificationHandler } from './components/Dashboard/DeviceNotificationHandler.tsx';
import { GlobalDeviceNotificationListener } from './components/Dashboard/GlobalDeviceNotificationListener.tsx';
import { BottomNav } from './components/Dashboard/BottomNav.tsx';
import { FloatingSupportToggle } from './components/Dashboard/FloatingSupportToggle.tsx';
import { CommunityTab } from './components/Tabs/CommunityTab.tsx';
import { PaymentsTab } from './components/Tabs/PaymentsTab.tsx';
import { SupportTab } from './components/Tabs/SupportTab.tsx';
import { MoreTab } from './components/Tabs/MoreTab.tsx';
import { EarnPage } from './components/Pages/EarnPage.tsx';
import { QuickCodePage } from './components/Pages/QuickCodePage.tsx';
import { DepositPage } from './components/Pages/DepositPage.tsx';
import { WithdrawPage } from './components/Pages/WithdrawPage.tsx';
import { AccountDetailsPage } from './components/Pages/AccountDetailsPage.tsx';
import { TransactionHistoryPage } from './components/Pages/TransactionHistoryPage.tsx';
import { NotificationsPage } from './components/Pages/NotificationsPage.tsx';
import { SettingsPage } from './components/Pages/SettingsPage.tsx';
import { TermsPage } from './components/Pages/TermsPage.tsx';
import { AdminDashboardPage } from './components/Pages/AdminDashboardPage.tsx';
import { LiveChatPage } from './components/Pages/LiveChatPage.tsx';
import { UpgradeTierPage } from './components/Pages/UpgradeTierPage.tsx';
import { ReferralsPage } from './components/Pages/ReferralsPage.tsx';
import { BankVerificationPage } from './components/Pages/BankVerificationPage.tsx';
import { KycVerificationPage } from './components/Pages/KycVerificationPage.tsx';
import { TaxClearancePage } from './components/Pages/TaxClearancePage.tsx';
import { PageTransitionLoader } from './components/Common/PageTransitionLoader.tsx';
import { TelegramAdvertModal } from './components/Common/TelegramAdvertModal.tsx';
import { KycNoticeModal } from './components/Modals/KycNoticeModal.tsx';
import {
  speakNewUserQuickCodeAdvice,
  speakKycPendingAdvice,
  speakTaxClearanceAdvice,
  stopAllVoiceAdvice,
} from './utils/voiceGuide.ts';
import { AdminMessagePopupModal } from './components/Modals/AdminMessagePopupModal.tsx';
import { CreditAlertModal } from './components/Modals/CreditAlertModal.tsx';
import { TaxApprovedTier3Modal } from './components/Modals/TaxApprovedTier3Modal.tsx';
import { ProfilePicturePromptModal } from './components/Modals/ProfilePicturePromptModal.tsx';
import { BannedAccountScreen } from './components/Pages/BannedAccountScreen.tsx';
import { OfflineScreen } from './components/Common/OfflineScreen.tsx';
import { ActiveTab, CurrentScreen, Transaction, SupportChatThread } from './types/index.ts';
import { subscribeToUserSupportChat } from './services/firebase.ts';
import { verifyInternetConnection } from './utils/networkCheck.ts';

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  earn: 'Daily Rewards & Tasks',
  quickcode: 'Quick Code Service',
  deposit: 'Wallet Deposit',
  withdraw: 'Bank Withdrawal',
  account_details: 'Account Details',
  transaction_history: 'Transaction History',
  notifications: 'Notifications',
  settings: 'Settings',
  terms: 'Terms & Conditions',
  admin: 'Company Control Center',
  live_chat: 'Live Chat Support',
  upgrade_tier: 'Account Tier Upgrade',
  referrals: 'Refer & Earn',
  bank_verification: 'Bank Verification',
  kyc_verification: 'KYC Account Verification',
  tax_clearance: 'Tax Clearance (99% Completed)',
  home: 'Dashboard Home',
  payments: 'Payments & Transfers',
  community: 'Official Community',
  cards: 'Official Community',
  support: 'Support Center',
  more: 'Account Menu',
};

const DashboardContent: React.FC = () => {
  const {
    user,
    transactions,
    showTelegramAdvert,
    setShowTelegramAdvert,
    communityLinks,
    showKycNoticeModal,
    setShowKycNoticeModal,
    kycPendingWithdrawal,
    hasUserWithdrawn,
    depositRequests,
    showProfilePicturePrompt,
    dismissProfilePicturePrompt,
  } = useAuth();
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [autoOpenMoreEdit, setAutoOpenMoreEdit] = useState<boolean>(false);
  const [showTaxApprovedTier3Modal, setShowTaxApprovedTier3Modal] = useState<boolean>(false);
  const [tierUpgradeTargetTier, setTierUpgradeTargetTier] = useState<number>(3);
  const [tierUpgradeInitialStep, setTierUpgradeInitialStep] = useState<'plans' | 'payment'>('plans');
  const [supportThreadState, setSupportThreadState] = useState<SupportChatThread | null>(
    user?.supportChat || null
  );
  const [lastSeenSupportTs, setLastSeenSupportTs] = useState<number>(() => {
    if (!user?.id) return 0;
    try {
      return Number(localStorage.getItem(`9jacash_support_seen_ts_${user.id}`) || '0') || 0;
    } catch {
      return 0;
    }
  });

  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashScreen = window.location.hash.replace('#', '') as CurrentScreen;
      const validScreens: CurrentScreen[] = [
        'earn',
        'quickcode',
        'deposit',
        'withdraw',
        'account_details',
        'transaction_history',
        'notifications',
        'settings',
        'terms',
        'admin',
        'live_chat',
        'upgrade_tier',
        'referrals',
        'bank_verification',
        'kyc_verification',
        'tax_clearance',
      ];
      if (validScreens.includes(hashScreen)) {
        return hashScreen;
      }
    }
    return 'dashboard';
  });
  const [selectedTxForPage, setSelectedTxForPage] = useState<Transaction | null>(null);

  // Sync user's support chat thread in real time so unread reply badge updates immediately
  useEffect(() => {
    if (!user?.id) {
      setSupportThreadState(null);
      setLastSeenSupportTs(0);
      return;
    }
    try {
      setLastSeenSupportTs(
        Number(localStorage.getItem(`9jacash_support_seen_ts_${user.id}`) || '0') || 0
      );
    } catch {
      setLastSeenSupportTs(0);
    }

    const unsub = subscribeToUserSupportChat(user.id, (remoteThread) => {
      setSupportThreadState(remoteThread);
    });
    return () => unsub();
  }, [user?.id]);

  // Also merge user.supportChat updates from AuthContext
  useEffect(() => {
    if (!user?.supportChat) return;
    setSupportThreadState((prev) => {
      if (!prev) return user.supportChat || null;
      return (user.supportChat?.lastTimestamp || 0) >= (prev.lastTimestamp || 0)
        ? user.supportChat || prev
        : prev;
    });
  }, [user?.supportChat]);

  const markSupportMessagesSeen = (threadToMark: SupportChatThread | null) => {
    if (!user?.id) return;
    const msgs = threadToMark?.messages || [];
    const latestMsgTs = msgs.length > 0 ? Math.max(...msgs.map((m) => m.timestamp || 0)) : 0;
    const seenTs = Math.max(latestMsgTs, Date.now());
    setLastSeenSupportTs(seenTs);
    try {
      localStorage.setItem(`9jacash_support_seen_ts_${user.id}`, String(seenTs));
    } catch {
      // Ignore storage error
    }
  };

  // Clear unread indicator automatically while user is actively viewing Support chat
  useEffect(() => {
    if (currentScreen === 'dashboard' && activeTab === 'support') {
      markSupportMessagesSeen(supportThreadState);
    }
  }, [currentScreen, activeTab, supportThreadState?.lastTimestamp, user?.id]);

  const unreadSupportCount = React.useMemo(() => {
    const msgs = supportThreadState?.messages;
    if (!Array.isArray(msgs) || msgs.length === 0) return 0;
    if (currentScreen === 'dashboard' && activeTab === 'support') return 0;

    if (lastSeenSupportTs > 0) {
      return msgs.filter((m) => m.sender === 'admin' && (m.timestamp || 0) > lastSeenSupportTs).length;
    }

    // If user hasn't opened Support yet, count replies arriving after their latest message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    const tail = lastUserIdx >= 0 ? msgs.slice(lastUserIdx + 1) : msgs;
    return tail.filter((m) => m.sender === 'admin').length;
  }, [supportThreadState, lastSeenSupportTs, currentScreen, activeTab]);

  const handleOpenSupportFromToggle = () => {
    markSupportMessagesSeen(supportThreadState);
    setCurrentScreen('dashboard');
    setActiveTab('support');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Detect tax payment approval and show celebratory withdrawal success & Tier 3 upgrade modal
  useEffect(() => {
    if (!user || user.isBanned || user.isVMode) {
      setShowTaxApprovedTier3Modal(false);
      return;
    }
    // If user is already Tier 3 or higher, don't show Tier 3 upgrade pop up
    if ((user.tier || 1) >= 3) {
      setShowTaxApprovedTier3Modal(false);
      return;
    }

    const hasApprovedTax =
      user.lastWithdrawal?.taxStatus === 'approved' ||
      user.withdrawalStatus === 'completed' ||
      (depositRequests || []).some(
        (r) => r.userId === user.id && r.requestType === 'tax_payment' && r.status === 'approved'
      );

    if (hasApprovedTax) {
      const approvalToken =
        user.lastWithdrawal?.taxApprovedAt ||
        user.lastWithdrawal?.reference ||
        'tax_cleared';
      const storageKey = `9jacash_tax_approved_ack_${user.id}_${approvalToken}`;
      const acknowledged = localStorage.getItem(storageKey);

      if (!acknowledged) {
        const timer = setTimeout(() => {
          setShowTaxApprovedTier3Modal(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } else {
      setShowTaxApprovedTier3Modal(false);
    }
  }, [
    user?.id,
    user?.tier,
    user?.isVMode,
    user?.isBanned,
    user?.withdrawalStatus,
    user?.lastWithdrawal?.taxStatus,
    user?.lastWithdrawal?.taxApprovedAt,
    user?.lastWithdrawal?.reference,
    depositRequests,
  ]);

  // Female voice advisor for new user Quick Code guidance, pending withdrawal / KYC, and Tax clearance
  useEffect(() => {
    if (!user || user.isBanned || user.isVMode) {
      stopAllVoiceAdvice();
      return;
    }

    const isKycApproved = user.isKycVerified || user.kycStatus === 'approved';
    const pendingTx = transactions.find((t) => t.type === 'withdraw' && t.status === 'pending');
    const hasUserKycPendingWithdrawal =
      !!kycPendingWithdrawal &&
      (!kycPendingWithdrawal.userId || kycPendingWithdrawal.userId === user.id);
    const isKycPending = !isKycApproved && (hasUserKycPendingWithdrawal || !!pendingTx);

    const lastWdr = user.lastWithdrawal;
    const isTaxActionRequired =
      isKycApproved &&
      (user.withdrawalStatus === 'action_required' || lastWdr?.taxStatus === 'action_required');

    // Check if user has ever made a withdrawal
    const hasMadeWithdrawal =
      hasUserWithdrawn ||
      !!user.lastWithdrawal ||
      !!user.withdrawalAccount ||
      hasUserKycPendingWithdrawal ||
      (!!user.withdrawalStatus && user.withdrawalStatus !== 'none') ||
      transactions.some((t) => t.type === 'withdraw');

    // Check if user already has an active quick code OR has purchased / has a pending quick code purchase
    const hasQuickCodeOrPendingPurchase =
      (Array.isArray(user.quickCodes) && user.quickCodes.length > 0) ||
      (depositRequests || []).some(
        (r) =>
          r.userId === user.id &&
          r.requestType === 'quickcode' &&
          (r.status === 'pending' || r.status === 'approved')
      ) ||
      (user.submittedRequests || []).some(
        (r) =>
          r.requestType === 'quickcode' &&
          (r.status === 'pending' || r.status === 'approved')
      ) ||
      transactions.some(
        (t) => t.type === 'quickcode' && (t.status === 'pending' || t.status === 'successful')
      );

    const needsNewUserQuickCodeAdvice = !hasMadeWithdrawal && !hasQuickCodeOrPendingPurchase;

    if (currentScreen === 'dashboard' && activeTab === 'home') {
      if (isKycPending) {
        // Female voice advises user to complete KYC so withdrawal can be credited
        const timer = setTimeout(() => {
          speakKycPendingAdvice();
        }, 1200);
        return () => {
          clearTimeout(timer);
          stopAllVoiceAdvice();
        };
      } else if (isTaxActionRequired) {
        // Once they clear KYC and reach tax clearance, advise for tax clearance
        const timer = setTimeout(() => {
          speakTaxClearanceAdvice();
        }, 1200);
        return () => {
          clearTimeout(timer);
          stopAllVoiceAdvice();
        };
      } else if (needsNewUserQuickCodeAdvice && !showTelegramAdvert) {
        // Cheering female voice advises new user without a withdrawal or quick code to buy a quick code and earn
        const timer = setTimeout(() => {
          speakNewUserQuickCodeAdvice(user.id);
        }, 800);
        return () => {
          clearTimeout(timer);
          stopAllVoiceAdvice();
        };
      } else {
        // Silence once code is purchased / pending, or after KYC until tax clearance
        stopAllVoiceAdvice();
      }
    } else if (currentScreen === 'tax_clearance' && isTaxActionRequired) {
      const timer = setTimeout(() => {
        speakTaxClearanceAdvice();
      }, 1000);
      return () => {
        clearTimeout(timer);
        stopAllVoiceAdvice();
      };
    } else {
      stopAllVoiceAdvice();
    }
  }, [
    currentScreen,
    activeTab,
    showTelegramAdvert,
    hasUserWithdrawn,
    user?.id,
    user?.isKycVerified,
    user?.kycStatus,
    user?.withdrawalStatus,
    user?.lastWithdrawal?.taxStatus,
    user?.quickCodes,
    user?.submittedRequests,
    kycPendingWithdrawal,
    depositRequests,
    transactions,
  ]);

  // 3-Second Loading State (only for Quick Code, plan select, withdraw, or resuming after minimizing)
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [loadingTargetTitle, setLoadingTargetTitle] = useState<string>('9jacash');
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPageTransition = (title: string, onFinish: () => void) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    setLoadingTargetTitle(title);
    setIsPageLoading(true);

    loadingTimerRef.current = setTimeout(() => {
      setIsPageLoading(false);
      onFinish();
    }, 3000);
  };

  // Synchronize browser history so device hardware/gesture back button returns to dashboard
  useEffect(() => {
    // 1. Establish base dashboard state in browser history
    if (!window.history.state || window.history.state.screen === undefined) {
      window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
    }

    // 2. If entered with a specific hash URL, push the screen into history
    if (currentScreen !== 'dashboard') {
      window.history.pushState({ screen: currentScreen }, '', `#${currentScreen}`);
    }

    // 3. Handle device hardware/browser back button popstate
    const handlePopState = (event: PopStateEvent) => {
      const stateScreen = event.state?.screen as CurrentScreen | undefined;
      const target = !stateScreen || stateScreen === 'dashboard' ? 'dashboard' : stateScreen;
      
      // Returning back to dashboard from any page -> NO loading page
      if (target === 'dashboard') {
        setCurrentScreen('dashboard');
        setSelectedTxForPage(null);
        window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
      } else if (target === 'quickcode' || target === 'withdraw') {
        triggerPageTransition(SCREEN_TITLES[target] || 'Page', () => {
          setCurrentScreen(target);
        });
      } else {
        setCurrentScreen(target);
      }
    };

    // 4. Handle hash changes from address bar or back actions
    const handleHashChange = () => {
      const hashScreen = window.location.hash.replace('#', '') as CurrentScreen;
      const target = !hashScreen || hashScreen === 'dashboard' ? 'dashboard' : hashScreen;
      
      // Returning back to dashboard from any page -> NO loading page
      if (target === 'dashboard') {
        setCurrentScreen('dashboard');
        setSelectedTxForPage(null);
      } else if (target === 'quickcode' || target === 'withdraw') {
        triggerPageTransition(SCREEN_TITLES[target] || 'Page', () => {
          setCurrentScreen(hashScreen);
        });
      } else {
        setCurrentScreen(hashScreen);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (screen: CurrentScreen, tx?: Transaction | null) => {
    if (tx !== undefined) {
      setSelectedTxForPage(tx);
    }

    // Returning back to dashboard from any page -> NO loading page
    if (screen === 'dashboard') {
      setCurrentScreen('dashboard');
      setSelectedTxForPage(null);
      window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
      window.scrollTo(0, 0);
      return;
    }

    // Only Quick Code and Withdraw buttons trigger the 3-second loading page
    const shouldLoad = screen === 'quickcode' || screen === 'withdraw';

    if (shouldLoad) {
      const title = SCREEN_TITLES[screen] || (screen === 'quickcode' ? 'Quick Code Service' : 'Bank Withdrawal');
      triggerPageTransition(title, () => {
        window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
        window.history.pushState({ screen }, '', `#${screen}`);
        setCurrentScreen(screen);
        window.scrollTo(0, 0);
      });
    } else {
      // Immediate navigation without loading page
      window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
      window.history.pushState({ screen }, '', `#${screen}`);
      setCurrentScreen(screen);
      window.scrollTo(0, 0);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    // No loading page on payments, more, community, or any tab button
    setActiveTab(tab);
    setCurrentScreen('dashboard');
    setSelectedTxForPage(null);
    window.history.replaceState({ screen: 'dashboard' }, '', window.location.pathname);
    window.scrollTo(0, 0);
  };

  const handleOpenTransaction = (tx: Transaction) => {
    navigateTo('transaction_history', tx);
  };

  const handleQuickAction = (action: 'earn' | 'community' | 'withdraw' | 'quickcode' | 'deposit') => {
    if (action === 'community') {
      handleTabChange('community');
    } else {
      navigateTo(action);
    }
  };

  return (
    <div
      className={`min-h-screen selection:bg-amber-500 selection:text-black flex justify-center transition-colors duration-300 relative ${
        isLight ? 'bg-[#f4f6fa] text-slate-900' : 'bg-[#0b0c0e] text-stone-100'
      }`}
    >
      {/* Plenty of 1,000 Nigerian Naira Notes Floating in the Background */}
      <FloatingNairaNotes />

      {/* 3-Second Page Transition Loader */}
      <PageTransitionLoader
        isLoading={isPageLoading}
        targetTitle={loadingTargetTitle}
        durationMs={3000}
      />

      {/* New User Registration Telegram Advert */}
      <TelegramAdvertModal
        isOpen={showTelegramAdvert}
        onClose={() => setShowTelegramAdvert(false)}
        telegramUrl={communityLinks.telegramUrl || 'https://t.me/jacash1'}
        userName={user?.name}
      />

      {/* KYC Withdrawal Notice Popup Modal */}
      <KycNoticeModal
        isOpen={
          showKycNoticeModal &&
          !!user &&
          !user.isVMode &&
          (!kycPendingWithdrawal?.userId || kycPendingWithdrawal.userId === user?.id)
        }
        onClose={() => setShowKycNoticeModal(false)}
        onProceedToKyc={() => {
          setShowKycNoticeModal(false);
          navigateTo('kyc_verification');
        }}
        pendingWithdrawal={
          kycPendingWithdrawal && (!kycPendingWithdrawal.userId || kycPendingWithdrawal.userId === user?.id)
            ? kycPendingWithdrawal
            : null
        }
        userName={user?.name}
      />


      {/* Tax Approved & Tier 3 Upgrade Celebration Pop-up Modal */}
      <TaxApprovedTier3Modal
        isOpen={showTaxApprovedTier3Modal}
        onClose={() => {
          if (user) {
            const approvalToken =
              user.lastWithdrawal?.taxApprovedAt ||
              user.lastWithdrawal?.reference ||
              'tax_cleared';
            localStorage.setItem(`9jacash_tax_approved_ack_${user.id}_${approvalToken}`, 'true');
          }
          setShowTaxApprovedTier3Modal(false);
        }}
        onProceedToUpgrade={() => {
          if (user) {
            const approvalToken =
              user.lastWithdrawal?.taxApprovedAt ||
              user.lastWithdrawal?.reference ||
              'tax_cleared';
            localStorage.setItem(`9jacash_tax_approved_ack_${user.id}_${approvalToken}`, 'true');
          }
          setShowTaxApprovedTier3Modal(false);
          setTierUpgradeTargetTier(3);
          setTierUpgradeInitialStep('payment');
          navigateTo('upgrade_tier');
        }}
        withdrawalAmount={user?.lastWithdrawal?.amount}
        destinationBank={user?.lastWithdrawal?.bank}
        destinationAccountNumber={user?.lastWithdrawal?.accountNumber}
        reference={user?.lastWithdrawal?.reference}
      />

      {/* Admin Message & Screenshot Popup Modal */}
      <AdminMessagePopupModal />

      {/* Credit Alert Modal (Fires 6 seconds after new user registration for 150k bot earn rewards) */}
      <CreditAlertModal />

      {/* 2-Minute Post-Registration Profile Picture Prompt */}
      <ProfilePicturePromptModal
        isOpen={showProfilePicturePrompt && !!user && !user.profilePicture}
        onClose={dismissProfilePicturePrompt}
        onAddPicture={() => {
          dismissProfilePicturePrompt();
          setAutoOpenMoreEdit(true);
          handleTabChange('more');
        }}
        userName={user?.name}
      />

      {/* Floating Cashout Testimonies Pop Up (overlaps at top: shows for 3s, removes for 10s) */}
      <CashoutTestimoniesPopup isActive={currentScreen === 'dashboard'} />

      {/* Hanging Blue Support Toggle (middle-down right side) with unread reply badge */}
      {currentScreen !== 'admin' && !(currentScreen === 'dashboard' && activeTab === 'support') && (
        <FloatingSupportToggle
          unreadCount={unreadSupportCount}
          onOpenSupport={handleOpenSupportFromToggle}
        />
      )}

      {/* Global Device Push Notification Listener (receives company alerts even in background/minimized) */}
      <GlobalDeviceNotificationListener />

      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-lg mx-auto">
        <div className="absolute top-10 right-[-10%] w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[-15%] w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md min-h-screen px-4 pt-3 pb-24 flex flex-col space-y-4">
        {/* Render Dedicated Full Page Screens if active */}
        {currentScreen === 'earn' && (
          <EarnPage
            onBack={() => navigateTo('dashboard')}
            onUpgradeTier={() => navigateTo('upgrade_tier')}
          />
        )}

        {currentScreen === 'quickcode' && (
          <QuickCodePage
            onBack={() => navigateTo('dashboard')}
            onGoToWithdraw={() => navigateTo('withdraw')}
          />
        )}

        {currentScreen === 'deposit' && (
          <DepositPage onBack={() => navigateTo('dashboard')} />
        )}

        {currentScreen === 'withdraw' && (
          <WithdrawPage
            onBack={() => navigateTo('dashboard')}
            onProceedToKyc={() => navigateTo('kyc_verification')}
            onNavigateToQuickCode={() => navigateTo('quickcode')}
            onProceedToTaxClearance={() => navigateTo('tax_clearance')}
          />
        )}

        {currentScreen === 'tax_clearance' && (
          <TaxClearancePage
            onBack={() => navigateTo('dashboard')}
            onNavigateToSupport={() => navigateTo('live_chat')}
            onNavigateToUpgradeTier={() => {
              setTierUpgradeTargetTier(3);
              setTierUpgradeInitialStep('payment');
              navigateTo('upgrade_tier');
            }}
          />
        )}

        {currentScreen === 'account_details' && (
          <AccountDetailsPage
            onBack={() => navigateTo('dashboard')}
            onOpenSettings={() => navigateTo('settings')}
          />
        )}

        {currentScreen === 'transaction_history' && (
          <TransactionHistoryPage
            onBack={() => {
              navigateTo('dashboard');
              setSelectedTxForPage(null);
            }}
            initialSelectedTx={selectedTxForPage}
          />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsPage onBack={() => navigateTo('dashboard')} />
        )}

        {currentScreen === 'settings' && (
          <SettingsPage
            onBack={() => navigateTo('dashboard')}
            onOpenTerms={() => navigateTo('terms')}
          />
        )}

        {currentScreen === 'terms' && (
          <TermsPage onBack={() => navigateTo('dashboard')} />
        )}

        {currentScreen === 'admin' && (
          <AdminDashboardPage onBack={() => navigateTo('dashboard')} />
        )}

        {currentScreen === 'live_chat' && (
          <LiveChatPage
            onBack={() => navigateTo('dashboard')}
            onNavigateToQuickCode={() => navigateTo('quickcode')}
            onNavigateToWithdraw={() => navigateTo('withdraw')}
          />
        )}

        {currentScreen === 'upgrade_tier' && (
          <UpgradeTierPage
            onBack={() => navigateTo('dashboard')}
            initialSelectedTier={tierUpgradeTargetTier}
            initialStep={tierUpgradeInitialStep}
          />
        )}

        {currentScreen === 'referrals' && (
          <ReferralsPage onBack={() => navigateTo('dashboard')} />
        )}

        {currentScreen === 'bank_verification' && (
          <BankVerificationPage
            onBack={() => navigateTo('dashboard')}
            onProceedToWithdraw={() => navigateTo('withdraw')}
          />
        )}

        {currentScreen === 'kyc_verification' && (
          <KycVerificationPage onBack={() => navigateTo('dashboard')} />
        )}

        {/* Primary Dashboard View (Tabs) */}
        {currentScreen === 'dashboard' && (
          <>
            {/* Top Header */}
            <Header
              onOpenSettings={() => navigateTo('settings')}
              onOpenNotifications={() => navigateTo('notifications')}
            />

            {/* Android Device Notification Handler (status bar alerts on dashboard visit) */}
            <DeviceNotificationHandler isActive={currentScreen === 'dashboard'} />

            {/* Tab Switcher Content */}
            {activeTab === 'home' && (
              <main className="space-y-4 flex-1">
                {/* 1. Total Balance Card */}
                <BalanceCard
                  onNavigateToWithdraw={() => navigateTo('withdraw')}
                  onNavigateToDeposit={() => navigateTo('deposit')}
                />

                {/* KYC & Tax Clearance Action Required Banner */}
                <PendingKycBanner
                  onActivateKyc={() => navigateTo('kyc_verification')}
                  onProceedToTaxClearance={() => navigateTo('tax_clearance')}
                  onProceedToUpgradeTier={() => {
                    setTierUpgradeTargetTier(3);
                    setTierUpgradeInitialStep('payment');
                    navigateTo('upgrade_tier');
                  }}
                />

                {/* 2. 4 Quick Circular Action Buttons (Earn, Deposit, Withdraw, Quick Code) */}
                <QuickActions onActionClick={handleQuickAction} />

                {/* 3. Account Details & Transaction History Side-by-Side Cards */}
                <AccountCards
                  onOpenAccountDetails={() => navigateTo('account_details')}
                  onOpenTransactionHistory={() => {
                    setSelectedTxForPage(null);
                    navigateTo('transaction_history');
                  }}
                />

                {/* 4. Tier Upgrade Limit Banner */}
                <CashbackBanner
                  onLearnMore={() => navigateTo('upgrade_tier')}
                />

                {/* 5. Recent Transactions */}
                <RecentTransactions
                  onSeeAll={() => {
                    setSelectedTxForPage(null);
                    navigateTo('transaction_history');
                  }}
                  onQuickDeposit={() => navigateTo('deposit')}
                  onViewTransaction={handleOpenTransaction}
                />
              </main>
            )}

            {(activeTab === 'community' || activeTab === 'cards') && <CommunityTab />}

            {activeTab === 'payments' && (
              <PaymentsTab
                onQuickAction={(act) => {
                  if (act === 'deposit') navigateTo('deposit');
                  else if (act === 'withdraw') navigateTo('withdraw');
                  else if (act === 'admin') navigateTo('admin');
                }}
                onOpenAdmin={() => navigateTo('admin')}
              />
            )}

            {activeTab === 'support' && (
              <SupportTab onStartLiveChat={() => navigateTo('live_chat')} />
            )}

            {activeTab === 'more' && (
              <MoreTab
                onOpenAccountDetails={() => navigateTo('account_details')}
                onOpenSettings={() => navigateTo('settings')}
                onOpenTerms={() => navigateTo('terms')}
                onOpenUpgradeTier={() => navigateTo('upgrade_tier')}
                onOpenReferrals={() => navigateTo('referrals')}
                autoOpenEdit={autoOpenMoreEdit}
                onConsumeAutoOpenEdit={() => setAutoOpenMoreEdit(false)}
              />
            )}

            {/* Bottom Navigation */}
            <BottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              supportUnreadCount={unreadSupportCount}
            />
          </>
        )}
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { isAuthenticated, user, verifyActiveAccountOnAdminDashboard } = useAuth();
  const { isLight } = useTheme();

  // Strict Real-Internet Offline Guard:
  // Blocks dashboard whenever navigator.onLine is false OR real internet probe fails
  // (catches Wi-Fi with no internet, exhausted mobile data, and PWA cached opens).
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine === false : false;
  });
  const [hasCheckedInitialOnline, setHasCheckedInitialOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine === false : true;
  });
  const checkInFlightRef = useRef<boolean>(false);

  const runLiveConnectivityCheck = async (triggerAccountCheckIfBackOnline = false): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOffline(true);
      setHasCheckedInitialOnline(true);
      return false;
    }
    if (checkInFlightRef.current) {
      return !isOffline;
    }
    checkInFlightRef.current = true;
    try {
      const online = await verifyInternetConnection(3500);
      setIsOffline((wasOffline) => {
        if (wasOffline && online && triggerAccountCheckIfBackOnline) {
          verifyActiveAccountOnAdminDashboard().catch(() => {});
        }
        return !online;
      });
      setHasCheckedInitialOnline(true);
      return online;
    } finally {
      checkInFlightRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const performCheck = async (reconnected = false) => {
      if (!isMounted) return;
      await runLiveConnectivityCheck(reconnected);
    };

    // 1. Immediate real-internet probe on mount so offline PWA opens never show cached dashboard
    performCheck(false);

    // 2. Instant offline listener & verified online listener
    const handleOffline = () => {
      if (!isMounted) return;
      setIsOffline(true);
      setHasCheckedInitialOnline(true);
    };
    const handleOnline = () => {
      if (!isMounted) return;
      performCheck(true);
    };
    const handleVisibilityOrFocus = () => {
      if (!isMounted) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      performCheck(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 3. Background heartbeat every 10s to catch silent data exhaustion / dead Wi-Fi mid-session
    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      performCheck(true);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(heartbeat);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const handleRetryConnection = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOffline(true);
      return false;
    }
    const online = await verifyInternetConnection(4000);
    setIsOffline(!online);
    setHasCheckedInitialOnline(true);
    if (online) {
      verifyActiveAccountOnAdminDashboard().catch(() => {});
    }
    return online;
  };

  // If registered users already exist on this device, default to 'login' rather than 'register', UNLESS arriving via referral link
  const [authView, setAuthView] = useState<'register' | 'login'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('ref') || urlParams.get('referral') || urlParams.get('r') || urlParams.get('code') || window.location.href.includes('ref=')) {
          return 'register';
        }
      }
      const savedUsers = localStorage.getItem('9jacash_users_db');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        if (Array.isArray(users) && users.length > 0) {
          return 'login';
        }
      }
    } catch {}
    return 'register';
  });

  // If user is offline, strictly hide dashboard and show OfflineScreen
  if (isOffline) {
    return <OfflineScreen onRetry={handleRetryConnection} />;
  }

  // While initial real-internet probe is running for a logged-in session, never flash cached dashboard
  if (!hasCheckedInitialOnline && (isAuthenticated || user)) {
    return (
      <div
        className={`fixed inset-0 z-[99998] flex flex-col items-center justify-center p-6 text-center ${
          isLight ? 'bg-[#f4f6fa] text-slate-900' : 'bg-[#0b0c0e] text-white'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl border-2 border-amber-500/30 border-t-amber-400 animate-spin mb-4" />
        <p className="text-sm font-bold tracking-wide">Connecting to 9jacash...</p>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
          Verifying internet connection
        </p>
      </div>
    );
  }

  // If user is authenticated or restored from session, immediately show their current dashboard!
  if (!isAuthenticated && !user) {
    if (authView === 'register') {
      return (
        <div className="relative min-h-screen">
          <FloatingNairaNotes />
          <Register onSwitchToLogin={() => setAuthView('login')} />
        </div>
      );
    }
    return (
      <div className="relative min-h-screen">
        <FloatingNairaNotes />
        <Login onSwitchToRegister={() => setAuthView('register')} />
      </div>
    );
  }

  // If user's account is banned by admin, lock the screen to BannedAccountScreen
  if (user?.isBanned) {
    return <BannedAccountScreen />;
  }

  return <DashboardContent />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
