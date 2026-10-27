/**
 * Safe localStorage and sessionStorage wrapper and global protector.
 * Handles QuotaExceededError, automatically prunes bulky cached assets,
 * and prevents uncaught storage exceptions from crashing the application.
 */

// Helper to sanitize any value before or during storage to strip massive base64 payloads
function sanitizeObjectDataUrls<T>(data: T): T {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObjectDataUrls(item)) as any;
  }

  const copy = { ...(data as Record<string, any>) };
  for (const k of Object.keys(copy)) {
    const val = copy[k];
    if (typeof val === 'string' && val.startsWith('data:image') && val.length > 250000) {
      // Truncate or remove oversized base64 string from persistent storage cache
      delete copy[k];
    } else if (typeof val === 'object' && val !== null) {
      copy[k] = sanitizeObjectDataUrls(val);
    }
  }
  return copy as T;
}

export function cleanStorageQuota(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const bulkyKeys = [
    '9jacash_notifications_db',
    '9jacash_deposit_requests_db',
    '9jacash_safe_payout_accounts_db',
    '9jacash_users_db',
  ];

  for (const k of bulkyKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        const cleaned = sanitizeObjectDataUrls(parsed);
        localStorage.setItem(k, JSON.stringify(cleaned));
      }
    } catch {
      // If a single key fails to prune, continue with others
    }
  }

  // Remove temporary stale spin/claim keys older than today
  try {
    const todayStr = new Date().toDateString();
    for (let i = 0; i < localStorage.length; i++) {
      const keyName = localStorage.key(i);
      if (keyName && (keyName.includes('9jacash_quiz_count_') || keyName.includes('9jacash_spins_'))) {
        if (!keyName.includes(todayStr)) {
          localStorage.removeItem(keyName);
        }
      }
    }
  } catch {
    // Ignore error
  }
}

// Global safety interceptor on Storage.prototype.setItem
if (typeof window !== 'undefined' && window.Storage) {
  try {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      try {
        originalSetItem.call(this, key, value);
      } catch (err: any) {
        const isQuota =
          err?.name === 'QuotaExceededError' ||
          err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err?.code === 22 ||
          err?.code === 1014 ||
          String(err).toLowerCase().includes('quota');

        if (isQuota) {
          console.warn(`Storage quota exceeded when writing "${key}". Running emergency cleanup...`);
          try {
            cleanStorageQuota();
            // Try again after cleaning
            originalSetItem.call(this, key, value);
            return;
          } catch {
            // If still failing, try pruning the value being saved
            try {
              const parsed = JSON.parse(value);
              const sanitized = sanitizeObjectDataUrls(parsed);
              originalSetItem.call(this, key, JSON.stringify(sanitized));
              return;
            } catch {
              console.warn(`Safe storage catch: Skipping localStorage persistence for "${key}" to avoid app crash.`);
            }
          }
        } else {
          // Re-throw if not quota related
          throw err;
        }
      }
    };
  } catch {
    // Ignore prototype patch issues if read-only
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    console.warn(`safeLocalStorageSet fallback triggered for "${key}":`, e);
    try {
      cleanStorageQuota();
      const parsed = JSON.parse(value);
      const sanitized = sanitizeObjectDataUrls(parsed);
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch {
      console.warn(`safeLocalStorageSet: unable to persist "${key}", keeping state in memory.`);
    }
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}
