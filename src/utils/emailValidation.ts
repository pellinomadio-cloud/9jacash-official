// Comprehensive email validation & domain verification utilities for new account registration

export interface EmailValidationResult {
  valid: boolean;
  normalizedEmail: string;
  error?: string;
  suggestion?: string;
}

// Common email provider domain typos -> suggested correction
const DOMAIN_TYPO_SUGGESTIONS: Record<string, string> = {
  // Gmail typos
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.com.ng': 'gmail.com',
  'gmil.com': 'gmail.com',
  'hmail.com': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoomail.com': 'yahoo.com',
  // Outlook / Hotmail typos
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'homail.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.co': 'outlook.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.co': 'icloud.com',
};

// Disposable, temporary, or obvious dummy/fake domains
const BLOCKED_DISPOSABLE_DOMAINS = new Set<string>([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'fake.com',
  'dummy.com',
  'none.com',
  'noemail.com',
  'asdf.com',
  'qwerty.com',
  'mailinator.com',
  'mailinator.net',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamail.net',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'throwawaymail.com',
  'dispostable.com',
  'getnada.com',
  'sharklasers.com',
  'maildrop.cc',
  'mohmal.com',
  'fakeinbox.com',
  'mintemail.com',
  'emailondeck.com',
  'burnermail.io',
  'inboxkitten.com',
  'localhost',
  'localdomain',
]);

// Known valid major TLDs (not exhaustive; generic TLD syntax still applies, but helps catch 1-letter / malformed TLDs)
const EMAIL_LOCAL_PART_REGEX = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/i;
const EMAIL_DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const EMAIL_TLD_REGEX = /^[a-z]{2,24}$/i;

/**
 * Validates email format, characters, domain structure, typos, and blocks disposable/fake domains.
 */
export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  const trimmed = (rawEmail || '').trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, normalizedEmail: trimmed, error: 'Please enter your email address.' };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Email address cannot contain spaces.',
    };
  }

  const atParts = trimmed.split('@');
  if (atParts.length !== 2) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Please enter a valid email address (example: name@gmail.com).',
    };
  }

  const [localPart, domainPart] = atParts;

  if (!localPart || localPart.length > 64) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'The username part before "@" is invalid.',
    };
  }

  if (localPart.includes('..') || !EMAIL_LOCAL_PART_REGEX.test(localPart)) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Email username contains invalid characters or formatting.',
    };
  }

  if (!domainPart || domainPart.length > 253 || !domainPart.includes('.')) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Please enter a complete email domain (example: @gmail.com or @yahoo.com).',
    };
  }

  if (domainPart.includes('..')) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Email domain cannot contain consecutive dots.',
    };
  }

  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Please enter a valid email domain.',
    };
  }

  for (const label of domainLabels) {
    if (!EMAIL_DOMAIN_LABEL_REGEX.test(label)) {
      return {
        valid: false,
        normalizedEmail: trimmed,
        error: 'Email domain contains invalid characters.',
      };
    }
  }

  const tld = domainLabels[domainLabels.length - 1];
  if (!EMAIL_TLD_REGEX.test(tld)) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Email address has an invalid domain ending (example: .com, .ng, .org).',
    };
  }

  // Check common provider typos (e.g. gmail.con, gmal.com)
  const suggestedDomain = DOMAIN_TYPO_SUGGESTIONS[domainPart];
  if (suggestedDomain) {
    const correctedEmail = `${localPart}@${suggestedDomain}`;
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: `Invalid email domain "@${domainPart}". Did you mean ${correctedEmail}?`,
      suggestion: correctedEmail,
    };
  }

  // Block temporary/disposable/dummy email domains
  if (BLOCKED_DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Temporary or fake email addresses are not allowed. Please use a real email address.',
    };
  }

  return {
    valid: true,
    normalizedEmail: trimmed,
  };
}

/**
 * Verifies that the email's domain actually exists and can receive email (DNS MX/A check via DNS-over-HTTPS).
 * Falls back gracefully if DNS lookup is unavailable or times out.
 */
export async function verifyEmailAddress(rawEmail: string): Promise<EmailValidationResult> {
  const formatResult = validateEmailFormat(rawEmail);
  if (!formatResult.valid) {
    return formatResult;
  }

  const [, domainPart] = formatResult.normalizedEmail.split('@');

  // Fast-path for well-known verified providers to avoid unnecessary network wait
  const trustedProviders = new Set([
    'gmail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'icloud.com',
    'me.com',
    'proton.me',
    'protonmail.com',
    'aol.com',
    'zoho.com',
    'ymail.com',
  ]);
  if (trustedProviders.has(domainPart)) {
    return formatResult;
  }

  // Query public DNS-over-HTTPS for MX records on custom/uncommon domains
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const mxRes = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domainPart)}&type=MX`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (mxRes.ok) {
      const mxData = await mxRes.json();
      // DNS Status 3 = NXDOMAIN (domain does not exist at all)
      if (mxData.Status === 3) {
        return {
          valid: false,
          normalizedEmail: formatResult.normalizedEmail,
          error: `The email domain "@${domainPart}" does not exist. Please enter a valid email address.`,
        };
      }

      if (Array.isArray(mxData.Answer) && mxData.Answer.length > 0) {
        return formatResult;
      }

      // If no MX record found, check A record (some domains use A record fallback for mail)
      const aController = new AbortController();
      const aTimeout = setTimeout(() => aController.abort(), 2000);
      const aRes = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domainPart)}&type=A`,
        { signal: aController.signal }
      );
      clearTimeout(aTimeout);

      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.Status === 3 || !Array.isArray(aData.Answer) || aData.Answer.length === 0) {
          return {
            valid: false,
            normalizedEmail: formatResult.normalizedEmail,
            error: `Cannot verify mail server for "@${domainPart}". Please use a valid, active email address.`,
          };
        }
      }
    }
  } catch {
    // Graceful fallback if offline / DNS endpoint unreachable — rely on strict syntax validation
  }

  return formatResult;
}
