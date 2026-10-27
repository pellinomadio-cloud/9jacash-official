/**
 * Formats any Telegram link or username into a direct, valid https://t.me/... link
 * Accepts:
 * - '@agent_username' -> 'https://t.me/agent_username'
 * - 'agent_username' -> 'https://t.me/agent_username'
 * - 't.me/agent_username' -> 'https://t.me/agent_username'
 * - 'https://t.me/agent_username' -> 'https://t.me/agent_username'
 * - 'http://t.me/agent_username' -> 'https://t.me/agent_username'
 * - '+inviteCode' -> 'https://t.me/+inviteCode'
 * - 'https://t.me/+inviteCode' -> 'https://t.me/+inviteCode'
 */
export function formatTelegramUrl(input?: string): string {
  if (!input || !input.trim()) return 'https://t.me/jacash1';
  let clean = input.trim();

  // If starts with @
  if (clean.startsWith('@')) {
    return `https://t.me/${clean.slice(1).trim()}`;
  }

  // If already full http(s)
  if (clean.startsWith('https://') || clean.startsWith('http://')) {
    return clean;
  }

  // If starts with t.me/ or telegram.me/
  if (clean.startsWith('t.me/')) {
    return `https://${clean}`;
  }
  if (clean.startsWith('telegram.me/')) {
    return `https://${clean}`;
  }

  // If invite link without protocol: e.g. +xyz or joinchat/...
  if (clean.startsWith('+') || clean.startsWith('joinchat/')) {
    return `https://t.me/${clean}`;
  }

  // If it's just a username like "john_support"
  return `https://t.me/${clean}`;
}

/**
 * Formats a Telegram handle with leading '@' or clean invite reference
 */
export function formatTelegramHandle(input?: string): string {
  if (!input || !input.trim()) return '@jacash1';
  let clean = input.trim();

  // If already starts with @, return as is
  if (clean.startsWith('@')) {
    return clean;
  }

  // Strip protocol and domain
  clean = clean.replace(/^https?:\/\/(www\.)?t\.me\//i, '');
  clean = clean.replace(/^https?:\/\/(www\.)?telegram\.me\//i, '');
  clean = clean.replace(/^(www\.)?t\.me\//i, '');
  clean = clean.replace(/^(www\.)?telegram\.me\//i, '');

  // Remove any query params
  clean = clean.split('?')[0].trim();

  // If it's an invite link like +Abc or joinchat/...
  if (clean.startsWith('+')) {
    return clean;
  }
  if (clean.startsWith('joinchat/')) {
    return clean;
  }

  clean = clean.split('/')[0].trim();

  if (!clean) return '@jacash1';
  if (!clean.startsWith('@') && !clean.startsWith('+')) {
    return `@${clean}`;
  }
  return clean;
}
