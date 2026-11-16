import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  setLogLevel,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { User, Transaction, ReferralRecord, DepositRequest, CompanyAccount, CommunityLinks, AppNotification, SafeWithdrawalAccount, AppPricing, DevicePushBroadcast, DeviceSubscriber, AdminQuickCode, SupportChatMessage, SupportChatThread } from '../types/index.ts';
import { sortTransactionsNewestFirst } from '../utils/transactionSort.ts';
import { extractReferralCodeFromEmail } from '../utils/referral.ts';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyB4PRlRaR2yz4HH4fbi3hk3BttItITsOfQ",
  authDomain: "project-2901277293043662795.firebaseapp.com",
  projectId: "project-2901277293043662795",
  storageBucket: "project-2901277293043662795.firebasestorage.app",
  messagingSenderId: "139269929507",
  appId: "1:139269929507:web:f8ada97617ed072f870f96",
  measurementId: "G-5X1T59TKH6"
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }
}

// Silence internal offline retry and backoff logs to keep console clean
try {
  setLogLevel('silent');
} catch {
  // Ignore in environments where setLogLevel is restricted
}

// Configure Firestore with in-memory cache and auto-detect long polling
function initFirestoreInstance() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: memoryLocalCache(),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = initFirestoreInstance();
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let isQuotaExhaustedState = false;
let quotaResetTimer: any = null;

export function isFirestoreQuotaExhausted(): boolean {
  return isQuotaExhaustedState;
}

