import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Transaction, AppNotification, CompanyAccount, CommunityLinks, DepositRequest, ReferralRecord, SafeWithdrawalAccount, AppPricing, DEFAULT_APP_PRICING, CreditAlertModalState, AdminQuickCode, QuickCodeItem } from '../types/index.ts';
import { soundFx } from '../utils/sound.ts';
import {
  SITE_DOMAIN,
  extractReferralCodeFromEmail,
  cleanReferralCodeInput,
  buildReferralLink,
  getDisplayReferralLink,
} from '../utils/referral.ts';
import {
  testConnection,
  saveUserToFirestore,
  subscribeToAllUsers,
  saveTransactionToFirestore,
  subscribeToUserTransactions,
  saveReferralRecordToFirestore,
  subscribeToAllReferrals,
  saveDepositRequestToFirestore,
  subscribeToDepositRequests,
  saveCompanyAccountToFirestore,
  subscribeToCompanyAccount,
  saveCommunityLinksToFirestore,
  subscribeToCommunityLinks,
  savePricingToFirestore,
  subscribeToPricing,
  saveNotificationToFirestore,
  subscribeToNotifications,
  deleteNotificationFromFirestore,
  saveSafePayoutAccountToFirestore,
  subscribeToSafePayoutAccounts,
  deleteSafePayoutAccountFromFirestore,
  getAllUsersFromFirestore,
  getAllDepositRequestsFromFirestore,
  saveAdminQuickCodeToFirestore,
  subscribeToAdminQuickCodes,
  deleteAdminQuickCodeFromFirestore,
  getUserFromFirestore,
  deleteUserFromFirestore,
  findUserByReferralCodeInFirestore,
  firebaseConfig,
} from '../services/firebase.ts';
import { sortTransactionsNewestFirst } from '../utils/transactionSort.ts';
import { safeLocalStorageSet, cleanStorageQuota } from '../utils/storage.ts';
import {
  sendWithdrawalDeviceNotification,
  sendCodePurchasedDeviceNotification,
  getOrCreateDeviceId,
} from '../utils/deviceNotifications.ts';
import {
  canRegisterAccountOnDevice,
  recordAccountOnDevice,
  getRegisteredAccountsOnDevice,
  DEVICE_ACCOUNTS_STORAGE_KEY,
} from '../utils/deviceLimit.ts';

export const TIER_LIMITS: Record<number, number> = {
  1: 400000,    // ₦400,000 for Tier 1
  2: 2000000,   // ₦2,000,000 for Tier 2
  3: 5000000,   // ₦5,000,000 for Tier 3
};

export const TIER_UPGRADE_PRICES: Record<number, number> = {
  2: 6600, // ₦6,600 to upgrade to Tier 2
  3: 8000, // ₦8,000 to upgrade to Tier 3
};

export const REFERRAL_BONUS_AMOUNT = 15000; // ₦15,000 instant bonus per referral
export const REFERRED_WELCOME_BONUS = 7000; // ₦7,000 welcome bonus for referred friend

interface AuthContextType {
  user: User | null;
  siteDomain: string;
  transactions: Transaction[];
  notifications: AppNotification[];
  companyAccount: CompanyAccount;
  communityLinks: CommunityLinks;
  depositRequests: DepositRequest[];
  referrals: ReferralRecord[];
  allUsers: User[];
  isAuthenticated: boolean;
  isBalanceHidden: boolean;
  toggleBalanceVisibility: () => void;
  showTelegramAdvert: boolean;
  setShowTelegramAdvert: (show: boolean) => void;
  showKycNoticeModal: boolean;
  setShowKycNoticeModal: (show: boolean) => void;
  kycPendingWithdrawal: { userId?: string; amount: number; bank: string; accountNumber: string; reference: string; date: string } | null;
  setKycPendingWithdrawal: (item: { userId?: string; amount: number; bank: string; accountNumber: string; reference: string; date: string } | null, targetUserId?: string) => void;
  getUserReferralCode: (targetUser?: User | null) => string;
  getUserReferralLink: (targetUser?: User | null, includeProtocol?: boolean) => string;
  getReferralDisplayLink: (targetUser?: User | null) => string;
  register: (name: string, email: string, pin: string, referralCode?: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'time' | 'reference'>) => void;
  formatNaira: (amount: number) => string;
  clearTransactions: () => void;
  getAllRegisteredUsers: () => User[];
  sendBroadcastNotification: (title: string, desc: string, type?: 'info' | 'success' | 'alert' | 'admin') => boolean;
  sendNotificationToUser: (
    userId: string,
    title: string,
    desc: string,
    type?: 'info' | 'success' | 'alert' | 'admin',
    extras?: {
      targetUserName?: string;
      screenshotUrl?: string;
      screenshotName?: string;
      isPopup?: boolean;
    }
  ) => boolean;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateCompanyAccount: (account: CompanyAccount) => void;
  updateCommunityLinks: (links: Partial<CommunityLinks>) => Promise<boolean>;
  submitDepositRequest: (
    amount: number,
    receiptName: string,
    requestType?: 'deposit' | 'quickcode' | 'upgrade' | 'kyc' | 'membership',
    planName?: string,
    withdrawalsCount?: number,
    receiptUrl?: string,
    targetTier?: number
  ) => DepositRequest | null;
  approveDepositRequest: (requestId: string) => boolean;
  declineDepositRequest: (requestId: string, reason?: string) => boolean;
  consumeQuickCode: (code: string) => boolean;
  withdrawFunds: (params: {
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    quickCode: string;
  }) => {
    success: boolean;
    requiresKyc?: boolean;
    requiresTax?: boolean;
    lastWithdrawal?: any;
    message?: string;
  };
  submitTaxPayment: (params: {
    senderBank: string;
    senderAccountName: string;
    receiptName: string;
    receiptUrl: string;
  }) => Promise<{ success: boolean; message?: string }>;
  approveTaxPaymentAndWithdrawal: (requestId: string) => boolean;
  banUserAccount: (userId: string, reason?: string) => boolean;
  upgradeTier: (targetTier: number, paymentReceiptName?: string) => { success: boolean; message?: string };
  getUserTierLimit: (tier?: number) => number;
  getUserReferrals: () => ReferralRecord[];
  refreshAllUsers: () => Promise<User[]>;
  banUser: (userId: string, reason?: string) => boolean;
  deleteUserAccount: (userId: string) => Promise<boolean>;
  unbanAccountWithCode: (code: string) => { success: boolean; message: string };
  setRecoveryCodeForUser: (userId: string, code: string) => boolean;
  generateNewRecoveryCodeForUser: (userId: string) => string;
  safePayoutAccounts: SafeWithdrawalAccount[];
  markSafePayoutAccountPaid: (accountId: string) => void;
  deleteSafePayoutAccount: (accountId: string) => void;
  sendDirectMessageToUser: (
    userId: string,
    title: string,
    desc: string,
    screenshotUrl?: string,
    screenshotName?: string,
    isPopup?: boolean
  ) => boolean;
  dismissDirectMessagePopup: (notifId: string) => void;
  updateUserAccountStatus: (userId: string, status: 'approved' | 'declined') => boolean;
  approveMembershipDirect: (userId: string) => boolean;
  setUserTierDirect: (userId: string, targetTier: number) => boolean;
  toggleVMode: (userId: string, targetStatus?: boolean) => boolean;
  toggleRequireMembership: (userId: string, targetStatus?: boolean) => boolean;
  updateUserName: (newName: string) => Promise<boolean>;
  updateUserPin: (newPin: string) => Promise<boolean>;
  claimDailyReward: () => { success: boolean; message?: string; amount?: number; remainingCooldownMs?: number };
  spinWheel: (prizeAmount: number) => {
    success: boolean;
    message?: string;
    amount?: number;
    creditedAmount?: number;
    pendingAmount?: number;
    spinsRemaining?: number;
  };
  getDailySpinsLeft: () => number;
  claimCandyMatchReward: (
    matchCount: number,
    isLevelWin?: boolean
  ) => {
    success: boolean;
    amount: number;
    creditedAmount: number;
    pendingAmount: number;
    message: string;
    newBalance: number;
  };
  claimSnakeCoinReward: (
    coinValue?: number,
    isSpecial?: boolean
  ) => {
    success: boolean;
    amount: number;
    creditedAmount: number;
    pendingAmount: number;
    message: string;
    newBalance: number;
  };
  hasUserWithdrawn: boolean;
  claimFreeReferralQuickCode: () => {
    success: boolean;
    code?: string;
    message: string;
  };
  appPricing: AppPricing;
  updateAppPricing: (newPricing: Partial<AppPricing>) => Promise<boolean>;
  creditAlertModal: CreditAlertModalState | null;
  dismissCreditAlertModal: () => void;
  adminQuickCodes: AdminQuickCode[];
  createAdminQuickCode: (customCode?: string, note?: string) => Promise<{ success: boolean; code?: string; message: string; quickCodeItem?: AdminQuickCode }>;
  deleteAdminQuickCode: (id: string) => Promise<void>;
  redeemAdminQuickCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = '9jacash_users_db';
const CURRENT_USER_KEY = '9jacash_current_session';
const TRANSACTIONS_PREFIX = '9jacash_tx_';
const NOTIFICATIONS_STORAGE_KEY = '9jacash_broadcast_notifications';
const COMPANY_ACCOUNT_STORAGE_KEY = '9jacash_company_account_config';
const APP_PRICING_STORAGE_KEY = '9jacash_app_pricing_config';
const COMMUNITY_LINKS_STORAGE_KEY = '9jacash_community_links_config';
const DEPOSIT_REQUESTS_STORAGE_KEY = '9jacash_deposit_requests_db';
const REFERRALS_STORAGE_KEY = '9jacash_referrals_db';
const SAFE_PAYOUTS_STORAGE_KEY = '9jacash_safe_payout_accounts_db';

const DEFAULT_COMPANY_ACCOUNT: CompanyAccount = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  isConfigured: false,
};

export const DEFAULT_COMMUNITY_LINKS: CommunityLinks = {
  telegramUrl: 'https://t.me/jacash1',
  telegramHandle: '@jacash1',
  whatsappUrl: 'https://whatsapp.com/channel/0029Va9jacashOfficial',
  agentTelegramUrl: 'https://t.me/jacash1',
  agentTelegramHandle: '@jacash1',
  announcement: 'Welcome to the official 9jacash community! Join our Telegram & WhatsApp channels for real-time updates, daily giveaways, and member support.',
  updatedAt: new Date().toISOString(),
};

function generateMembershipId(): string {
  return '9JA-' + Math.floor(100000 + Math.random() * 900000);
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

/**
 * Determines whether a notification is visible to a specific user.
 * - Global admin broadcasts (targetUserId === 'all' or isBroadcast === true) are visible to all users.
 * - Private notifications (targetUserId === currentUserId) are visible ONLY to that individual recipient.
 * - Notifications targeted to other specific users are strictly hidden.
 */
export const isGlobalBroadcastNotification = (n: AppNotification): boolean => {
  if (!n) return false;
  return n.targetUserId === 'all' || (n.isBroadcast === true && (!n.targetUserId || n.targetUserId === 'all'));
};

export const isNotificationVisibleToUser = (n: AppNotification, currentUserId?: string): boolean => {
  if (!n) return false;
  // If currentUserId was passed via array iterator (e.g. index number), ignore it
  const cleanUserId = typeof currentUserId === 'string' && currentUserId.trim() ? currentUserId.trim() : undefined;

  // 1. Explicit global broadcast addressed to 'all' or marked as broadcast with no other user specified
  if (isGlobalBroadcastNotification(n)) {
    return true;
  }

  // 2. Private direct notification explicitly targeted to this current user
  if (cleanUserId && n.targetUserId === cleanUserId) {
    return true;
  }

  // Any notification targeted to someone else is private and NOT visible to this user
  return false;
};

// Backwards-compatible alias for existing imports
export const isBroadcastNotification = (n: AppNotification, currentUserId?: string): boolean => {
  return isNotificationVisibleToUser(n, currentUserId);
};

export function normalizeUser(u: User | null): User | null {
  if (!u) return null;
  // Requirement: "And if a user account is on level 3 they don’t need to have pending earnings"
  if ((u.tier || 1) >= 3) {
    const pendingToRelease = u.pendingEarnings || 0;
    return {
      ...u,
      balance: (u.balance || 0) + pendingToRelease,
      availableBalance: (u.availableBalance ?? u.balance ?? 0) + pendingToRelease,
      pendingEarnings: 0,
    };
  }
  return u;
}

const getInitialUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser && parsedUser.id && parsedUser.email) {
        const expectedRef = extractReferralCodeFromEmail(parsedUser.email);
        if (!parsedUser.referralCode || parsedUser.referralCode.startsWith('9JA-')) {
          parsedUser.referralCode = expectedRef;
        }

        const normalized = normalizeUser(parsedUser);
        if (normalized) {
          safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    }

    // Only restore session if CURRENT_USER_KEY is explicitly set
  } catch (e) {
    console.error('Failed to load initial session', e);
  }
  return null;
};

