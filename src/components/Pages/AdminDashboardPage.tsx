import React, { useState, useEffect } from 'react';
import { useAuth, isGlobalBroadcastNotification } from '../../context/AuthContext.tsx';
import { User, AppNotification, CompanyAccount, DepositRequest, SafeWithdrawalAccount } from '../../types/index.ts';
import { formatTelegramUrl, formatTelegramHandle } from '../../utils/telegram.ts';
import { compressImageFile } from '../../utils/imageCompressor.ts';
import { AdminDailyRevenuePage } from './AdminDailyRevenuePage.tsx';
import { AdminDeviceNotificationPage } from './AdminDeviceNotificationPage.tsx';
import { AdminQuickCodePage } from './AdminQuickCodePage.tsx';
import {
  ArrowLeft,
  Shield,
  Users,
  Wallet,
  Send,
  Bell,
  Megaphone,
  Search,
  CheckCircle2,
  Lock,
  KeyRound,
  AlertTriangle,
  LogOut,
  Sparkles,
  Trash2,
  TrendingUp,
  Landmark,
  Save,
  Check,
  Building2,
  Clock,
  CheckCheck,
  XCircle,
  FileText,
  Filter,
  MessageCircle,
  Headphones,
  Crown,
  ShieldCheck,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  Upload,
  X,
  CreditCard,
  Zap,
  ShieldAlert,
  Smartphone,
  Radio,
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface AdminDashboardPageProps {
  onBack: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack }) => {
  const { isLight } = useTheme();
  const {
    user,
    allUsers,
    getAllRegisteredUsers,
    refreshAllUsers,
    notifications,
    sendBroadcastNotification,
    sendNotificationToUser,
    deleteNotification,
    clearAllNotifications,
    formatNaira,
    companyAccount,
    updateCompanyAccount,
    communityLinks,
    updateCommunityLinks,
    depositRequests,
    approveDepositRequest,
    declineDepositRequest,
    banUser,
    deleteUserAccount,
    setRecoveryCodeForUser,
    generateNewRecoveryCodeForUser,
    sendDirectMessageToUser,
    safePayoutAccounts,
    markSafePayoutAccountPaid,
    deleteSafePayoutAccount,
    updateUserAccountStatus,
    approveTaxPaymentAndWithdrawal,
    banUserAccount,
    setUserTierDirect,
    toggleVMode,
    appPricing,
    updateAppPricing,
    adminQuickCodes,
  } = useAuth();

  const [copiedRecoveryCodeId, setCopiedRecoveryCodeId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDailyRevenue, setShowDailyRevenue] = useState(false);
  const [showDeviceNotificationPage, setShowDeviceNotificationPage] = useState(false);
  const [showQuickCodePage, setShowQuickCodePage] = useState(false);

  // Active admin tab (Approvals, Safe, Users, Account, Broadcast, Notifs History)
  const [activeTab, setActiveTab] = useState<'approvals' | 'safe' | 'users' | 'account' | 'broadcast' | 'history'>('approvals');

  // Pricing & Fee Controls state (Quick Code & KYC)
  const [kycPriceInput, setKycPriceInput] = useState<number>(appPricing?.kycPrice ?? 22000);
  const [quickCodePlan1Input, setQuickCodePlan1Input] = useState<number>(appPricing?.quickCodePlan1 ?? 7800);
  const [quickCodePlan2Input, setQuickCodePlan2Input] = useState<number>(appPricing?.quickCodePlan2 ?? 10300);
  const [quickCodePlan3Input, setQuickCodePlan3Input] = useState<number>(appPricing?.quickCodePlan3 ?? 15600);
  const [quickCodePlanUnlimitedInput, setQuickCodePlanUnlimitedInput] = useState<number>(appPricing?.quickCodePlanUnlimited ?? 70000);
  const [pricingSaveMsg, setPricingSaveMsg] = useState('');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Sync inputs with live appPricing from Firestore
  useEffect(() => {
    if (appPricing) {
      if (appPricing.kycPrice !== undefined) setKycPriceInput(appPricing.kycPrice);
      if (appPricing.quickCodePlan1 !== undefined) setQuickCodePlan1Input(appPricing.quickCodePlan1);
      if (appPricing.quickCodePlan2 !== undefined) setQuickCodePlan2Input(appPricing.quickCodePlan2);
      if (appPricing.quickCodePlan3 !== undefined) setQuickCodePlan3Input(appPricing.quickCodePlan3);
      if (appPricing.quickCodePlanUnlimited !== undefined) setQuickCodePlanUnlimitedInput(appPricing.quickCodePlanUnlimited);
    }
  }, [appPricing]);

  // Auto-sync data from Firestore on mount and periodically alongside real-time onSnapshot listeners
  useEffect(() => {
    refreshAllUsers().catch(console.error);
    const interval = setInterval(() => {
      refreshAllUsers().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    setPricingSaveMsg('');
    const success = await updateAppPricing({
      kycPrice: Number(kycPriceInput) || 22000,
      quickCodePlan1: Number(quickCodePlan1Input) || 7800,
      quickCodePlan2: Number(quickCodePlan2Input) || 10300,
      quickCodePlan3: Number(quickCodePlan3Input) || 15600,
      quickCodePlanUnlimited: Number(quickCodePlanUnlimitedInput) || 70000,
    });
    setIsSavingPricing(false);
    if (success) {
      setPricingSaveMsg('Pricing updated successfully! KYC & Quick Code prices are now live for all users.');
      setTimeout(() => setPricingSaveMsg(''), 4500);
    } else {
      setPricingSaveMsg('Failed to update pricing. Please try again.');
    }
  };

  // Company Account Form state
  const [accountNumber, setAccountNumber] = useState(companyAccount?.accountNumber || '');
  const [bankName, setBankName] = useState(companyAccount?.bankName || '');
  const [accountName, setAccountName] = useState(companyAccount?.accountName || '');
  const [accountSaveMsg, setAccountSaveMsg] = useState('');

  // Community Channels & Agent Form state
  const [telegramUrlInput, setTelegramUrlInput] = useState(communityLinks?.telegramUrl || 'https://t.me/jacash1');
  const [telegramHandleInput, setTelegramHandleInput] = useState(communityLinks?.telegramHandle || '@jacash1');
  const [whatsappUrlInput, setWhatsappUrlInput] = useState(communityLinks?.whatsappUrl || 'https://whatsapp.com/channel/0029Va9jacashOfficial');
  const [agentTelegramUrlInput, setAgentTelegramUrlInput] = useState(communityLinks?.agentTelegramUrl || 'https://t.me/jacash1');
  const [agentTelegramHandleInput, setAgentTelegramHandleInput] = useState(communityLinks?.agentTelegramHandle || '@jacash1');
  const [communityAnnouncementInput, setCommunityAnnouncementInput] = useState(communityLinks?.announcement || '');
  const [communitySaveMsg, setCommunitySaveMsg] = useState('');
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);

  // Keep admin inputs in sync with live Firestore communityLinks
  useEffect(() => {
    if (communityLinks) {
      if (communityLinks.telegramUrl) setTelegramUrlInput(communityLinks.telegramUrl);
      if (communityLinks.telegramHandle) setTelegramHandleInput(communityLinks.telegramHandle);
      if (communityLinks.whatsappUrl) setWhatsappUrlInput(communityLinks.whatsappUrl);
      if (communityLinks.agentTelegramUrl) setAgentTelegramUrlInput(communityLinks.agentTelegramUrl);
      if (communityLinks.agentTelegramHandle) setAgentTelegramHandleInput(communityLinks.agentTelegramHandle);
      if (communityLinks.announcement !== undefined) setCommunityAnnouncementInput(communityLinks.announcement);
    }
  }, [communityLinks]);

  // Deposit Request management
  const [selectedDeclineReqId, setSelectedDeclineReqId] = useState<string | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState('Receipt could not be verified. Please upload full transfer screenshot.');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [depositFilter, setDepositFilter] = useState<'pending' | 'all' | 'approved' | 'declined'>('pending');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [selectedProofReq, setSelectedProofReq] = useState<DepositRequest | null>(null);

  // Safe Withdrawal Accounts management
  const [safeFilter, setSafeFilter] = useState<'all' | 'confirmed' | 'paid'>('all');
  const [safeSearchQuery, setSafeSearchQuery] = useState('');
  const [copiedSafeId, setCopiedSafeId] = useState<string | null>(null);

  // User list filter (All vs V Mode)
  const [userFilter, setUserFilter] = useState<'all' | 'vmode'>('all');

  // User direct message & screenshot modal state
  const [selectedUserForMsg, setSelectedUserForMsg] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgDesc, setMsgDesc] = useState('');
  const [msgScreenshotUrl, setMsgScreenshotUrl] = useState<string>('');
  const [msgScreenshotName, setMsgScreenshotName] = useState<string>('');
  const [msgIsPopup, setMsgIsPopup] = useState<boolean>(true);
  const [imgUploadError, setImgUploadError] = useState<string>('');

  // Broadcast & notification controls
  const [broadcastAudience, setBroadcastAudience] = useState<'global' | 'user'>('global');
  const [broadcastTargetUserId, setBroadcastTargetUserId] = useState<string>('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastType, setBroadcastType] = useState<'admin' | 'info' | 'alert' | 'success'>('admin');
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'global' | 'private'>('all');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [userPage, setUserPage] = useState<number>(1);
  const USERS_PER_PAGE = 30;

  const registeredUsers: User[] = (allUsers && allUsers.length > 0) ? allUsers : getAllRegisteredUsers();
  const allUsersList = registeredUsers.length > 0 ? registeredUsers : (user ? [user] : []);

  // Synthesize any pending tax payment request ONLY if a user is actively awaiting review and not already in depositRequests
  const synthesizedTaxRequests: DepositRequest[] = (allUsersList || [])
    .filter((u) => {
      if (!u) return false;
      // Must be actively pending tax review
      const isAwaitingReview = u.withdrawalStatus === 'tax_pending' || u.lastWithdrawal?.taxStatus === 'pending';
      if (!isAwaitingReview) return false;

      // If user status is action_required (declined) or completed, NEVER synthesize as pending
      if (
        u.withdrawalStatus === 'action_required' ||
        u.lastWithdrawal?.taxStatus === 'action_required' ||
        u.withdrawalStatus === 'completed' ||
        u.lastWithdrawal?.taxStatus === 'approved'
      ) {
        return false;
      }

      // If depositRequests already contains any entry for this user's tax payment, never duplicate or override
      const alreadyHasEntry = (depositRequests || []).some(
        (r) => r && r.userId === u.id && r.requestType === 'tax_payment'
      );
      if (alreadyHasEntry) return false;
      return true;
    })
    .map((u) => ({
      id: `synth_tax_${u.id}`,
      userId: u.id,
      userName: u.name || 'User',
      userEmail: u.email || '',
      amount: u.lastWithdrawal?.taxAmount || Math.round((u.lastWithdrawal?.amount || u.withdrawalAccount?.amount || 100000) * 0.119),
      withdrawalAmount: u.lastWithdrawal?.amount || u.withdrawalAccount?.amount || 100000,
      destinationBank: u.lastWithdrawal?.bank || u.withdrawalAccount?.bank || 'Bank',
      destinationAccountNumber: u.lastWithdrawal?.accountNumber || u.withdrawalAccount?.accountNumber || '',
      destinationAccountName: u.lastWithdrawal?.accountName || u.withdrawalAccount?.accountName || u.name || 'User',
      senderBank: u.lastWithdrawal?.taxSenderBank || 'Commercial Bank',
      senderAccountName: u.lastWithdrawal?.taxSenderName || u.name || 'User',
      bankName: companyAccount?.bankName || 'Company Account',
      accountNumber: companyAccount?.accountNumber || '0123456789',
      receiptName: u.lastWithdrawal?.taxReceiptName || 'tax-receipt.jpg',
      receiptUrl: u.lastWithdrawal?.taxProofUrl || '',
      requestType: 'tax_payment' as const,
      status: 'pending' as const,
      submittedAt: u.lastWithdrawal?.taxSubmittedAt || new Date().toISOString(),
      reference: u.lastWithdrawal?.reference || `TAX-${u.id.slice(0, 6).toUpperCase()}`,
    }));

  const combinedDepositRequests: DepositRequest[] = (() => {
    const reqMap = new Map<string, DepositRequest>();

    // 1. Add primary depositRequests state
    (depositRequests || []).forEach((r) => {
      if (r && r.id) {
        reqMap.set(r.id, r);
      }
    });

    // 2. Merge any embedded submittedRequests from all users (guarantees cross-device sync for Quick Code, Deposit, KYC, Upgrade, Membership, and Tax)
    (allUsersList || []).forEach((u) => {
      if (!u) return;
      if (Array.isArray(u.submittedRequests)) {
        u.submittedRequests.forEach((sr) => {
          if (sr && sr.id) {
            const existing = reqMap.get(sr.id);
            if (!existing) {
              reqMap.set(sr.id, sr);
            } else {
              const useSrStatus = existing.status === 'pending' && sr.status !== 'pending';
              const useExistingStatus = sr.status === 'pending' && existing.status !== 'pending';
              reqMap.set(sr.id, {
                ...existing,
                ...(useSrStatus ? sr : {}),
                status: useSrStatus ? sr.status : useExistingStatus ? existing.status : existing.status,
                receiptUrl: existing.receiptUrl || sr.receiptUrl || '',
                receiptName: existing.receiptName || sr.receiptName || 'receipt.jpg',
                declineReason: existing.declineReason || sr.declineReason,
                reviewedAt: existing.reviewedAt || sr.reviewedAt,
                approvedAt: existing.approvedAt || sr.approvedAt,
              });
            }
          }
        });
      }
    });

    const list = Array.from(reqMap.values()).map((r) => {
      if (!r.receiptUrl) {
        const uMatch = (allUsersList || []).find((u) => u && u.id === r.userId);
        if (uMatch) {
          const subWithImg = (uMatch.submittedRequests || []).find(
            (sr) => sr && sr.receiptUrl && (sr.id === r.id || sr.reference === r.reference || sr.requestType === r.requestType)
          );
          if (subWithImg?.receiptUrl) {
            return { ...r, receiptUrl: subWithImg.receiptUrl };
          }
          if (r.requestType === 'tax_payment' && uMatch.lastWithdrawal?.taxProofUrl) {
            return { ...r, receiptUrl: uMatch.lastWithdrawal.taxProofUrl };
          }
        }
      }
      return r;
    });

    // 3. Add synthesized tax requests if not already present
    synthesizedTaxRequests.forEach((synth) => {
      const existingIdx = list.findIndex((r) => r.userId === synth.userId && r.requestType === 'tax_payment');
      if (existingIdx === -1) {
        list.push(synth);
      } else if (!list[existingIdx].receiptUrl && synth.receiptUrl) {
        list[existingIdx] = { ...list[existingIdx], receiptUrl: synth.receiptUrl };
      }
    });

    // 4. Synthesize fallback KYC or Membership pending requests if user status is pending but request doc wasn't in list
    (allUsersList || []).forEach((u) => {
      if (!u) return;
      if (u.kycStatus === 'pending' && !u.isKycVerified) {
        const hasKycReq = list.some((r) => r.userId === u.id && r.requestType === 'kyc');
        if (!hasKycReq) {
          const matchingSub = (u.submittedRequests || []).find((sr) => sr && sr.requestType === 'kyc');
          list.push({
            id: matchingSub?.id || `synth_kyc_${u.id}`,
            userId: u.id,
            userName: u.name || 'User',
            userEmail: u.email || '',
            amount: matchingSub?.amount || (appPricing?.kycPrice ?? 22000),
            bankName: matchingSub?.bankName || companyAccount?.bankName || 'Company Account',
            accountNumber: matchingSub?.accountNumber || companyAccount?.accountNumber || '',
            receiptName: matchingSub?.receiptName || 'KYC_Payment_Receipt.png',
            receiptUrl: matchingSub?.receiptUrl || '',
            requestType: 'kyc',
            planName: `KYC Account Verification Fee`,
            status: 'pending',
            submittedAt: matchingSub?.submittedAt || u.createdAt || new Date().toISOString(),
            reference: matchingSub?.reference || u.kycReference || `KYC-${u.id.slice(0, 6).toUpperCase()}`,
          });
        }
      }
      if (u.membershipStatus === 'pending' && !u.isMembershipPaid) {
        const hasMemReq = list.some((r) => r.userId === u.id && r.requestType === 'membership');
        if (!hasMemReq) {
          const matchingSub = (u.submittedRequests || []).find((sr) => sr && sr.requestType === 'membership');
          list.push({
            id: matchingSub?.id || `synth_mem_${u.id}`,
            userId: u.id,
            userName: u.name || 'User',
            userEmail: u.email || '',
            amount: matchingSub?.amount || 9200,
            bankName: matchingSub?.bankName || companyAccount?.bankName || 'Company Account',
            accountNumber: matchingSub?.accountNumber || companyAccount?.accountNumber || '',
            receiptName: matchingSub?.receiptName || 'Membership_Payment_Receipt.png',
            receiptUrl: matchingSub?.receiptUrl || '',
            requestType: 'membership',
            planName: 'Official Membership Group Registration (₦9,200)',
            status: 'pending',
            submittedAt: matchingSub?.submittedAt || u.createdAt || new Date().toISOString(),
            reference: matchingSub?.reference || u.membershipReference || `MEM-${u.id.slice(0, 6).toUpperCase()}`,
          });
        }
      }
    });

    return list;
  })();

  const resolveReceiptImageUrl = (req?: DepositRequest | null): string => {
    if (!req) return '';
    if (req.receiptUrl && req.receiptUrl.trim().length > 10) return req.receiptUrl;
    const fromCombined = combinedDepositRequests.find(
      (r) => r && r.receiptUrl && (r.id === req.id || (req.reference && r.reference === req.reference))
    );
    if (fromCombined?.receiptUrl) return fromCombined.receiptUrl;
    const uMatch = (allUsersList || []).find((u) => u && u.id === req.userId);
    if (uMatch) {
      const subMatch = (uMatch.submittedRequests || []).find(
        (sr) =>
          sr &&
          sr.receiptUrl &&
          (sr.id === req.id || (req.reference && sr.reference === req.reference) || sr.requestType === req.requestType)
      );
      if (subMatch?.receiptUrl) return subMatch.receiptUrl;
      if (req.requestType === 'tax_payment' && uMatch.lastWithdrawal?.taxProofUrl) {
        return uMatch.lastWithdrawal.taxProofUrl;
      }
    }
    return '';
  };

  const pendingDepositsCount = combinedDepositRequests.filter((r) => r && r.status === 'pending').length;
  const pendingTaxPaymentsCount = combinedDepositRequests.filter(
    (r) => r && r.requestType === 'tax_payment' && r.status === 'pending'
  ).length;
  const totalTaxPaymentsCount = combinedDepositRequests.filter(
    (r) => r && r.requestType === 'tax_payment'
  ).length;
  const pendingSafePayoutsCount = (safePayoutAccounts || []).filter((a) => a && a.status === 'confirmed').length;

  const getSafeTime = (d?: string | number | null): number => {
    if (!d) return 0;
    try {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    } catch {
      return 0;
    }
  };

  const formatSafeDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString()}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatSafeDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString();
    } catch {
      return String(dateStr);
    }
  };

  const filteredDeposits = combinedDepositRequests
    .filter((r) => {
      if (!r) return false;
      if (depositFilter !== 'all') {
        if (r.status !== depositFilter) return false;
      }

      const q = (depositSearchQuery || '').toLowerCase().trim();
      if (!q) return true;
      const userName = (r.userName || '').toLowerCase();
      const userEmail = (r.userEmail || '').toLowerCase();
      const ref = (r.reference || '').toLowerCase();
      const senderBank = (r.senderBank || '').toLowerCase();
      const senderName = (r.senderAccountName || '').toLowerCase();
      const planName = (r.planName || '').toLowerCase();
      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        ref.includes(q) ||
        senderBank.includes(q) ||
        senderName.includes(q) ||
        planName.includes(q)
      );
    })
    .sort((a, b) => getSafeTime(b?.submittedAt) - getSafeTime(a?.submittedAt));

  const filteredSafeAccounts = (safePayoutAccounts || [])
    .filter((a) => {
      if (!a) return false;
      if (safeFilter !== 'all' && a.status !== safeFilter) return false;
      const q = (safeSearchQuery || '').toLowerCase().trim();
      if (!q) return true;
      const userName = (a.userName || '').toLowerCase();
      const userEmail = (a.userEmail || '').toLowerCase();
      const bank = (a.bank || '').toLowerCase();
      const accNum = (a.accountNumber || '').toLowerCase();
      const accName = (a.accountName || '').toLowerCase();
      const ref = (a.reference || '').toLowerCase();
      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        bank.includes(q) ||
        accNum.includes(q) ||
        accName.includes(q) ||
        ref.includes(q)
      );
    })
    .sort((a, b) => getSafeTime(b?.confirmedAt || b?.date) - getSafeTime(a?.confirmedAt || a?.date));

  const filteredUsers = (allUsersList || []).filter((u) => {
    if (!u) return false;
    if (userFilter === 'vmode' && !u.isVMode) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const refCode = (u.referralCode || '').toLowerCase();
    const memberId = (u.membershipId || u.id || '').toLowerCase();
    return name.includes(q) || email.includes(q) || refCode.includes(q) || memberId.includes(q);
  });

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE
  );

  useEffect(() => {
    setUserPage(1);
  }, [searchQuery, userFilter]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshAllUsers();
    setTimeout(() => {
      setIsRefreshing(false);
      setActionSuccessMsg('Data refreshed successfully!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    }, 600);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === 'MACELL999') {
      setIsAdminAuthenticated(true);
      setLoginError('');
      refreshAllUsers().catch(console.error);
    } else {
      setLoginError('Invalid Key. Access Denied.');
    }
  };

  const handleSaveCompanyAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !bankName.trim() || !accountName.trim()) {
      setAccountSaveMsg('Please fill in all company account fields.');
      return;
    }

    updateCompanyAccount({
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim(),
      accountName: accountName.trim(),
    });

    setAccountSaveMsg('Company account details saved & updated across all deposit pages!');
    setTimeout(() => setAccountSaveMsg(''), 4000);
  };

  const handleClearCompanyAccount = () => {
    updateCompanyAccount({
      accountNumber: '',
      bankName: '',
      accountName: '',
    });
    setAccountNumber('');
    setBankName('');
    setAccountName('');
    setAccountSaveMsg('Company account has been deactivated. Pages will now show as not configured until a new account is set.');
    setTimeout(() => setAccountSaveMsg(''), 5000);
  };

  const handleSaveCommunityLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUrlInput.trim() || !whatsappUrlInput.trim()) {
      return;
    }

    setIsSavingCommunity(true);
    setCommunitySaveMsg('');

    const cleanChannelUrl = formatTelegramUrl(telegramUrlInput);
    // Explicitly derive handle from input or clean URL to ensure handle never remains stale
    const cleanChannelHandle = telegramHandleInput.trim()
      ? formatTelegramHandle(telegramHandleInput)
      : formatTelegramHandle(cleanChannelUrl);

    const cleanAgentUrl = formatTelegramUrl(agentTelegramUrlInput || 'https://t.me/jacash1');
    const cleanAgentHandle = formatTelegramHandle(agentTelegramHandleInput || cleanAgentUrl);

    const success = await updateCommunityLinks({
      telegramUrl: cleanChannelUrl,
      telegramHandle: cleanChannelHandle,
      whatsappUrl: whatsappUrlInput.trim(),
      agentTelegramUrl: cleanAgentUrl,
      agentTelegramHandle: cleanAgentHandle,
      announcement: communityAnnouncementInput.trim(),
    });

    setIsSavingCommunity(false);
    if (success !== false) {
      setCommunitySaveMsg('Community channel and Support Agent Telegram link updated and synchronized successfully! Live on Community page.');
      setTimeout(() => setCommunitySaveMsg(''), 5000);
    } else {
      setCommunitySaveMsg('Notice: Saved locally, syncing to cloud in background.');
      setTimeout(() => setCommunitySaveMsg(''), 5000);
    }
  };

  const handleApproveDeposit = (requestId: string) => {
    const reqObj = combinedDepositRequests.find((r) => r.id === requestId);
    const success = approveDepositRequest(requestId);
    if (success) {
      const msg =
        reqObj?.requestType === 'quickcode'
          ? `Quick Code payment approved and authorization code issued to ${reqObj.userName || 'user'}!`
          : reqObj?.requestType === 'kyc'
          ? `KYC payment approved for ${reqObj.userName || 'user'}!`
          : reqObj?.requestType === 'upgrade'
          ? `Tier ${reqObj.targetTier || 2} upgrade approved and activated for ${reqObj.userName || 'user'}!`
          : reqObj?.requestType === 'membership'
          ? `Membership verified for ${reqObj.userName || 'user'}!`
          : 'Payment approved and credited to user wallet!';
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleConfirmDecline = (requestId: string) => {
    const success = declineDepositRequest(requestId, declineReasonInput);
    if (success) {
      setSelectedDeclineReqId(null);
      setActionSuccessMsg('Deposit declined and notification sent to user.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastDesc.trim()) {
      return;
    }

    if (broadcastAudience === 'user') {
      if (!broadcastTargetUserId) {
        setBroadcastSuccessMsg('Please select a target user to send notification.');
        setTimeout(() => setBroadcastSuccessMsg(''), 4000);
        return;
      }
      const targetUserObj = allUsersList.find((u) => u.id === broadcastTargetUserId);
      const ok = sendNotificationToUser(
        broadcastTargetUserId,
        broadcastTitle,
        broadcastDesc,
        broadcastType,
        { targetUserName: targetUserObj?.name }
      );
      if (ok) {
        setBroadcastSuccessMsg(`Private notification sent directly to ${targetUserObj?.name || 'user'}!`);
        setBroadcastTitle('');
        setBroadcastDesc('');
        setBroadcastTargetUserId('');
        setTimeout(() => setBroadcastSuccessMsg(''), 4000);
      }
    } else {
      const ok = sendBroadcastNotification(broadcastTitle, broadcastDesc, broadcastType);
      if (ok) {
        setBroadcastSuccessMsg('Global broadcast sent successfully to all registered users!');
        setBroadcastTitle('');
        setBroadcastDesc('');
        setTimeout(() => setBroadcastSuccessMsg(''), 4000);
      }
    }
  };

  const handleCopySafeAccountNumber = (accNumber: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(accNumber);
    }
    setCopiedSafeId(id);
    setTimeout(() => setCopiedSafeId(null), 2000);
  };

  const handleOpenScreenshotModalForSafe = (safeAcc: SafeWithdrawalAccount) => {
    setSelectedUserForMsg({
      id: safeAcc.userId,
      name: safeAcc.userName || 'User',
      email: safeAcc.userEmail,
    });
    setMsgTitle(`Withdrawal Transfer Cleared - ${formatNaira(safeAcc.amount || 0)}`);
    setMsgDesc(
      `Hello ${safeAcc.userName || 'User'},\n\nYour withdrawal request of ${formatNaira(safeAcc.amount || 0)} has been successfully processed and transferred to your bank account (${safeAcc.bank} - ${safeAcc.accountNumber}).\n\nPlease find your official transfer confirmation slip screenshot attached below.\n\nThank you for choosing 9jacash!`
    );
    setMsgScreenshotUrl('');
    setMsgScreenshotName('');
    setMsgIsPopup(true);
    setImgUploadError('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setImgUploadError('Screenshot image must be under 8MB');
      setTimeout(() => setImgUploadError(''), 4000);
      return;
    }

    setImgUploadError('');
    setMsgScreenshotName(file.name);
    try {
      const compressed = await compressImage(file, 600, 600, 0.6);
      if (compressed) {
        setMsgScreenshotUrl(compressed);
        return;
      }
      setImgUploadError('Could not optimize image. Please select a PNG or JPG file.');
    } catch (err) {
      console.warn('Screenshot compression error', err);
      setImgUploadError('Failed to process image. Please select a smaller image.');
    }
  };

  // If Admin is NOT yet authenticated with key MACELL999
  if (!isAdminAuthenticated) {
    return (
      <div className={`admin-page-root min-h-screen pb-12 space-y-4 ${isLight ? 'admin-light text-slate-800 bg-[#f4f6fa]' : 'text-stone-100 bg-[#0b0c0e]'}`}>
        {/* Header */}
        <div className={`flex items-center gap-3 pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
          <button
            type="button"
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
                : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Government &amp; Tasks <Shield className="w-4 h-4 text-amber-500" />
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Restricted Company Gateway</p>
          </div>
        </div>

        {/* Login Card */}
        <div className={`p-6 rounded-3xl border text-center space-y-4 shadow-xl ${
          isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50' : 'bg-[#14151b] border-stone-800 text-stone-100'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Company Authentication</h2>
            <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Please enter your authorized company security key to access the control dashboard.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input
                type="password"
                placeholder="Enter Company Key"
                value={adminKeyInput}
                onChange={(e) => {
                  setAdminKeyInput(e.target.value);
                  setLoginError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-mono tracking-widest focus:border-amber-500 focus:outline-none text-center ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-[#1c1e26] border-stone-800 text-white placeholder-stone-600'
                }`}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Unlock Company Control Center</span>
              <Shield className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dedicated Daily Revenue & Analytics Sub-Page
  if (isAdminAuthenticated && showDailyRevenue) {
    return (
      <div className={`admin-page-root min-h-screen ${isLight ? 'admin-light text-slate-800 bg-[#f4f6fa]' : 'text-stone-100 bg-[#0b0c0e]'}`}>
        <AdminDailyRevenuePage onBack={() => setShowDailyRevenue(false)} />
      </div>
    );
  }

  // Dedicated Device Push Notification Sub-Page (Sends directly to phone status bars & lock screens)
  if (isAdminAuthenticated && showDeviceNotificationPage) {
    return (
      <div className={`admin-page-root min-h-screen ${isLight ? 'admin-light text-slate-800 bg-[#f4f6fa]' : 'text-stone-100 bg-[#0b0c0e]'}`}>
        <AdminDeviceNotificationPage onBack={() => setShowDeviceNotificationPage(false)} />
      </div>
    );
  }

  // Dedicated 10-Minute Universal Quick Code Sub-Page
  if (isAdminAuthenticated && showQuickCodePage) {
    return (
      <div className={`admin-page-root min-h-screen ${isLight ? 'admin-light text-slate-800 bg-[#f4f6fa]' : 'text-stone-100 bg-[#0b0c0e]'}`}>
        <AdminQuickCodePage onBack={() => setShowQuickCodePage(false)} />
      </div>
    );
  }

  const activeAdminCodesCount = (adminQuickCodes || []).filter(
    (c) => c.status === 'active' && Date.now() < c.expiresTimestamp
  ).length;

  // Admin Dashboard View (Authenticated with MACELL999)
  return (
    <div className={`admin-page-root min-h-screen pb-16 space-y-4 animate-in fade-in ${isLight ? 'admin-light text-slate-800 bg-[#f4f6fa]' : 'text-stone-100 bg-[#0b0c0e]'}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              Company Control Center
            </h1>
            <p className="text-[11px] text-stone-400">Restricted Company Gateway • {allUsersList.length} Registered User(s)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 10-Minute Universal Quick Code Action Button */}
          <button
            type="button"
            onClick={() => setShowQuickCodePage(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-all shadow-sm shadow-purple-500/10 cursor-pointer"
            title="Create & Manage Universal 10-Minute Quick Codes"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            <span>10-Min Quick Code</span>
            {activeAdminCodesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                {activeAdminCodesCount}
              </span>
            )}
          </button>

          {/* Send Device Notification Action Button */}
          <button
            type="button"
            onClick={() => setShowDeviceNotificationPage(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-all shadow-sm shadow-cyan-500/10 cursor-pointer"
            title="Send Device Push Notification (Android Status Bar & iPhone Lock Screen)"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Device Notification</span>
          </button>

          {/* Daily Revenue Action Button */}
          <button
            type="button"
            onClick={() => setShowDailyRevenue(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all shadow-sm shadow-amber-500/10 cursor-pointer"
            title="View Daily App Revenue & Analytics"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Revenue</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdminAuthenticated(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Company</span>
          </button>
        </div>
      </div>

      {/* Daily Revenue Quick Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#181922] to-[#14151b] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Daily Income &amp; Payment Analytics</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Auto-Resets Daily
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Track daily counts of Quick Codes purchased, KYC verified, Tax paid, and total earned.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDailyRevenue(true)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 flex-shrink-0"
        >
          <span>Open Daily Revenue</span>
          <TrendingUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Device Push Notification Quick Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-[#181924] to-[#14151b] border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Send Device Push Notifications</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Android &amp; iPhone OS
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Pushes directly to users&apos; device status bar &amp; lock screen. Users do not need to enter the app to receive it.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeviceNotificationPage(true)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 flex-shrink-0"
        >
          <span>Send Device Notification</span>
          <Send className="w-3.5 h-3.5 text-black" />
        </button>
      </div>

      {/* 10-Minute Universal Quick Code Quick Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#191726] to-[#14151b] border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Zap className="w-5 h-5 fill-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Universal 10-Minute Quick Codes</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Single-Use • 10m Expiry
              </span>
              {activeAdminCodesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeAdminCodesCount} Active Now
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Create a universal code that can be used once by any user for withdrawal. Automatically expires in 10 minutes if unused.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowQuickCodePage(true)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 hover:from-purple-400 hover:to-amber-300 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 flex-shrink-0"
        >
          <span>Create Quick Code</span>
          <Zap className="w-3.5 h-3.5 fill-white" />
        </button>
      </div>

      {/* Stats Cards (3 Columns: Users, General Approvals, Tax Clearance Proofs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Registered Users Count */}
        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Registered Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-white truncate">
            {allUsersList.length} <span className="text-xs font-normal text-stone-400">Members</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ShieldCheck className="w-3 h-3" /> Active Database Accounts
          </span>
        </div>

        {/* Pending General Approvals */}
        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white">
            {pendingDepositsCount} <span className="text-xs font-normal text-stone-400">Awaiting</span>
          </div>
          <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <Sparkles className="w-3 h-3" /> {combinedDepositRequests.length} Total Submissions
          </span>
        </div>

        {/* Confirmed Safe Payouts */}
        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Safe Payouts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-white">
            {pendingSafePayoutsCount} <span className="text-xs font-normal text-stone-400">Awaiting</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> {(safePayoutAccounts || []).length} Confirmed Safe Accounts
          </span>
        </div>
      </div>

      {/* Navigation Pills (6 Tabs: Approvals, Safe, Users, Settings, Broadcast, History) */}
      <div className="grid grid-cols-6 p-1 rounded-xl bg-[#15161c] border border-stone-800 text-[10px] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="truncate">Approvals</span>
          {pendingDepositsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center">
              {pendingDepositsCount}
            </span>
          )}
        </button>

        {/* Safe Button / Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('safe')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
            activeTab === 'safe'
              ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate">Safe</span>
          {pendingSafePayoutsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black font-extrabold text-[9px] flex items-center justify-center">
              {pendingSafePayoutsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="truncate">Users</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'account'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="truncate">Broadcast</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="truncate">History</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: DEPOSIT APPROVALS WORKFLOW */}
      {activeTab === 'approvals' && (
        <div className="space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Deposit Review &amp; Approvals
              </h3>
              <p className="text-[11px] text-stone-400">Review uploaded deposit payments and credit user balances.</p>
            </div>
            {/* Filter pills */}
            <div className="flex gap-1 bg-[#14151b] p-1 rounded-lg border border-stone-800 text-[10px]">
              {(['pending', 'all', 'approved', 'declined'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDepositFilter(f)}
                  className={`px-3 py-1 rounded capitalize font-bold transition-all cursor-pointer ${
                    depositFilter === f
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {f === 'pending' ? `Pending (${pendingDepositsCount})` : f}
                </button>
              ))}
            </div>
          </div>

          {/* Search box for Approvals */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search deposit or tax payment by user, email, bank, or ref..."
              value={depositSearchQuery}
              onChange={(e) => setDepositSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Decline Reason Popup Modal if active */}
          {selectedDeclineReqId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md p-5 rounded-3xl bg-[#14151b] border-2 border-red-500/40 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <span className="text-sm font-black text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Decline Payment Request
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDeclineReqId(null)}
                    className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-stone-800/80 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-400 block">Quick Reason Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Payment receipt could not be verified.',
                      'Transfer not received in company account.',
                      'Fake or edited payment receipt uploaded.',
                      'OPay / PalmPay transfers are strictly prohibited.',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDeclineReasonInput(preset)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          declineReasonInput === preset
                            ? 'bg-red-500/25 border-red-500 text-red-200 font-bold'
                            : 'bg-[#181922] border-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={declineReasonInput}
                  onChange={(e) => setDeclineReasonInput(e.target.value)}
                  rows={3}
                  placeholder="Explain why this receipt was declined..."
                  className="w-full p-3 bg-[#181922] border border-red-500/30 rounded-xl text-white text-xs placeholder-stone-500 focus:outline-none focus:border-red-400 resize-none"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDeclineReqId(null)}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDecline(selectedDeclineReqId)}
                    className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-black shadow-lg shadow-red-500/25 cursor-pointer"
                  >
                    Confirm Decline &amp; Notify User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Requests list */}
          <div className="space-y-2.5">
            {filteredDeposits.length === 0 ? (
              <div className="p-8 text-center bg-[#14151b] rounded-2xl border border-stone-800 text-stone-400 text-xs space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto opacity-50" />
                <p className="font-bold text-white">No Deposit Requests Found</p>
                <p className="text-stone-500">
                  {depositFilter === 'pending'
                    ? 'All user deposit payments have been reviewed and resolved.'
                    : `No ${depositFilter} requests in records.`}
                </p>
              </div>
            ) : (
              filteredDeposits.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#14151b] border border-stone-800 hover:border-amber-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{req.userName || 'User'}</span>
                        {req.requestType === 'tax_payment' ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Tax Clearance (11.9% Fee: {formatNaira(req.amount || 0)}) • Payout: {formatNaira(req.withdrawalAmount || 0)}
                          </span>
                        ) : req.requestType === 'upgrade' ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                            Tier {req.targetTier || 2} Upgrade
                          </span>
                        ) : req.requestType === 'kyc' ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            KYC Account Clearance ({formatNaira(req.amount || appPricing?.kycPrice || 22000)})
                          </span>
                        ) : req.requestType === 'membership' ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                            <Users className="w-3 h-3 text-cyan-400" />
                            Official Membership Fee ({formatNaira(req.amount || 9200)})
                          </span>
                        ) : req.requestType === 'quickcode' || req.planName ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Quick Code Plan ({req.planName})
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            Wallet Deposit
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : req.status === 'declined'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 font-mono">{req.userEmail || 'No email'}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-black text-amber-400">{formatNaira(req.amount || 0)}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {formatSafeDateTime(req.submittedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Details Grid */}
                  <div className="p-3 rounded-xl bg-[#181922] border border-stone-800/80 text-xs space-y-1.5 font-mono">
                    {req.requestType === 'tax_payment' && (
                      <div className="space-y-1.5 pb-2 border-b border-stone-800">
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-sans">Payout Destination:</span>
                          <span className="text-white font-bold">{req.destinationBank} - {req.destinationAccountNumber} ({req.destinationAccountName})</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-sans">Sender Bank:</span>
                          <span className={`font-bold ${
                            req.senderBank?.toLowerCase().includes('opay') || req.senderBank?.toLowerCase().includes('palmpay')
                              ? 'text-red-400 font-black'
                              : 'text-white'
                          }`}>{req.senderBank || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-sans">Sender Account Name:</span>
                          <span className="text-emerald-400 font-bold">{req.senderAccountName || 'Not specified'}</span>
                        </div>
                        {(req.senderBank?.toLowerCase().includes('opay') || req.senderBank?.toLowerCase().includes('palmpay')) && (
                          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span>POLICY VIOLATION: User paid with {req.senderBank}! OPay/PalmPay transfers are strictly forbidden. Admin can ban account or decline payment.</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-stone-300">
                      <span className="text-stone-400">Paid Into:</span>
                      <span className="text-white font-bold">{req.bankName} - {req.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-300">
                      <span className="text-stone-400">Ref Code:</span>
                      <span className="text-amber-400">{req.reference}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-300">
                      <span className="text-stone-400">Receipt Attachment:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedProofReq(req)}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{req.receiptName || 'View Uploaded Image'}</span>
                      </button>
                    </div>
                    {resolveReceiptImageUrl(req) && (
                      <div className="pt-2 border-t border-stone-800/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Uploaded Payment Receipt Preview (Click to Enlarge):
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProofReq(req)}
                          className="w-full rounded-xl overflow-hidden border border-stone-700/80 bg-black/50 hover:border-amber-400 transition-all cursor-pointer block"
                        >
                          <img
                            src={resolveReceiptImageUrl(req)}
                            alt="Uploaded Payment Receipt"
                            className="max-h-52 w-full object-contain mx-auto"
                          />
                        </button>
                      </div>
                    )}
                    {req.declineReason && req.status === 'declined' && (
                      <div className="pt-1 text-[11px] text-red-400 border-t border-stone-800">
                        <strong>Declined Reason:</strong> {req.declineReason}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Pending requests */}
                  {req.status === 'pending' && req.requestType === 'tax_payment' && (
                    <div className="flex gap-2 pt-1 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDeclineReqId(req.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isLight
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          banUserAccount(req.userId, 'Tax payment clearance rejected / compliance violation');
                          setActionSuccessMsg(`User account has been banned!`);
                          setTimeout(() => setActionSuccessMsg(''), 4000);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isLight
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                        }`}
                        title="Ban user account"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Ban Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const success = approveTaxPaymentAndWithdrawal(req.id);
                          if (success) {
                            setActionSuccessMsg(`Tax payment approved! Withdrawal of ₦${(req.withdrawalAmount || 0).toLocaleString()} released to user's bank.`);
                            setTimeout(() => setActionSuccessMsg(''), 4500);
                          }
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve Tax &amp; Disburse</span>
                      </button>
                    </div>
                  )}

                  {req.status === 'pending' && req.requestType !== 'tax_payment' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDeclineReqId(req.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isLight
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveDeposit(req.id)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>
                          {req.requestType === 'upgrade'
                            ? `Approve & Activate Tier ${req.targetTier || 2}`
                            : req.requestType === 'kyc'
                            ? 'Approve KYC & Clear Withdrawal'
                            : req.requestType === 'membership'
                            ? 'Approve Membership'
                            : (req.requestType === 'deposit' || !req.planName)
                            ? 'Approve & Credit Balance'
                            : 'Approve & Issue Code'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SAFE WITHDRAWAL ACCOUNTS (KYC CONFIRMED DESTINATION ACCOUNTS) */}
      {activeTab === 'safe' && (
        <div className="space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Safe Withdrawal Destination Accounts
              </h3>
              <p className="text-[11px] text-stone-400">
                Accounts submitted by users after KYC confirmation for safe payout execution.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 bg-[#14151b] p-1 rounded-lg border border-stone-800 text-[10px]">
              {(['all', 'confirmed', 'paid'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSafeFilter(f)}
                  className={`px-2.5 py-0.5 rounded capitalize font-semibold transition-colors cursor-pointer ${
                    safeFilter === f ? 'bg-emerald-400 text-black font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {f === 'confirmed' ? 'Awaiting Payout' : (f === 'paid' ? 'Paid & Cleared' : 'All Safe')}
                </button>
              ))}
            </div>
          </div>

          {/* Search Safe Accounts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search by user name, bank, account number, or ref..."
              value={safeSearchQuery}
              onChange={(e) => setSafeSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Safe Accounts List */}
          <div className="space-y-3">
            {filteredSafeAccounts.length === 0 ? (
              <div className="p-8 text-center bg-[#14151b] rounded-2xl border border-stone-800 text-stone-400 text-xs space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
                <p className="font-bold text-white">No Safe Withdrawal Accounts</p>
                <p className="text-stone-500 max-w-sm mx-auto">
                  When a user confirms and gets approved for KYC, their withdrawal destination account is automatically submitted here for safe payout execution.
                </p>
              </div>
            ) : (
              filteredSafeAccounts.map((safeAcc) => {
                const isPaid = safeAcc.status === 'paid';
                return (
                  <div
                    key={safeAcc.id}
                    className={`p-4 rounded-2xl bg-[#14151b] border transition-all space-y-3 shadow-lg ${
                      isPaid ? 'border-stone-800/80' : 'border-emerald-500/40 shadow-emerald-500/5'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{safeAcc.userName || 'User'}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> KYC Confirmed Safe
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            }`}
                          >
                            {isPaid ? 'Paid & Cleared' : 'Awaiting Transfer'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">{safeAcc.userEmail || 'No email'}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-black text-emerald-400">{formatNaira(safeAcc.amount || 0)}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {formatSafeDate(safeAcc.confirmedAt || safeAcc.date)}
                        </div>
                      </div>
                    </div>

                    {/* Bank & Account Details with 1-Click Copy */}
                    <div className="p-3.5 rounded-xl bg-[#181922] border border-stone-800 space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Destination Bank:</span>
                        <span className="font-bold text-white text-right">{safeAcc.bank}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400 text-sm">{safeAcc.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySafeAccountNumber(safeAcc.accountNumber, safeAcc.id)}
                            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center gap-1 text-[10px] font-sans font-bold cursor-pointer transition-colors"
                            title="Copy Account Number"
                          >
                            {copiedSafeId === safeAcc.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Account Name:</span>
                        <span className="font-bold text-white text-right uppercase">{safeAcc.accountName}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
                        <span className="text-stone-400">Withdrawal Ref:</span>
                        <span className="text-amber-400">{safeAcc.reference}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            markSafePayoutAccountPaid(safeAcc.id);
                            setActionSuccessMsg(
                              isPaid ? 'Payout marked as Pending' : 'Payout marked as Paid & Cleared!'
                            );
                            setTimeout(() => setActionSuccessMsg(''), 3000);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isPaid
                              ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{isPaid ? 'Mark as Pending' : 'Mark as Paid'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            deleteSafePayoutAccount(safeAcc.id);
                            setActionSuccessMsg('Safe payout record removed.');
                            setTimeout(() => setActionSuccessMsg(''), 3000);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                          title="Delete from Safe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Upload Screenshot and Send to User Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenScreenshotModalForSafe(safeAcc)}
                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Send Screenshot &amp; Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERED USERS & BALANCES */}
      {activeTab === 'users' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Search box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search user by name, email, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <button
                type="button"
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userFilter === 'all'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-[#14151b] text-stone-400 border border-stone-800 hover:text-white'
                }`}
              >
                All Users ({allUsersList.length})
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('vmode')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  userFilter === 'vmode'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>V Mode Active ({allUsersList.filter((u) => u?.isVMode).length})</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-[#14151b] rounded-2xl border border-stone-800 text-stone-500 text-xs">
                {userFilter === 'vmode'
                  ? 'No users currently set to V Mode. Search a user and click "Set V Mode" to enable instant auto-verify.'
                  : `No registered users found matching "${searchQuery}".`}
              </div>
            ) : (
              paginatedUsers.map((u, i) => (
                <div
                  key={u.id || i}
                  className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 hover:border-amber-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs uppercase flex-shrink-0">
                        {(u.name || 'U').substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{u.name || 'User'}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                            (u.tier || 1) >= 3
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            Level {u.tier || 1} {(u.tier || 1) >= 3 ? '• 0 Pending' : ''}
                          </span>
                          {u.isKycVerified && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> KYC Active
                            </span>
                          )}
                          {u.isVMode && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-extrabold flex items-center gap-1 shadow-sm">
                              <Zap className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />
                              V MODE ACTIVE
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                              BANNED
                            </span>
                          )}
                          {u.withdrawalStatus === 'tax_pending' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold flex items-center gap-1 animate-pulse">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              TAX CLEARANCE PENDING (11.9%)
                            </span>
                          )}
                          {u.withdrawalStatus === 'action_required' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-yellow-400" />
                              TAX CLEARANCE REQUIRED (99% DONE)
                            </span>
                          )}
                          {u.withdrawalStatus === 'completed' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              WITHDRAWAL CLEARED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400">{u.email || 'No email'}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-stone-400">Balance</div>
                      <div className="text-sm font-bold text-amber-400">{formatNaira(u.balance || 0)}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400 gap-2 flex-wrap font-mono">
                    <div>
                      Account: <span className="text-stone-300 font-semibold">{u.referralCode || u.email}</span>
                    </div>
                    {u.referralCode && (
                      <div>
                        Ref Code: <span className="text-amber-400 font-bold">{u.referralCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Banned User Recovery Code Card */}
                  {u.isBanned && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-red-400 flex items-center gap-1.5 text-[11px]">
                          <Lock className="w-3.5 h-3.5" /> Account Banned (Screen Locked)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                          Restore Fee: ₦60,000
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0e0f14] border border-stone-800 font-mono text-[11px] flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-stone-400">Restore Code:</span>
                          <span className="font-bold text-amber-400 tracking-wider text-xs">
                            {u.recoveryCode || 'None Assigned'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          {u.recoveryCode && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(u.recoveryCode || '');
                                setCopiedRecoveryCodeId(u.id);
                                setTimeout(() => setCopiedRecoveryCodeId(null), 2000);
                              }}
                              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy Code for User"
                            >
                              {copiedRecoveryCodeId === u.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const newCode = generateNewRecoveryCodeForUser(u.id);
                              setActionSuccessMsg(`New ₦60k Restore Code generated: ${newCode}`);
                              setTimeout(() => setActionSuccessMsg(''), 4000);
                            }}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-sans font-bold cursor-pointer transition-colors"
                          >
                            Reset Code
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForMsg({ id: u.id, name: u.name || 'User', email: u.email });
                              setMsgTitle('Account Restore Code (₦60,000 Verified)');
                              setMsgDesc(
                                `Here is your verified ₦60,000 Restore Code: ${u.recoveryCode || 'RC60K'}\n\nEnter this code on your screen to immediately unlock your account and restore your funds.`
                              );
                              setMsgScreenshotUrl('');
                              setMsgScreenshotName('');
                              setMsgIsPopup(true);
                              setImgUploadError('');
                            }}
                            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-sans font-bold cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Send via DM</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}



                  {/* Admin User Management Actions */}
                  <div className="flex items-center gap-2 pt-2 justify-end flex-wrap">
                    {/* V Mode Auto-Verify Quick Code Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus = !u.isVMode;
                        toggleVMode(u.id, nextStatus);
                        setActionSuccessMsg(
                          nextStatus
                            ? `⚡ V Mode enabled for ${u.name || 'User'}! Uploaded Quick Code payments will auto-verify immediately without admin approval.`
                            : `V Mode disabled for ${u.name || 'User'}.`
                        );
                        setTimeout(() => setActionSuccessMsg(''), 4000);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        u.isVMode
                          ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                      title={
                        u.isVMode
                          ? 'V Mode is ON: Quick Code payments auto-verify without admin approval. Click to turn OFF.'
                          : 'Set V Mode: Quick Code payments uploaded by this user will automatically verify without admin approval.'
                      }
                    >
                      <Zap className={`w-3 h-3 ${u.isVMode ? 'fill-white text-white' : 'text-purple-400'}`} />
                      <span>{u.isVMode ? 'V Mode: Active' : 'Set V Mode'}</span>
                    </button>

                    {/* Level / Tier Quick Controls */}
                    <div className="flex items-center gap-1 border border-stone-800 rounded-lg p-0.5 bg-[#0f1015]">
                      <span className="text-[9px] text-stone-400 px-1 font-bold">Level:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUserTierDirect(u.id, 1);
                          setActionSuccessMsg(`${u.name || 'User'} set to Level 1`);
                          setTimeout(() => setActionSuccessMsg(''), 3000);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                          (u.tier || 1) === 1 ? 'bg-amber-400 text-black font-extrabold' : 'text-stone-400 hover:text-white'
                        }`}
                        title="Set to Level 1"
                      >
                        L1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserTierDirect(u.id, 2);
                          setActionSuccessMsg(`${u.name || 'User'} set to Level 2`);
                          setTimeout(() => setActionSuccessMsg(''), 3000);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                          u.tier === 2 ? 'bg-amber-400 text-black font-extrabold' : 'text-stone-400 hover:text-white'
                        }`}
                        title="Set to Level 2"
                      >
                        L2
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserTierDirect(u.id, 3);
                          setActionSuccessMsg(`⭐ ${u.name || 'User'} upgraded to Level 3 — 0 Pending earnings!`);
                          setTimeout(() => setActionSuccessMsg(''), 4000);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                          (u.tier || 1) >= 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-extrabold' : 'text-stone-400 hover:text-white'
                        }`}
                        title="Level 3 VIP: Zero pending earnings required, 100% credited directly to balance"
                      >
                        L3 (No Pending)
                      </button>
                    </div>

                    {/* Tax Payment Approval button if user submitted tax */}
                    {u.withdrawalStatus === 'tax_pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetReq = (depositRequests || []).find(
                            (r) => r.userId === u.id && r.requestType === 'tax_payment' && r.status === 'pending'
                          );
                          if (targetReq) {
                            approveTaxPaymentAndWithdrawal(targetReq.id);
                          } else {
                            updateUserAccountStatus(u.id, 'approved');
                          }
                          setActionSuccessMsg(`Tax clearance approved for ${u.name || 'User'}! Payout disbursed to destination bank.`);
                          setTimeout(() => setActionSuccessMsg(''), 4500);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-md cursor-pointer hover:from-emerald-300 hover:to-teal-300 flex items-center gap-1"
                        title="Approve 11.9% Tax Payment and disburse withdrawal"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Approve Tax &amp; Disburse</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const newStatus = u.accountStatus === 'approved' ? 'declined' : 'approved';
                        updateUserAccountStatus(u.id, newStatus);
                        setActionSuccessMsg(`User status updated to ${newStatus}`);
                        setTimeout(() => setActionSuccessMsg(''), 3000);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                        u.accountStatus === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {u.accountStatus === 'approved' ? 'Approved' : 'Approve User'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        banUser(u.id);
                        setActionSuccessMsg(
                          u.isBanned
                            ? 'User unbanned successfully'
                            : 'User account banned - Screen locked & ₦60,000 restore code generated'
                        );
                        setTimeout(() => setActionSuccessMsg(''), 3500);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                        u.isBanned
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {u.isBanned ? 'Unban (Bypass)' : 'Ban Account'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserForMsg({ id: u.id, name: u.name || 'User', email: u.email });
                        setMsgTitle('Official Account Notice');
                        setMsgDesc('');
                        setMsgScreenshotUrl('');
                        setMsgScreenshotName('');
                        setMsgIsPopup(true);
                        setImgUploadError('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Screenshot / Msg</span>
                    </button>

                    {confirmDeleteUserId === u.id ? (
                      <div className="flex items-center gap-1.5 bg-red-950/60 p-1 rounded-lg border border-red-500/40">
                        <span className="text-[10px] text-red-300 font-medium px-1">Delete for good?</span>
                        <button
                          type="button"
                          disabled={isDeletingUser}
                          onClick={async () => {
                            setIsDeletingUser(true);
                            try {
                              const success = await deleteUserAccount(u.id);
                              if (success) {
                                setActionSuccessMsg(`User ${u.name || u.email} deleted and removed from the app`);
                              } else {
                                setActionSuccessMsg('Error deleting user');
                              }
                              setTimeout(() => setActionSuccessMsg(''), 3500);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsDeletingUser(false);
                              setConfirmDeleteUserId(null);
                            }
                          }}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isDeletingUser ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingUser}
                          onClick={() => setConfirmDeleteUserId(null)}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteUserId(u.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Delete user completely so they do not exist on the app"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Account</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {filteredUsers.length > USERS_PER_PAGE && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 text-xs text-stone-300">
                <span className="text-[11px] text-stone-400">
                  Showing {(userPage - 1) * USERS_PER_PAGE + 1} - {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {allUsersList.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Page {userPage} of {Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
                  </span>
                  <button
                    type="button"
                    disabled={userPage >= Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
                    onClick={() => setUserPage((p) => Math.min(Math.ceil(filteredUsers.length / USERS_PER_PAGE), p + 1))}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW PROOF MODAL */}
      {selectedProofReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#14151b] border border-amber-500/30 rounded-3xl p-5 space-y-4 text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Uploaded Payment Proof</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProofReq(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c1e26] border border-stone-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">User Name:</span>
                <span className="font-bold text-white">{selectedProofReq.userName || 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">User Email:</span>
                <span className="text-white">{selectedProofReq.userEmail || 'No email'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Amount:</span>
                <span className="font-extrabold text-amber-400 text-sm">{formatNaira(selectedProofReq.amount || 0)}</span>
              </div>
              {selectedProofReq.requestType === 'tax_payment' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Withdrawal Payout:</span>
                    <span className="font-bold text-emerald-400">{formatNaira(selectedProofReq.withdrawalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Payout Destination:</span>
                    <span className="text-white font-semibold">{selectedProofReq.destinationBank} - {selectedProofReq.destinationAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Sender Bank:</span>
                    <span className="text-amber-300 font-bold">{selectedProofReq.senderBank || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Sender Account Name:</span>
                    <span className="text-emerald-300 font-bold">{selectedProofReq.senderAccountName || 'Not specified'}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-stone-400">Payment To:</span>
                <span className="text-white">{selectedProofReq.bankName} ({selectedProofReq.accountNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Receipt File Name:</span>
                <span className="text-emerald-400 font-mono">{selectedProofReq.receiptName || 'receipt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Reference:</span>
                <span className="font-mono text-stone-300">{selectedProofReq.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Submitted At:</span>
                <span className="text-stone-300">{formatSafeDateTime(selectedProofReq.submittedAt)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#181922] border border-stone-800 text-center space-y-2">
              {resolveReceiptImageUrl(selectedProofReq) ? (
                <div className="space-y-2">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                    Uploaded Receipt Image Preview:
                  </span>
                  <img
                    src={resolveReceiptImageUrl(selectedProofReq)}
                    alt="Payment Proof"
                    className="max-h-[55vh] w-full mx-auto rounded-xl object-contain bg-black/60 border border-stone-700"
                  />
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white">Payment Receipt Proof Preview</p>
                  <p className="text-[10px] text-stone-400">File: {selectedProofReq.receiptName || 'Receipt'}</p>
                  <p className="text-[10px] text-amber-400/80">
                    (Older submission without embedded image data — all new uploads include full image preview)
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {selectedProofReq.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const reqId = selectedProofReq.id;
                      setSelectedProofReq(null);
                      setSelectedDeclineReqId(reqId);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProofReq.requestType === 'tax_payment') {
                        const ok = approveTaxPaymentAndWithdrawal(selectedProofReq.id);
                        if (ok) {
                          setActionSuccessMsg(`Tax payment approved! Withdrawal of ₦${(selectedProofReq.withdrawalAmount || 0).toLocaleString()} released to user's bank.`);
                          setTimeout(() => setActionSuccessMsg(''), 4500);
                        }
                      } else {
                        handleApproveDeposit(selectedProofReq.id);
                      }
                      setSelectedProofReq(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                  >
                    {selectedProofReq.requestType === 'tax_payment' ? 'Approve Tax & Disburse' : 'Approve & Credit'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedProofReq(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND DIRECT MESSAGE & SCREENSHOT MODAL */}
      {selectedUserForMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#14151b] border-2 border-amber-500/40 rounded-3xl p-5 space-y-4 text-stone-200 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Send Notice &amp; Screenshot Proof</h3>
                  <p className="text-[10px] text-amber-400 font-mono">To: {selectedUserForMsg.name} ({selectedUserForMsg.email || 'User ID: ' + selectedUserForMsg.id})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForMsg(null)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Message Title</label>
                <input
                  type="text"
                  placeholder="e.g. Withdrawal Transfer Cleared"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Message Body / Details</label>
                <textarea
                  rows={4}
                  placeholder="Type message for this user..."
                  value={msgDesc}
                  onChange={(e) => setMsgDesc(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Upload Screenshot Section */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#181922] border border-stone-800">
                <label className="block font-bold text-amber-400 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Upload Transfer / Payment Screenshot
                  </span>
                  {msgScreenshotUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setMsgScreenshotUrl('');
                        setMsgScreenshotName('');
                      }}
                      className="text-[10px] text-red-400 hover:underline cursor-pointer"
                    >
                      Remove Screenshot
                    </button>
                  )}
                </label>

                {imgUploadError && (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                    {imgUploadError}
                  </div>
                )}

                {msgScreenshotUrl ? (
                  <div className="space-y-2">
                    <img
                      src={msgScreenshotUrl}
                      alt="Uploaded transfer screenshot"
                      className="max-h-48 w-full object-contain rounded-xl bg-black/50 border border-stone-700"
                    />
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>{msgScreenshotName || 'screenshot.png'}</span>
                      <span className="text-emerald-400 font-bold">Ready to send</span>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-amber-500/60 rounded-xl cursor-pointer bg-[#14151b] transition-colors group">
                    <Upload className="w-6 h-6 text-stone-500 group-hover:text-amber-400 mb-1 transition-colors" />
                    <span className="text-xs font-bold text-stone-300 group-hover:text-white">Click to select screenshot image</span>
                    <span className="text-[10px] text-stone-500 mt-0.5">Supports PNG, JPG, JPEG, WEBP (Max 4MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Dashboard Popup Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1c1e26] border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msgIsPopup}
                  onChange={(e) => setMsgIsPopup(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 accent-amber-400 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white text-xs block">Pop up immediately on user dashboard</span>
                  <span className="text-[10px] text-stone-400 block">
                    Displays screenshot &amp; message modal on screen with Cancel and Chat Agent buttons.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForMsg(null)}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs hover:bg-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!msgTitle.trim() || !msgDesc.trim()) {
                    setActionSuccessMsg('Please enter a message title and description.');
                    setTimeout(() => setActionSuccessMsg(''), 3000);
                    return;
                  }
                  sendDirectMessageToUser(
                    selectedUserForMsg.id,
                    msgTitle,
                    msgDesc,
                    msgScreenshotUrl || undefined,
                    msgScreenshotName || undefined,
                    msgIsPopup
                  );
                  setActionSuccessMsg(`Screenshot & message delivered to ${selectedUserForMsg.name}!`);
                  setSelectedUserForMsg(null);
                  setMsgTitle('');
                  setMsgDesc('');
                  setMsgScreenshotUrl('');
                  setMsgScreenshotName('');
                  setTimeout(() => setActionSuccessMsg(''), 4000);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS (COMPANY ACCOUNT, COMMUNITY CHANNELS, PRICING) */}
      {activeTab === 'account' && (
        <div className="p-4 rounded-2xl bg-[#14151b] border border-stone-800 space-y-5 animate-in fade-in">
          {/* 1. Official Bank Account */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                Company Official Bank Account
              </h3>
              <p className="text-[11px] text-stone-400">
                This account is displayed on all deposit pages for users to transfer funds.
              </p>
            </div>

            {accountSaveMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{accountSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompanyAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. OPay, Moniepoint, PalmPay, Kuda"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 8140000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. 9JACASH ENTERPRISES"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs uppercase focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearCompanyAccount}
                  className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs cursor-pointer"
                >
                  Deactivate
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Bank Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Official Community Channels & Agent Settings */}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                Community Channels &amp; Support Agent Telegram
              </h4>
              <p className="text-[10px] text-stone-400">
                Configure official Telegram broadcast channel, WhatsApp group, and Support Agent handle.
              </p>
            </div>

            {communitySaveMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{communitySaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCommunityLinks} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Official Telegram Broadcast Channel Link</label>
                <input
                  type="text"
                  placeholder="e.g. https://t.me/jacash1 or https://t.me/your_channel"
                  value={telegramUrlInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTelegramUrlInput(val);
                    if (val.trim()) {
                      setTelegramHandleInput(formatTelegramHandle(val));
                    }
                  }}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Telegram Channel Display Handle</label>
                <input
                  type="text"
                  placeholder="e.g. @jacash1"
                  value={telegramHandleInput}
                  onChange={(e) => setTelegramHandleInput(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  This handle is displayed as the official channel name and copied by users on the Community page.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Official WhatsApp Community Link</label>
                <input
                  type="text"
                  placeholder="e.g. https://whatsapp.com/channel/..."
                  value={whatsappUrlInput}
                  onChange={(e) => setWhatsappUrlInput(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label className="block font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" />
                  Support Agent Direct Telegram (Chat Agent Button Destination)
                </label>
                <p className="text-[10px] text-stone-300">
                  When users click &quot;Chat Agent&quot; on support or screenshot popups, this direct username is launched.
                </p>
                <input
                  type="text"
                  placeholder="e.g. @jacash1 or https://t.me/jacash1"
                  value={agentTelegramUrlInput}
                  onChange={(e) => setAgentTelegramUrlInput(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1e26] border border-amber-500/40 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCommunity}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingCommunity ? 'Saving Live Links...' : 'Save Community & Agent Links'}</span>
              </button>
            </form>
          </div>

          {/* 3. Pricing & Clearance Controls */}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Code &amp; KYC Clearance Pricing
              </h4>
              <p className="text-[11px] text-stone-400">
                Configure real-time pricing for KYC account clearance and Quick Code purchase tiers.
              </p>
            </div>

            {pricingSaveMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pricingSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#1c1e26] border border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    KYC Verification Fee (₦)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    Current: {formatNaira(appPricing?.kycPrice ?? 22000)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₦</span>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    placeholder="22000"
                    value={kycPriceInput}
                    onChange={(e) => setKycPriceInput(Number(e.target.value))}
                    className="w-full py-2.5 pl-8 pr-3 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1c1e26] border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Quick Code Plans (₦)
                  </label>
                  <span className="text-[10px] text-stone-400">4 Purchase Tiers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-300 mb-1">1 Withdrawal</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-stone-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="7800"
                        value={quickCodePlan1Input}
                        onChange={(e) => setQuickCodePlan1Input(Number(e.target.value))}
                        className="w-full py-2 pl-6 pr-2 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-300 mb-1">3 Withdrawals</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-stone-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="10300"
                        value={quickCodePlan2Input}
                        onChange={(e) => setQuickCodePlan2Input(Number(e.target.value))}
                        className="w-full py-2 pl-6 pr-2 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-300 mb-1">6 Withdrawals</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-stone-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="15600"
                        value={quickCodePlan3Input}
                        onChange={(e) => setQuickCodePlan3Input(Number(e.target.value))}
                        className="w-full py-2 pl-6 pr-2 bg-[#14151b] border border-stone-800 rounded-xl text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-amber-300 mb-1 flex items-center justify-between">
                      <span>Unlimited (Coder)</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-bold">VIP</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-stone-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        placeholder="70000"
                        value={quickCodePlanUnlimitedInput}
                        onChange={(e) => setQuickCodePlanUnlimitedInput(Number(e.target.value))}
                        className="w-full py-2 pl-6 pr-2 bg-[#14151b] border border-amber-500/40 rounded-xl text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPricing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingPricing ? 'Saving Live Prices...' : 'Save Pricing'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST OR TARGETED NOTIFICATIONS */}
      {activeTab === 'broadcast' && (
        <div className="p-4 rounded-2xl bg-[#14151b] border border-stone-800 space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-400" />
              Notifications &amp; Broadcast Dispatcher
            </h3>
            <p className="text-[11px] text-stone-400">
              Send global broadcast updates to all users or dispatch a private notice to a specific user.
            </p>
          </div>

          {/* Quick Switch to Device Push Notification */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#181924] to-[#14151b] border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Send OS Device Push Notifications</h4>
                <p className="text-[11px] text-stone-400">
                  Users receive the alert directly on Android status bars &amp; iPhone lock screens without opening the app.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeviceNotificationPage(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Open Device Push Sender →
            </button>
          </div>

          {broadcastSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{broadcastSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastAudience('global')}
                  className={`py-2.5 px-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    broadcastAudience === 'global'
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Global (All Users - {allUsersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastAudience('user')}
                  className={`py-2.5 px-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    broadcastAudience === 'user'
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Single Specific User</span>
                </button>
              </div>
            </div>

            {/* If Single User: User Picker */}
            {broadcastAudience === 'user' && (
              <div className="p-3 rounded-xl bg-[#1c1e26] border border-amber-500/30 space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-semibold text-amber-300">
                  Select Recipient User (Private Delivery)
                </label>
                <select
                  value={broadcastTargetUserId}
                  onChange={(e) => setBroadcastTargetUserId(e.target.value)}
                  className="w-full p-2.5 bg-[#14151b] border border-stone-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                  required={broadcastAudience === 'user'}
                >
                  <option value="">-- Choose a user --</option>
                  {allUsersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || 'User'} ({u.email || u.membershipId || u.id})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-stone-400 block">
                  This notification will appear ONLY on this selected user&apos;s notification page, not globally.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Notification Priority &amp; Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['admin', 'info', 'alert', 'success'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBroadcastType(t)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold capitalize border transition-all cursor-pointer ${
                      broadcastType === t
                        ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                        : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Notification Title</label>
              <input
                type="text"
                placeholder={broadcastAudience === 'global' ? "e.g. Special Weekend Cashback Live!" : "e.g. KYC Verification Approved / Notice"}
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Notification Message</label>
              <textarea
                rows={3}
                placeholder="Type your message here..."
                value={broadcastDesc}
                onChange={(e) => setBroadcastDesc(e.target.value)}
                className="w-full p-2.5 bg-[#1c1e26] border border-stone-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {broadcastAudience === 'global'
                  ? `Broadcast to All Users (${allUsersList.length})`
                  : 'Send Private Notification to Selected User'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS & BROADCAST HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-white block">Active System Notifications</span>
              <span className="text-[10px] text-stone-400">Manage global announcements and private user alerts</span>
            </div>
            {(notifications || []).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearAllNotifications();
                  setActionSuccessMsg('All notifications cleared successfully!');
                  setTimeout(() => setActionSuccessMsg(''), 4000);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Clear All ({notifications.length})
              </button>
            )}
          </div>

          {/* Filter options */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-[#14151b] border border-stone-800 text-[11px]">
            <button
              type="button"
              onClick={() => setHistoryFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                historyFilter === 'all'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({(notifications || []).length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('global')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                historyFilter === 'global'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Global ({(notifications || []).filter(isGlobalBroadcastNotification).length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('private')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                historyFilter === 'private'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Private Users ({(notifications || []).filter((n) => !isGlobalBroadcastNotification(n)).length})
            </button>
          </div>

          {(notifications || []).length === 0 ? (
            <div className="p-8 text-center bg-[#14151b] rounded-2xl border border-stone-800 text-stone-400 text-xs space-y-2">
              <Bell className="w-8 h-8 text-amber-400 mx-auto opacity-50" />
              <p className="font-bold text-white">No Active Notifications</p>
              <p className="text-[11px] text-stone-500">
                You haven&apos;t sent any notifications yet. Use the Broadcast tab to notify all users or a specific user.
              </p>
            </div>
          ) : (
            (notifications || [])
              .filter((n: AppNotification) => {
                const isGlobal = isGlobalBroadcastNotification(n);
                if (historyFilter === 'global') return isGlobal;
                if (historyFilter === 'private') return !isGlobal;
                return true;
              })
              .map((n: AppNotification) => {
                const isGlobal = isGlobalBroadcastNotification(n);
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 shadow-md transition-all ${
                      isGlobal
                        ? 'bg-[#14151b] border-amber-500/30'
                        : 'bg-[#121319] border-stone-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isGlobal
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      }`}>
                        {isGlobal ? <Megaphone className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white">{n.title || 'Notice'}</h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                            isGlobal
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                              : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                          }`}>
                            {isGlobal ? 'GLOBAL BROADCAST (All Users)' : `PRIVATE: ${n.targetUserName || n.targetUserId || 'User'}`}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            {n.type || 'admin'}
                          </span>
                          {n.screenshotUrl && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono flex items-center gap-0.5">
                              <ImageIcon className="w-2.5 h-2.5" /> Screenshot
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-300 mt-1 leading-relaxed whitespace-pre-line">{n.desc}</p>
                        <span className="text-[10px] text-stone-500 mt-1 block font-mono">
                          {n.time || ''} {n.date ? `• ${n.date}` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteNotification(n.id);
                        setActionSuccessMsg('Notification deleted successfully!');
                        setTimeout(() => setActionSuccessMsg(''), 3000);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
};
