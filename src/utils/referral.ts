/**
 * Referral utilities for 9jacash
 * Domain: 9jacash.online
 * Referral links format: 9jacash.online?ref=username
 */

export const SITE_DOMAIN = '9jacash.online';
export const REFERRAL_STORAGE_KEY = '9jacash_incoming_referral';

/**
 * Extracts the user's first name / handle from their email address
 * e.g. "james.okafor@gmail.com" -> "james"
 * e.g. "pellinomadio@gmail.com" -> "pellinomadio"
 */
export const extractReferralCodeFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '';
  const localPart = email.split('@')[0].trim().toLowerCase();
  
  // Extract the first segment before dot, underscore, plus, or hyphen
  const parts = localPart.split(/[._+\-]/);
  const firstPart = parts[0]?.replace(/[^a-z0-9]/g, '') || '';

  if (firstPart.length >= 2) {
    return firstPart;
  }

  // Fallback to sanitized entire local part if first segment was too short
  const fullSanitized = localPart.replace(/[^a-z0-9]/g, '');
  return fullSanitized || 'earner';
};

/**
 * Parses incoming referral code from URL query parameters (e.g. ?ref=james) or stored session
 */
export const getIncomingReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramRef =
      urlParams.get('ref') ||
      urlParams.get('referral') ||
      urlParams.get('r') ||
      urlParams.get('code');

    if (paramRef) {
      const clean = decodeURIComponent(paramRef).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (clean) {
        try {
          sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
          localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
        } catch {
          // ignore storage errors
        }
        return clean;
      }
    }

    // Check stored incoming referral
    const stored =
      sessionStorage.getItem(REFERRAL_STORAGE_KEY) ||
      localStorage.getItem(REFERRAL_STORAGE_KEY);

    if (stored) {
      return stored.trim().toLowerCase();
    }
  } catch {
    // ignore
  }

  return null;
};

/**
 * Builds the full referral link (with or without https:// protocol)
 */
export const buildReferralLink = (code: string, includeProtocol = true): string => {
  const cleanCode = (code || '').trim().toLowerCase();
  const base = includeProtocol ? `https://${SITE_DOMAIN}` : SITE_DOMAIN;
  return `${base}?ref=${encodeURIComponent(cleanCode)}`;
};

/**
 * Builds a clean display link (e.g. 9jacash.online?ref=james)
 */
export const getDisplayReferralLink = (code: string): string => {
  const cleanCode = (code || '').trim().toLowerCase();
  return `${SITE_DOMAIN}?ref=${cleanCode}`;
};
