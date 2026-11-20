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

// Known valid local part & domain regexes
const EMAIL_LOCAL_PART_REGEX = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/i;
const EMAIL_DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const EMAIL_TLD_REGEX = /^[a-z]{2,24}$/i;

/**
 * Strict check verifying that an email address is a valid @gmail.com address.
 * Any account whose email fails this check must be deleted and cannot exist on the platform.
 */
export function isGmailAddress(rawEmail?: string | null): boolean {
  if (typeof rawEmail !== 'string') return false;
  const trimmed = rawEmail.trim().toLowerCase();
  if (!trimmed || /\s/.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domainPart] = parts;
  if (!localPart || localPart.length > 64 || localPart.includes('..')) return false;
  if (!EMAIL_LOCAL_PART_REGEX.test(localPart)) return false;
  return domainPart === 'gmail.com';
}

/**
 * Validates email format, characters, Gmail typos, and strictly enforces @gmail.com addresses only.
 */
export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  const trimmed = (rawEmail || '').trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, normalizedEmail: trimmed, error: 'Please enter your @gmail.com email address.' };
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
      error: 'Please enter a valid @gmail.com address (example: name@gmail.com).',
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
      error: 'Only @gmail.com email addresses are allowed (example: name@gmail.com).',
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
      error: 'Only @gmail.com email addresses are allowed.',
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
      error: 'Only @gmail.com email addresses are allowed.',
    };
  }

  // Suggest correction for common Gmail typos (e.g. gmal.com, gmial.com, gmail.con)
  const suggestedDomain = DOMAIN_TYPO_SUGGESTIONS[domainPart];
  if (suggestedDomain === 'gmail.com') {
    const correctedEmail = `${localPart}@gmail.com`;
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
      error: 'Only real @gmail.com email addresses are allowed.',
    };
  }

  // Strictly enforce @gmail.com only
  if (domainPart !== 'gmail.com') {
    return {
      valid: false,
      normalizedEmail: trimmed,
      error: 'Only @gmail.com email addresses are allowed. Non-Gmail accounts are not permitted.',
    };
  }

  return {
    valid: true,
    normalizedEmail: trimmed,
  };
}

/**
 * Verifies that the email address is a valid @gmail.com address.
 */
export async function verifyEmailAddress(rawEmail: string): Promise<EmailValidationResult> {
  const formatResult = validateEmailFormat(rawEmail);
  if (!formatResult.valid) {
    return formatResult;
  }

  if (!isGmailAddress(formatResult.normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail: formatResult.normalizedEmail,
      error: 'Only @gmail.com email addresses are allowed. Non-Gmail accounts are not permitted.',
    };
  }

  return formatResult;
}
