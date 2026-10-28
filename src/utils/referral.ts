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
 * Cleans a raw referral input (whether a code, full URL, or email address) into a normalized referral code
 */
export const cleanReferralCodeInput = (raw: string): string => {
  if (!raw) return '';
  let val = raw.trim();
  try {
    val = decodeURIComponent(val).trim();
  } catch {
    // ignore decode error
  }

  // If user pasted a URL containing ?ref= or &ref=
  const refMatch = val.match(/[?&#](?:ref|referral|r|code)=([^&#\s]+)/i);
  if (refMatch && refMatch[1]) {
    val = refMatch[1].trim();
  } else if (val.includes('ref=')) {
    const simpleMatch = val.match(/ref=([^&#\s]+)/i);
    if (simpleMatch && simpleMatch[1]) {
      val = simpleMatch[1].trim();
    }
  }

  // If user entered an email address like pellinomadio@gmail.com, extract the referral code handle
  if (val.includes('@')) {
    return extractReferralCodeFromEmail(val);
  }

  // Strip domain prefixes if user pasted e.g. 9jacash.online/pellinomadio
  val = val.replace(/^https?:\/\/[^/]+\/?/i, '').replace(/^9jacash\.online\/?/i, '');

  return val.toLowerCase().replace(/[^a-z0-9._-]/g, '').trim();
};

/**
 * Parses incoming referral code from URL query parameters, hash parameters, or stored session
 */
export const getIncomingReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    let paramRef =
      urlParams.get('ref') ||
      urlParams.get('referral') ||
      urlParams.get('r') ||
      urlParams.get('code');

    // Fallback: inspect full href / hash in case link was opened with hash routing
    if (!paramRef && window.location.href) {
      const hrefMatch = window.location.href.match(/[?&#](?:ref|referral|r|code)=([^&#\s]+)/i);
      if (hrefMatch && hrefMatch[1]) {
        paramRef = hrefMatch[1];
      }
    }

    if (paramRef) {
      const clean = cleanReferralCodeInput(paramRef);
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
      return cleanReferralCodeInput(stored) || null;
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