export function setFirestoreQuotaExhausted(val: boolean = true) {
  if (isQuotaExhaustedState !== val) {
    isQuotaExhaustedState = val;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('9jacash_quota_status_change', { detail: { exceeded: val } }));
    }
  }

  if (val) {
    if (quotaResetTimer) clearTimeout(quotaResetTimer);
    // Automatically attempt reconnection after a 20s cooldown so operations don't freeze indefinitely
    quotaResetTimer = setTimeout(() => {
      isQuotaExhaustedState = false;
    }, 20000);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuota =
    errMsg.toLowerCase().includes('quota') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Resource has been exhausted');

  if (isQuota) {
    setFirestoreQuotaExhausted(true);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  // If transient network offline, backend unavailable, or quota notification, handle gracefully without console spam
  if (
    isQuota ||
    errMsg.includes('unavailable') ||
    errMsg.includes('offline') ||
    errMsg.includes('Could not reach') ||
    errMsg.includes('connection failed') ||
    errMsg.includes('Failed to get document')
  ) {
    return errInfo;
  }

  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Sanitizes an object before writing to Firestore, stripping `undefined` fields
 * which Firestore rejects as unsupported values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

// -------------------------------------------------------------
// FIRESTORE REAL-TIME SYNCHRONIZATION HELPERS
// -------------------------------------------------------------

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const REFERRALS_COLLECTION = 'referrals';
const DEPOSITS_COLLECTION = 'deposit_requests';
const SETTINGS_COLLECTION = 'app_settings';
const NOTIFICATIONS_COLLECTION = 'notifications';
const SAFE_PAYOUTS_COLLECTION = 'safe_payout_accounts';

// 1. User Profiles & Balance Sync
export async function saveUserToFirestore(user: User): Promise<void> {
  if (!user?.id) return;
  if (isFirestoreQuotaExhausted()) return;
  const path = `${USERS_COLLECTION}/${user.id}`;
  const updatedAtIso = user.updatedAt || new Date().toISOString();
  try {
    // Keep at most 4 recent submittedRequests with compact thumbnails on the user document
    // so profilePicture, balances, and withdrawal state never approach Firestore's 1MB limit.
    const trimmedUser: User = {
      ...user,
      ...(Array.isArray(user.submittedRequests)
        ? {
            submittedRequests: user.submittedRequests.slice(0, 4).map((r) => ({
              ...r,
              receiptUrl: r.receiptUrl && r.receiptUrl.length > 45000 ? '' : r.receiptUrl,
            })),
          }
        : {}),
      ...(user.supportChat && Array.isArray(user.supportChat.messages)
        ? {
            supportChat: {
              ...user.supportChat,
              userProfilePicture: '',
              messages: user.supportChat.messages.slice(-40),
            },
          }
        : {}),
    };
    const sanitized = sanitizeForFirestore({
      ...trimmedUser,
      updatedAt: updatedAtIso,
    });
    await setDoc(doc(db, USERS_COLLECTION, user.id), sanitized, { merge: true });
  } catch (error) {
    // Fallback: strip embedded receipts & bulky chat history so core balance, withdrawal & profilePicture always save
    try {
      const lightUser = sanitizeForFirestore({
        ...user,
        submittedRequests: (user.submittedRequests || []).slice(0, 4).map((r) => ({
          ...r,
          receiptUrl: '',
        })),
        supportChat: user.supportChat
          ? {
              ...user.supportChat,
              userProfilePicture: '',
              messages: (user.supportChat.messages || []).slice(-15),
            }
          : user.supportChat,
        updatedAt: updatedAtIso,
      });
      await setDoc(doc(db, USERS_COLLECTION, user.id), lightUser, { merge: true });
    } catch (retryErr) {
      handleFirestoreError(retryErr, OperationType.WRITE, path);
    }
  }
}

export async function findUserByEmailOrIdInFirestore(identifier: string): Promise<User | null> {
  if (!identifier || isFirestoreQuotaExhausted()) return null;
  const clean = identifier.trim().toLowerCase();
  const raw = identifier.trim();

  try {
    // 1. Direct document lookup by ID
    const directSnap = await getDoc(doc(db, USERS_COLLECTION, raw));
    if (directSnap.exists()) {
      const data = directSnap.data() as User;
      return { ...data, id: data.id || directSnap.id };
    }

    // Also check lowercase ID if different
    if (clean !== raw) {
      const lowerSnap = await getDoc(doc(db, USERS_COLLECTION, clean));
      if (lowerSnap.exists()) {
        const data = lowerSnap.data() as User;
        return { ...data, id: data.id || lowerSnap.id };
      }
    }

    // 2. Query by email
    const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', clean));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      const d = snapEmail.docs[0];
      const data = d.data() as User;
      return { ...data, id: data.id || d.id };
    }

    // Try query with raw email if differing case
    if (raw !== clean) {
      const qEmailRaw = query(collection(db, USERS_COLLECTION), where('email', '==', raw));
      const snapEmailRaw = await getDocs(qEmailRaw);
      if (!snapEmailRaw.empty) {
        const d = snapEmailRaw.docs[0];
        const data = d.data() as User;
        return { ...data, id: data.id || d.id };
      }
    }

    // 3. Query by id field
    const qId = query(collection(db, USERS_COLLECTION), where('id', '==', raw));
    const snapId = await getDocs(qId);
    if (!snapId.empty) {
      const d = snapId.docs[0];
      const data = d.data() as User;
      return { ...data, id: data.id || d.id };
    }

    // 4. Fallback inspection: scan collection case-insensitively
    const snapAll = await getDocs(collection(db, USERS_COLLECTION));
    for (const d of snapAll.docs) {
      const data = d.data() as User;
      if (!data) continue;
      const uEmail = (data.email || '').trim().toLowerCase();
      const uId = (data.id || d.id || '').trim();
      if (uEmail === clean || uId === raw || uId === clean) {
        return { ...data, id: data.id || d.id };
      }
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${identifier}`);
    return null;
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  if (!userId) return null;
  return findUserByEmailOrIdInFirestore(userId);
}

export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function getAllUsersFromFirestore(): Promise<User[]> {
  const path = USERS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => {
      const data = d.data() as User;
      return {
        ...data,
        id: data.id || d.id,
        referralCode: data.referralCode || extractReferralCodeFromEmail(data.email || ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Quickly finds a user in Firestore matching a referral code, email, handle or membership ID.
 * Employs a 3-second timeout so registration remains fast while reliably resolving cross-device referrals.
 */
export async function findUserByReferralCodeInFirestore(code: string): Promise<User | null> {
  if (!code || isFirestoreQuotaExhausted()) return null;
  const clean = code.trim().toLowerCase();
  const cleanHandle = clean.includes('@') ? extractReferralCodeFromEmail(clean) : clean;

  const searchOperation = (async (): Promise<User | null> => {
    try {
      // 1. Direct query by referralCode field
      const qRef = query(collection(db, USERS_COLLECTION), where('referralCode', '==', cleanHandle));
      const snapRef = await getDocs(qRef);
      if (!snapRef.empty) {
        const docSnap = snapRef.docs[0];
        const data = docSnap.data() as User;
        return { ...data, id: data.id || docSnap.id };
      }

      // 2. Query by email
      const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', clean));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const docSnap = snapEmail.docs[0];
        const data = docSnap.data() as User;
        return { ...data, id: data.id || docSnap.id };
      }

      // 3. Fallback: inspect user documents
      const snapAll = await getDocs(collection(db, USERS_COLLECTION));
      for (const d of snapAll.docs) {
        const raw = d.data() as User;
        if (!raw) continue;
        const u: User = { ...raw, id: raw.id || d.id };
        const uRef = (u.referralCode || '').toLowerCase().trim();
        const uEmail = (u.email || '').toLowerCase().trim();
        const uLocal = uEmail.split('@')[0];
        const uEmailRef = extractReferralCodeFromEmail(uEmail);
        const uMemberId = (u.membershipId || '').toLowerCase().trim();
        if (
          uRef === clean ||
          uRef === cleanHandle ||
          uEmail === clean ||
          uLocal === clean ||
          uLocal === cleanHandle ||
          uEmailRef === clean ||
          uEmailRef === cleanHandle ||
          uMemberId === clean
        ) {
          return u;
        }
      }
      return null;
    } catch (err) {
      console.warn('Failed to query referrer from Firestore:', err);
      return null;
    }
  })();

  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
  return Promise.race([searchOperation, timeoutPromise]);
}

export function subscribeToAllUsers(onUpdate: (users: User[]) => void): Unsubscribe {
  const path = USERS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, USERS_COLLECTION),
      (snap) => {
        try {
          const users = snap.docs.map((d) => {
            const data = d.data() as User;
            return {
              ...data,
              id: data.id || d.id,
              referralCode: data.referralCode || extractReferralCodeFromEmail(data.email || ''),
            };
          });
          onUpdate(users);
        } catch (e) {
          console.warn('Error processing users snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 2. Transactions Sync
export async function saveTransactionToFirestore(tx: Transaction, userId: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${TRANSACTIONS_COLLECTION}/${tx.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...tx,
      userId,
      createdAt: tx.createdAt || new Date().toISOString(),
      timestamp: tx.timestamp || Date.now(),
    });
    await setDoc(doc(db, TRANSACTIONS_COLLECTION, tx.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserTransactions(userId: string, onUpdate: (txs: Transaction[]) => void): Unsubscribe {
  const path = TRANSACTIONS_COLLECTION;
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        try {
          const rawTxs = snap.docs.map((d) => d.data() as Transaction);
          const sortedTxs = sortTransactionsNewestFirst(rawTxs);
          onUpdate(sortedTxs);
        } catch (e) {
          console.warn('Error processing user transactions snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export function subscribeToAllTransactions(onUpdate: (txs: (Transaction & { userId?: string })[]) => void): Unsubscribe {
  const path = TRANSACTIONS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, TRANSACTIONS_COLLECTION),
      (snap) => {
        try {
          const rawTxs = snap.docs.map((d) => d.data() as (Transaction & { userId?: string }));
          const sortedTxs = sortTransactionsNewestFirst(rawTxs);
          onUpdate(sortedTxs);
        } catch (e) {
          console.warn('Error processing all transactions snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 3. Referral Records Sync
export async function saveReferralRecordToFirestore(record: ReferralRecord): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${REFERRALS_COLLECTION}/${record.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...record,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, REFERRALS_COLLECTION, record.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 0. Connection Test
export async function testConnection(): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.toLowerCase().includes('quota') || errMsg.includes('resource-exhausted')) {
      setFirestoreQuotaExhausted(true);
    }
    return false;
  }
}

export function subscribeToReferrals(onUpdate: (referrals: ReferralRecord[]) => void): Unsubscribe {
  const path = REFERRALS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, REFERRALS_COLLECTION),
      (snap) => {
        try {
          const records = snap.docs.map((d) => d.data() as ReferralRecord);
          onUpdate(records);
        } catch (e) {
          console.warn('Error processing referrals snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export const subscribeToAllReferrals = subscribeToReferrals;

// 4. Deposit & Quick Code Requests Sync
export async function saveDepositRequestToFirestore(deposit: DepositRequest): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const docId = deposit.id || `dpr_${Date.now()}`;
  const path = `${DEPOSITS_COLLECTION}/${docId}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...deposit,
      id: docId,
      status: deposit.status || 'pending',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, DEPOSITS_COLLECTION, docId), sanitized, { merge: true });
  } catch (error) {
    // Only strip receiptUrl if it exceeded 750KB (Firestore limit is 1MB)
    if (deposit.receiptUrl && deposit.receiptUrl.length > 750000) {
      try {
        const fallbackSanitized = sanitizeForFirestore({
          ...deposit,
          id: docId,
          receiptUrl: '',
          status: deposit.status || 'pending',
          updatedAt: new Date().toISOString(),
        });
        await setDoc(doc(db, DEPOSITS_COLLECTION, docId), fallbackSanitized, { merge: true });
        return;
      } catch (retryErr) {
        handleFirestoreError(retryErr, OperationType.WRITE, path);
        return;
      }
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllDepositRequestsFromFirestore(): Promise<DepositRequest[]> {
  if (isFirestoreQuotaExhausted()) return [];
  const path = DEPOSITS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, DEPOSITS_COLLECTION));
    return snap.docs.map((d) => {
      const data = d.data() as DepositRequest;
      return {
        ...data,
        id: data.id || d.id,
        status: data.status || 'pending',
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToDepositRequests(onUpdate: (requests: DepositRequest[]) => void): Unsubscribe {
  const path = DEPOSITS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, DEPOSITS_COLLECTION),
      (snap) => {
        try {
          const requests = snap.docs.map((d) => {
            const data = d.data() as DepositRequest;
            return {
              ...data,
              id: data.id || d.id,
              status: data.status || 'pending',
            };
          });
          onUpdate(requests);
        } catch (e) {
          console.warn('Error processing deposit requests snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 5. Company Bank Account Settings Sync
export async function saveCompanyAccountToFirestore(account: CompanyAccount): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${SETTINGS_COLLECTION}/company_account`;
  try {
    const sanitized = sanitizeForFirestore({
      ...account,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, SETTINGS_COLLECTION, 'company_account'), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCompanyAccount(onUpdate: (account: CompanyAccount | null) => void): Unsubscribe {
  const path = `${SETTINGS_COLLECTION}/company_account`;
  try {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, 'company_account'),
      (snap) => {
        try {
          if (snap.exists()) {
            onUpdate(snap.data() as CompanyAccount);
          }
        } catch (e) {
          console.warn('Error processing company account snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 6. Community Links Settings Sync
export async function saveCommunityLinksToFirestore(links: CommunityLinks): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${SETTINGS_COLLECTION}/community_links`;
  try {
    const sanitized = sanitizeForFirestore({
      ...links,
      updatedAt: links.updatedAt || new Date().toISOString(),
    });
    await setDoc(doc(db, SETTINGS_COLLECTION, 'community_links'), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCommunityLinks(onUpdate: (links: CommunityLinks | null) => void): Unsubscribe {
  const path = `${SETTINGS_COLLECTION}/community_links`;
  try {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, 'community_links'),
      (snap) => {
        try {
          if (snap.exists()) {
            onUpdate(snap.data() as CommunityLinks);
          }
        } catch (e) {
          console.warn('Error processing community links snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 6b. App Pricing Settings Sync (KYC & Quick Code Prices)
export async function savePricingToFirestore(pricing: AppPricing): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${SETTINGS_COLLECTION}/pricing`;
  try {
    const sanitized = sanitizeForFirestore({
      ...pricing,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, SETTINGS_COLLECTION, 'pricing'), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToPricing(onUpdate: (pricing: AppPricing | null) => void): Unsubscribe {
  const path = `${SETTINGS_COLLECTION}/pricing`;
  try {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, 'pricing'),
      (snap) => {
        try {
          if (snap.exists()) {
            onUpdate(snap.data() as AppPricing);
          }
        } catch (e) {
          console.warn('Error processing pricing snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch {
    return () => {};
  }
}

// 7. Notifications Sync
export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${NOTIFICATIONS_COLLECTION}/${notif.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...notif,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToNotifications(onUpdate: (notifs: AppNotification[]) => void): Unsubscribe {
  const path = NOTIFICATIONS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, NOTIFICATIONS_COLLECTION),
      (snap) => {
        try {
          const notifs = snap.docs.map((d) => d.data() as AppNotification);
          onUpdate(notifs);
        } catch (e) {
          console.warn('Error processing notifications snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${NOTIFICATIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 8. Safe Payout Accounts Sync (Confirmed KYC Withdrawal Accounts)
export async function saveSafePayoutAccountToFirestore(account: SafeWithdrawalAccount): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${SAFE_PAYOUTS_COLLECTION}/${account.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...account,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, SAFE_PAYOUTS_COLLECTION, account.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToSafePayoutAccounts(onUpdate: (accounts: SafeWithdrawalAccount[]) => void): Unsubscribe {
  const path = SAFE_PAYOUTS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, SAFE_PAYOUTS_COLLECTION),
      (snap) => {
        try {
          const accounts = snap.docs.map((d) => d.data() as SafeWithdrawalAccount);
          onUpdate(accounts);
        } catch (e) {
          console.warn('Error processing safe payout accounts snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export async function deleteSafePayoutAccountFromFirestore(id: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${SAFE_PAYOUTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, SAFE_PAYOUTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 9. Device Push Broadcasts Sync (OS-level notifications sent to Android & iPhone)
export const DEVICE_BROADCASTS_COLLECTION = 'device_broadcasts';
export const DEVICE_SUBSCRIBERS_COLLECTION = 'device_subscribers';

export async function saveDeviceBroadcastToFirestore(broadcast: DevicePushBroadcast): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${DEVICE_BROADCASTS_COLLECTION}/${broadcast.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...broadcast,
      createdAt: broadcast.createdAt || new Date().toISOString(),
      timestamp: broadcast.timestamp || Date.now(),
    });
    await setDoc(doc(db, DEVICE_BROADCASTS_COLLECTION, broadcast.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToDeviceBroadcasts(onUpdate: (broadcasts: DevicePushBroadcast[]) => void): Unsubscribe {
  const path = DEVICE_BROADCASTS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, DEVICE_BROADCASTS_COLLECTION),
      (snap) => {
        try {
          const list = snap.docs.map((d) => d.data() as DevicePushBroadcast);
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          onUpdate(list);
        } catch (e) {
          console.warn('Error processing device broadcasts snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export async function deleteDeviceBroadcastFromFirestore(id: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${DEVICE_BROADCASTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, DEVICE_BROADCASTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10. Device Subscribers Sync (Tracking registered Android and iPhone devices)
export async function registerDeviceSubscriberInFirestore(sub: DeviceSubscriber): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${DEVICE_SUBSCRIBERS_COLLECTION}/${sub.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...sub,
      lastActiveAt: new Date().toISOString(),
    });
    await setDoc(doc(db, DEVICE_SUBSCRIBERS_COLLECTION, sub.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToDeviceSubscribers(onUpdate: (subscribers: DeviceSubscriber[]) => void): Unsubscribe {
  const path = DEVICE_SUBSCRIBERS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, DEVICE_SUBSCRIBERS_COLLECTION),
      (snap) => {
        try {
          const list = snap.docs.map((d) => d.data() as DeviceSubscriber);
          onUpdate(list);
        } catch (e) {
          console.warn('Error processing device subscribers snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export async function getDeviceSubscribersFromFirestore(): Promise<DeviceSubscriber[]> {
  if (isFirestoreQuotaExhausted()) return [];
  const path = DEVICE_SUBSCRIBERS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, DEVICE_SUBSCRIBERS_COLLECTION));
    return snap.docs.map((d) => d.data() as DeviceSubscriber);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 11. Admin Universal Quick Codes Sync (10-minute expiry, single-use by any user)
export const ADMIN_QUICK_CODES_COLLECTION = 'admin_quick_codes';

export async function saveAdminQuickCodeToFirestore(codeItem: AdminQuickCode): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${ADMIN_QUICK_CODES_COLLECTION}/${codeItem.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...codeItem,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, ADMIN_QUICK_CODES_COLLECTION, codeItem.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToAdminQuickCodes(onUpdate: (codes: AdminQuickCode[]) => void): Unsubscribe {
  const path = ADMIN_QUICK_CODES_COLLECTION;
  try {
    return onSnapshot(
      collection(db, ADMIN_QUICK_CODES_COLLECTION),
      (snap) => {
        try {
          const list = snap.docs.map((d) => d.data() as AdminQuickCode);
          list.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
          onUpdate(list);
        } catch (e) {
          console.warn('Error processing admin quick codes snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}

export async function deleteAdminQuickCodeFromFirestore(id: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  const path = `${ADMIN_QUICK_CODES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ADMIN_QUICK_CODES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getAdminQuickCodesFromFirestore(): Promise<AdminQuickCode[]> {
  if (isFirestoreQuotaExhausted()) return [];
  const path = ADMIN_QUICK_CODES_COLLECTION;
  try {
    const snap = await getDocs(collection(db, ADMIN_QUICK_CODES_COLLECTION));
    return snap.docs.map((d) => d.data() as AdminQuickCode);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 12. 9jacash Support Chat Threads (User <-> Admin Live Support)
export const SUPPORT_CHATS_COLLECTION = 'support_chats';

function pickNewerSupportThread(
  a?: SupportChatThread | null,
  b?: SupportChatThread | null
): SupportChatThread | null {
  if (!a && !b) return null;
  if (!a) return b || null;
  if (!b) return a || null;
  const aLen = Array.isArray(a.messages) ? a.messages.length : 0;
  const bLen = Array.isArray(b.messages) ? b.messages.length : 0;
  if ((b.lastTimestamp || 0) !== (a.lastTimestamp || 0)) {
    return (b.lastTimestamp || 0) > (a.lastTimestamp || 0) ? b : a;
  }
  return bLen >= aLen ? b : a;
}

async function readExistingSupportThread(userId: string): Promise<SupportChatThread | null> {
  const [chatRes, userRes] = await Promise.allSettled([
    getDoc(doc(db, SUPPORT_CHATS_COLLECTION, userId)),
    getDoc(doc(db, USERS_COLLECTION, userId)),
  ]);

  let chatDocThread: SupportChatThread | null = null;
  let userDocThread: SupportChatThread | null = null;

  if (chatRes.status === 'fulfilled' && chatRes.value.exists()) {
    chatDocThread = chatRes.value.data() as SupportChatThread;
  }
  if (userRes.status === 'fulfilled' && userRes.value.exists()) {
    const userData = userRes.value.data() as User;
    if (userData?.supportChat) {
      userDocThread = userData.supportChat;
    }
  }

  return pickNewerSupportThread(chatDocThread, userDocThread);
}

async function persistSupportThread(userId: string, thread: SupportChatThread): Promise<boolean> {
  const compactThread: SupportChatThread = {
    ...thread,
    userProfilePicture: '',
    messages: (thread.messages || []).slice(-60),
  };

  const [chatWrite, userWrite] = await Promise.allSettled([
    setDoc(doc(db, SUPPORT_CHATS_COLLECTION, userId), sanitizeForFirestore(thread), {
      merge: true,
    }),
    setDoc(
      doc(db, USERS_COLLECTION, userId),
      sanitizeForFirestore({
        supportChat: compactThread,
        updatedAt: thread.updatedAt,
      }),
      { merge: true }
    ),
  ]);

  if (chatWrite.status === 'rejected') {
    const err = chatWrite.reason;
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
    }
  }

  if (userWrite.status === 'rejected') {
    handleFirestoreError(userWrite.reason, OperationType.WRITE, `${USERS_COLLECTION}/${userId}`);
  }

  return chatWrite.status === 'fulfilled' || userWrite.status === 'fulfilled';
}

export async function sendUserSupportMessageToFirestore(
  user: { id: string; name?: string; email?: string; profilePicture?: string },
  rawText: string
): Promise<{ ok: boolean; reason?: string; thread?: SupportChatThread }> {
  const text = rawText.trim().slice(0, 2000);
  if (!text) {
    return { ok: false, reason: 'Please enter a message before sending.' };
  }
  if (!user?.id) {
    return { ok: false, reason: 'Please sign in to send a support message.' };
  }
  if (isFirestoreQuotaExhausted()) {
    return { ok: false, reason: 'Service is temporarily busy. Please try again in a moment.' };
  }

  try {
    const existing = await readExistingSupportThread(user.id);
    const existingMessages = Array.isArray(existing?.messages) ? existing.messages : [];
    const latestMsg = existingMessages[existingMessages.length - 1];

    // Enforce turn-taking: user cannot send consecutive messages before admin replies
    if (latestMsg && latestMsg.sender === 'user') {
      return {
        ok: false,
        reason: 'Please wait for 9jacash Support to reply before sending another message.',
        thread: existing || undefined,
      };
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const newMsg: SupportChatMessage = {
      id: `msg_${now}_${Math.random().toString(36).slice(2, 8)}`,
      sender: 'user',
      senderName: user.name || 'User',
      text,
      timestamp: now,
      createdAt: nowIso,
    };

    const updatedMessages = [...existingMessages, newMsg].slice(-80);
    const thread: SupportChatThread = {
      id: user.id,
      userId: user.id,
      userName: user.name || existing?.userName || '9jacash User',
      userEmail: user.email || existing?.userEmail || '',
      userProfilePicture:
        user.profilePicture && user.profilePicture.length <= 120000
          ? user.profilePicture
          : existing?.userProfilePicture || '',
      messages: updatedMessages,
      lastMessage: text,
      lastSender: 'user',
      awaitingAdminReply: true,
      lastTimestamp: now,
      updatedAt: nowIso,
    };

    const saved = await persistSupportThread(user.id, thread);
    if (!saved) {
      return { ok: false, reason: 'Unable to send message right now. Please try again.' };
    }
    return { ok: true, thread };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${user.id}`);
    return { ok: false, reason: 'Unable to send message right now. Please try again.' };
  }
}

export async function sendAdminSupportReplyToFirestore(
  userId: string,
  rawText: string,
  userMeta?: { name?: string; email?: string; profilePicture?: string }
): Promise<{ ok: boolean; reason?: string; thread?: SupportChatThread }> {
  const text = rawText.trim().slice(0, 2000);
  if (!text) {
    return { ok: false, reason: 'Please enter a reply message.' };
  }
  if (!userId) {
    return { ok: false, reason: 'No user selected.' };
  }
  if (isFirestoreQuotaExhausted()) {
    return { ok: false, reason: 'Service is temporarily busy. Please try again shortly.' };
  }

  try {
    const existing = await readExistingSupportThread(userId);
    const existingMessages = Array.isArray(existing?.messages) ? existing.messages : [];

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const adminMsg: SupportChatMessage = {
      id: `msg_${now}_${Math.random().toString(36).slice(2, 8)}`,
      sender: 'admin',
      senderName: '9jacash Support',
      text,
      timestamp: now,
      createdAt: nowIso,
    };

    const updatedMessages = [...existingMessages, adminMsg].slice(-80);
    const thread: SupportChatThread = {
      id: userId,
      userId,
      userName: existing?.userName || userMeta?.name || '9jacash User',
      userEmail: existing?.userEmail || userMeta?.email || '',
      userProfilePicture: existing?.userProfilePicture || userMeta?.profilePicture || '',
      messages: updatedMessages,
      lastMessage: text,
      lastSender: 'admin',
      awaitingAdminReply: false,
      lastTimestamp: now,
      updatedAt: nowIso,
    };

    const saved = await persistSupportThread(userId, thread);
    if (!saved) {
      return { ok: false, reason: 'Failed to send reply. Please try again.' };
    }
    return { ok: true, thread };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
    return { ok: false, reason: 'Failed to send reply. Please try again.' };
  }
}

export function subscribeToUserSupportChat(
  userId: string,
  onUpdate: (thread: SupportChatThread | null) => void
): Unsubscribe {
  if (!userId) return () => {};
  let chatThread: SupportChatThread | null = null;
  let userThread: SupportChatThread | null = null;

  const emit = () => {
    onUpdate(pickNewerSupportThread(chatThread, userThread));
  };

  let unsubChat: Unsubscribe = () => {};
  let unsubUser: Unsubscribe = () => {};

  try {
    unsubChat = onSnapshot(
      doc(db, SUPPORT_CHATS_COLLECTION, userId),
      (snap) => {
        try {
          chatThread = snap.exists() ? (snap.data() as SupportChatThread) : null;
          emit();
        } catch (e) {
          console.warn('Error processing user support chat snapshot', e);
        }
      },
      () => {
        // Silently rely on users/{userId} listener if support_chats rule isn't deployed
      }
    );
  } catch {
    unsubChat = () => {};
  }

  try {
    unsubUser = onSnapshot(
      doc(db, USERS_COLLECTION, userId),
      (snap) => {
        try {
          if (snap.exists()) {
            const u = snap.data() as User;
            userThread = u?.supportChat || null;
          } else {
            userThread = null;
          }
          emit();
        } catch (e) {
          console.warn('Error processing user doc support chat snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
      }
    );
  } catch {
    unsubUser = () => {};
  }

  return () => {
    unsubChat();
    unsubUser();
  };
}

export function subscribeToAllSupportChats(
  onUpdate: (threads: SupportChatThread[]) => void
): Unsubscribe {
  const path = SUPPORT_CHATS_COLLECTION;
  try {
    return onSnapshot(
      collection(db, SUPPORT_CHATS_COLLECTION),
      (snap) => {
        try {
          const threads = snap.docs
            .map((d) => d.data() as SupportChatThread)
            .filter((t) => t && t.userId && Array.isArray(t.messages) && t.messages.length > 0);
          threads.sort((a, b) => {
            const aWaiting = a.lastSender === 'user' || a.awaitingAdminReply ? 1 : 0;
            const bWaiting = b.lastSender === 'user' || b.awaitingAdminReply ? 1 : 0;
            if (bWaiting !== aWaiting) return bWaiting - aWaiting;
            return (b.lastTimestamp || 0) - (a.lastTimestamp || 0);
          });
          onUpdate(threads);
        } catch (e) {
          console.warn('Error processing all support chats snapshot', e);
        }
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.toLowerCase().includes('permission')) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      }
    );
  } catch {
    return () => {};
  }
}

export async function deleteSupportChatFromFirestore(userId: string): Promise<void> {
  if (isFirestoreQuotaExhausted() || !userId) return;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const clearedThread: SupportChatThread = {
    id: userId,
    userId,
    userName: '',
    userEmail: '',
    userProfilePicture: '',
    messages: [],
    lastMessage: '',
    lastSender: 'admin',
    awaitingAdminReply: false,
    lastTimestamp: now,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, SUPPORT_CHATS_COLLECTION, userId), clearedThread);
  } catch {
    // Ignore if support_chats rule isn't deployed
  }
  try {
    await deleteDoc(doc(db, SUPPORT_CHATS_COLLECTION, userId));
  } catch {
    // Ignore if support_chats rule isn't deployed
  }
  try {
    await setDoc(
      doc(db, USERS_COLLECTION, userId),
      { supportChat: clearedThread, updatedAt: nowIso },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${userId}`);
  }
}


