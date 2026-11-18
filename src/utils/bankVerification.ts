/**
 * Bank Account Verification Utility
 * Routes through /api/verify-account (Node/Vite/Vercel proxy) with CORS fallback
 */

export { NIGERIAN_BANKS, type BankItem } from './bankList.ts';

export interface VerificationResponse {
  success: boolean;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  error?: string;
  canceled?: boolean;
}

// In-flight request tracker to deduplicate identical requests (e.g. React StrictMode)
// while aborting stale requests for different bank/account pairs
let activeVerificationKey: string | null = null;
let activeAbortController: AbortController | null = null;
let activePromise: Promise<VerificationResponse> | null = null;

/**
 * Sends a verification request for a 10-digit Nigerian NUBAN bank account
 * @param bankCode The 3-digit or fintech bank code
 * @param accountNumber 10-digit NUBAN account number
 */
export async function verifyBankAccount(
  bankCode: string,
  accountNumber: string,
  bankName?: string
): Promise<VerificationResponse> {
  const cleanCode = bankCode.trim();
  const cleanAcc = accountNumber.trim().replace(/\D/g, '');

  if (!cleanCode) {
    return { success: false, error: 'Please select a destination bank.' };
  }

  if (cleanAcc.length !== 10) {
    return { success: false, error: 'Account number must be exactly 10 digits.' };
  }

  const requestKey = `${cleanCode}_${cleanAcc}`;

  // Reuse the same in-flight promise if the exact same account is already being verified
  if (activeVerificationKey === requestKey && activePromise) {
    return activePromise;
  }

  // Cancel any previous in-flight request for a different account/bank
  if (activeAbortController) {
    activeAbortController.abort();
  }

  const controller = new AbortController();
  activeVerificationKey = requestKey;
  activeAbortController = controller;
  const currentSignal = controller.signal;

  const isHtml = (str: string) => {
    const s = str.trim().toLowerCase();
    return s.startsWith('<') || s.startsWith('<!doctype') || s.includes('<html') || s.includes('<head');
  };

  const extractPayload = (raw: string): { text?: string; error?: string } => {
    const trimmed = raw.trim();
    if (!trimmed || isHtml(trimmed)) return {};

    // Handle JSON responses cleanly if any gateway returns JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          status?: boolean | string;
          success?: boolean;
          message?: string;
          error?: string;
          accountName?: string;
          account_name?: string;
          data?: { account_name?: string; accountName?: string };
        };
        const resolved =
          parsed?.data?.account_name ||
          parsed?.data?.accountName ||
          parsed?.account_name ||
          parsed?.accountName;
        if (resolved && typeof resolved === 'string' && resolved.trim()) {
          return { text: resolved.trim() };
        }
        const errMsg = parsed?.error || parsed?.message;
        if (errMsg && typeof errMsg === 'string') {
          return { error: errMsg.trim() };
        }
      } catch {
        // Not valid JSON, treat as plain text
      }
    }

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('error') ||
      lower.includes('invalid account') ||
      lower.includes('invalid request') ||
      lower.includes('missing bank code')
    ) {
      return { error: trimmed.replace(/^Error:\s*/i, '') };
    }

    return { text: trimmed };
  };

  const run = async (): Promise<VerificationResponse> => {
    const bodyData = new URLSearchParams();
    bodyData.append('bank_code', cleanCode);
    bodyData.append('account_number', cleanAcc);

    try {
      let rawText = '';

      // Strategy 1: Local/Serverless proxy route (/api/verify-account via POST)
      try {
        const proxyResponse = await fetch('/api/verify-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyData.toString(),
          signal: currentSignal,
        });

        const text = (await proxyResponse.text()).trim();
        if (text && !isHtml(text) && (proxyResponse.ok || text.toLowerCase().startsWith('error'))) {
          rawText = text;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
      }

      // Strategy 2: Proxy route via GET query parameters
      if (!rawText) {
        try {
          const getUrl = `/api/verify-account?bank_code=${encodeURIComponent(cleanCode)}&account_number=${encodeURIComponent(cleanAcc)}`;
          const getResponse = await fetch(getUrl, {
            method: 'GET',
            signal: currentSignal,
          });

          const text = (await getResponse.text()).trim();
          if (text && !isHtml(text) && (getResponse.ok || text.toLowerCase().startsWith('error'))) {
            rawText = text;
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            throw err;
          }
        }
      }

      // Strategy 3: Direct POST fallback (works only if upstream allows CORS)
      if (!rawText) {
        try {
          const response = await fetch('https://api.wtproject.space/vrf/verify.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyData.toString(),
            signal: currentSignal,
          });

          if (response.ok) {
            const text = (await response.text()).trim();
            if (text && !isHtml(text)) {
              rawText = text;
            }
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            throw err;
          }
        }
      }

      if (!rawText || isHtml(rawText)) {
        return {
          success: false,
          error: 'Unable to reach live bank verification server. Please enter your account name manually below.',
        };
      }

      const parsed = extractPayload(rawText);
      if (parsed.error) {
        return {
          success: false,
          error: parsed.error,
        };
      }

      if (!parsed.text) {
        return {
          success: false,
          error: 'Could not verify this account automatically. Please enter your account name manually below.',
        };
      }

      return {
        success: true,
        accountName: parsed.text,
        accountNumber: cleanAcc,
        bankCode: cleanCode,
        bankName: bankName || cleanCode,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, canceled: true, error: 'Verification canceled.' };
      }

      return {
        success: false,
        error: 'Failed to verify account. Please check your network or enter your account name manually.',
      };
    } finally {
      if (activeVerificationKey === requestKey && activeAbortController === controller) {
        activeVerificationKey = null;
        activeAbortController = null;
        activePromise = null;
      }
    }
  };

  activePromise = run();
  return activePromise;
}
