import { User } from '../types/index.ts';
import { getOrCreateDeviceId } from './deviceNotifications.ts';

export const MAX_ACCOUNTS_PER_DEVICE = 10;
export const DEVICE_ACCOUNTS_STORAGE_KEY = '9jacash_registered_accounts_on_device';

/**
 * Get list of account emails registered from this specific device
 */
export function getRegisteredAccountsOnDevice(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if current device is allowed to create another account (Maximum 10 accounts per device)
 */
export function canRegisterAccountOnDevice(existingUsers?: User[]): {
  allowed: boolean;
  count: number;
  max: number;
  message?: string;
  accounts: string[];
} {
  const currentDeviceId = getOrCreateDeviceId();
  const localAccounts = getRegisteredAccountsOnDevice().map((e) => e.toLowerCase().trim());

  // Also check if remote users in Firestore have this deviceId
  let remoteAccounts: string[] = [];
  if (existingUsers && Array.isArray(existingUsers)) {
    remoteAccounts = existingUsers
      .filter((u) => u && u.deviceId && u.deviceId === currentDeviceId)
      .map((u) => (u.email || '').toLowerCase().trim())
      .filter(Boolean);
  }

  // Combine unique accounts created on this device
  const combined = Array.from(new Set([...localAccounts, ...remoteAccounts]));
  const count = combined.length;

  if (count >= MAX_ACCOUNTS_PER_DEVICE) {
    return {
      allowed: false,
      count,
      max: MAX_ACCOUNTS_PER_DEVICE,
      message: `Device registration limit reached. A maximum of ${MAX_ACCOUNTS_PER_DEVICE} accounts can be created on this device. Please log in to your existing account.`,
      accounts: combined,
    };
  }

  return {
    allowed: true,
    count,
    max: MAX_ACCOUNTS_PER_DEVICE,
    accounts: combined,
  };
}

/**
 * Record a newly registered account to this device
 */
export function recordAccountOnDevice(email: string): void {
  if (typeof window === 'undefined') return;
  const cleanEmail = email.toLowerCase().trim();
  const accounts = getRegisteredAccountsOnDevice();
  if (!accounts.includes(cleanEmail)) {
    accounts.push(cleanEmail);
    try {
      localStorage.setItem(DEVICE_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // ignore storage quota errors
    }
  }
}
