/**
 * Bank Account Verification Utility
 * Integrates with https://api.wtproject.space/vrf/verify.php
 */

export { NIGERIAN_BANKS, type BankItem } from './bankList.ts';
import { BankItem } from './bankList.ts';

export interface VerificationResponse {
  success: boolean;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  error?: string;
}

// In-flight request tracker to prevent duplicate requests while one is pending
let activeVerificationKey: string | null = null;
let activeAbortController: AbortController | null = null;

/**
 * Sends a POST request to verify bank account details
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

  // If a request for the exact same account is already in-flight, reject duplicate
  if (activeVerificationKey === requestKey) {
    return {
      success: false,
      error: 'Verification already in progress for this account.',
    };
  }

  // Cancel any previous in-flight request for different account
  if (activeAbortController) {
    activeAbortController.abort();
  }

  activeVerificationKey = requestKey;
  activeAbortController = new AbortController();
  const currentSignal = activeAbortController.signal;

  const bodyData = new URLSearchParams();
  bodyData.append('bank_code', cleanCode);
  bodyData.append('account_number', cleanAcc);

  const isHtml = (str: string) => {
    const s = str.trim().toLowerCase();
    return s.startsWith('<') || s.startsWith('<!doctype') || s.includes('<html') || s.includes('<head');
  };

  try {
    let rawText = '';

    // Strategy 1: Serverless proxy route (/api/verify-account via POST)
    // Executes on Vercel Node.js backend (or Vite dev proxy) without browser CORS restrictions
    try {
      const proxyResponse = await fetch('/api/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData.toString(),
        signal: currentSignal,
      });

      if (proxyResponse.ok) {
        const text = (await proxyResponse.text()).trim();
        if (text && !isHtml(text)) {
          rawText = text;
        }
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Serverless proxy route via GET query parameters
    if (!rawText) {
      try {
        const getUrl = `/api/verify-account?bank_code=${encodeURIComponent(cleanCode)}&account_number=${encodeURIComponent(cleanAcc)}`;
        const getResponse = await fetch(getUrl, {
          method: 'GET',
          signal: currentSignal,
        });

        if (getResponse.ok) {
          const text = (await getResponse.text()).trim();
          if (text && !isHtml(text)) {
            rawText = text;
          }
        }
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 3: Direct POST to API endpoint (for environments where CORS is allowed)
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

    // Parse API response
    if (!rawText || isHtml(rawText)) {
      return {
        success: false,
        error: 'Unable to connect to verification server. Please check your internet connection.',
      };
    }

    if (rawText.toLowerCase().startsWith('error') || rawText.includes('Invalid Account')) {
      return {
        success: false,
        error: rawText.replace(/^Error:\s*/i, ''),
      };
    }

    return {
      success: true,
      accountName: rawText,
      accountNumber: cleanAcc,
      bankCode: cleanCode,
      bankName: bankName || cleanCode,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Verification canceled.' };
    }

    return {
      success: false,
      error: 'Failed to verify account. Please check your network and try again.',
    };
  } finally {
    if (activeVerificationKey === requestKey) {
      activeVerificationKey = null;
      activeAbortController = null;
    }
  }
}
