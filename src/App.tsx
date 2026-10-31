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
import { SpecialOfferModal } from './components/Modals/SpecialOfferModal.tsx';
import { AdminMessagePopupModal } from './components/Modals/AdminMessagePopupModal.tsx';
import { CreditAlertModal } from './components/Modals/CreditAlertModal.tsx';
import { BannedAccountScreen } from './components/Pages/BannedAccountScreen.tsx';
import { OfflineScreen } from './components/Common/OfflineScreen.tsx';
import { ActiveTab, CurrentScreen, Transaction } from './types/index.ts';

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
  } = useAuth();
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
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
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState<boolean>(false);

  // Special Offer Pop Up: "The special offer quick code advert pop up should only show once on user dashboard and not show again"
  useEffect(() => {
    // Show only on dashboard, only if not withdrawn, not banned, and logged in
    if (!user || user.isBanned || hasUserWithdrawn || currentScreen !== 'dashboard') {
      setShowSpecialOfferModal(false);
      return;
    }

    const offerStorageKey = `9jacash_special_offer_shown_${user.id}`;
    const hasAlreadyShown = localStorage.getItem(offerStorageKey) === 'true';

    // If the user has already seen this special offer advert, do NOT show it again
    if (hasAlreadyShown) {
      setShowSpecialOfferModal(false);
      return;
    }

    // Show once on dashboard after a short 2-second delay
    const timer = setTimeout(() => {
      if (localStorage.getItem(offerStorageKey) !== 'true') {
        setShowSpecialOfferModal(true);
        // Persist immediately that it has been shown once so it will never trigger again
        localStorage.setItem(offerStorageKey, 'true');
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [user?.id, hasUserWithdrawn, currentScreen]);

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

      {/* Special Offer Pop Up Modal (Free Quick Code for 50 Referrals - shows only once on user dashboard) */}
      <SpecialOfferModal
        isOpen={showSpecialOfferModal && currentScreen === 'dashboard' && !hasUserWithdrawn}
        onClose={() => {
          if (user?.id) {
            localStorage.setItem(`9jacash_special_offer_shown_${user.id}`, 'true');
          }
          setShowSpecialOfferModal(false);
        }}
        onNavigateToReferrals={() => {
          if (user?.id) {
            localStorage.setItem(`9jacash_special_offer_shown_${user.id}`, 'true');
          }
          setShowSpecialOfferModal(false);
          navigateTo('referrals');
        }}
      />

      {/* Admin Message & Screenshot Popup Modal */}
      <AdminMessagePopupModal />

      {/* Credit Alert Modal (Fires 6 seconds after new user registration for 150k bot earn rewards) */}
      <CreditAlertModal />

      {/* Floating Cashout Testimonies Pop Up (overlaps at top: shows for 3s, removes for 10s) */}
      <CashoutTestimoniesPopup isActive={currentScreen === 'dashboard'} />

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
          <UpgradeTierPage onBack={() => navigateTo('dashboard')} />
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
              />
            )}

            {/* Bottom Navigation */}
            <BottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Offline Guard: Prevent users from using the app when offline
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetryConnection = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      await fetch('/favicon.ico?_ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      setIsOffline(false);
      return true;
    } catch {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsOffline(false);
        return true;
      }
      return false;
    }
  };

  // If registered users already exist on this device, default to 'login' rather than 'register'
  const [authView, setAuthView] = useState<'register' | 'login'>(() => {
    try {
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

  // If user is offline, strictly block app usage
  if (isOffline) {
    return <OfflineScreen onRetry={handleRetryConnection} />;
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