const getInitialTransactions = (u: User | null): Transaction[] => {
  if (!u?.id) return [];
  try {
    const savedTx = localStorage.getItem(`${TRANSACTIONS_PREFIX}${u.id}`);
    if (savedTx) {
      return sortTransactionsNewestFirst(JSON.parse(savedTx));
    }
  } catch (e) {
    console.error('Failed to load initial transactions', e);
  }
  return [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const initU = getInitialUser();
    return getInitialTransactions(initU);
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount>(DEFAULT_COMPANY_ACCOUNT);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinks>(() => {
    try {
      const saved = localStorage.getItem(COMMUNITY_LINKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_COMMUNITY_LINKS, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_COMMUNITY_LINKS;
  });
  const [creditAlertModal, setCreditAlertModal] = useState<CreditAlertModalState | null>(null);

  const dismissCreditAlertModal = () => {
    setCreditAlertModal(null);
  };
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem(DEPOSIT_REQUESTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [appPricing, setAppPricing] = useState<AppPricing>(() => {
    try {
      const saved = localStorage.getItem(APP_PRICING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_APP_PRICING, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_APP_PRICING;
  });
  const [safePayoutAccounts, setSafePayoutAccounts] = useState<SafeWithdrawalAccount[]>(() => {
    try {
      const saved = localStorage.getItem(SAFE_PAYOUTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [adminQuickCodes, setAdminQuickCodes] = useState<AdminQuickCode[]>(() => {
    try {
      const saved = localStorage.getItem('9jacash_admin_quick_codes_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const adminQuickCodesRef = useRef<AdminQuickCode[]>(adminQuickCodes);
  const lastAutoSyncedHashRef = useRef<string>('');
  useEffect(() => {
    adminQuickCodesRef.current = adminQuickCodes;
  }, [adminQuickCodes]);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [showTelegramAdvert, setShowTelegramAdvertState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('9jacash_show_telegram_advert') === 'true';
    } catch {
      return false;
    }
  });

  const setShowTelegramAdvert = (show: boolean) => {
    setShowTelegramAdvertState(show);
    try {
      if (show) {
        sessionStorage.setItem('9jacash_show_telegram_advert', 'true');
      } else {
        sessionStorage.removeItem('9jacash_show_telegram_advert');
      }
    } catch {}
  };

  const [showKycNoticeModal, setShowKycNoticeModal] = useState<boolean>(false);
  const [kycPendingWithdrawal, setKycPendingWithdrawalState] = useState<{
    userId?: string;
    amount: number;
    bank: string;
    accountNumber: string;
    reference: string;
    date: string;
  } | null>(() => {
    try {
      const currentUser = getInitialUser();
      if (!currentUser) return null;
      const userKey = `9jacash_kyc_pending_withdrawal_${currentUser.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.userId || parsed.userId === currentUser.id) {
          return { ...parsed, userId: currentUser.id };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Keep kycPendingWithdrawal strictly in sync with the logged-in user (prevents leak across logout/new account creation)
  useEffect(() => {
    if (!user) {
      setKycPendingWithdrawalState(null);
      setShowKycNoticeModal(false);
      return;
    }
    try {
      const userKey = `9jacash_kyc_pending_withdrawal_${user.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.userId || parsed.userId === user.id) {
          setKycPendingWithdrawalState({ ...parsed, userId: user.id });
        } else {
          setKycPendingWithdrawalState(null);
        }
      } else {
        setKycPendingWithdrawalState(null);
      }
    } catch {
      setKycPendingWithdrawalState(null);
    }
  }, [user?.id]);

  const setKycPendingWithdrawal = (
    item: {
      userId?: string;
      amount: number;
      bank: string;
      accountNumber: string;
      reference: string;
      date: string;
    } | null,
    targetUserId?: string
  ) => {
    const activeUserId = targetUserId || item?.userId || userRef.current?.id || user?.id;
    if (item && activeUserId) {
      const itemWithUser = { ...item, userId: activeUserId };
      setKycPendingWithdrawalState(itemWithUser);
      try {
        safeLocalStorageSet(`9jacash_kyc_pending_withdrawal_${activeUserId}`, JSON.stringify(itemWithUser));
        localStorage.removeItem('9jacash_kyc_pending_withdrawal');
      } catch {}
    } else {
      setKycPendingWithdrawalState(null);
      try {
        if (activeUserId) {
          localStorage.removeItem(`9jacash_kyc_pending_withdrawal_${activeUserId}`);
        }
        localStorage.removeItem('9jacash_kyc_pending_withdrawal');
      } catch {}
    }
  };

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Load stored fallback data
  const loadStoredConfig = useCallback(() => {
    try {
      const savedNotifs = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (savedNotifs) {
        try {
          const parsed: AppNotification[] = JSON.parse(savedNotifs);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          } else {
            setNotifications([]);
          }
        } catch {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }

      const savedCompanyAcc = localStorage.getItem(COMPANY_ACCOUNT_STORAGE_KEY);
      if (savedCompanyAcc) {
        try {
          const parsed: CompanyAccount = JSON.parse(savedCompanyAcc);
          if (
            parsed &&
            parsed.isConfigured &&
            parsed.accountNumber &&
            parsed.accountNumber !== '9048291048' &&
            parsed.bankName
          ) {
            setCompanyAccount(parsed);
          } else {
            setCompanyAccount(DEFAULT_COMPANY_ACCOUNT);
            safeLocalStorageSet(COMPANY_ACCOUNT_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_ACCOUNT));
          }
        } catch {
          setCompanyAccount(DEFAULT_COMPANY_ACCOUNT);
        }
      } else {
        safeLocalStorageSet(COMPANY_ACCOUNT_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_ACCOUNT));
        setCompanyAccount(DEFAULT_COMPANY_ACCOUNT);
      }

      const savedCommunityLinks = localStorage.getItem(COMMUNITY_LINKS_STORAGE_KEY);
      if (savedCommunityLinks) {
        try {
          const parsed = JSON.parse(savedCommunityLinks);
          setCommunityLinks({ ...DEFAULT_COMMUNITY_LINKS, ...parsed });
        } catch {
          setCommunityLinks(DEFAULT_COMMUNITY_LINKS);
        }
      } else {
        safeLocalStorageSet(COMMUNITY_LINKS_STORAGE_KEY, JSON.stringify(DEFAULT_COMMUNITY_LINKS));
        setCommunityLinks(DEFAULT_COMMUNITY_LINKS);
      }

      const savedDepositReqs = localStorage.getItem(DEPOSIT_REQUESTS_STORAGE_KEY);
      if (savedDepositReqs) {
        setDepositRequests(JSON.parse(savedDepositReqs));
      }

      const savedReferrals = localStorage.getItem(REFERRALS_STORAGE_KEY);
      if (savedReferrals) {
        setReferrals(JSON.parse(savedReferrals));
      }

      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) {
        setAllUsers(JSON.parse(savedUsers));
      }
    } catch (e) {
      console.error('Failed to load stored configuration', e);
    }
  }, []);

  // Initialize session and test Firebase connection
  useEffect(() => {
    // Clean any bloated storage quota immediately
    try {
      cleanStorageQuota();
    } catch {}

    // 1. Check if Firebase project changed so stale local caches from a previous project are not mixed in
    const ACTIVE_PROJECT_KEY = '9jacash_active_firebase_project_id';
    const currentUserSession = getInitialUser();
    try {
      const lastProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (lastProjectId !== firebaseConfig.projectId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, firebaseConfig.projectId);
        const initialUsers = currentUserSession ? [currentUserSession] : [];
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
        setAllUsers(initialUsers);
        const initialDeps = Array.isArray(currentUserSession?.submittedRequests)
          ? currentUserSession.submittedRequests
          : [];
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(initialDeps));
        setDepositRequests(initialDeps);
      }
    } catch {}

    // 2. Test Firestore connection on boot
    testConnection();

    // 3. Verify active session user against Firestore (must be recorded on admin dashboard)
    const restoredUser = currentUserSession;
    if (restoredUser && restoredUser.id) {
      getUserFromFirestore(restoredUser.id)
        .then((cloudUser) => {
          if (!cloudUser) {
            // Account is NOT recorded on the admin dashboard -> It must NOT exist on the app!
            console.warn(`Account "${restoredUser.email || restoredUser.id}" is not recorded on admin dashboard. Purging from app.`);
            setUser(null);
            userRef.current = null;
            localStorage.removeItem(CURRENT_USER_KEY);
            setTransactions([]);
          } else {
            const normalized = normalizeUser(cloudUser) || cloudUser;
            setUser(normalized);
            userRef.current = normalized;
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(normalized));
            const restoredTx = getInitialTransactions(normalized);
            if (restoredTx.length > 0) {
              setTransactions(restoredTx);
            }
          }
        })
        .catch(() => {});
    }
    loadStoredConfig();
  }, [loadStoredConfig]);

  // Real-time Firebase Firestore subscriptions
  useEffect(() => {
    // 1. Subscribe to all registered users in Firestore
    const unsubUsers = subscribeToAllUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        // Also extract any submittedRequests embedded on user documents so Admin Dashboard always receives them
        const embeddedRequests: DepositRequest[] = [];
        cloudUsers.forEach((cu) => {
          if (Array.isArray(cu.submittedRequests)) {
            cu.submittedRequests.forEach((req) => {
              if (req && req.id && req.userId) {
                embeddedRequests.push(req);
              }
            });
          }
        });
        if (embeddedRequests.length > 0) {
          setDepositRequests((prevDeps) => {
            const depMap = new Map<string, DepositRequest>();
            prevDeps.forEach((d) => {
              if (d && d.id) depMap.set(d.id, d);
            });
            let changed = false;
            embeddedRequests.forEach((er) => {
              const existing = depMap.get(er.id);
              if (!existing) {
                depMap.set(er.id, er);
                changed = true;
              } else {
                const resolvedStatus =
                  existing.status !== 'pending'
                    ? existing.status
                    : er.status !== 'pending'
                    ? er.status
                    : existing.status;
                const resolvedReceiptUrl = existing.receiptUrl || er.receiptUrl || '';
                if (
                  resolvedStatus !== existing.status ||
                  resolvedReceiptUrl !== (existing.receiptUrl || '')
                ) {
                  depMap.set(er.id, {
                    ...er,
                    ...existing,
                    status: resolvedStatus,
                    receiptUrl: resolvedReceiptUrl,
                    declineReason: existing.declineReason || er.declineReason,
                    reviewedAt: existing.reviewedAt || er.reviewedAt,
                    approvedAt: existing.approvedAt || er.approvedAt,
                    generatedCode: existing.generatedCode || er.generatedCode,
                  });
                  changed = true;
                }
              }
            });
            if (!changed) return prevDeps;
            const nextDeps = Array.from(depMap.values());
            safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(nextDeps));
            return nextDeps;
          });
        }

        // MONOTONIC BALANCE INTEGRITY GUARD:
        // A stale background cloud snapshot must NEVER reduce any user's balance!
        setAllUsers((prevLocalUsers) => {
          const currentLoggedIn = userRef.current;
          const merged: User[] = cloudUsers.map((cu): User => {
            const isCurrent = currentLoggedIn && cu.id === currentLoggedIn.id;
            const localMatch = prevLocalUsers.find((p) => p.id === cu.id);
            const highestKnownBalance = Math.max(
              cu.balance || 0,
              isCurrent ? (currentLoggedIn.balance || 0) : (localMatch?.balance || 0)
            );
            const highestKnownAvailable = Math.max(
              cu.availableBalance || 0,
              isCurrent ? (currentLoggedIn.availableBalance || 0) : (localMatch?.availableBalance || 0)
            );
            const highestKnownPending = Math.max(
              cu.pendingEarnings || 0,
              isCurrent ? (currentLoggedIn.pendingEarnings || 0) : (localMatch?.pendingEarnings || 0)
            );

            const resolvedTier = Math.max(cu.tier || 1, (isCurrent ? currentLoggedIn.tier : localMatch?.tier) || 1);
            let finalBal = highestKnownBalance;
            let finalAvail = highestKnownAvailable;
            let finalPending = highestKnownPending;

            if (resolvedTier >= 3) {
              if (finalPending > 0) {
                finalBal += finalPending;
                finalAvail += finalPending;
              }
              finalPending = 0;
            }

            // Resolve withdrawalStatus and lastWithdrawal without letting stale localUser overwrite admin/tax updates
            const localStatus = (isCurrent ? currentLoggedIn.withdrawalStatus : localMatch?.withdrawalStatus);
            const cloudStatus = cu.withdrawalStatus;
            const resolvedWithdrawalStatus =
              localStatus === 'tax_pending' && cloudStatus === 'action_required'
                ? 'tax_pending'
                : cloudStatus || localStatus;

            const localLastWdr = isCurrent ? currentLoggedIn.lastWithdrawal : localMatch?.lastWithdrawal;
            const cloudLastWdr = cu.lastWithdrawal;
            const resolvedLastWithdrawal =
              localLastWdr?.taxStatus === 'pending' && cloudLastWdr?.taxStatus === 'action_required'
                ? localLastWdr
                : cloudLastWdr || localLastWdr;

            // Merge submittedRequests from cloud and local user (preserving non-pending status & receiptUrl)
            const localSubReqs = (isCurrent ? currentLoggedIn.submittedRequests : localMatch?.submittedRequests) || [];
            const cloudSubReqs = cu.submittedRequests || [];
            const subReqMap = new Map<string, DepositRequest>();
            cloudSubReqs.forEach((r) => {
              if (r && r.id) subReqMap.set(r.id, r);
            });
            localSubReqs.forEach((r) => {
              if (r && r.id) {
                const ex = subReqMap.get(r.id);
                if (!ex) {
                  subReqMap.set(r.id, r);
                } else {
                  const useLocalStatus = r.status !== 'pending' && ex.status === 'pending';
                  subReqMap.set(r.id, {
                    ...ex,
                    ...(useLocalStatus ? r : {}),
                    status: useLocalStatus ? r.status : ex.status,
                    receiptUrl: ex.receiptUrl || r.receiptUrl || '',
                    declineReason: r.declineReason || ex.declineReason,
                    reviewedAt: r.reviewedAt || ex.reviewedAt,
                    approvedAt: r.approvedAt || ex.approvedAt,
                  });
                }
              }
            });
            const mergedSubReqs = Array.from(subReqMap.values()).slice(0, 15);

            const localKycStatus = isCurrent ? currentLoggedIn.kycStatus : localMatch?.kycStatus;
            const resolvedKycStatus =
              localKycStatus && localKycStatus !== 'pending' && cu.kycStatus === 'pending'
                ? localKycStatus
                : cu.kycStatus || localKycStatus;

            const localMemStatus = isCurrent ? currentLoggedIn.membershipStatus : localMatch?.membershipStatus;
            const resolvedMemStatus =
              localMemStatus && localMemStatus !== 'pending' && cu.membershipStatus === 'pending'
                ? localMemStatus
                : cu.membershipStatus || localMemStatus;

            return {
              ...cu,
              kycStatus: resolvedKycStatus,
              membershipStatus: resolvedMemStatus,
              withdrawalStatus: resolvedWithdrawalStatus,
              lastWithdrawal: resolvedLastWithdrawal,
              submittedRequests: mergedSubReqs,
              balance: finalBal,
              availableBalance: finalAvail,
              pendingEarnings: finalPending,
              referralEarnings: Math.max(
                cu.referralEarnings || 0,
                isCurrent ? (currentLoggedIn.referralEarnings || 0) : (localMatch?.referralEarnings || 0)
              ),
              referralCount: Math.max(
                cu.referralCount || 0,
                isCurrent ? (currentLoggedIn.referralCount || 0) : (localMatch?.referralCount || 0)
              ),
              tier: resolvedTier,
            };
          });

          // Any account not recorded in Firestore / Admin Dashboard MUST NOT exist on the app!
          const cloudIds = new Set(cloudUsers.map((u) => u.id));
          if (currentLoggedIn && currentLoggedIn.id && !cloudIds.has(currentLoggedIn.id)) {
            console.warn(`User ${currentLoggedIn.id} is not recorded on the Admin Dashboard. Purging from app.`);
            userRef.current = null;
            setUser(null);
            localStorage.removeItem(CURRENT_USER_KEY);
            localStorage.removeItem(`9jacash_kyc_pending_withdrawal_${currentLoggedIn.id}`);
            localStorage.removeItem(`${TRANSACTIONS_PREFIX}${currentLoggedIn.id}`);
            setTransactions([]);
          }

          // Clean device account registry so deleted/unrecorded accounts do not linger on device
          try {
            const validEmails = new Set(cloudUsers.map((u) => (u.email || '').toLowerCase().trim()).filter(Boolean));
            const currentDeviceEmails = getRegisteredAccountsOnDevice();
            const cleanedDeviceEmails = currentDeviceEmails.filter((e: string) => validEmails.has(e.toLowerCase().trim()));
            safeLocalStorageSet(DEVICE_ACCOUNTS_STORAGE_KEY, JSON.stringify(cleanedDeviceEmails));
          } catch {}

          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });

        // If current user is logged in, sync their profile SAFELY (never reduce balance on its own!)
        const currentUid = userRef.current?.id;
        if (currentUid) {
          const freshCurrent = cloudUsers.find((u) => u.id === currentUid);
          if (freshCurrent) {
            const localUser = userRef.current;
            const safeTier = Math.max(freshCurrent.tier || 1, localUser?.tier || 1);
            let safeBalance = Math.max(freshCurrent.balance || 0, localUser?.balance || 0);
            let safeAvailable = Math.max(freshCurrent.availableBalance || 0, localUser?.availableBalance || 0);
            let safePending = Math.max(freshCurrent.pendingEarnings || 0, localUser?.pendingEarnings || 0);

            if (safeTier >= 3) {
              if (safePending > 0) {
                safeBalance += safePending;
                safeAvailable += safePending;
              }
              safePending = 0;
            }

            const resolvedWithdrawalStatus =
              localUser?.withdrawalStatus === 'tax_pending' && freshCurrent.withdrawalStatus === 'action_required'
                ? 'tax_pending'
                : freshCurrent.withdrawalStatus || localUser?.withdrawalStatus;

            const resolvedLastWithdrawal =
              localUser?.lastWithdrawal?.taxStatus === 'pending' && freshCurrent.lastWithdrawal?.taxStatus === 'action_required'
                ? localUser.lastWithdrawal
                : freshCurrent.lastWithdrawal || localUser?.lastWithdrawal;

            const localSubReqs = localUser?.submittedRequests || [];
            const cloudSubReqs = freshCurrent.submittedRequests || [];
            const subReqMap = new Map<string, DepositRequest>();
            cloudSubReqs.forEach((r) => {
              if (r && r.id) subReqMap.set(r.id, r);
            });
            localSubReqs.forEach((r) => {
              if (r && r.id && !subReqMap.has(r.id)) {
                subReqMap.set(r.id, r);
              }
            });
            const mergedSubReqs = Array.from(subReqMap.values()).slice(0, 15);

            const rawMergedUser: User = {
              ...freshCurrent,
              ...localUser,
              isKycVerified: freshCurrent.isKycVerified ?? localUser?.isKycVerified,
              kycStatus: freshCurrent.kycStatus ?? localUser?.kycStatus,
              accountStatus: freshCurrent.accountStatus ?? localUser?.accountStatus,
              isBanned: freshCurrent.isBanned ?? localUser?.isBanned,
              recoveryCode: freshCurrent.recoveryCode ?? localUser?.recoveryCode,
              withdrawalAccount: freshCurrent.withdrawalAccount || localUser?.withdrawalAccount,
              withdrawalStatus: resolvedWithdrawalStatus,
              lastWithdrawal: resolvedLastWithdrawal,
              submittedRequests: mergedSubReqs,
              quickCodes: freshCurrent.quickCodes || localUser?.quickCodes,
              tier: safeTier,
              // Strictly protected balances & referral statistics:
              balance: safeBalance,
              availableBalance: safeAvailable,
              pendingEarnings: safePending,
              referralEarnings: Math.max(freshCurrent.referralEarnings || 0, localUser?.referralEarnings || 0),
              referralCount: Math.max(freshCurrent.referralCount || 0, localUser?.referralCount || 0),
            };

            const mergedUser = normalizeUser(rawMergedUser) || rawMergedUser;

            userRef.current = mergedUser;
            setUser(mergedUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(mergedUser));

            // If local balance or referral count was ahead of Firestore, write back safely once (without runaway loops)
            const syncHash = `${mergedUser.id}_${safeBalance}_${safePending}_${mergedUser.referralCount || 0}`;
            const isAhead =
              safeBalance > (freshCurrent.balance || 0) ||
              safePending > (freshCurrent.pendingEarnings || 0) ||
              (mergedUser.referralCount || 0) > (freshCurrent.referralCount || 0);

            if (isAhead && lastAutoSyncedHashRef.current !== syncHash) {
              lastAutoSyncedHashRef.current = syncHash;
              saveUserToFirestore(mergedUser).catch(console.error);
            }
          } else if (userRef.current) {
            // User does not exist in Firestore / Admin Dashboard -> Remove session from app
            console.warn(`User ${userRef.current.id} does not exist on Admin Dashboard. Logging out.`);
            userRef.current = null;
            setUser(null);
            localStorage.removeItem(CURRENT_USER_KEY);
            setTransactions([]);
          }
        }
      } else {
        // If Firestore users collection is currently empty, no accounts exist on the admin dashboard
        setAllUsers([]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify([]));
        if (userRef.current) {
          userRef.current = null;
          setUser(null);
          localStorage.removeItem(CURRENT_USER_KEY);
          setTransactions([]);
        }
      }
    });

    // 2. Subscribe to company bank account info
    const unsubCompany = subscribeToCompanyAccount((account) => {
      if (
        account &&
        account.isConfigured &&
        account.accountNumber &&
        account.accountNumber !== '9048291048' &&
        account.bankName
      ) {
        setCompanyAccount(account);
        safeLocalStorageSet(COMPANY_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      } else if (account && account.isConfigured === false) {
        setCompanyAccount(DEFAULT_COMPANY_ACCOUNT);
        safeLocalStorageSet(COMPANY_ACCOUNT_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_ACCOUNT));
      }
    });

    // 3. Subscribe to official community links (Telegram & WhatsApp & Agent Telegram)
    const unsubCommunity = subscribeToCommunityLinks((cloudLinks) => {
      if (cloudLinks) {
        setCommunityLinks((prev) => {
          if (prev?.updatedAt && cloudLinks.updatedAt) {
            const localTime = new Date(prev.updatedAt).getTime();
            const cloudTime = new Date(cloudLinks.updatedAt).getTime();
            if (!isNaN(localTime) && !isNaN(cloudTime) && localTime > cloudTime) {
              return prev;
            }
          }
          const merged: CommunityLinks = {
            ...DEFAULT_COMMUNITY_LINKS,
            ...prev,
            ...cloudLinks,
            telegramUrl: cloudLinks.telegramUrl || prev?.telegramUrl || DEFAULT_COMMUNITY_LINKS.telegramUrl,
            telegramHandle: cloudLinks.telegramHandle || prev?.telegramHandle || DEFAULT_COMMUNITY_LINKS.telegramHandle,
            whatsappUrl: cloudLinks.whatsappUrl || prev?.whatsappUrl || DEFAULT_COMMUNITY_LINKS.whatsappUrl,
            agentTelegramUrl: cloudLinks.agentTelegramUrl || prev?.agentTelegramUrl || DEFAULT_COMMUNITY_LINKS.agentTelegramUrl,
            agentTelegramHandle: cloudLinks.agentTelegramHandle || prev?.agentTelegramHandle || DEFAULT_COMMUNITY_LINKS.agentTelegramHandle,
            announcement: cloudLinks.announcement !== undefined ? cloudLinks.announcement : prev?.announcement,
            updatedAt: cloudLinks.updatedAt || prev?.updatedAt || new Date().toISOString(),
          };
          safeLocalStorageSet(COMMUNITY_LINKS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    });

    // 4. Subscribe to deposit requests (for real-time admin review & instant user updates)
    const unsubDeposits = subscribeToDepositRequests((cloudDeposits) => {
      if (cloudDeposits) {
        setDepositRequests((prevLocal) => {
          const map = new Map<string, DepositRequest>();
          cloudDeposits.forEach((d) => {
            if (d && d.id) map.set(d.id, d);
          });
          // Preserve any local request or local status/receiptUrl if cloud hasn't synced it yet
          prevLocal.forEach((loc) => {
            if (!loc || !loc.id) return;
            const existingCloud = map.get(loc.id);
            if (!existingCloud) {
              map.set(loc.id, loc);
            } else {
              const localResolved = loc.status !== 'pending' && existingCloud.status === 'pending';
              const resolvedReceiptUrl = existingCloud.receiptUrl || loc.receiptUrl || '';
              const mergedItem: DepositRequest = {
                ...existingCloud,
                ...(localResolved ? loc : {}),
                status: localResolved ? loc.status : existingCloud.status,
                receiptUrl: resolvedReceiptUrl,
                declineReason: loc.declineReason || existingCloud.declineReason,
                reviewedAt: loc.reviewedAt || existingCloud.reviewedAt,
                approvedAt: loc.approvedAt || existingCloud.approvedAt,
                generatedCode: loc.generatedCode || existingCloud.generatedCode,
              };
              map.set(loc.id, mergedItem);
            }
          });
          const merged = Array.from(map.values());
          safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    });

    // 5. Subscribe to referrals collection (for affiliate tracking & rewards)
    const unsubReferrals = subscribeToAllReferrals((cloudReferrals: ReferralRecord[]) => {
      if (cloudReferrals) {
        setReferrals(cloudReferrals);
        safeLocalStorageSet(REFERRALS_STORAGE_KEY, JSON.stringify(cloudReferrals));
      }
    });

    // 6. Subscribe to notifications
    const unsubNotifs = subscribeToNotifications((cloudNotifs) => {
      if (cloudNotifs) {
        setNotifications(cloudNotifs);
        safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(cloudNotifs));
      }
    });

    // 7. Subscribe to safe payout accounts (Confirmed KYC withdrawal destination accounts)
    const unsubSafePayouts = subscribeToSafePayoutAccounts((cloudAccounts) => {
      if (cloudAccounts) {
        setSafePayoutAccounts(cloudAccounts);
        safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(cloudAccounts));
      }
    });

    // 8. Subscribe to app pricing settings (KYC and Quick Code prices)
    const unsubPricing = subscribeToPricing((cloudPricing) => {
      if (cloudPricing) {
        setAppPricing((prev) => {
          const merged: AppPricing = {
            ...DEFAULT_APP_PRICING,
            ...prev,
            ...cloudPricing,
          };
          safeLocalStorageSet(APP_PRICING_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    });

    // 9. Subscribe to admin universal quick codes
    const unsubAdminCodes = subscribeToAdminQuickCodes((cloudCodes) => {
      if (cloudCodes) {
        setAdminQuickCodes(cloudCodes);
        safeLocalStorageSet('9jacash_admin_quick_codes_cache', JSON.stringify(cloudCodes));
      }
    });

    return () => {
      unsubUsers();
      unsubCompany();
      unsubCommunity();
      unsubDeposits();
      unsubReferrals();
      unsubNotifs();
      unsubSafePayouts();
      unsubPricing();
      unsubAdminCodes();
    };
  }, []);

  // Listen to current user transactions in Firestore
  useEffect(() => {
    if (!user?.id) return;
    const unsubTx = subscribeToUserTransactions(user.id, (cloudTxs) => {
      if (cloudTxs && cloudTxs.length > 0) {
        const sorted = sortTransactionsNewestFirst(cloudTxs);
        setTransactions(sorted);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(sorted));
      }
    });
    return () => {
      unsubTx();
    };
  }, [user?.id]);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  const updateCompanyAccount = (newAccount: CompanyAccount) => {
    const updated: CompanyAccount = {
      ...newAccount,
      isConfigured: newAccount.isConfigured !== undefined ? newAccount.isConfigured : true,
      updatedAt: new Date().toISOString(),
    };
    safeLocalStorageSet(COMPANY_ACCOUNT_STORAGE_KEY, JSON.stringify(updated));
    setCompanyAccount(updated);
    saveCompanyAccountToFirestore(updated).catch(console.error);
  };

  const updateCommunityLinks = async (newLinks: Partial<CommunityLinks>): Promise<boolean> => {
    try {
      const current = communityLinks || DEFAULT_COMMUNITY_LINKS;
      const updated: CommunityLinks = {
        ...DEFAULT_COMMUNITY_LINKS,
        ...current,
        ...newLinks,
        updatedAt: new Date().toISOString(),
      };
      safeLocalStorageSet(COMMUNITY_LINKS_STORAGE_KEY, JSON.stringify(updated));
      setCommunityLinks(updated);
      await saveCommunityLinksToFirestore(updated);
      return true;
    } catch (err) {
      console.error('Failed to save community links to Firestore:', err);
      return false;
    }
  };

  const getAllRegisteredUsers = (): User[] => {
    if (allUsers.length > 0) return allUsers;
    try {
      const existingUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (existingUsersRaw) {
        return JSON.parse(existingUsersRaw);
      }
      return [];
    } catch {
      return [];
    }
  };

  const sendBroadcastNotification = (
    title: string,
    desc: string,
    type: 'info' | 'success' | 'alert' | 'admin' = 'admin'
  ): boolean => {
    try {
      const newNotif: AppNotification = {
        id: 'broadcast_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        desc: desc.trim(),
        time: 'Just now',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type,
        targetUserId: 'all',
        targetUserName: 'All Users',
        isBroadcast: true,
      };

      setNotifications((prev) => {
        const updatedList = [newNotif, ...prev];
        safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedList));
        return updatedList;
      });
      saveNotificationToFirestore(newNotif).catch(console.error);
      return true;
    } catch (e) {
      console.error('Failed to send broadcast notification', e);
      return false;
    }
  };

  const sendNotificationToUser = (
    userId: string,
    title: string,
    desc: string,
    type: 'info' | 'success' | 'alert' | 'admin' = 'info',
    extras?: {
      targetUserName?: string;
      screenshotUrl?: string;
      screenshotName?: string;
      isPopup?: boolean;
    }
  ): boolean => {
    try {
      const newNotif: AppNotification = {
        id: 'notif_user_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        desc: desc.trim(),
        time: 'Just now',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type,
        targetUserId: userId,
        targetUserName: extras?.targetUserName,
        isBroadcast: false,
        screenshotUrl: extras?.screenshotUrl,
        screenshotName: extras?.screenshotName,
        isPopup: extras?.isPopup ?? false,
        isViewed: false,
      };

      setNotifications((prev) => {
        const updatedList = [newNotif, ...prev];
        safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedList));
        return updatedList;
      });
      saveNotificationToFirestore(newNotif).catch(console.error);
      return true;
    } catch (e) {
      console.error('Failed to send private user notification', e);
      return false;
    }
  };

  const deleteNotification = (id: string) => {
    try {
      const updatedList = notifications.filter((n) => n.id !== id);
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedList));
      setNotifications(updatedList);
      deleteNotificationFromFirestore(id).catch(console.error);
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const clearAllNotifications = () => {
    try {
      const idsToDelete = notifications.map((n) => n.id);
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      setNotifications([]);
      idsToDelete.forEach((id) => {
        deleteNotificationFromFirestore(id).catch(console.error);
      });
    } catch (e) {
      console.error('Failed to clear all notifications', e);
    }
  };

  // Submit a deposit, quick code, account upgrade, or KYC verification request (Enters Pending Approval state in Firebase)
  const submitDepositRequest = (
    amount: number,
    receiptName: string,
    requestType: 'deposit' | 'quickcode' | 'upgrade' | 'kyc' | 'membership' = 'deposit',
    planName?: string,
    withdrawalsCount?: number,
    receiptUrl?: string,
    targetTier?: number
  ): DepositRequest | null => {
    const activeUser = userRef.current || user;
    if (!activeUser) return null;

    // Check if user already has a pending request for this specific non-deposit type so we can update/re-push it cleanly
    const existingPendingSameType =
      requestType !== 'deposit'
        ? depositRequests.find(
            (r) => r.userId === activeUser.id && r.requestType === requestType && r.status === 'pending'
          )
        : undefined;

    const refPrefix = requestType === 'deposit'
      ? 'DEP9JA'
      : (requestType === 'upgrade' ? 'UPG9JA' : (requestType === 'kyc' ? 'KYC9JA' : (requestType === 'membership' ? 'MEM9JA' : 'QC9JA')));
    const reference = existingPendingSameType?.reference || (refPrefix + Math.floor(10000000 + Math.random() * 90000000));
    const resolvedTier = targetTier || (requestType === 'upgrade' ? 2 : undefined);
    const resolvedPlanName = requestType === 'quickcode'
      ? (planName || '1 Withdrawal Plan')
      : (requestType === 'upgrade'
        ? (planName || `Tier ${resolvedTier} Upgrade`)
        : (requestType === 'kyc'
          ? (planName || 'KYC Account Verification Fee')
          : (requestType === 'membership'
            ? (planName || 'Official Membership Group Registration (₦9,200)')
            : undefined)));

    const reqId = existingPendingSameType?.id || ('dpr_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900));

    const newRequest: DepositRequest = {
      id: reqId,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      amount,
      bankName: companyAccount.bankName || 'Company Bank',
      accountNumber: companyAccount.accountNumber || '',
      receiptName: receiptName || 'payment_receipt.png',
      receiptUrl: receiptUrl || existingPendingSameType?.receiptUrl || '',
      requestType,
      targetTier: resolvedTier,
      planName: resolvedPlanName,
      withdrawalsCount: requestType === 'quickcode' ? (withdrawalsCount || 1) : undefined,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reference,
    };

    // V MODE: If user has V Mode set by admin, auto-verify Quick Code payment immediately without admin approval
    // (User is not notified that they are in V Mode; it appears as standard instant automated verification)
    if (requestType === 'quickcode' && activeUser.isVMode) {
      const assignedCode = '9JA-' + Math.floor(1000 + Math.random() * 9000);
      const newCodeItem = {
        code: assignedCode,
        planName: resolvedPlanName || '1 Withdrawal Plan',
        withdrawalsLeft: withdrawalsCount || 1,
      };

      const approvedRequest: DepositRequest = {
        ...newRequest,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        generatedCode: assignedCode,
      };

      const userCodes = activeUser.quickCodes || [];
      const prevSubReqs = (activeUser.submittedRequests || []).filter((r) => r.id !== approvedRequest.id);
      const updatedUser: User = {
        ...activeUser,
        quickCodes: [newCodeItem, ...userCodes],
        submittedRequests: [approvedRequest, ...prevSubReqs].slice(0, 15),
      };
      userRef.current = updatedUser;
      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);

      const existingUsers = getAllRegisteredUsers();
      const uIdx = existingUsers.findIndex((u) => u.id === activeUser.id);
      if (uIdx !== -1) {
        existingUsers[uIdx] = updatedUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      }

      setDepositRequests((prev) => {
        const updatedRequests = [approvedRequest, ...prev.filter((r) => r.id !== approvedRequest.id)];
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      saveDepositRequestToFirestore(approvedRequest).catch(console.error);

      const now = new Date();
      const nowMs = Date.now();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const approvedTx: Transaction = {
        id: 'tx_app_' + nowMs,
        type: 'quickcode',
        title: 'Quick Code Approved',
        subtitle: `Quick Code Generated: ${assignedCode}`,
        amount,
        date: dateStr,
        time: timeStr,
        isCredit: false,
        status: 'successful',
        reference,
        timestamp: nowMs,
        createdAt: now.toISOString(),
      };

      const updatedTxList = sortTransactionsNewestFirst([approvedTx, ...transactions]);
      setTransactions(updatedTxList);
      safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${activeUser.id}`, JSON.stringify(updatedTxList));
      saveTransactionToFirestore(approvedTx, activeUser.id).catch(console.error);

      sendNotificationToUser(
        activeUser.id,
        'Quick Code Approved! 🔑',
        `Your payment of ${formatNaira(amount)} has been approved. Your withdrawal authorization code is: ${assignedCode}. You can now proceed to withdraw!`,
        'success',
        { targetUserName: activeUser.name }
      );

      // Trigger device notification: Quick Code is successfully purchased
      sendCodePurchasedDeviceNotification(assignedCode, resolvedPlanName).catch(console.warn);

      return approvedRequest;
    }

    // Embed request inside user's submittedRequests and sync user doc to Firestore so Admin Dashboard ALWAYS sees it
    const prevUserRequests = (activeUser.submittedRequests || []).filter((r) => r.id !== newRequest.id);
    const updatedUserWithReq: User = {
      ...activeUser,
      ...(requestType === 'kyc' ? { kycStatus: 'pending' as const, kycReference: reference } : {}),
      ...(requestType === 'membership' ? { membershipStatus: 'pending' as const, membershipReference: reference } : {}),
      submittedRequests: [newRequest, ...prevUserRequests].slice(0, 15),
    };
    userRef.current = updatedUserWithReq;
    setUser(updatedUserWithReq);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUserWithReq));
    saveUserToFirestore(updatedUserWithReq).catch(console.error);

    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === activeUser.id);
      const nextUsers = exists
        ? prev.map((u) => (u.id === activeUser.id ? updatedUserWithReq : u))
        : [updatedUserWithReq, ...prev];
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
      return nextUsers;
    });

    setDepositRequests((prev) => {
      const updatedRequests = [newRequest, ...prev.filter((r) => r.id !== newRequest.id)];
      safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
      return updatedRequests;
    });
    saveDepositRequestToFirestore(newRequest).catch(console.error);

    const now = new Date();
    const nowMs = Date.now();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const txType = requestType === 'deposit'
      ? 'deposit'
      : (requestType === 'upgrade'
        ? 'upgrade'
        : (requestType === 'kyc' || requestType === 'membership' ? 'transfer' : 'quickcode'));
    const txTitle = requestType === 'deposit'
      ? 'Wallet Deposit'
      : (requestType === 'upgrade'
        ? `Account Upgrade to Tier ${resolvedTier}`
        : (requestType === 'kyc'
          ? 'KYC Account Verification Fee'
          : (requestType === 'membership'
            ? 'Official Membership Group Fee'
            : 'Quick Code Purchase')));
    const txSubtitle = requestType === 'deposit'
      ? 'Deposit Pending • Waiting company approval'
      : (requestType === 'upgrade'
        ? `Tier ${resolvedTier} Upgrade Pending • Waiting company approval`
        : (requestType === 'kyc'
          ? 'KYC Payment Pending (₦22,000) • Waiting company approval'
          : (requestType === 'membership'
            ? 'Membership Group Pending (₦9,200) • Awaiting Instant Clearance'
            : 'Quick Code Purchase Pending • Waiting company approval')));

    const newTx: Transaction = {
      id: 'tx_' + nowMs,
      type: txType,
      title: txTitle,
      subtitle: txSubtitle,
      amount,
      date: dateStr,
      time: timeStr,
      isCredit: requestType === 'deposit',
      status: 'pending',
      reference,
      timestamp: nowMs,
      createdAt: now.toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions.filter((t) => t.reference !== reference)]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${activeUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, activeUser.id).catch(console.error);

    return newRequest;
  };

  // Company/Admin approves a deposit/upgrade/KYC request -> credits wallet balance, issues quick code, upgrades account, or verifies KYC
  const approveDepositRequest = (requestId: string): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      let foundReq = depositRequests.find((r) => r.id === requestId);

      // Fallback: check embedded submittedRequests across all users if not in depositRequests state yet
      if (!foundReq) {
        for (const u of existingUsers) {
          const match = (u.submittedRequests || []).find((r) => r.id === requestId);
          if (match) {
            foundReq = { ...match };
            break;
          }
        }
      }

      // Fallback for synthesized KYC or Membership requests
      if (!foundReq && (requestId.startsWith('synth_kyc_') || requestId.startsWith('synth_mem_'))) {
        const isSynthKyc = requestId.startsWith('synth_kyc_');
        const synthUid = requestId.replace(isSynthKyc ? 'synth_kyc_' : 'synth_mem_', '');
        const uMatch = existingUsers.find((u) => u.id === synthUid);
        if (uMatch) {
          foundReq = {
            id: requestId,
            userId: uMatch.id,
            userName: uMatch.name || 'User',
            userEmail: uMatch.email || '',
            amount: isSynthKyc ? (appPricing?.kycPrice ?? 22000) : 9200,
            bankName: companyAccount?.bankName || 'Company Account',
            accountNumber: companyAccount?.accountNumber || '',
            receiptName: isSynthKyc ? 'KYC_Receipt.png' : 'Membership_Receipt.png',
            requestType: isSynthKyc ? 'kyc' : 'membership',
            planName: isSynthKyc ? 'KYC Account Verification Fee' : 'Official Membership Group Registration (₦9,200)',
            status: 'pending',
            submittedAt: new Date().toISOString(),
            reference: (isSynthKyc ? uMatch.kycReference : uMatch.membershipReference) || `REF-${uMatch.id.slice(0, 6).toUpperCase()}`,
          };
        }
      }

      if (!foundReq || foundReq.status !== 'pending') return false;

      const isTaxPayment = foundReq.requestType === 'tax_payment';
      if (isTaxPayment) {
        return approveTaxPaymentAndWithdrawal(requestId);
      }

      const isKyc = foundReq.requestType === 'kyc';
      const isUpgrade = foundReq.requestType === 'upgrade';
      const isMembership = foundReq.requestType === 'membership';
      const isDeposit = foundReq.requestType === 'deposit' || (!foundReq.planName && !foundReq.requestType && !isUpgrade && !isKyc && !isMembership && !isTaxPayment);

      const assignedQuickCode = (!isKyc && !isUpgrade && !isDeposit && !isMembership)
        ? ('9JA-' + Math.floor(1000 + Math.random() * 9000))
        : undefined;

      const targetReq: DepositRequest = {
        ...foundReq,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        ...(assignedQuickCode ? { generatedCode: assignedQuickCode } : {}),
      };

      setDepositRequests((prev) => {
        const exists = prev.some((r) => r.id === requestId);
        const updatedRequests = exists
          ? prev.map((r) => (r.id === requestId ? targetReq : r))
          : [targetReq, ...prev];
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      saveDepositRequestToFirestore(targetReq).catch(console.error);

      const targetUserIdx = existingUsers.findIndex((u) => u.id === targetReq.userId);
      const syncUserSubmittedReqs = (u: User): DepositRequest[] => {
        const currentList = u.submittedRequests || [];
        const hasId = currentList.some((r) => r.id === targetReq.id);
        return (hasId
          ? currentList.map((r) => (r.id === targetReq.id ? targetReq : r))
          : [targetReq, ...currentList]
        ).slice(0, 15);
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (isKyc) {
        // KYC APPROVAL:
        let destAmount = 0;
        let destBank = 'Bank';
        let destAccNumber = '';
        let destAccName = '';
        let destRef = '';

        if (targetUserIdx !== -1) {
          const targetUser = existingUsers[targetUserIdx];
          destBank = targetUser.withdrawalAccount?.bank || targetUser.lastWithdrawal?.bank || 'Bank';
          destAccNumber = targetUser.withdrawalAccount?.accountNumber || targetUser.lastWithdrawal?.accountNumber || targetReq.accountNumber || '';
          destAccName = targetUser.withdrawalAccount?.accountName || targetUser.lastWithdrawal?.accountName || targetReq.userName || targetUser.name;
          destAmount = targetUser.withdrawalAccount?.amount || targetUser.lastWithdrawal?.amount || targetReq.withdrawalAmount || 100000;
          destRef = targetUser.withdrawalAccount?.reference || targetUser.lastWithdrawal?.reference || targetReq.reference;

          const taxAmount = Math.round(destAmount * 0.119); // 11.9%
          const updatedTargetUser: User = {
            ...targetUser,
            isKycVerified: true,
            kycStatus: 'approved',
            withdrawalStatus: 'action_required',
            submittedRequests: syncUserSubmittedReqs(targetUser),
            lastWithdrawal: {
              amount: destAmount,
              bank: destBank,
              accountNumber: destAccNumber,
              accountName: destAccName,
              reference: destRef,
              date: dateStr,
              taxAmount,
              taxStatus: 'action_required',
            },
          };
          existingUsers[targetUserIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);

          if (user && user.id === targetReq.userId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }

          if (destAmount > 0) {
            const safeAccountItem: SafeWithdrawalAccount = {
              id: 'safe_' + targetReq.userId + '_' + Date.now(),
              userId: targetReq.userId,
              userName: targetReq.userName || updatedTargetUser.name,
              userEmail: targetReq.userEmail || updatedTargetUser.email,
              bank: destBank,
              accountNumber: destAccNumber,
              accountName: destAccName,
              amount: destAmount,
              reference: destRef,
              date: dateStr,
              confirmedAt: new Date().toISOString(),
              status: 'pending',
            };

            setSafePayoutAccounts((prev) => {
              const merged = [safeAccountItem, ...prev.filter((a) => a.userId !== targetReq.userId || a.reference !== destRef)];
              safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(merged));
              return merged;
            });
            saveSafePayoutAccountToFirestore(safeAccountItem).catch(console.error);
          }
        }

        const approvedKycTx: Transaction = {
          id: 'tx_app_kyc_' + Date.now(),
          type: 'transfer',
          title: 'KYC Account Verification Fee',
          subtitle: 'KYC Verification Approved & Account Activated',
          amount: targetReq.amount || 22000,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'successful',
          reference: targetReq.reference,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        let userTxsToUpdate: Transaction[] = [];
        if (user && user.id === targetReq.userId) {
          userTxsToUpdate = transactions;
        } else {
          try {
            const raw = localStorage.getItem(`${TRANSACTIONS_PREFIX}${targetReq.userId}`);
            userTxsToUpdate = raw ? JSON.parse(raw) : [];
          } catch {
            userTxsToUpdate = [];
          }
        }

        const updatedUserTxs = userTxsToUpdate.map((t) => {
          if (t.reference === targetReq.reference) {
            return approvedKycTx;
          }
          if (t.type === 'withdraw' && t.status === 'pending') {
            const taxNoticeTx: Transaction = {
              ...t,
              title: 'Withdrawal (Action Required)',
              subtitle: t.subtitle.replace('• Pending KYC Verification', '• Action Required: 11.9% Tax Fee (99% Done)'),
            };
            saveTransactionToFirestore(taxNoticeTx, targetReq.userId).catch(console.error);
            return taxNoticeTx;
          }
          return t;
        });

        const hasKycTx = updatedUserTxs.some((t) => t.reference === targetReq.reference);
        const finalTxs = sortTransactionsNewestFirst(hasKycTx ? updatedUserTxs : [approvedKycTx, ...updatedUserTxs]);

        if (user && user.id === targetReq.userId) {
          setTransactions(finalTxs);
        }
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${targetReq.userId}`, JSON.stringify(finalTxs));
        saveTransactionToFirestore(approvedKycTx, targetReq.userId).catch(console.error);

        sendNotificationToUser(
          targetReq.userId,
          `KYC Approved • 99% Done 🛡️`,
          `Your KYC has been approved! You are 99% done with your first withdrawal approval. Action Required: Remit 11.9% tax fee to complete bank disbursement.`,
          'alert',
          { targetUserName: targetReq.userName }
        );
      } else if (isUpgrade) {
        // TIER UPGRADE: Increase tier holding limit and unlock pending earnings
        const targetTier = targetReq.targetTier || 2;
        const newLimit = TIER_LIMITS[targetTier] || TIER_LIMITS[3];

        if (targetUserIdx !== -1) {
          const targetUser = existingUsers[targetUserIdx];
          const currentHeldPending = targetUser.pendingEarnings || 0;
          let pendingToRelease = 0;
          let remainingPending = 0;
          let finalBalance = targetUser.balance || 0;

          if (targetTier >= 3) {
            pendingToRelease = currentHeldPending;
            remainingPending = 0;
            finalBalance = (targetUser.balance || 0) + pendingToRelease;
          } else {
            const availableRoom = Math.max(0, newLimit - (targetUser.balance || 0));
            pendingToRelease = Math.min(currentHeldPending, availableRoom);
            remainingPending = currentHeldPending - pendingToRelease;
            finalBalance = (targetUser.balance || 0) + pendingToRelease;
          }

          const updatedTargetUser: User = {
            ...targetUser,
            tier: targetTier,
            balance: finalBalance,
            availableBalance: finalBalance,
            pendingEarnings: remainingPending,
            submittedRequests: syncUserSubmittedReqs(targetUser),
          };

          existingUsers[targetUserIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);

          if (user && user.id === targetReq.userId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }
        }

        const approvedTx: Transaction = {
          id: 'tx_app_' + Date.now(),
          type: 'upgrade',
          title: `Account Upgrade to Tier ${targetTier}`,
          subtitle: `Tier ${targetTier} Approved & Activated • Limit increased to ₦${newLimit.toLocaleString()}`,
          amount: targetReq.amount,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'successful',
          reference: targetReq.reference,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        if (user && user.id === targetReq.userId) {
          const updatedTxs = transactions.map((t) =>
            t.reference === targetReq.reference ? approvedTx : t
          );
          const hasTx = updatedTxs.some((t) => t.reference === targetReq.reference);
          const finalTxs = sortTransactionsNewestFirst(hasTx ? updatedTxs : [approvedTx, ...transactions]);
          setTransactions(finalTxs);
          safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(finalTxs));
        }
        saveTransactionToFirestore(approvedTx, targetReq.userId).catch(console.error);

        sendNotificationToUser(
          targetReq.userId,
          `Account Upgraded to Tier ${targetTier}! 🚀`,
          `Your payment was verified and approved by the company. Your account is now upgraded to Tier ${targetTier}!`,
          'success',
          { targetUserName: targetReq.userName }
        );
      } else if (isDeposit) {
        // WALLET DEPOSIT: Credit the user's dashboard balance
        if (targetUserIdx !== -1) {
          const targetUser = existingUsers[targetUserIdx];
          const newBalance = (targetUser.balance || 0) + targetReq.amount;
          const newAvailBalance = (targetUser.availableBalance || 0) + targetReq.amount;
          const updatedTargetUser: User = {
            ...targetUser,
            balance: newBalance,
            availableBalance: newAvailBalance,
            submittedRequests: syncUserSubmittedReqs(targetUser),
          };
          existingUsers[targetUserIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);

          if (user && user.id === targetReq.userId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }
        }

        const approvedTx: Transaction = {
          id: 'tx_app_' + Date.now(),
          type: 'deposit',
          title: 'Wallet Deposit',
          subtitle: 'Deposit Approved & Credited by Company',
          amount: targetReq.amount,
          date: dateStr,
          time: timeStr,
          isCredit: true,
          status: 'successful',
          reference: targetReq.reference,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        if (user && user.id === targetReq.userId) {
          const updatedTxs = transactions.map((t) =>
            t.reference === targetReq.reference ? approvedTx : t
          );
          const hasTx = updatedTxs.some((t) => t.reference === targetReq.reference);
          const finalTxs = sortTransactionsNewestFirst(hasTx ? updatedTxs : [approvedTx, ...transactions]);
          setTransactions(finalTxs);
          safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(finalTxs));
        }
        saveTransactionToFirestore(approvedTx, targetReq.userId).catch(console.error);

        sendNotificationToUser(
          targetReq.userId,
          `Deposit of ${formatNaira(targetReq.amount)} Approved! 🎉`,
          `Your wallet deposit has been verified and credited to your balance.`,
          'success',
          { targetUserName: targetReq.userName }
        );
      } else if (isMembership) {
        // MEMBERSHIP APPROVAL: Grant membership group verification without banning account
        if (targetUserIdx !== -1) {
          const targetUser = existingUsers[targetUserIdx];
          const updatedTargetUser: User = {
            ...targetUser,
            isMembershipPaid: true,
            membershipStatus: 'approved',
            isBanned: false,
            bannedAt: undefined,
            bannedReason: undefined,
            recoveryCode: undefined,
            submittedRequests: syncUserSubmittedReqs(targetUser),
          };
          existingUsers[targetUserIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);

          if (user && user.id === targetReq.userId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }
        }

        const approvedTx: Transaction = {
          id: 'tx_app_mem_' + Date.now(),
          type: 'transfer',
          title: 'Official Membership Group Fee',
          subtitle: 'Membership Verified & Approved Successfully',
          amount: targetReq.amount || 9200,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'successful',
          reference: targetReq.reference,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        let userTxsToUpdate: Transaction[] = [];
        if (user && user.id === targetReq.userId) {
          userTxsToUpdate = transactions;
        } else {
          try {
            const raw = localStorage.getItem(`${TRANSACTIONS_PREFIX}${targetReq.userId}`);
            userTxsToUpdate = raw ? JSON.parse(raw) : [];
          } catch {
            userTxsToUpdate = [];
          }
        }

        const updatedTxs = userTxsToUpdate.map((t) =>
          t.reference === targetReq.reference ? approvedTx : t
        );
        const hasTx = updatedTxs.some((t) => t.reference === targetReq.reference);
        const finalTxs = sortTransactionsNewestFirst(hasTx ? updatedTxs : [approvedTx, ...userTxsToUpdate]);
        if (user && user.id === targetReq.userId) {
          setTransactions(finalTxs);
        }
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${targetReq.userId}`, JSON.stringify(finalTxs));
        saveTransactionToFirestore(approvedTx, targetReq.userId).catch(console.error);

        sendNotificationToUser(
          targetReq.userId,
          'Official Membership Approved ✅',
          'Your official 9jacash membership group verification has been approved! Full platform access is unlocked.',
          'success',
          { targetUserName: targetReq.userName }
        );
      } else {
        // QUICK CODE PURCHASE: Generate Quick Code & assign to user
        const assignedCode = assignedQuickCode || ('9JA-' + Math.floor(1000 + Math.random() * 9000));
        const newCodeItem = {
          code: assignedCode,
          planName: targetReq.planName || '1 Withdrawal Plan',
          withdrawalsLeft: targetReq.withdrawalsCount || 1,
        };

        if (targetUserIdx !== -1) {
          const targetUser = existingUsers[targetUserIdx];
          const userCodes = targetUser.quickCodes || [];
          const updatedTargetUser: User = {
            ...targetUser,
            quickCodes: [newCodeItem, ...userCodes],
            submittedRequests: syncUserSubmittedReqs(targetUser),
          };
          existingUsers[targetUserIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);

          if (user && user.id === targetReq.userId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }
        }

        const approvedTx: Transaction = {
          id: 'tx_app_' + Date.now(),
          type: 'quickcode',
          title: 'Quick Code Approved',
          subtitle: `Quick Code Generated: ${assignedCode}`,
          amount: targetReq.amount,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'successful',
          reference: targetReq.reference,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        if (user && user.id === targetReq.userId) {
          const updatedTxs = transactions.map((t) =>
            t.reference === targetReq.reference ? approvedTx : t
          );
          const hasTx = updatedTxs.some((t) => t.reference === targetReq.reference);
          const finalTxs = sortTransactionsNewestFirst(hasTx ? updatedTxs : [approvedTx, ...transactions]);
          setTransactions(finalTxs);
          safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(finalTxs));
        }
        saveTransactionToFirestore(approvedTx, targetReq.userId).catch(console.error);

        sendNotificationToUser(
          targetReq.userId,
          `Quick Code Approved! 🔑`,
          `Your payment of ${formatNaira(targetReq.amount)} has been approved. Your withdrawal authorization code is: ${assignedCode}. You can now proceed to withdraw!`,
          'success',
          { targetUserName: targetReq.userName }
        );

        // Trigger device notification: Quick Code is successfully purchased
        sendCodePurchasedDeviceNotification(assignedCode, targetReq.planName).catch(console.warn);
      }

      return true;
    } catch (e) {
      console.error('Failed to approve deposit request', e);
      return false;
    }
  };

  // Company/Admin declines a deposit/upgrade/KYC/tax/membership request
  const declineDepositRequest = (requestId: string, reason?: string): boolean => {
    try {
      const declineReason = (reason && reason.trim()) ? reason.trim() : 'Payment receipt could not be verified.';
      const existingUsers = getAllRegisteredUsers();
      let targetReq = depositRequests.find((r) => r.id === requestId);

      // Check embedded submittedRequests across all users if not in depositRequests state yet
      if (!targetReq) {
        for (const u of existingUsers) {
          const match = (u.submittedRequests || []).find((r) => r.id === requestId);
          if (match) {
            targetReq = { ...match };
            break;
          }
        }
      }

      // Support declining synthesized tax request if depositRequest wasn't in array
      if (!targetReq && requestId.startsWith('synth_tax_')) {
        const synthUserId = requestId.replace('synth_tax_', '');
        const uIdx = existingUsers.findIndex((u) => u.id === synthUserId);
        if (uIdx !== -1) {
          const targetUser = existingUsers[uIdx];
          const synthDeclinedReq: DepositRequest = {
            id: `req_tax_${Date.now()}`,
            userId: targetUser.id,
            userName: targetUser.name || 'User',
            userEmail: targetUser.email || '',
            amount: targetUser.lastWithdrawal?.taxAmount || Math.round((targetUser.lastWithdrawal?.amount || 100000) * 0.119),
            withdrawalAmount: targetUser.lastWithdrawal?.amount || 100000,
            destinationBank: targetUser.lastWithdrawal?.bank || '',
            destinationAccountNumber: targetUser.lastWithdrawal?.accountNumber || '',
            destinationAccountName: targetUser.lastWithdrawal?.accountName || targetUser.name || '',
            senderBank: targetUser.lastWithdrawal?.taxSenderBank || '',
            senderAccountName: targetUser.lastWithdrawal?.taxSenderName || '',
            bankName: companyAccount?.bankName || 'Company Account',
            accountNumber: companyAccount?.accountNumber || '',
            receiptName: targetUser.lastWithdrawal?.taxReceiptName || 'tax-receipt.jpg',
            receiptUrl: targetUser.lastWithdrawal?.taxProofUrl || '',
            requestType: 'tax_payment',
            status: 'declined',
            declineReason: declineReason,
            submittedAt: targetUser.lastWithdrawal?.taxSubmittedAt || new Date().toISOString(),
            reviewedAt: new Date().toISOString(),
            reference: targetUser.lastWithdrawal?.reference || `TAX-${targetUser.id.slice(0, 6).toUpperCase()}`,
          };
          const updatedTargetUser: User = {
            ...targetUser,
            withdrawalStatus: 'action_required',
            submittedRequests: [synthDeclinedReq, ...(targetUser.submittedRequests || [])].slice(0, 15),
            lastWithdrawal: targetUser.lastWithdrawal
              ? {
                  ...targetUser.lastWithdrawal,
                  taxStatus: 'action_required',
                  taxDeclinedReason: declineReason,
                }
              : undefined,
          };
          existingUsers[uIdx] = updatedTargetUser;
          setAllUsers([...existingUsers]);
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
          saveUserToFirestore(updatedTargetUser).catch(console.error);
          if (user && user.id === synthUserId) {
            userRef.current = updatedTargetUser;
            setUser(updatedTargetUser);
            safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
          }

          setDepositRequests((prev) => {
            const updatedReqList = [synthDeclinedReq, ...prev];
            safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedReqList));
            return updatedReqList;
          });
          saveDepositRequestToFirestore(synthDeclinedReq).catch(console.error);

          sendNotificationToUser(
            synthUserId,
            'Tax Clearance Declined ⚠️',
            `Your 11.9% tax payment could not be verified: ${declineReason}. Please transfer from an authorized commercial bank (strictly no OPay or PalmPay) and re-upload your proof.`,
            'alert'
          );
          return true;
        }
        return false;
      }

      // Support declining synthesized KYC or Membership requests
      if (!targetReq && (requestId.startsWith('synth_kyc_') || requestId.startsWith('synth_mem_'))) {
        const isSynthKyc = requestId.startsWith('synth_kyc_');
        const synthUserId = requestId.replace(isSynthKyc ? 'synth_kyc_' : 'synth_mem_', '');
        const uMatch = existingUsers.find((u) => u.id === synthUserId);
        if (uMatch) {
          const matchingSub = (uMatch.submittedRequests || []).find(
            (r) => r.requestType === (isSynthKyc ? 'kyc' : 'membership')
          );
          targetReq = matchingSub || {
            id: requestId,
            userId: uMatch.id,
            userName: uMatch.name || 'User',
            userEmail: uMatch.email || '',
            amount: isSynthKyc ? (appPricing?.kycPrice ?? 22000) : 9200,
            bankName: companyAccount?.bankName || 'Company Account',
            accountNumber: companyAccount?.accountNumber || '',
            receiptName: isSynthKyc ? 'KYC_Payment_Receipt.png' : 'Membership_Payment_Receipt.png',
            receiptUrl: '',
            requestType: isSynthKyc ? 'kyc' : 'membership',
            planName: isSynthKyc ? 'KYC Account Verification Fee' : 'Official Membership Group Registration (₦9,200)',
            status: 'pending',
            submittedAt: uMatch.createdAt || new Date().toISOString(),
            reference: (isSynthKyc ? uMatch.kycReference : uMatch.membershipReference) || `REF-${uMatch.id.slice(0, 6).toUpperCase()}`,
          };
        }
      }

      if (!targetReq) return false;
      const updatedReq: DepositRequest = {
        ...targetReq,
        status: 'declined',
        declineReason: declineReason,
        reviewedAt: new Date().toISOString(),
      };

      setDepositRequests((prev) => {
        const exists = prev.some((r) => r.id === targetReq!.id || r.id === requestId);
        const updatedRequests = exists
          ? prev.map((r) => (r.id === targetReq!.id || r.id === requestId ? updatedReq : r))
          : [updatedReq, ...prev];
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      saveDepositRequestToFirestore(updatedReq).catch(console.error);

      const isTaxPayment = targetReq.requestType === 'tax_payment';
      const isKyc = targetReq.requestType === 'kyc';
      const isUpgrade = targetReq.requestType === 'upgrade';
      const isMembership = targetReq.requestType === 'membership';
      const isDeposit = targetReq.requestType === 'deposit' || (!targetReq.planName && !targetReq.requestType && !isUpgrade && !isKyc && !isMembership && !isTaxPayment);
      const targetUserIdx = existingUsers.findIndex((u) => u.id === targetReq!.userId);

      if (targetUserIdx !== -1) {
        const targetUser = existingUsers[targetUserIdx];
        const prevSub = targetUser.submittedRequests || [];
        const nextSub = (prevSub.some((r) => r.id === updatedReq.id || r.id === requestId)
          ? prevSub.map((r) => (r.id === updatedReq.id || r.id === requestId ? updatedReq : r))
          : [updatedReq, ...prevSub]
        ).slice(0, 15);

        const updatedTargetUser: User = {
          ...targetUser,
          submittedRequests: nextSub,
          ...(isTaxPayment
            ? {
                withdrawalStatus: 'action_required' as const,
                lastWithdrawal: targetUser.lastWithdrawal
                  ? {
                      ...targetUser.lastWithdrawal,
                      taxStatus: 'action_required' as const,
                      taxDeclinedReason: declineReason,
                    }
                  : undefined,
              }
            : {}),
          ...(isKyc ? { kycStatus: 'declined' as const } : {}),
          ...(isMembership ? { membershipStatus: 'declined' as const } : {}),
        };
        existingUsers[targetUserIdx] = updatedTargetUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
        saveUserToFirestore(updatedTargetUser).catch(console.error);

        if (user && user.id === targetReq.userId) {
          userRef.current = updatedTargetUser;
          setUser(updatedTargetUser);
          safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedTargetUser));
        }

        if (isTaxPayment) {
          sendNotificationToUser(
            targetReq.userId,
            'Tax Clearance Declined ⚠️',
            `Your 11.9% tax payment could not be verified: ${declineReason}. Please transfer from an authorized commercial bank (strictly no OPay or PalmPay) and re-upload your proof.`,
            'alert'
          );
        }
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const declinedTxType = isDeposit ? 'deposit' : (isUpgrade ? 'upgrade' : (isKyc || isTaxPayment ? 'transfer' : 'quickcode'));
      const declinedTxTitle = isDeposit ? 'Wallet Deposit Declined' : (isUpgrade ? 'Account Upgrade Declined' : (isKyc ? 'KYC Verification Declined' : (isTaxPayment ? 'Tax Clearance Declined' : 'Quick Code Declined')));

      const declinedTx: Transaction = {
        id: 'tx_dec_' + Date.now(),
        type: declinedTxType,
        title: declinedTxTitle,
        subtitle: `Declined: ${declineReason}`,
        amount: targetReq.amount,
        date: dateStr,
        time: timeStr,
        isCredit: isDeposit,
        status: 'failed',
        reference: targetReq.reference,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      if (user && user.id === targetReq.userId) {
        const updatedTxs = transactions.map((t) =>
          t.reference === targetReq.reference ? declinedTx : t
        );
        const hasTx = updatedTxs.some((t) => t.reference === targetReq.reference);
        const finalTxs = sortTransactionsNewestFirst(hasTx ? updatedTxs : [declinedTx, ...transactions]);
        setTransactions(finalTxs);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(finalTxs));
      }
      saveTransactionToFirestore(declinedTx, targetReq.userId).catch(console.error);

      const declineNoticeTitle = isKyc
        ? 'KYC Verification Declined ❌'
        : (isDeposit ? 'Wallet Deposit Declined ❌' : (isUpgrade ? 'Tier Upgrade Declined ❌' : 'Quick Code Declined ❌'));

      sendNotificationToUser(
        targetReq.userId,
        declineNoticeTitle,
        `Your payment request of ${formatNaira(targetReq.amount)} was declined. Reason: ${declineReason}`,
        'alert',
        { targetUserName: targetReq.userName }
      );

      return true;
    } catch (e) {
      console.error('Failed to decline deposit request', e);
      return false;
    }
  };

  // Consume a quick code when used for a successful withdrawal
  const consumeQuickCode = (code: string): boolean => {
    try {
      if (!user) return false;
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return false;
      const userCodes = user.quickCodes || [];

      const codeIdx = userCodes.findIndex((item) => {
        if (typeof item === 'string') return item.trim().toUpperCase() === cleanCode;
        return item.code.trim().toUpperCase() === cleanCode;
      });

      if (codeIdx === -1) return false;

      const targetItem = userCodes[codeIdx];
      const updatedCodes = [...userCodes];

      if (typeof targetItem === 'string') {
        updatedCodes.splice(codeIdx, 1);
      } else if (
        targetItem.withdrawalsLeft >= 999 ||
        targetItem.planName?.toLowerCase().includes('unlimited')
      ) {
        // Unlimited plan: code never decrements or expires
      } else {
        if (targetItem.withdrawalsLeft > 1) {
          updatedCodes[codeIdx] = {
            ...targetItem,
            withdrawalsLeft: targetItem.withdrawalsLeft - 1,
          };
        } else {
          updatedCodes.splice(codeIdx, 1);
        }
      }

      const updatedUser = {
        ...user,
        quickCodes: updatedCodes,
      };

      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);
      return true;
    } catch (e) {
      console.error('Failed to consume quick code', e);
      return false;
    }
  };

  // Atomic withdrawal processor
  const withdrawFunds = (params: {
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    quickCode: string;
  }): {
    success: boolean;
    requiresKyc?: boolean;
    requiresTax?: boolean;
    lastWithdrawal?: any;
    message?: string;
  } => {
    try {
      if (!user) {
        return { success: false, message: 'User session not found.' };
      }

      if (params.amount <= 0 || params.amount > user.balance) {
        return { success: false, message: 'Insufficient wallet balance.' };
      }

      if (params.amount < 100000) {
        return { success: false, message: 'Minimum withdrawal amount is ₦100,000.' };
      }

      const cleanCode = params.quickCode.trim().toUpperCase();
      const userCodes = user.quickCodes || [];

      const codeIdx = userCodes.findIndex((item) => {
        if (typeof item === 'string') return item.trim().toUpperCase() === cleanCode;
        return item.code.trim().toUpperCase() === cleanCode;
      });

      let updatedCodes = [...userCodes];

      if (codeIdx !== -1) {
        const targetItem = userCodes[codeIdx];
        if (typeof targetItem === 'string') {
          updatedCodes.splice(codeIdx, 1);
        } else if (
          targetItem.withdrawalsLeft >= 999 ||
          targetItem.planName?.toLowerCase().includes('unlimited')
        ) {
          // Unlimited plan: never decrements or expires
        } else {
          if (targetItem.withdrawalsLeft > 1) {
            updatedCodes[codeIdx] = {
              ...targetItem,
              withdrawalsLeft: targetItem.withdrawalsLeft - 1,
            };
          } else {
            updatedCodes.splice(codeIdx, 1);
          }
        }
      } else {
        // Check if matching Admin Universal Quick Code exists
        // Can be used once by any user; expires in 10 minutes from creation
        const matchingAdminCode = adminQuickCodesRef.current.find(
          (c) => c.code.trim().toUpperCase() === cleanCode
        );

        if (!matchingAdminCode) {
          return {
            success: false,
            message: 'Invalid or expired Quick Code. Please verify your code or purchase an active Quick Code.',
          };
        }

        if (matchingAdminCode.status === 'used') {
          return {
            success: false,
            message: 'This Quick Code has already been used and is expired.',
          };
        }

        const nowMs = Date.now();
        if (nowMs > matchingAdminCode.expiresTimestamp || matchingAdminCode.status === 'expired') {
          saveAdminQuickCodeToFirestore({
            ...matchingAdminCode,
            status: 'expired',
          }).catch(console.error);
          return {
            success: false,
            message: 'This Quick Code has expired. It was not used within 10 minutes of creation.',
          };
        }

        // Mark Admin Quick Code as USED! Once used by any user, it expires immediately
        const usedCodeItem: AdminQuickCode = {
          ...matchingAdminCode,
          status: 'used',
          usedByUserId: user.id,
          usedByUserName: user.name,
          usedByUserEmail: user.email,
          usedAt: new Date().toISOString(),
        };

        saveAdminQuickCodeToFirestore(usedCodeItem).catch(console.error);
        setAdminQuickCodes((prev) =>
          prev.map((c) => (c.id === usedCodeItem.id ? usedCodeItem : c))
        );
      }

      const withdrawalAccountData = {
        bank: params.bank,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        amount: params.amount,
        reference: '', // will be assigned below
        date: '', // will be assigned below
      };

      const now = new Date();
      const nowMs = now.getTime();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const reference = 'TX9JA' + Math.floor(1000000000 + Math.random() * 9000000000);

      withdrawalAccountData.reference = reference;
      withdrawalAccountData.date = dateStr;

      const updatedBalance = Math.max(0, user.balance - params.amount);

      // V-MODE USER:
      // "If a user is on v mode, they don't need to do tax before successfully withdrawing
      // If they withdraw it will show successful smoothly, don't let them know if they are on v mode"
      if (user.isVMode) {
        const lastWithdrawalData = {
          amount: params.amount,
          bank: params.bank,
          accountNumber: params.accountNumber,
          accountName: params.accountName,
          reference,
          date: dateStr,
          taxAmount: 0,
          taxStatus: 'approved' as const,
        };

        const updatedUser: User = {
          ...user,
          balance: updatedBalance,
          availableBalance: updatedBalance,
          quickCodes: updatedCodes,
          isKycVerified: true,
          kycStatus: 'approved',
          withdrawalStatus: 'completed',
          lastWithdrawal: lastWithdrawalData,
          withdrawalAccount: withdrawalAccountData,
        };

        userRef.current = updatedUser;
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        saveUserToFirestore(updatedUser).catch(console.error);
        setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

        const newTx: Transaction = {
          id: 'tx_wdr_' + nowMs,
          type: 'withdraw',
          title: 'Withdrawal to Bank',
          subtitle: `To: ${params.bank} - ${params.accountNumber} (${params.accountName.toUpperCase()}) • Transferred Successfully`,
          amount: params.amount,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'successful',
          reference,
          timestamp: nowMs,
          createdAt: now.toISOString(),
        };

        const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
        setTransactions(updatedTxList);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(updatedTxList));
        saveTransactionToFirestore(newTx, user.id).catch(console.error);

        // Safe payout record marked as confirmed
        const safeAccountItem: SafeWithdrawalAccount = {
          id: 'safe_' + user.id + '_' + Date.now(),
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          bank: params.bank,
          accountNumber: params.accountNumber,
          accountName: params.accountName,
          amount: params.amount,
          reference,
          date: dateStr,
          confirmedAt: new Date().toISOString(),
          status: 'confirmed',
        };

        setSafePayoutAccounts((prev) => {
          const merged = [safeAccountItem, ...prev.filter((a) => a.userId !== user.id || a.reference !== reference)];
          safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
        saveSafePayoutAccountToFirestore(safeAccountItem).catch(console.error);

        sendWithdrawalDeviceNotification(params.amount, params.bank, params.accountNumber).catch(console.warn);

        sendNotificationToUser(
          user.id,
          'Withdrawal Successful! 🚀',
          `Your withdrawal of ${formatNaira(params.amount)} to ${params.bank} (${params.accountNumber}) was processed and transferred successfully.`,
          'success'
        );

        return {
          success: true,
          requiresKyc: false,
          requiresTax: false,
          lastWithdrawal: lastWithdrawalData,
          message: 'Withdrawal successful! Funds transferred to your bank account.',
        };
      }

      // Normal users without verified KYC have their withdrawal placed on pending until KYC (₦22,000) is completed and approved
      if (!user.isKycVerified) {
        const updatedUser: User = {
          ...user,
          balance: updatedBalance,
          availableBalance: updatedBalance,
          quickCodes: updatedCodes,
          withdrawalStatus: 'pending_kyc',
          withdrawalAccount: withdrawalAccountData,
        };

        userRef.current = updatedUser;
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        saveUserToFirestore(updatedUser).catch(console.error);
        setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

        const newTx: Transaction = {
          id: 'tx_wdr_' + nowMs,
          type: 'withdraw',
          title: 'Withdrawal (Pending KYC)',
          subtitle: `To: ${params.bank} - ${params.accountNumber} (${params.accountName.toUpperCase()}) • Pending KYC Verification`,
          amount: params.amount,
          date: dateStr,
          time: timeStr,
          isCredit: false,
          status: 'pending',
          reference,
          timestamp: nowMs,
          createdAt: now.toISOString(),
        };

        const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
        setTransactions(updatedTxList);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(updatedTxList));
        saveTransactionToFirestore(newTx, user.id).catch(console.error);

        sendWithdrawalDeviceNotification(params.amount, params.bank, params.accountNumber).catch(console.warn);

        setKycPendingWithdrawal(
          {
            userId: user.id,
            amount: params.amount,
            bank: params.bank,
            accountNumber: params.accountNumber,
            reference,
            date: dateStr,
          },
          user.id
        );
        setShowKycNoticeModal(true);
        return { success: true, requiresKyc: true };
      }

      // KYC VERIFIED USER:
      // "once a user KYC have been approved successfully, their withdrawal will Not be successful yet,
      // it will show them action required, if they proceed it will load a new page showing the amount
      // they withdraw and the account they withdraw to, it will now let them know that they are 99 percent done
      // with first withdrawal approval. They will now need to pay TAX fee (11.9%) into the company account."
      const taxAmount = Math.round(params.amount * 0.119); // 11.9%
      const lastWithdrawalData = {
        amount: params.amount,
        bank: params.bank,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        reference,
        date: dateStr,
        taxAmount,
        taxStatus: 'action_required' as const,
      };

      const updatedUser: User = {
        ...user,
        balance: updatedBalance,
        availableBalance: updatedBalance,
        quickCodes: updatedCodes,
        withdrawalStatus: 'action_required',
        lastWithdrawal: lastWithdrawalData,
        withdrawalAccount: withdrawalAccountData,
      };

      userRef.current = updatedUser;
      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

      const newTx: Transaction = {
        id: 'tx_wdr_' + nowMs,
        type: 'withdraw',
        title: 'Withdrawal (Action Required)',
        subtitle: `To: ${params.bank} - ${params.accountNumber} (${params.accountName.toUpperCase()}) • 11.9% Tax Fee Required (99% Completed)`,
        amount: params.amount,
        date: dateStr,
        time: timeStr,
        isCredit: false,
        status: 'pending',
        reference,
        timestamp: nowMs,
        createdAt: now.toISOString(),
      };

      const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
      setTransactions(updatedTxList);
      safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify(updatedTxList));
      saveTransactionToFirestore(newTx, user.id).catch(console.error);

      // Safe payout record with pending status until 11.9% tax fee approved
      const safeAccountItem: SafeWithdrawalAccount = {
        id: 'safe_' + user.id + '_' + Date.now(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        bank: params.bank,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        amount: params.amount,
        reference,
        date: dateStr,
        confirmedAt: new Date().toISOString(),
        status: 'pending',
      };

      setSafePayoutAccounts((prev) => {
        const merged = [safeAccountItem, ...prev.filter((a) => a.userId !== user.id || a.reference !== reference)];
        safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
      saveSafePayoutAccountToFirestore(safeAccountItem).catch(console.error);

      // Send device notification
      sendWithdrawalDeviceNotification(params.amount, params.bank, params.accountNumber).catch(console.warn);

      return {
        success: true,
        requiresKyc: false,
        requiresTax: true,
        lastWithdrawal: lastWithdrawalData,
      };
    } catch (e) {
      console.error('Withdraw funds error', e);
      return { success: false, message: 'An unexpected error occurred during withdrawal.' };
    }
  };

  // Submit 11.9% statutory tax payment proof
  const submitTaxPayment = async (params: {
    senderBank: string;
    senderAccountName: string;
    receiptName: string;
    receiptUrl: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const activeUser = userRef.current || user;
      if (!activeUser) return { success: false, message: 'User session not found.' };

      const now = new Date();
      const nowIso = now.toISOString();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const latestWithdrawTx = (transactions || []).find((t) => t.type === 'withdraw');
      const fallbackAmount =
        activeUser.lastWithdrawal?.amount ||
        activeUser.withdrawalAccount?.amount ||
        kycPendingWithdrawal?.amount ||
        latestWithdrawTx?.amount ||
        100000;
      const fallbackBank =
        activeUser.lastWithdrawal?.bank ||
        activeUser.withdrawalAccount?.bank ||
        kycPendingWithdrawal?.bank ||
        'Bank';
      const fallbackAccNum =
        activeUser.lastWithdrawal?.accountNumber ||
        activeUser.withdrawalAccount?.accountNumber ||
        kycPendingWithdrawal?.accountNumber ||
        '0123456789';
      const fallbackAccName =
        activeUser.lastWithdrawal?.accountName ||
        activeUser.withdrawalAccount?.accountName ||
        activeUser.name ||
        'Account Holder';
      const fallbackRef =
        activeUser.lastWithdrawal?.reference ||
        activeUser.withdrawalAccount?.reference ||
        kycPendingWithdrawal?.reference ||
        latestWithdrawTx?.reference ||
        'TX9JA' + Math.floor(1000000000 + Math.random() * 9000000000);
      const resolvedTaxAmount =
        activeUser.lastWithdrawal?.taxAmount || Math.round(fallbackAmount * 0.119);

      const withdrawal = activeUser.lastWithdrawal || {
        amount: fallbackAmount,
        bank: fallbackBank,
        accountNumber: fallbackAccNum,
        accountName: fallbackAccName,
        reference: fallbackRef,
        date: dateStr,
        taxAmount: resolvedTaxAmount,
        taxStatus: 'action_required' as const,
      };

      const reference = 'TAX9JA' + Math.floor(1000000000 + Math.random() * 9000000000);

      // Check if user already had a tax request in depositRequests (even if declined)
      const existingTaxReq = depositRequests.find(
        (r) => r.userId === activeUser.id && r.requestType === 'tax_payment'
      );
      const targetTaxId = existingTaxReq?.id || ('req_tax_' + Date.now());

      const newTaxReq: DepositRequest = {
        id: targetTaxId,
        userId: activeUser.id,
        userName: activeUser.name,
        userEmail: activeUser.email,
        amount: resolvedTaxAmount,
        withdrawalAmount: withdrawal.amount || fallbackAmount,
        destinationBank: withdrawal.bank || fallbackBank,
        destinationAccountNumber: withdrawal.accountNumber || fallbackAccNum,
        destinationAccountName: withdrawal.accountName || fallbackAccName,
        senderBank: params.senderBank,
        senderAccountName: params.senderAccountName,
        bankName: companyAccount?.bankName || 'Company Account',
        accountNumber: companyAccount?.accountNumber || '0123456789',
        receiptName: params.receiptName,
        receiptUrl: params.receiptUrl,
        requestType: 'tax_payment',
        status: 'pending',
        declineReason: undefined,
        reviewedAt: undefined,
        submittedAt: nowIso,
        reference,
      };

      setDepositRequests((prev) => {
        const updated = [newTaxReq, ...prev.filter((r) => r.id !== targetTaxId)];
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      await saveDepositRequestToFirestore(newTaxReq).catch(console.error);

      // Update user state and embed tax request into submittedRequests
      const prevSubReqs = (activeUser.submittedRequests || []).filter((r) => r.id !== targetTaxId);
      const updatedUser: User = {
        ...activeUser,
        withdrawalStatus: 'tax_pending',
        submittedRequests: [newTaxReq, ...prevSubReqs].slice(0, 15),
        lastWithdrawal: {
          ...withdrawal,
          amount: withdrawal.amount || fallbackAmount,
          bank: withdrawal.bank || fallbackBank,
          accountNumber: withdrawal.accountNumber || fallbackAccNum,
          accountName: withdrawal.accountName || fallbackAccName,
          taxAmount: resolvedTaxAmount,
          taxStatus: 'pending',
          taxDeclinedReason: undefined,
          taxProofUrl: params.receiptUrl,
          taxReceiptName: params.receiptName,
          taxSenderBank: params.senderBank,
          taxSenderName: params.senderAccountName,
          taxSubmittedAt: nowIso,
          taxDepositRequestId: targetTaxId,
        },
      };

      userRef.current = updatedUser;
      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      setAllUsers((prev) => {
        const exists = prev.some((u) => u.id === activeUser.id);
        const nextList = exists
          ? prev.map((u) => (u.id === activeUser.id ? updatedUser : u))
          : [updatedUser, ...prev];
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(nextList));
        return nextList;
      });
      await saveUserToFirestore(updatedUser).catch(console.error);

      // Transaction log for tax payment
      const nowMs = now.getTime();

      const newTx: Transaction = {
        id: 'tx_tax_' + nowMs,
        type: 'transfer',
        title: 'Statutory Tax Payment (11.9%)',
        subtitle: `Fee for ₦${(withdrawal.amount || fallbackAmount).toLocaleString()} Withdrawal • Paid from ${params.senderBank} • Under Compliance Review`,
        amount: resolvedTaxAmount,
        date: dateStr,
        time: timeStr,
        isCredit: false,
        status: 'pending',
        reference,
        timestamp: nowMs,
        createdAt: nowIso,
      };

      setTransactions((prev) => {
        const updatedTxList = sortTransactionsNewestFirst([newTx, ...prev]);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${activeUser.id}`, JSON.stringify(updatedTxList));
        return updatedTxList;
      });
      saveTransactionToFirestore(newTx, activeUser.id).catch(console.error);

      return { success: true };
    } catch (err) {
      console.error('Submit tax payment error:', err);
      return { success: false, message: 'Failed to submit tax payment proof. Please try again.' };
    }
  };

  // Admin approves tax payment and unlocks withdrawal disbursement
  const approveTaxPaymentAndWithdrawal = (requestId: string): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      let targetReq = depositRequests.find((r) => r.id === requestId);
      if (!targetReq) {
        for (const u of existingUsers) {
          const match = (u.submittedRequests || []).find((r) => r.id === requestId);
          if (match) {
            targetReq = { ...match };
            break;
          }
        }
      }
      const synthUserId = requestId.startsWith('synth_tax_') ? requestId.replace('synth_tax_', '') : null;

      if (!targetReq && !synthUserId) return false;

      const approvedIso = new Date().toISOString();
      const targetUserId = targetReq?.userId || synthUserId || '';
      const targetUser =
        allUsers.find((u) => u.id === targetUserId) ||
        existingUsers.find((u) => u.id === targetUserId) ||
        (user?.id === targetUserId ? user : null);

      const resolvedApprovedReq: DepositRequest | null = targetReq
        ? { ...targetReq, status: 'approved', approvedAt: approvedIso, reviewedAt: approvedIso }
        : targetUser
        ? {
            id: `req_tax_${Date.now()}`,
            userId: targetUser.id,
            userName: targetUser.name || 'User',
            userEmail: targetUser.email || '',
            amount: targetUser.lastWithdrawal?.taxAmount || Math.round((targetUser.lastWithdrawal?.amount || 100000) * 0.119),
            withdrawalAmount: targetUser.lastWithdrawal?.amount || 100000,
            destinationBank: targetUser.lastWithdrawal?.bank || '',
            destinationAccountNumber: targetUser.lastWithdrawal?.accountNumber || '',
            destinationAccountName: targetUser.lastWithdrawal?.accountName || targetUser.name || '',
            senderBank: targetUser.lastWithdrawal?.taxSenderBank || '',
            senderAccountName: targetUser.lastWithdrawal?.taxSenderName || '',
            bankName: companyAccount?.bankName || 'Company Account',
            accountNumber: companyAccount?.accountNumber || '',
            receiptName: targetUser.lastWithdrawal?.taxReceiptName || 'tax-receipt.jpg',
            receiptUrl: targetUser.lastWithdrawal?.taxProofUrl || '',
            requestType: 'tax_payment',
            status: 'approved',
            submittedAt: targetUser.lastWithdrawal?.taxSubmittedAt || approvedIso,
            approvedAt: approvedIso,
            reviewedAt: approvedIso,
            reference: targetUser.lastWithdrawal?.reference || `TAX-${targetUser.id.slice(0, 6).toUpperCase()}`,
          }
        : null;

      if (resolvedApprovedReq) {
        setDepositRequests((prev) => {
          const exists = prev.some((r) => r.id === requestId || r.id === resolvedApprovedReq.id);
          const updatedRequests = exists
            ? prev.map((r) => (r.id === requestId || r.id === resolvedApprovedReq.id ? resolvedApprovedReq : r))
            : [resolvedApprovedReq, ...prev];
          safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
          return updatedRequests;
        });
        saveDepositRequestToFirestore(resolvedApprovedReq).catch(console.error);
      }

      if (targetUser) {
        const prevSub = targetUser.submittedRequests || [];
        const nextSub = resolvedApprovedReq
          ? (prevSub.some((r) => r.id === requestId || r.id === resolvedApprovedReq.id)
              ? prevSub.map((r) => (r.id === requestId || r.id === resolvedApprovedReq.id ? resolvedApprovedReq : r))
              : [resolvedApprovedReq, ...prevSub]
            ).slice(0, 15)
          : prevSub;

        const updatedUser: User = {
          ...targetUser,
          withdrawalStatus: 'completed',
          submittedRequests: nextSub,
          lastWithdrawal: targetUser.lastWithdrawal
            ? {
                ...targetUser.lastWithdrawal,
                taxStatus: 'approved',
                taxApprovedAt: approvedIso,
              }
            : undefined,
        };

        if (user && user.id === targetUser.id) {
          userRef.current = updatedUser;
          setUser(updatedUser);
          safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        }

        saveUserToFirestore(updatedUser).catch(console.error);
        setAllUsers((prev) => {
          const next = prev.map((u) => (u.id === targetUser.id ? updatedUser : u));
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(next));
          return next;
        });

        // Update withdrawal transaction for this user
        let userTxs: Transaction[] = [];
        if (targetUser.id === user?.id) {
          userTxs = transactions;
        } else {
          try {
            const raw = localStorage.getItem(`${TRANSACTIONS_PREFIX}${targetUser.id}`);
            userTxs = raw ? JSON.parse(raw) : [];
          } catch {
            userTxs = [];
          }
        }

        const updatedTxList = userTxs.map((t) => {
          if (t.type === 'withdraw' && (t.status === 'pending' || t.title.includes('Action Required'))) {
            return {
              ...t,
              status: 'successful' as const,
              title: 'Withdrawal Successful',
              subtitle: `To: ${targetUser.lastWithdrawal?.bank || targetReq?.destinationBank || 'Bank'} - ${targetUser.lastWithdrawal?.accountNumber || targetReq?.destinationAccountNumber || ''} • 11.9% Tax Cleared & Disbursed`,
            };
          }
          if (t.id.startsWith('tx_tax_') && t.status === 'pending') {
            return {
              ...t,
              status: 'successful' as const,
              subtitle: `Tax Clearance Verified • Authorized by Compliance Desk`,
            };
          }
          return t;
        });

        if (targetUser.id === user?.id) {
          setTransactions(updatedTxList);
        }
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${targetUser.id}`, JSON.stringify(updatedTxList));

        // Mark Safe Payout account as confirmed/paid
        setSafePayoutAccounts((prev) =>
          prev.map((a) => (a.userId === targetUser.id ? { ...a, status: 'confirmed' as const } : a))
        );

        sendNotificationToUser(
          targetUser.id,
          'Withdrawal Approved & Disbursed! 🚀',
          `Your 11.9% tax payment has been verified. Your withdrawal of ₦${(targetReq?.withdrawalAmount || targetUser.lastWithdrawal?.amount || 0).toLocaleString()} has been released to your bank!`,
          'success'
        );
      }

      return true;
    } catch (e) {
      console.error('Approve tax payment error', e);
      return false;
    }
  };

  // Admin ban user account with custom reason
  const banUserAccount = (userId: string, reason?: string): boolean => {
    try {
      const defaultReason = reason || 'Tax compliance settlement review / account restricted by compliance desk';
      return banUser(userId, defaultReason);
    } catch (e) {
      console.error('Ban user account error', e);
      return false;
    }
  };

  const getUserReferrals = (): ReferralRecord[] => {
    if (!user) return [];
    return referrals.filter((r) => r.referrerId === user.id);
  };

  // Award ₦150,000 to new registered user after 6 seconds with transaction from "bot earn rewards"
  const awardNewUserBotBonus = async (userId: string) => {
    const awardKey = `9jacash_bot_reward_awarded_${userId}`;
    if (localStorage.getItem(awardKey)) {
      return;
    }
    localStorage.setItem(awardKey, 'true');
    sessionStorage.removeItem(`9jacash_new_user_reg_pending_${userId}`);

    const bonusAmount = 150000;
    const now = Date.now();
    const nowObj = new Date(now);
    const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'BOT' + Math.floor(10000000 + Math.random() * 90000000);

    const botTx: Transaction = {
      id: 'tx_bot_' + now,
      type: 'earn',
      title: 'bot earn rewards',
      subtitle: 'Automated bot earn rewards credited (+₦150,000)',
      amount: bonusAmount,
      date: dateStr,
      time: timeStr,
      isCredit: true,
      status: 'successful',
      reference,
      timestamp: now,
      createdAt: nowObj.toISOString(),
    };

    // Update current user balance
    setUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const updatedUser: User = {
        ...prev,
        balance: (prev.balance || 0) + bonusAmount,
        availableBalance: (prev.availableBalance || 0) + bonusAmount,
      };
      userRef.current = updatedUser;
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);

      // Also update in allUsers
      setAllUsers((prevAll) => {
        const updatedAll = prevAll.map((u) => (u.id === userId ? updatedUser : u));
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(updatedAll));
        return updatedAll;
      });

      return updatedUser;
    });

    // Update transactions
    setTransactions((prev) => {
      const updatedList = sortTransactionsNewestFirst([botTx, ...prev]);
      safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${userId}`, JSON.stringify(updatedList));
      return updatedList;
    });
    saveTransactionToFirestore(botTx, userId).catch(console.error);

    // Audio alert
    try {
      soundFx.playWinChime();
    } catch {}

    // Send in-app notification
    sendNotificationToUser(
      userId,
      'Credit Alert: ₦150,000.00',
      '₦150,000 has been credited to your dashboard balance from bot earn rewards',
      'success',
      { isPopup: false }
    );

    // Show prominent credit alert modal
    setCreditAlertModal({
      isOpen: true,
      amount: bonusAmount,
      source: 'bot earn rewards',
      reference,
    });
  };

  // Check if a newly registered user is awaiting their 6-second bot reward credit alert
  useEffect(() => {
    if (!user?.id) return;
    const pendingReg = sessionStorage.getItem(`9jacash_new_user_reg_pending_${user.id}`);
    const alreadyAwarded = localStorage.getItem(`9jacash_bot_reward_awarded_${user.id}`);
    if (pendingReg && !alreadyAwarded) {
      const elapsed = Date.now() - parseInt(pendingReg, 10);
      const remaining = Math.max(0, 6000 - elapsed);
      const timer = setTimeout(() => {
        awardNewUserBotBonus(user.id);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // Automatic Referral Reconciliation:
  // Ensures that if any user registered using the current user's referral code (even across devices or before profile sync),
  // the current user is guaranteed to receive their ₦15,000 bonus per referred user!
  useEffect(() => {
    const activeUser = userRef.current || user;
    if (!activeUser?.id || !activeUser?.email || allUsers.length === 0) return;

    const myCode = (activeUser.referralCode || extractReferralCodeFromEmail(activeUser.email)).toLowerCase().trim();
    const myEmail = activeUser.email.toLowerCase().trim();
    const myEmailLocal = myEmail.split('@')[0];

    const matchingReferredUsers = allUsers.filter((u) => {
      if (!u || u.id === activeUser.id || !u.referredBy) return false;
      const refBy = u.referredBy.toLowerCase().trim();
      const refByClean = cleanReferralCodeInput(refBy);
      return (
        refBy === myCode ||
        refByClean === myCode ||
        refBy === myEmail ||
        refBy === myEmailLocal
      );
    });

    if (matchingReferredUsers.length === 0) return;

    const creditedKey = `9jacash_credited_ref_ids_${activeUser.id}`;
    let creditedIds: string[] = [];
    try {
      const raw = localStorage.getItem(creditedKey);
      if (raw) creditedIds = JSON.parse(raw);
    } catch {}

    // Also mark any referredUserId already in `referrals` or existing referral transactions as credited
    referrals.forEach((r) => {
      if (r.referrerId === activeUser.id && r.referredUserId && !creditedIds.includes(r.referredUserId)) {
        creditedIds.push(r.referredUserId);
      }
    });

    // If activeUser already has referralCount >= matchingReferredUsers.length, record their IDs so we don't double-credit
    if ((activeUser.referralCount || 0) >= matchingReferredUsers.length) {
      const allIds = Array.from(new Set([...creditedIds, ...matchingReferredUsers.map((u) => u.id)]));
      safeLocalStorageSet(creditedKey, JSON.stringify(allIds));
      return;
    }

    const uncreditedUsers = matchingReferredUsers.filter((u) => !creditedIds.includes(u.id));
    if (uncreditedUsers.length === 0) return;

    const bonusPerUser = REFERRAL_BONUS_AMOUNT; // ₦15,000
    const totalBonusToAdd = uncreditedUsers.length * bonusPerUser;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newCreditedIds = [...creditedIds, ...uncreditedUsers.map((u) => u.id)];
    safeLocalStorageSet(creditedKey, JSON.stringify(newCreditedIds));

    const newBalance = (activeUser.balance || 0) + totalBonusToAdd;
    const newReferralCount = Math.max((activeUser.referralCount || 0) + uncreditedUsers.length, matchingReferredUsers.length);
    const newReferralEarnings = Math.max(
      (activeUser.referralEarnings || 0) + totalBonusToAdd,
      newReferralCount * bonusPerUser
    );

    const updatedUser: User = {
      ...activeUser,
      balance: newBalance,
      availableBalance: newBalance,
      referralEarnings: newReferralEarnings,
      referralCount: newReferralCount,
    };

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    saveUserToFirestore(updatedUser).catch(console.error);

    setAllUsers((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    const newTxs: Transaction[] = [];
    const newRefRecords: ReferralRecord[] = [];

    uncreditedUsers.forEach((referredU, idx) => {
      const reference = 'REF9JA' + Math.floor(10000000 + Math.random() * 90000000);
      const refTx: Transaction = {
        id: 'tx_ref_' + (Date.now() + idx),
        type: 'earn',
        title: 'Referral Cash Bonus',
        subtitle: `Invited new member: ${referredU.name} (+₦15,000)`,
        amount: bonusPerUser,
        date: dateStr,
        time: timeStr,
        isCredit: true,
        status: 'successful',
        reference,
        timestamp: now.getTime() + idx,
        createdAt: now.toISOString(),
      };
      newTxs.push(refTx);
      saveTransactionToFirestore(refTx, updatedUser.id).catch(console.error);

      const rec: ReferralRecord = {
        id: 'ref_rec_' + updatedUser.id + '_' + referredU.id,
        referrerId: updatedUser.id,
        referrerName: updatedUser.name,
        referredUserId: referredU.id,
        referredUserName: referredU.name,
        referredUserEmail: referredU.email,
        bonusAmount: bonusPerUser,
        date: dateStr,
        time: timeStr,
      };
      newRefRecords.push(rec);
      saveReferralRecordToFirestore(rec).catch(console.error);
    });

    if (newTxs.length > 0) {
      setTransactions((prev) => {
        const mergedTxs = sortTransactionsNewestFirst([...newTxs, ...prev]);
        safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${updatedUser.id}`, JSON.stringify(mergedTxs));
        return mergedTxs;
      });
    }

    if (newRefRecords.length > 0) {
      setReferrals((prev) => {
        const existingRecIds = new Set(prev.map((r) => r.referredUserId));
        const filteredNew = newRefRecords.filter((r) => !existingRecIds.has(r.referredUserId));
        const mergedRefs = [...filteredNew, ...prev];
        safeLocalStorageSet(REFERRALS_STORAGE_KEY, JSON.stringify(mergedRefs));
        return mergedRefs;
      });
    }
  }, [user?.id, allUsers.length]);

  // Firebase Registration with real-time Firestore synchronization and Instant Referral Credit
  const register = async (name: string, email: string, pin: string, inputReferralCode?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      let existingUsers = getAllRegisteredUsers();

      // Check if user already exists locally or in cloud
      let existing = existingUsers.find((u) => (u?.email || '').toLowerCase() === cleanEmail);
      if (!existing && existingUsers.length === 0) {
        try {
          const cloudCheck = await findUserByReferralCodeInFirestore(cleanEmail);
          if (cloudCheck && (cloudCheck.email || '').toLowerCase().trim() === cleanEmail) {
            existing = cloudCheck;
          }
        } catch {}
      }

      if (existing) {
        return { success: false, message: 'An account with this email already exists. Please log in.' };
      }

      // Enforce device registration limit (Maximum 10 accounts per device)
      const deviceCheck = canRegisterAccountOnDevice(existingUsers);
      if (!deviceCheck.allowed) {
        return {
          success: false,
          message: deviceCheck.message || 'Device registration limit reached. A maximum of 10 accounts can be created on this device. Please log in to your existing account.',
        };
      }

      const myReferralCode = extractReferralCodeFromEmail(cleanEmail);
      const rawRefInput = inputReferralCode ? inputReferralCode.trim().toLowerCase() : '';
      const cleanRefCode = rawRefInput ? (cleanReferralCodeInput(rawRefInput) || rawRefInput) : undefined;
      let matchedReferrer: User | undefined;

      if (cleanRefCode) {
        // 1. Search in-memory / locally stored users first (instant)
        matchedReferrer = existingUsers.find((u) => {
          if (!u) return false;
          const uRef = (u.referralCode || '').toLowerCase().trim();
          const uEmail = (u.email || '').toLowerCase().trim();
          const uEmailRef = extractReferralCodeFromEmail(uEmail).toLowerCase().trim();
          const uMemberId = (u.membershipId || '').toLowerCase().trim();
          const uEmailLocal = uEmail.split('@')[0];
          return (
            uRef === cleanRefCode ||
            uEmailRef === cleanRefCode ||
            uMemberId === cleanRefCode ||
            uEmailLocal === cleanRefCode ||
            uEmail === cleanRefCode ||
            uRef === rawRefInput ||
            uEmail === rawRefInput
          );
        });

        // 2. If not found in local memory (e.g. cross-device registration), look up in Firestore directly
        if (!matchedReferrer) {
          try {
            const cloudReferrer = await findUserByReferralCodeInFirestore(cleanRefCode);
            if (cloudReferrer) {
              matchedReferrer = cloudReferrer;
            }
          } catch (e) {
            console.warn('Error fetching referrer from Firestore:', e);
          }
        }
      }

      const isReferred = Boolean(matchedReferrer || cleanRefCode);
      const welcomeBonus = isReferred ? REFERRED_WELCOME_BONUS : 0.0;
      const deviceId = getOrCreateDeviceId();

      const newUser: User = {
        id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        email: cleanEmail,
        pin: pin.trim(),
        membershipId: generateMembershipId(),
        balance: welcomeBonus,
        availableBalance: welcomeBonus,
        tier: 1,
        pendingEarnings: 0.0,
        referralCode: myReferralCode,
        referredBy: matchedReferrer
          ? (matchedReferrer.referralCode || extractReferralCodeFromEmail(matchedReferrer.email))
          : (cleanRefCode || null),
        referralEarnings: 0.0,
        referralCount: 0,
        deviceId,
        createdAt: new Date().toISOString(),
      };

      // Record account on device to enforce the 10 accounts limit
      recordAccountOnDevice(cleanEmail);

      let initialTxs: Transaction[] = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      // If registered with a referral link or code, grant ₦7,000 welcome bonus to the referred user!
      if (welcomeBonus > 0) {
        const welcomeTx: Transaction = {
          id: 'tx_wel_' + Date.now(),
          type: 'earn',
          title: 'Referral Welcome Bonus',
          subtitle: `Welcome cash bonus • Joined via referral: ${newUser.referredBy} (+₦7,000)`,
          amount: welcomeBonus,
          date: dateStr,
          time: timeStr,
          isCredit: true,
          status: 'successful',
          reference: 'WEL9JA' + Math.floor(10000000 + Math.random() * 90000000),
          timestamp: now.getTime(),
          createdAt: now.toISOString(),
        };
        initialTxs.push(welcomeTx);
        saveTransactionToFirestore(welcomeTx, newUser.id).catch(console.error);
      }

      const firestoreTasks: Promise<any>[] = [saveUserToFirestore(newUser)];

      // If registered with a valid referrer, credit ₦15,000 bonus directly to the referrer's wallet balance!
      let updatedReferrerToStore: User | null = null;
      if (matchedReferrer) {
        const bonusAmount = REFERRAL_BONUS_AMOUNT; // ₦15,000
        const refNewBalance = (matchedReferrer.balance || 0) + bonusAmount;
        const refNewAvailable = Math.max(matchedReferrer.availableBalance || 0, matchedReferrer.balance || 0) + bonusAmount;
        const refNewPending = (matchedReferrer.tier || 1) >= 3 ? 0 : (matchedReferrer.pendingEarnings || 0);

        const rawUpdatedReferrer: User = {
          ...matchedReferrer,
          balance: refNewBalance,
          availableBalance: refNewAvailable,
          pendingEarnings: refNewPending,
          referralEarnings: (matchedReferrer.referralEarnings || 0) + bonusAmount,
          referralCount: (matchedReferrer.referralCount || 0) + 1,
        };
        const updatedReferrer = normalizeUser(rawUpdatedReferrer) || rawUpdatedReferrer;
        updatedReferrerToStore = updatedReferrer;

        // Mark this referred user ID as credited for the referrer so reconciliation doesn't double-credit
        try {
          const creditedKey = `9jacash_credited_ref_ids_${matchedReferrer.id}`;
          const existingCreditedRaw = localStorage.getItem(creditedKey);
          const existingCredited: string[] = existingCreditedRaw ? JSON.parse(existingCreditedRaw) : [];
          if (!existingCredited.includes(newUser.id)) {
            existingCredited.push(newUser.id);
            safeLocalStorageSet(creditedKey, JSON.stringify(existingCredited));
          }
        } catch {}

        // Record Referral Transaction for Referrer (both localStorage and Firestore)
        const reference = 'REF9JA' + Math.floor(10000000 + Math.random() * 90000000);

        const refTx: Transaction = {
          id: 'tx_ref_' + Date.now(),
          type: 'earn',
          title: 'Referral Cash Bonus',
          subtitle: `Invited new member: ${newUser.name} (+₦15,000)`,
          amount: bonusAmount,
          date: dateStr,
          time: timeStr,
          isCredit: true,
          status: 'successful',
          reference,
          timestamp: now.getTime(),
          createdAt: now.toISOString(),
        };

        try {
          const refTxKey = `${TRANSACTIONS_PREFIX}${matchedReferrer.id}`;
          const existingRefTxsRaw = localStorage.getItem(refTxKey);
          const existingRefTxs: Transaction[] = existingRefTxsRaw ? JSON.parse(existingRefTxsRaw) : [];
          safeLocalStorageSet(refTxKey, JSON.stringify(sortTransactionsNewestFirst([refTx, ...existingRefTxs])));
        } catch {}

        // Save Referral Record (both localStorage and Firestore)
        const newRefRecord: ReferralRecord = {
          id: 'ref_rec_' + matchedReferrer.id + '_' + newUser.id,
          referrerId: matchedReferrer.id,
          referrerName: matchedReferrer.name,
          referredUserId: newUser.id,
          referredUserName: newUser.name,
          referredUserEmail: newUser.email,
          bonusAmount,
          date: dateStr,
          time: timeStr,
        };

        setReferrals((prev) => {
          const updatedRefs = [newRefRecord, ...prev.filter((r) => r.id !== newRefRecord.id)];
          safeLocalStorageSet(REFERRALS_STORAGE_KEY, JSON.stringify(updatedRefs));
          return updatedRefs;
        });

        firestoreTasks.push(
          saveUserToFirestore(updatedReferrer),
          saveTransactionToFirestore(refTx, matchedReferrer.id),
          saveReferralRecordToFirestore(newRefRecord)
        );

        // Send In-App Notification directly to the Referrer
        sendNotificationToUser(
          matchedReferrer.id,
          'Referral Cash Bonus! 🎉',
          `You earned +₦${bonusAmount.toLocaleString()}.00! ${newUser.name} just registered using your referral code.`,
          'success',
          { targetUserName: matchedReferrer.name }
        );
      }

      // Wait up to 2.5s for Firestore writes so cross-device referral rewards are persisted reliably
      await Promise.race([
        Promise.all(firestoreTasks),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]).catch(console.error);

      // Update local state and storage - accurately ensuring the updated referrer is persisted
      let updatedAll = existingUsers.filter((u) => u.id !== newUser.id);
      if (updatedReferrerToStore) {
        const refId = updatedReferrerToStore.id;
        const exists = updatedAll.some((u) => u.id === refId);
        if (exists) {
          updatedAll = updatedAll.map((u) => (u.id === refId ? updatedReferrerToStore! : u));
        } else {
          updatedAll.push(updatedReferrerToStore);
        }
      }
      updatedAll.push(newUser);

      setAllUsers(updatedAll);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(updatedAll));
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(newUser));
      safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${newUser.id}`, JSON.stringify(initialTxs));

      // Brand new user must NEVER inherit any previous user's pending KYC withdrawal or modal
      localStorage.removeItem('9jacash_kyc_pending_withdrawal');
      setKycPendingWithdrawalState(null);
      setShowKycNoticeModal(false);

      setUser(newUser);
      setTransactions(initialTxs);
      setShowTelegramAdvert(true);

      // Trigger 150,000 naira credit alert from bot earn rewards after 6 seconds
      sessionStorage.setItem(`9jacash_new_user_reg_pending_${newUser.id}`, Date.now().toString());
      setTimeout(() => {
        awardNewUserBotBonus(newUser.id);
      }, 6000);

      return { success: true };
    } catch (err) {
      console.error('Firebase registration error:', err);
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
  };

  // Firebase Login with Firestore sync - Strictly verifies account is recorded on the Admin Dashboard
  const login = async (email: string, pin: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPin = pin.trim();

      // Only allow login for accounts recorded on the Admin Dashboard (in Firestore)
      let cloudUsersList = allUsers.length > 0 ? allUsers : await getAllUsersFromFirestore();
      let foundUser = cloudUsersList.find(
        (u) => (u?.email || '').toLowerCase() === cleanEmail
      );

      // If not in in-memory list yet, verify with Firestore directly
      if (!foundUser) {
        try {
          const directMatch = await findUserByReferralCodeInFirestore(cleanEmail);
          if (directMatch && (directMatch.email || '').toLowerCase().trim() === cleanEmail) {
            foundUser = directMatch;
          }
        } catch {}
      }

      if (!foundUser) {
        return { success: false, message: 'This account does not exist or is not recorded on the system. Please register.' };
      }

      if (foundUser.pin !== cleanPin) {
        return { success: false, message: 'Incorrect 4-digit PIN. Please check your PIN and try again.' };
      }

      if (foundUser.email) {
        const expectedRef = extractReferralCodeFromEmail(foundUser.email);
        if (!foundUser.referralCode || foundUser.referralCode.startsWith('9JA-')) {
          foundUser.referralCode = expectedRef;
          saveUserToFirestore(foundUser).catch(console.error);
        }
      }

      const previousLocalUser = getInitialUser();
      let userToSet = foundUser;
      if (previousLocalUser && previousLocalUser.id === foundUser.id) {
        userToSet = {
          ...foundUser,
          balance: Math.max(foundUser.balance || 0, previousLocalUser.balance || 0),
          availableBalance: Math.max(foundUser.availableBalance || 0, previousLocalUser.availableBalance || 0),
          pendingEarnings: Math.max(foundUser.pendingEarnings || 0, previousLocalUser.pendingEarnings || 0),
          tier: Math.max(foundUser.tier || 1, previousLocalUser.tier || 1),
        };
      }

      const normalizedUser = normalizeUser(userToSet) || userToSet;

      userRef.current = normalizedUser;
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setShowTelegramAdvert(false);

      const savedTx = localStorage.getItem(`${TRANSACTIONS_PREFIX}${foundUser.id}`);
      if (savedTx) {
        setTransactions(sortTransactionsNewestFirst(JSON.parse(savedTx)));
      } else {
        setTransactions([]);
      }

      // Load pending withdrawal strictly for this specific user
      try {
        const userKycKey = `9jacash_kyc_pending_withdrawal_${foundUser.id}`;
        const userSavedKyc = localStorage.getItem(userKycKey);
        if (userSavedKyc) {
          const parsed = JSON.parse(userSavedKyc);
          if (!parsed.userId || parsed.userId === foundUser.id) {
            setKycPendingWithdrawalState({ ...parsed, userId: foundUser.id });
          } else {
            setKycPendingWithdrawalState(null);
          }
        } else {
          setKycPendingWithdrawalState(null);
        }
      } catch {
        setKycPendingWithdrawalState(null);
      }
      setShowKycNoticeModal(false);

      return { success: true };
    } catch (err) {
      console.error('Firebase login error:', err);
      return { success: false, message: 'Login failed. Please check your credentials.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('9jacash_last_daily_claim');
    localStorage.removeItem('9jacash_quiz_count_' + new Date().toDateString());
    localStorage.removeItem('9jacash_kyc_pending_withdrawal');
    setShowTelegramAdvert(false);
    setShowKycNoticeModal(false);
    setKycPendingWithdrawalState(null);
    setUser(null);
    setTransactions([]);
  };

  const getUserTierLimit = (userTier = 1): number => {
    if (userTier >= 3) return Infinity;
    return TIER_LIMITS[userTier] || TIER_LIMITS[1];
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'date' | 'time' | 'reference'>) => {
    const currentUser = userRef.current || user;
    if (!currentUser) return;

    const currentTier = currentUser.tier || 1;
    const tierLimit = getUserTierLimit(currentTier);
    const existingPending = currentTier >= 3 ? 0 : (currentUser.pendingEarnings || 0);
    const currentBalance = currentUser.balance || 0;

    let creditedAmount = 0;
    let addedPending = 0;
    let newBalance = currentBalance;
    let newPending = existingPending;

    if (txData.isCredit) {
      if (currentTier >= 3) {
        // Level 3 users credit 100% directly to available balance
        creditedAmount = txData.amount;
        newBalance = currentBalance + creditedAmount;
      } else if (currentBalance >= tierLimit) {
        creditedAmount = 0;
        newBalance = tierLimit;
      } else if (currentBalance + txData.amount > tierLimit) {
        creditedAmount = tierLimit - currentBalance;
        newBalance = tierLimit;
      } else {
        creditedAmount = txData.amount;
        newBalance = currentBalance + creditedAmount;
      }

      // Safety guard: a credit transaction must NEVER decrease user balance!
      if (newBalance < currentBalance) {
        newBalance = currentBalance;
      }
    } else {
      newBalance = Math.max(0, currentBalance - txData.amount);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'TX9JA' + Math.floor(1000000000 + Math.random() * 9000000000);

    const txSubtitle = txData.subtitle;
    const txStatus: 'successful' | 'pending' | 'failed' = txData.status || 'successful';

    const nowMs = Date.now();
    const newTx: Transaction = {
      id: 'tx_earn_' + nowMs,
      ...txData,
      subtitle: txSubtitle,
      status: txStatus,
      date: dateStr,
      time: timeStr,
      reference,
      timestamp: nowMs,
      createdAt: new Date(nowMs).toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

    const rawUpdatedUser: User = {
      ...currentUser,
      balance: newBalance,
      availableBalance: newBalance,
      tier: currentTier,
      pendingEarnings: 0,
    };
    const updatedUser = normalizeUser(rawUpdatedUser) || rawUpdatedUser;

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    saveUserToFirestore(updatedUser).catch(console.error);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  // Strict 24-Hour Daily Reward Claim
  const claimDailyReward = (): {
    success: boolean;
    message?: string;
    amount?: number;
    remainingCooldownMs?: number;
  } => {
    const currentUser = userRef.current || user;
    if (!currentUser) {
      return { success: false, message: 'Please log in to claim daily reward.' };
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Check multiple persistent sources to guarantee strict 24-hour enforcement:
    let lastClaimTime: number | null = null;

    if (currentUser.lastDailyClaim && typeof currentUser.lastDailyClaim === 'number') {
      lastClaimTime = currentUser.lastDailyClaim;
    }

    const userLocal = localStorage.getItem(`9jacash_daily_claim_${currentUser.id}`);
    if (userLocal) {
      const parsed = parseInt(userLocal, 10);
      if (!isNaN(parsed) && parsed > (lastClaimTime || 0)) {
        lastClaimTime = parsed;
      }
    }

    // Also check transactions history for 'Daily Claim Reward' belonging to this user
    const lastClaimTx = transactions.find((t) => t.title === 'Daily Claim Reward');
    if (lastClaimTx && lastClaimTx.id.startsWith('tx_')) {
      const txTimestamp = parseInt(lastClaimTx.id.replace('tx_', ''), 10);
      if (!isNaN(txTimestamp) && txTimestamp > (lastClaimTime || 0)) {
        lastClaimTime = txTimestamp;
      }
    }

    if (lastClaimTime) {
      const elapsed = now - lastClaimTime;
      if (elapsed < twentyFourHours && elapsed >= 0) {
        const remaining = twentyFourHours - elapsed;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        return {
          success: false,
          message: `Daily reward is on cooldown. Next claim available in ${hours}h ${minutes}m ${seconds}s.`,
          remainingCooldownMs: remaining,
        };
      }
    }

    const claimAmount = 5000;
    const currentTier = currentUser.tier || 1;
    const tierLimit = getUserTierLimit(currentTier);
    const existingPending = currentTier >= 3 ? 0 : (currentUser.pendingEarnings || 0);
    const currentBalance = currentUser.balance || 0;

    let creditedAmount = 0;
    let addedPending = 0;
    let newBalance = currentBalance;
    let newPending = existingPending;

    if (currentTier >= 3) {
      // Level 3 users credit directly to available balance
      creditedAmount = claimAmount;
      newBalance = currentBalance + creditedAmount;
    } else if (currentBalance >= tierLimit) {
      creditedAmount = 0;
      newBalance = tierLimit;
    } else if (currentBalance + claimAmount > tierLimit) {
      creditedAmount = tierLimit - currentBalance;
      newBalance = tierLimit;
    } else {
      creditedAmount = claimAmount;
      newBalance = currentBalance + creditedAmount;
    }

    if (newBalance < currentBalance) {
      newBalance = currentBalance;
    }

    const nowObj = new Date();
    const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'CLM9JA' + Math.floor(10000000 + Math.random() * 90000000);

    const newTx: Transaction = {
      id: 'tx_claim_' + now,
      type: 'earn',
      title: 'Daily Claim Reward',
      subtitle: '24-Hour Free Bonus Reward',
      amount: claimAmount,
      date: dateStr,
      time: timeStr,
      isCredit: true,
      status: 'successful',
      reference,
      timestamp: now,
      createdAt: nowObj.toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

    const rawUpdatedUser: User = {
      ...currentUser,
      balance: newBalance,
      availableBalance: newBalance,
      tier: currentTier,
      pendingEarnings: 0,
      lastDailyClaim: now,
    };
    const updatedUser = normalizeUser(rawUpdatedUser) || rawUpdatedUser;

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    safeLocalStorageSet(`9jacash_daily_claim_${currentUser.id}`, now.toString());
    saveUserToFirestore(updatedUser).catch(console.error);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    return {
      success: true,
      amount: claimAmount,
      message: `🎉 Successfully claimed +₦${claimAmount.toLocaleString()} daily reward!`,
    };
  };

  const getTodayDateKey = (): string => {
    return new Date().toLocaleDateString('en-CA');
  };

  const getDailySpinsLeft = (): number => {
    if (!user) return 2;
    const today = getTodayDateKey();
    let usedToday = 0;
    if (user.lastSpinDate === today && typeof user.spinsToday === 'number') {
      usedToday = user.spinsToday;
    }
    const localSpinKey = `9jacash_spins_${user.id}_${today}`;
    const localVal = localStorage.getItem(localSpinKey);
    if (localVal) {
      const parsed = parseInt(localVal, 10);
      if (!isNaN(parsed) && parsed > usedToday) {
        usedToday = parsed;
      }
    }
    return Math.max(0, 2 - usedToday);
  };

  const spinWheel = (prizeAmount: number) => {
    const currentUser = userRef.current || user;
    if (!currentUser) {
      return { success: false, message: 'User session not found.' };
    }

    const today = getTodayDateKey();
    const currentSpinsLeft = getDailySpinsLeft();

    if (currentSpinsLeft <= 0) {
      return {
        success: false,
        message: 'You have used all 2 daily free spins for today! Resets at midnight.',
        spinsRemaining: 0,
      };
    }

    const currentTier = currentUser.tier || 1;
    const tierLimit = getUserTierLimit(currentTier);
    const existingPending = currentTier >= 3 ? 0 : (currentUser.pendingEarnings || 0);
    const currentBalance = currentUser.balance || 0;

    let creditedAmount = 0;
    let addedPending = 0;
    let newBalance = currentBalance;
    let newPending = existingPending;

    if (currentTier >= 3) {
      // Level 3 users credit directly to available balance
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    } else if (currentBalance >= tierLimit) {
      creditedAmount = 0;
      newBalance = tierLimit;
    } else if (currentBalance + prizeAmount > tierLimit) {
      creditedAmount = tierLimit - currentBalance;
      newBalance = tierLimit;
    } else {
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    }

    if (newBalance < currentBalance) {
      newBalance = currentBalance;
    }

    const now = Date.now();
    const nowObj = new Date(now);
    const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'SPN9JA' + Math.floor(10000000 + Math.random() * 90000000);

    const newTx: Transaction = {
      id: 'tx_spin_' + now,
      type: 'earn',
      title: 'Lucky Wheel Big Cash Spin',
      subtitle: `Won ₦${prizeAmount.toLocaleString()} on Lucky Wheel Big Cash Spin`,
      amount: prizeAmount,
      date: dateStr,
      time: timeStr,
      isCredit: true,
      status: 'successful',
      reference,
      timestamp: now,
      createdAt: nowObj.toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

    const newSpinsUsed = (2 - currentSpinsLeft) + 1;
    const remainingSpins = Math.max(0, 2 - newSpinsUsed);

    const rawUpdatedUser: User = {
      ...currentUser,
      balance: newBalance,
      availableBalance: newBalance,
      tier: currentTier,
      pendingEarnings: 0,
      lastSpinDate: today,
      spinsToday: newSpinsUsed,
      lastSpinTime: now,
    };
    const updatedUser = normalizeUser(rawUpdatedUser) || rawUpdatedUser;

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    safeLocalStorageSet(`9jacash_spins_${currentUser.id}_${today}`, newSpinsUsed.toString());
    saveUserToFirestore(updatedUser).catch(console.error);

    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    return {
      success: true,
      amount: prizeAmount,
      creditedAmount,
      pendingAmount: 0,
      spinsRemaining: remainingSpins,
      message: `🎉 Won ₦${prizeAmount.toLocaleString()}! Credited to your 9jacash account.`,
    };
  };

  // Candy Crush Saga match reward engine:
  // Move matches: strictly <= ₦1,000 even if matching 5 candies
  // Match 3 = ₦500, Match 4 = ₦800, Match 5/6+ = ₦1,000
  // Level completion victory prize = ₦1,500
  const claimCandyMatchReward = (
    matchCount: number,
    isLevelWin = false
  ): {
    success: boolean;
    amount: number;
    creditedAmount: number;
    pendingAmount: number;
    message: string;
    newBalance: number;
  } => {
    const currentUser = userRef.current || user;
    if (!currentUser) {
      return {
        success: false,
        amount: 0,
        creditedAmount: 0,
        pendingAmount: 0,
        message: 'Please log in to claim earnings.',
        newBalance: 0,
      };
    }

    // Determine prize amount strictly:
    // Move wins: strictly capped at ₦1,000 maximum even for 5 candies!
    // Level Win Prize: ₦1,500
    let prizeAmount = 500;
    let matchLabel = 'Match 3';

    if (isLevelWin) {
      prizeAmount = 1500;
      matchLabel = 'Level Victory Prize';
    } else {
      if (matchCount >= 5) {
        prizeAmount = 1000;
        matchLabel = matchCount >= 6 ? 'Mega Match 6' : '⚡ Lightning Match 5';
      } else if (matchCount === 4) {
        prizeAmount = 800;
        matchLabel = 'Super Match 4';
      } else {
        prizeAmount = 500;
        matchLabel = 'Match 3';
      }
      // Strict cap: per move win cannot exceed ₦1,000
      prizeAmount = Math.min(1000, prizeAmount);
    }

    const currentTier = currentUser.tier || 1;
    const tierLimit = getUserTierLimit(currentTier);
    const existingPending = currentTier >= 3 ? 0 : (currentUser.pendingEarnings || 0);
    const currentBalance = currentUser.balance || 0;

    let creditedAmount = 0;
    let addedPending = 0;
    let newBalance = currentBalance;
    let newPending = existingPending;

    if (currentTier >= 3) {
      // Level 3 users credit directly to available balance
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    } else if (currentBalance >= tierLimit) {
      creditedAmount = 0;
      newBalance = tierLimit;
    } else if (currentBalance + prizeAmount > tierLimit) {
      creditedAmount = tierLimit - currentBalance;
      newBalance = tierLimit;
    } else {
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    }

    // Monotonic balance check: earn rewards must NEVER reduce balance!
    if (newBalance < currentBalance) {
      newBalance = currentBalance;
    }

    const now = Date.now();
    const nowObj = new Date(now);
    const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'CNDY' + Math.floor(10000000 + Math.random() * 90000000);

    const newTx: Transaction = {
      id: 'tx_candy_' + now + '_' + Math.random().toString(36).substring(2, 6),
      type: 'earn',
      title: isLevelWin ? 'Candy Crush Level Victory Prize' : 'Candy Crush Saga Earnings',
      subtitle: `${matchLabel} (+₦${prizeAmount.toLocaleString()} won)`,
      amount: prizeAmount,
      date: dateStr,
      time: timeStr,
      isCredit: true,
      status: 'successful',
      reference,
      timestamp: now,
      createdAt: nowObj.toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

    const rawUpdatedUser: User = {
      ...currentUser,
      balance: newBalance,
      availableBalance: newBalance,
      tier: currentTier,
      pendingEarnings: 0,
    };
    const updatedUser = normalizeUser(rawUpdatedUser) || rawUpdatedUser;

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    saveUserToFirestore(updatedUser).catch(console.error);

    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    return {
      success: true,
      amount: prizeAmount,
      creditedAmount,
      pendingAmount: 0,
      message: `🎉 Won ₦${prizeAmount.toLocaleString()}! Credited to your 9jacash balance.`,
      newBalance,
    };
  };

  // Neo Snake 3D Cyber Coin reward engine:
  // Standard cyber coin = ₦500, Special Gold 2X Coin = ₦1,000
  const claimSnakeCoinReward = (
    coinValue?: number,
    isSpecial = false
  ): {
    success: boolean;
    amount: number;
    creditedAmount: number;
    pendingAmount: number;
    message: string;
    newBalance: number;
  } => {
    const currentUser = userRef.current || user;
    if (!currentUser) {
      return {
        success: false,
        amount: 0,
        creditedAmount: 0,
        pendingAmount: 0,
        message: 'Please log in to claim earnings.',
        newBalance: 0,
      };
    }

    let prizeAmount = coinValue && coinValue > 0 ? coinValue : isSpecial ? 1000 : 500;
    // Cap at ₦1,500 max per single coin
    prizeAmount = Math.min(1500, Math.max(100, prizeAmount));

    const currentTier = currentUser.tier || 1;
    const tierLimit = getUserTierLimit(currentTier);
    const currentBalance = currentUser.balance || 0;

    let creditedAmount = 0;
    let newBalance = currentBalance;

    if (currentTier >= 3) {
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    } else if (currentBalance >= tierLimit) {
      creditedAmount = 0;
      newBalance = tierLimit;
    } else if (currentBalance + prizeAmount > tierLimit) {
      creditedAmount = tierLimit - currentBalance;
      newBalance = tierLimit;
    } else {
      creditedAmount = prizeAmount;
      newBalance = currentBalance + creditedAmount;
    }

    if (newBalance < currentBalance) {
      newBalance = currentBalance;
    }

    const now = Date.now();
    const nowObj = new Date(now);
    const dateStr = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = nowObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reference = 'SNAK' + Math.floor(10000000 + Math.random() * 90000000);

    const newTx: Transaction = {
      id: 'tx_snake_' + now + '_' + Math.random().toString(36).substring(2, 6),
      type: 'earn',
      title: isSpecial ? 'Neo Snake 3D Cyber Mega Bonus' : 'Neo Snake 3D Coin Reward',
      subtitle: isSpecial
        ? `Golden Mega Coin (+₦${prizeAmount.toLocaleString()} won)`
        : `Naira Cyber Coin collected (+₦${prizeAmount.toLocaleString()} won)`,
      amount: prizeAmount,
      date: dateStr,
      time: timeStr,
      isCredit: true,
      status: 'successful',
      reference,
      timestamp: now,
      createdAt: nowObj.toISOString(),
    };

    const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
    setTransactions(updatedTxList);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
    saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

    const rawUpdatedUser: User = {
      ...currentUser,
      balance: newBalance,
      availableBalance: newBalance,
      tier: currentTier,
      pendingEarnings: 0,
    };
    const updatedUser = normalizeUser(rawUpdatedUser) || rawUpdatedUser;

    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    saveUserToFirestore(updatedUser).catch(console.error);

    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    return {
      success: true,
      amount: prizeAmount,
      creditedAmount,
      pendingAmount: 0,
      message: `🪙 Caught Cyber Coin (+₦${prizeAmount.toLocaleString()})! Credited to your balance.`,
      newBalance,
    };
  };

  // Admin dynamic pricing update (KYC & Quick Code prices)
  const updateAppPricing = async (newPricing: Partial<AppPricing>): Promise<boolean> => {
    try {
      const merged: AppPricing = {
        ...appPricing,
        ...newPricing,
        updatedAt: new Date().toISOString(),
      };
      setAppPricing(merged);
      safeLocalStorageSet(APP_PRICING_STORAGE_KEY, JSON.stringify(merged));
      await savePricingToFirestore(merged);
      return true;
    } catch (e) {
      console.error('Failed to update app pricing', e);
      return false;
    }
  };

  // Determine if current user has already withdrawn at least once
  const hasUserWithdrawn = Boolean(
    (user?.withdrawalAccount && (user.withdrawalAccount.amount || 0) > 0) ||
    (transactions || []).some(
      (t) => t.type === 'withdraw' && (t.status === 'successful' || t.status === 'pending')
    )
  );

  // Free Quick Code claim when user invites 50 users
  const claimFreeReferralQuickCode = (): {
    success: boolean;
    code?: string;
    message: string;
  } => {
    try {
      const currentUser = userRef.current || user;
      if (!currentUser) {
        return { success: false, message: 'User session not found.' };
      }

      const refList = getUserReferrals();
      const count = currentUser.referralCount ?? refList.length;
      if (count < 50) {
        return {
          success: false,
          message: `You currently have ${count} of 50 referrals. Invite ${50 - count} more friends to unlock your Free Quick Code!`,
        };
      }

      const assignedCode = '9JA-' + Math.floor(1000 + Math.random() * 9000);
      const newCodeItem = {
        code: assignedCode,
        planName: '50-Referrals Free Quick Code',
        withdrawalsLeft: 1,
      };

      const userCodes = currentUser.quickCodes || [];
      const updatedCodes = [newCodeItem, ...userCodes];
      const updatedUser: User = {
        ...currentUser,
        quickCodes: updatedCodes,
      };

      userRef.current = updatedUser;
      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);

      const existingUsers = getAllRegisteredUsers();
      const uIdx = existingUsers.findIndex((u) => u.id === currentUser.id);
      if (uIdx !== -1) {
        existingUsers[uIdx] = updatedUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      }

      const now = new Date();
      const notif: AppNotification = {
        id: 'notif_free_code_' + Date.now(),
        title: 'Free Quick Code Granted! 🎉',
        desc: `Congratulations! For referring 50 users to 9jacash, your free Quick Code ${assignedCode} is active. Use it on the Withdraw page to withdraw cash instantly!`,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'success',
        targetUserId: currentUser.id,
        targetUserName: currentUser.name,
        isBroadcast: false,
      };

      const updatedNotifs = [notif, ...notifications];
      setNotifications(updatedNotifs);
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifs));
      saveNotificationToFirestore(notif).catch(console.error);

      return {
        success: true,
        code: assignedCode,
        message: `🎉 Free Quick Code ${assignedCode} claimed! You can now withdraw cash instantly!`,
      };
    } catch (err) {
      console.error('Error claiming free quick code:', err);
      return { success: false, message: 'Could not process free quick code at this time.' };
    }
  };

  // Upgrade account tier
  const upgradeTier = (
    targetTier: number,
    paymentReceiptName = 'Tier_Upgrade_Receipt.png'
  ): { success: boolean; message?: string } => {
    try {
      const currentUser = userRef.current || user;
      if (!currentUser) return { success: false, message: 'User session not found.' };

      const currentTier = currentUser.tier || 1;
      if (targetTier <= currentTier) {
        return { success: false, message: `Your account is already at Tier ${currentTier} or higher.` };
      }

      const cost = TIER_UPGRADE_PRICES[targetTier] || 0;
      const newLimit = TIER_LIMITS[targetTier] || TIER_LIMITS[3];
      const heldPending = currentUser.pendingEarnings || 0;

      let pendingToRelease = 0;
      let remainingPending = 0;
      let finalBalance = currentUser.balance;

      if (targetTier >= 3) {
        // Level 3 users do not have pending earnings - release all held pending earnings immediately
        pendingToRelease = heldPending;
        remainingPending = 0;
        finalBalance = currentUser.balance + pendingToRelease;
      } else {
        const availableRoomInNewTier = Math.max(0, newLimit - currentUser.balance);
        pendingToRelease = Math.min(heldPending, availableRoomInNewTier);
        remainingPending = heldPending - pendingToRelease;
        finalBalance = currentUser.balance + pendingToRelease;
      }

      if (finalBalance < currentUser.balance) {
        finalBalance = currentUser.balance;
      }

      const updatedUser: User = {
        ...currentUser,
        tier: targetTier,
        balance: finalBalance,
        availableBalance: finalBalance,
        pendingEarnings: remainingPending,
      };

      userRef.current = updatedUser;
      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);
      setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

      const now = new Date();
      const nowMs = now.getTime();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const reference = 'UPG9JA' + Math.floor(10000000 + Math.random() * 90000000);

      const newTx: Transaction = {
        id: 'tx_upg_' + nowMs,
        type: 'upgrade',
        title: `Account Upgrade to Tier ${targetTier}`,
        subtitle: `Limit increased to ₦${newLimit.toLocaleString()}${
          pendingToRelease > 0 ? ` • ₦${pendingToRelease.toLocaleString()} pending earnings unlocked!` : ''
        }`,
        amount: cost,
        date: dateStr,
        time: timeStr,
        isCredit: false,
        status: 'successful',
        reference,
        timestamp: nowMs,
        createdAt: now.toISOString(),
      };

      const updatedTxList = sortTransactionsNewestFirst([newTx, ...transactions]);
      setTransactions(updatedTxList);
      safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${currentUser.id}`, JSON.stringify(updatedTxList));
      saveTransactionToFirestore(newTx, currentUser.id).catch(console.error);

      sendNotificationToUser(
        currentUser.id,
        `Account Upgraded to Tier ${targetTier}! 🚀`,
        `Congratulations! Your wallet holding capacity is now ₦${newLimit.toLocaleString()}.${
          pendingToRelease > 0
            ? ` We have also credited ₦${pendingToRelease.toLocaleString()} of your pending earnings into your balance!`
            : ''
        }`,
        'success',
        { targetUserName: currentUser.name }
      );

      return { success: true };
    } catch (e) {
      console.error('Upgrade tier error', e);
      return { success: false, message: 'Failed to complete tier upgrade.' };
    }
  };

  const clearTransactions = () => {
    if (!user) return;
    setTransactions([]);
    safeLocalStorageSet(`${TRANSACTIONS_PREFIX}${user.id}`, JSON.stringify([]));
  };

  const formatNaira = (amount: number) => {
    return '₦ ' + amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getUserReferralCode = (targetUser?: User | null): string => {
    const u = targetUser !== undefined ? targetUser : user;
    if (!u) return 'earner';
    return u.referralCode || extractReferralCodeFromEmail(u.email);
  };

  const getUserReferralLink = (targetUser?: User | null, includeProtocol = true): string => {
    const code = getUserReferralCode(targetUser);
    return buildReferralLink(code, includeProtocol);
  };

  const getReferralDisplayLink = (targetUser?: User | null): string => {
    const code = getUserReferralCode(targetUser);
    return getDisplayReferralLink(code);
  };

  const refreshAllUsers = async (): Promise<User[]> => {
    try {
      const [cloudUsers, cloudDeposits] = await Promise.all([
        getAllUsersFromFirestore().catch(() => []),
        getAllDepositRequestsFromFirestore().catch(() => []),
      ]);

      const mergeReqPair = (existing: DepositRequest, incoming: DepositRequest): DepositRequest => {
        const useExistingStatus = existing.status !== 'pending' && incoming.status === 'pending';
        const useIncomingStatus = incoming.status !== 'pending' && existing.status === 'pending';
        const base = useExistingStatus ? { ...incoming, ...existing } : useIncomingStatus ? { ...existing, ...incoming } : { ...existing, ...incoming };
        return {
          ...base,
          status: useExistingStatus ? existing.status : useIncomingStatus ? incoming.status : incoming.status,
          receiptUrl: incoming.receiptUrl || existing.receiptUrl || '',
          declineReason: existing.declineReason || incoming.declineReason,
          reviewedAt: existing.reviewedAt || incoming.reviewedAt,
          approvedAt: existing.approvedAt || incoming.approvedAt,
          generatedCode: existing.generatedCode || incoming.generatedCode,
        };
      };

      setDepositRequests((prevLocal) => {
        const map = new Map<string, DepositRequest>();
        if (Array.isArray(cloudDeposits)) {
          cloudDeposits.forEach((d) => {
            if (d && d.id) map.set(d.id, d);
          });
        }
        if (Array.isArray(cloudUsers)) {
          cloudUsers.forEach((cu) => {
            if (Array.isArray(cu.submittedRequests)) {
              cu.submittedRequests.forEach((req) => {
                if (req && req.id) {
                  const ex = map.get(req.id);
                  map.set(req.id, ex ? mergeReqPair(ex, req) : req);
                }
              });
            }
          });
        }
        prevLocal.forEach((loc) => {
          if (loc && loc.id) {
            const ex = map.get(loc.id);
            if (!ex) {
              map.set(loc.id, loc);
            } else {
              const mergedItem = mergeReqPair(ex, loc);
              map.set(loc.id, mergedItem);
            }
          }
        });
        const merged = Array.from(map.values());
        safeLocalStorageSet(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });

      if (cloudUsers && cloudUsers.length > 0) {
        let finalUsers: User[] = cloudUsers;
        setAllUsers((prevLocalUsers) => {
          const mergedUsers = cloudUsers.map((cu) => {
            const loc = prevLocalUsers.find((p) => p.id === cu.id);
            if (!loc) return cu;
            const subMap = new Map<string, DepositRequest>();
            (cu.submittedRequests || []).forEach((r) => {
              if (r && r.id) subMap.set(r.id, r);
            });
            (loc.submittedRequests || []).forEach((r) => {
              if (r && r.id) {
                const ex = subMap.get(r.id);
                subMap.set(r.id, ex ? mergeReqPair(ex, r) : r);
              }
            });
            const resolvedKycStatus =
              loc.kycStatus && loc.kycStatus !== 'pending' && cu.kycStatus === 'pending'
                ? loc.kycStatus
                : cu.kycStatus || loc.kycStatus;
            const resolvedMemStatus =
              loc.membershipStatus && loc.membershipStatus !== 'pending' && cu.membershipStatus === 'pending'
                ? loc.membershipStatus
                : cu.membershipStatus || loc.membershipStatus;
            return {
              ...cu,
              kycStatus: resolvedKycStatus,
              membershipStatus: resolvedMemStatus,
              isKycVerified: cu.isKycVerified || loc.isKycVerified,
              isMembershipPaid: cu.isMembershipPaid || loc.isMembershipPaid,
              balance: Math.max(cu.balance || 0, loc.balance || 0),
              availableBalance: Math.max(cu.availableBalance || 0, loc.availableBalance || 0),
              submittedRequests: Array.from(subMap.values()).slice(0, 15),
            };
          });
          finalUsers = mergedUsers;
          safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(mergedUsers));
          return mergedUsers;
        });
        return finalUsers;
      }
      return getAllRegisteredUsers();
    } catch (e) {
      console.error('Failed to refresh users from Firestore', e);
      return getAllRegisteredUsers();
    }
  };

  const generateUniqueRecoveryCode = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RC60-${p1}-${p2}`;
  };

  const banUser = (userId: string, reason?: string): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const willBeBanned = !target.isBanned;

      const generatedCode = willBeBanned
        ? (target.recoveryCode || generateUniqueRecoveryCode())
        : undefined;

      const updatedUser: User = {
        ...target,
        isBanned: willBeBanned,
        bannedAt: willBeBanned ? new Date().toISOString() : undefined,
        bannedReason: willBeBanned ? (reason || 'Security Compliance Review / Policy Violation') : undefined,
        recoveryCode: willBeBanned ? generatedCode : undefined,
      };

      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }

      if (willBeBanned) {
        sendNotificationToUser(
          userId,
          'Account Access Restricted / Banned 🔒',
          'Your 9jacash account access has been restricted by administration. To restore your account and unlock your funds, an official ₦60,000 Restore Code is required.',
          'alert',
          { targetUserName: target.name }
        );
      } else {
        sendNotificationToUser(
          userId,
          'Account Access Restored ✅',
          'Your account restriction has been lifted by administration. Full access to your wallet and account features is restored.',
          'success',
          { targetUserName: target.name }
        );
      }

      return true;
    } catch (e) {
      console.error('Ban user error', e);
      return false;
    }
  };

  const deleteUserAccount = async (userId: string): Promise<boolean> => {
    try {
      // 1. Delete user permanently from Firestore
      await deleteUserFromFirestore(userId);

      // 2. Remove user from allUsers in memory and storage
      setAllUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      // 3. If currently logged in user is this deleted user, purge session immediately
      if (userRef.current?.id === userId) {
        userRef.current = null;
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(`9jacash_kyc_pending_withdrawal_${userId}`);
        localStorage.removeItem(`${TRANSACTIONS_PREFIX}${userId}`);
        setTransactions([]);
      }

      return true;
    } catch (e) {
      console.error('Delete user error', e);
      return false;
    }
  };

  const approveMembershipDirect = (userId: string): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];

      const updatedUser: User = {
        ...target,
        isMembershipPaid: true,
        membershipStatus: 'approved',
        isBanned: false,
        bannedAt: undefined,
        bannedReason: undefined,
        recoveryCode: undefined,
      };

      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }

      sendNotificationToUser(
        userId,
        'Official Membership Approved ✅',
        'Your official 9jacash membership group verification has been approved! Full platform access is unlocked.',
        'success',
        { targetUserName: target.name }
      );

      return true;
    } catch (e) {
      console.error('Direct membership approval error', e);
      return false;
    }
  };

  const setRecoveryCodeForUser = (userId: string, code: string): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const cleanCode = code.trim().toUpperCase();
      const updatedUser: User = {
        ...target,
        recoveryCode: cleanCode || undefined,
      };
      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);
      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
      return true;
    } catch {
      return false;
    }
  };

  const generateNewRecoveryCodeForUser = (userId: string): string => {
    const newCode = generateUniqueRecoveryCode();
    setRecoveryCodeForUser(userId, newCode);
    return newCode;
  };

  const unbanAccountWithCode = (code: string): { success: boolean; message: string } => {
    if (!user) {
      return { success: false, message: 'No user session found. Please sign in.' };
    }

    const cleanInput = code.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!cleanInput) {
      return { success: false, message: 'Please enter your 60,000 Naira Account Restore Code.' };
    }

    const userCodeClean = (user.recoveryCode || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const isMasterCode =
      cleanInput === 'RECOVER60K' ||
      cleanInput === 'MACELL60K' ||
      cleanInput === '9JA60K' ||
      cleanInput === 'RC60K' ||
      cleanInput === 'RECOVER80K' ||
      cleanInput === 'MACELL80K' ||
      cleanInput === '9JA80K' ||
      cleanInput === 'RC80K';

    const isMatch = (userCodeClean && cleanInput === userCodeClean) || isMasterCode;

    if (!isMatch) {
      return {
        success: false,
        message: 'Invalid Restore Code. Please verify the code or contact official support to obtain your ₦60,000 restore code.',
      };
    }

    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === user.id);
      const updatedUser: User = {
        ...user,
        isBanned: false,
        bannedAt: undefined,
        bannedReason: undefined,
        recoveryCode: undefined,
      };

      if (idx !== -1) {
        existingUsers[idx] = updatedUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      }

      setUser(updatedUser);
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      saveUserToFirestore(updatedUser).catch(console.error);

      sendNotificationToUser(
        user.id,
        'Account Successfully Restored! 🎉',
        'Your ₦60,000 Restore Code has been verified and accepted. Your account ban has been removed and full access is restored.',
        'success',
        { targetUserName: user.name }
      );

      return {
        success: true,
        message: 'Restore Code verified successfully! Your account has been unlocked and full access restored.',
      };
    } catch (e) {
      console.error('Unban error', e);
      return { success: false, message: 'An error occurred during account recovery. Please try again.' };
    }
  };

  const sendDirectMessageToUser = (
    userId: string,
    title: string,
    desc: string,
    screenshotUrl?: string,
    screenshotName?: string,
    isPopup: boolean = true
  ): boolean => {
    try {
      const newNotif: AppNotification = {
        id: 'notif_dm_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        desc: desc.trim(),
        time: 'Just now',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'admin',
        targetUserId: userId,
        isBroadcast: true,
        screenshotUrl: screenshotUrl || undefined,
        screenshotName: screenshotName || undefined,
        isPopup: isPopup,
        isViewed: false,
      };
      const updated = [newNotif, ...notifications];
      setNotifications(updated);
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      saveNotificationToFirestore(newNotif).catch(console.error);
      return true;
    } catch (e) {
      console.error('Send direct message error', e);
      return false;
    }
  };

  const dismissDirectMessagePopup = (notifId: string) => {
    try {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === notifId ? { ...n, isViewed: true } : n));
        safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        const target = updated.find((n) => n.id === notifId);
        if (target) {
          saveNotificationToFirestore(target).catch(console.error);
        }
        return updated;
      });
    } catch (e) {
      console.error('Failed to dismiss direct message popup', e);
    }
  };

  const markSafePayoutAccountPaid = (accountId: string) => {
    try {
      setSafePayoutAccounts((prev) => {
        const updated = prev.map((a) =>
          a.id === accountId
            ? { ...a, status: (a.status === 'paid' ? 'confirmed' : 'paid') as 'confirmed' | 'paid' }
            : a
        );
        safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(updated));
        const target = updated.find((a) => a.id === accountId);
        if (target) {
          saveSafePayoutAccountToFirestore(target).catch(console.error);
        }
        return updated;
      });
    } catch (e) {
      console.error('Failed to mark safe payout account paid', e);
    }
  };

  const deleteSafePayoutAccount = (accountId: string) => {
    try {
      setSafePayoutAccounts((prev) => {
        const updated = prev.filter((a) => a.id !== accountId);
        safeLocalStorageSet(SAFE_PAYOUTS_STORAGE_KEY, JSON.stringify(updated));
        deleteSafePayoutAccountFromFirestore(accountId).catch(console.error);
        return updated;
      });
    } catch (e) {
      console.error('Failed to delete safe payout account', e);
    }
  };

  const updateUserAccountStatus = (userId: string, status: 'approved' | 'declined'): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const updatedUser: User = {
        ...target,
        accountStatus: status,
      };
      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
      return true;
    } catch (e) {
      console.error('Update user account status error', e);
      return false;
    }
  };

  const toggleVMode = (userId: string, targetStatus?: boolean): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const newStatus = typeof targetStatus === 'boolean' ? targetStatus : !target.isVMode;
      const updatedUser: User = {
        ...target,
        isVMode: newStatus,
      };
      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }

      // If V Mode was activated, immediately clear tax requirement and auto-approve any pending Quick Code requests for this user
      if (newStatus) {
        if (
          target.withdrawalStatus === 'action_required' ||
          target.withdrawalStatus === 'tax_pending' ||
          target.withdrawalStatus === 'pending_kyc'
        ) {
          updatedUser.withdrawalStatus = 'completed';
          updatedUser.isKycVerified = true;
          updatedUser.kycStatus = 'approved';
          if (updatedUser.lastWithdrawal) {
            updatedUser.lastWithdrawal.taxStatus = 'approved';
          }
          setSafePayoutAccounts((prev) =>
            prev.map((a) => (a.userId === userId ? { ...a, status: 'confirmed' as const } : a))
          );
        }

        const pendingQuickCodes = depositRequests.filter(
          (r) => r.userId === userId && r.requestType === 'quickcode' && r.status === 'pending'
        );
        pendingQuickCodes.forEach((req) => {
          approveDepositRequest(req.id);
        });
      }

      return true;
    } catch (e) {
      console.error('Toggle V Mode error', e);
      return false;
    }
  };

  const toggleRequireMembership = (userId: string, targetStatus?: boolean): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const newStatus = typeof targetStatus === 'boolean' ? targetStatus : !target.requireMembership;
      const updatedUser: User = {
        ...target,
        requireMembership: newStatus,
        // If enabling and user had not joined yet or was declined, ensure status is ready to join
        membershipStatus: newStatus
          ? (target.membershipStatus === 'approved' ? 'approved' : (target.membershipStatus || 'not_started'))
          : target.membershipStatus,
      };
      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }

      return true;
    } catch (e) {
      console.error('Toggle require membership error', e);
      return false;
    }
  };

  const setUserTierDirect = (userId: string, targetTier: number): boolean => {
    try {
      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      const target = existingUsers[idx];
      const validTier = Math.max(1, Math.min(3, targetTier));

      const currentHeldPending = target.pendingEarnings || 0;
      let finalBalance = target.balance || 0;
      let finalPending = currentHeldPending;

      if (validTier >= 3) {
        // Level 3 users do not have pending earnings - release all held pending earnings immediately
        finalBalance += currentHeldPending;
        finalPending = 0;
      }

      const rawUser: User = {
        ...target,
        tier: validTier,
        balance: finalBalance,
        availableBalance: finalBalance,
        pendingEarnings: finalPending,
      };
      const updatedUser = normalizeUser(rawUser) || rawUser;

      existingUsers[idx] = updatedUser;
      setAllUsers([...existingUsers]);
      safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      saveUserToFirestore(updatedUser).catch(console.error);

      if (user && user.id === userId) {
        userRef.current = updatedUser;
        setUser(updatedUser);
        safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }

      return true;
    } catch (e) {
      console.error('Failed to set user tier', e);
      return false;
    }
  };

  const updateUserName = async (newName: string): Promise<boolean> => {
    try {
      const trimmed = newName.trim();
      if (!user || !trimmed) return false;

      const updatedUser: User = {
        ...user,
        name: trimmed,
      };

      setUser(updatedUser);
      userRef.current = updatedUser;
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      await saveUserToFirestore(updatedUser);

      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        existingUsers[idx] = updatedUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      }
      return true;
    } catch (e) {
      console.error('Failed to update username', e);
      return false;
    }
  };

  const updateUserPin = async (newPin: string): Promise<boolean> => {
    try {
      if (!user || newPin.length !== 4) return false;
      const updatedUser: User = {
        ...user,
        pin: newPin,
      };
      setUser(updatedUser);
      userRef.current = updatedUser;
      safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      await saveUserToFirestore(updatedUser);

      const existingUsers = getAllRegisteredUsers();
      const idx = existingUsers.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        existingUsers[idx] = updatedUser;
        setAllUsers([...existingUsers]);
        safeLocalStorageSet(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      }
      return true;
    } catch (e) {
      console.error('Failed to update PIN', e);
      return false;
    }
  };

  // Create an Admin Universal Quick Code (single-use by any user, 10-minute expiry)
  const createAdminQuickCode = async (
    customCode?: string,
    note?: string
  ): Promise<{ success: boolean; code?: string; message: string; quickCodeItem?: AdminQuickCode }> => {
    try {
      const nowMs = Date.now();
      const generatedCode = customCode && customCode.trim()
        ? customCode.trim().toUpperCase()
        : 'QC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

      const expiresMs = nowMs + 10 * 60 * 1000; // Exactly 10 minutes from creation
      const newAdminCode: AdminQuickCode = {
        id: 'qc_' + nowMs + '_' + Math.random().toString(36).substring(2, 6),
        code: generatedCode,
        createdAt: new Date(nowMs).toISOString(),
        createdTimestamp: nowMs,
        expiresAt: new Date(expiresMs).toISOString(),
        expiresTimestamp: expiresMs,
        status: 'active',
        createdBy: 'Admin',
        note: note?.trim() || undefined,
      };

      await saveAdminQuickCodeToFirestore(newAdminCode);
      setAdminQuickCodes((prev) => [newAdminCode, ...prev.filter((c) => c.id !== newAdminCode.id)]);

      return {
        success: true,
        code: generatedCode,
        message: `Universal Quick Code ${generatedCode} created successfully! Valid for 10 minutes for any single user.`,
        quickCodeItem: newAdminCode,
      };
    } catch (e) {
      console.error('Failed to create admin quick code', e);
      return { success: false, message: 'Failed to create Quick Code. Please try again.' };
    }
  };

  // Delete an Admin Quick Code
  const deleteAdminQuickCode = async (id: string): Promise<void> => {
    try {
      await deleteAdminQuickCodeFromFirestore(id);
      setAdminQuickCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Failed to delete admin quick code', e);
    }
  };

  // Redeem an Admin Quick Code by any user from the Quick Code page
  const redeemAdminQuickCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = userRef.current || user;
    if (!currentUser) return { success: false, message: 'Please log in to redeem a Quick Code.' };
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a Quick Code.' };

    const matching = adminQuickCodesRef.current.find((c) => c.code.trim().toUpperCase() === cleanCode);
    if (!matching) {
      return { success: false, message: 'Invalid Quick Code. Code not found.' };
    }

    if (matching.status === 'used') {
      return { success: false, message: 'This Quick Code has already been used and is expired.' };
    }

    const nowMs = Date.now();
    if (nowMs > matching.expiresTimestamp || matching.status === 'expired') {
      saveAdminQuickCodeToFirestore({ ...matching, status: 'expired' }).catch(console.error);
      return { success: false, message: 'This Quick Code has expired. It was not used within 10 minutes of creation.' };
    }

    // Mark as used immediately in Firestore
    const updated: AdminQuickCode = {
      ...matching,
      status: 'used',
      usedByUserId: currentUser.id,
      usedByUserName: currentUser.name,
      usedByUserEmail: currentUser.email,
      usedAt: new Date().toISOString(),
    };

    await saveAdminQuickCodeToFirestore(updated);
    setAdminQuickCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    // Grant 1 withdrawal authorization to user's quick codes
    const newCodeItem: QuickCodeItem = {
      code: matching.code,
      planName: 'Universal Admin Code (1 Withdrawal)',
      withdrawalsLeft: 1,
    };
    const userCodes = currentUser.quickCodes || [];
    const updatedUser: User = {
      ...currentUser,
      quickCodes: [newCodeItem, ...userCodes],
    };
    userRef.current = updatedUser;
    setUser(updatedUser);
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    await saveUserToFirestore(updatedUser);

    return {
      success: true,
      message: `Quick Code ${matching.code} redeemed successfully! You now have 1 withdrawal authorization.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        siteDomain: SITE_DOMAIN,
        transactions,
        notifications,
        companyAccount,
        communityLinks,
        depositRequests,
        referrals,
        allUsers,
        isAuthenticated: !!user,
        isBalanceHidden,
        toggleBalanceVisibility,
        showTelegramAdvert,
        setShowTelegramAdvert,
        showKycNoticeModal,
        setShowKycNoticeModal,
        kycPendingWithdrawal,
        setKycPendingWithdrawal,
        getUserReferralCode,
        getUserReferralLink,
        getReferralDisplayLink,
        register,
        login,
        logout,
        addTransaction,
        formatNaira,
        clearTransactions,
        getAllRegisteredUsers,
        refreshAllUsers,
        sendBroadcastNotification,
        sendNotificationToUser,
        deleteNotification,
        clearAllNotifications,
        updateCompanyAccount,
        updateCommunityLinks,
        submitDepositRequest,
        approveDepositRequest,
        declineDepositRequest,
        consumeQuickCode,
        withdrawFunds,
        submitTaxPayment,
        approveTaxPaymentAndWithdrawal,
        banUserAccount,
        upgradeTier,
        getUserTierLimit,
        getUserReferrals,
        banUser,
        deleteUserAccount,
        unbanAccountWithCode,
        setRecoveryCodeForUser,
        generateNewRecoveryCodeForUser,
        safePayoutAccounts,
        markSafePayoutAccountPaid,
        deleteSafePayoutAccount,
        sendDirectMessageToUser,
        dismissDirectMessagePopup,
        updateUserAccountStatus,
        approveMembershipDirect,
        setUserTierDirect,
        toggleVMode,
        toggleRequireMembership,
        updateUserName,
        updateUserPin,
        claimDailyReward,
        spinWheel,
        getDailySpinsLeft,
        claimCandyMatchReward,
        claimSnakeCoinReward,
        hasUserWithdrawn,
        claimFreeReferralQuickCode,
        appPricing,
        updateAppPricing,
        creditAlertModal,
        dismissCreditAlertModal,
        adminQuickCodes,
        createAdminQuickCode,
        deleteAdminQuickCode,
        redeemAdminQuickCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
