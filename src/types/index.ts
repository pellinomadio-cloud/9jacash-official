export interface User {
  id: string;
  name: string;
  email: string;
  pin: string; // 4-digit password
  membershipId?: string;
  balance: number;
  availableBalance: number;
  tier?: number; // Tier 1, 2, or 3 (defaults to 1)
  pendingEarnings?: number; // Earnings stored in pending state when tier balance limit is reached
  quickCodes?: (string | { code: string; planName: string; withdrawalsLeft: number })[];
  referralCode?: string; // User's unique referral code
  referredBy?: string | null; // Referral code or user id that referred this user
  referralEarnings?: number; // Total cash earned from referring friends
  referralCount?: number; // Count of successful invited referrals
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  recoveryCode?: string;
  accountStatus?: 'pending' | 'approved' | 'declined';
  lastDailyClaim?: number; // Exact timestamp (ms) when 24h reward was claimed
  lastSpinDate?: string; // Date string (YYYY-MM-DD) of last spin activity
  spinsToday?: number; // Number of spins used today (0, 1, or 2)
  lastSpinTime?: number; // Exact timestamp (ms) of last spin
  isVMode?: boolean; // When true, Quick Code payments uploaded by this user automatically verify without admin approval
  isKycVerified?: boolean; // Whether user completed and got approved for KYC (₦22,000)
  kycStatus?: 'not_started' | 'pending' | 'approved' | 'declined';
  kycReference?: string;
  isMembershipPaid?: boolean; // Legacy flag
  requireMembership?: boolean; // Legacy flag - feature removed
  membershipStatus?: 'not_started' | 'pending' | 'approved' | 'declined';
  membershipReference?: string;
  withdrawalStatus?: 'none' | 'pending_kyc' | 'action_required' | 'tax_pending' | 'completed' | 'declined';
  lastWithdrawal?: {
    amount: number;
    bank: string;
    accountNumber: string;
    accountName: string;
    reference: string;
    date: string;
    taxAmount: number; // 11.9% of amount
    taxStatus: 'action_required' | 'pending' | 'approved' | 'declined';
    taxProofUrl?: string;
    taxReceiptName?: string;
    taxSenderBank?: string;
    taxSenderName?: string;
    taxSubmittedAt?: string;
    taxApprovedAt?: string;
    taxDeclinedReason?: string;
    taxDepositRequestId?: string;
  };
  withdrawalAccount?: {
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    reference: string;
    date: string;
    confirmedAt?: string;
  };
  deviceId?: string; // Unique device identifier to enforce max 3 accounts per device
  createdAt: string;
}

export interface SafeWithdrawalAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  reference: string;
  date: string;
  confirmedAt: string;
  status: 'confirmed' | 'paid' | 'pending';
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  bonusAmount: number;
  date: string;
  time: string;
}

export interface CompanyAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  updatedAt?: string;
  isConfigured?: boolean;
}

export interface CommunityLinks {
  telegramUrl: string;
  telegramHandle: string;
  whatsappUrl: string;
  agentTelegramUrl?: string;
  agentTelegramHandle?: string;
  announcement?: string;
  updatedAt?: string;
}

export interface CreditAlertModalState {
  isOpen: boolean;
  amount: number;
  source: string;
  reference: string;
}

export interface QuickCodeItem {
  code: string;
  planName: string;
  withdrawalsLeft: number;
}

export interface AdminQuickCode {
  id: string;
  code: string;
  createdAt: string;
  createdTimestamp: number;
  expiresAt: string;
  expiresTimestamp: number;
  status: 'active' | 'used' | 'expired';
  usedByUserId?: string | null;
  usedByUserName?: string | null;
  usedByUserEmail?: string | null;
  usedAt?: string | null;
  createdBy?: string;
  note?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  receiptName: string;
  receiptUrl?: string;
  requestType?: 'deposit' | 'quickcode' | 'upgrade' | 'kyc' | 'tax_payment' | 'membership';
  withdrawalAmount?: number;
  taxAmount?: number;
  destinationBank?: string;
  destinationAccountNumber?: string;
  destinationAccountName?: string;
  senderBank?: string;
  senderAccountName?: string;
  targetTier?: number;
  planName?: string;
  withdrawalsCount?: number;
  status: 'pending' | 'approved' | 'declined';
  declineReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  generatedCode?: string;
  reference: string;
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  date: string;
  type?: 'info' | 'success' | 'alert' | 'admin';
  targetUserId?: string; // 'all' or specific user id
  targetUserName?: string; // Display name of recipient for private notifications
  isBroadcast?: boolean; // Flag to identify genuine admin broadcast announcements
  isDevicePush?: boolean; // When true, triggers native OS device notification on Android / iPhone
  targetPlatform?: 'all' | 'android' | 'ios'; // Target mobile platform
  senderLabel?: string; // e.g. "Message from 9jacash company"
  actionUrl?: string; // Deep link URL
  screenshotUrl?: string; // Screenshot image URL uploaded by admin for user
  screenshotName?: string;
  isPopup?: boolean; // Whether to pop up on user dashboard
  isViewed?: boolean;
}

export interface DeviceSubscriber {
  id: string;
  platform: 'android' | 'ios' | 'desktop';
  permission: 'granted' | 'default' | 'denied';
  isPwa?: boolean;
  userAgent?: string;
  registeredAt: string;
  lastActiveAt: string;
  userId?: string | null;
  userName?: string | null;
}

export interface DevicePushBroadcast {
  id: string;
  title: string;
  body: string;
  senderLabel: string;
  targetPlatform: 'all' | 'android' | 'ios';
  timestamp: number;
  createdAt: string;
  actionUrl?: string;
  tag?: string;
  vibrate?: number[];
  sentBy?: string;
  deliveredCount?: number;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'deposit' | 'withdraw' | 'quickcode' | 'transfer' | 'upgrade';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  time: string;
  isCredit: boolean;
  status: 'successful' | 'pending' | 'failed';
  reference: string;
  timestamp?: number;
  createdAt?: string;
}

export type ActiveTab = 'home' | 'cards' | 'community' | 'payments' | 'support' | 'more';

export type CurrentScreen =
  | 'dashboard'
  | 'earn'
  | 'deposit'
  | 'withdraw'
  | 'quickcode'
  | 'account_details'
  | 'transaction_history'
  | 'referrals'
  | 'notifications'
  | 'settings'
  | 'terms'
  | 'admin'
  | 'live_chat'
  | 'upgrade_tier'
  | 'bank_verification'
  | 'kyc_verification'
  | 'tax_clearance'
  | 'membership_payment';

export interface AppPricing {
  kycPrice: number;
  quickCodePlan1: number;
  quickCodePlan2: number;
  quickCodePlan3: number;
  quickCodePlanUnlimited?: number;
  updatedAt?: string;
}

export const DEFAULT_APP_PRICING: AppPricing = {
  kycPrice: 22000,
  quickCodePlan1: 7800,
  quickCodePlan2: 10300,
  quickCodePlan3: 15600,
  quickCodePlanUnlimited: 70000,
};

