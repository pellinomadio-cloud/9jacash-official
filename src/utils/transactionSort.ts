import { Transaction } from '../types/index.ts';

/**
 * Extracts the most accurate numeric millisecond timestamp from a transaction.
 * Checks timestamp, createdAt, embedded numeric id timestamps, and date/time strings.
 */
export const getTransactionTimestamp = (tx: Transaction): number => {
  if (!tx) return 0;

  // 1. Explicit numeric timestamp
  if (typeof tx.timestamp === 'number' && !isNaN(tx.timestamp) && tx.timestamp > 0) {
    return tx.timestamp;
  }

  // 2. ISO timestamp in createdAt
  if (tx.createdAt) {
    const parsed = new Date(tx.createdAt).getTime();
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // 3. Embedded numeric millisecond timestamp inside ID (e.g. tx_1727670984920 or tx_wdr_1727670984920)
  if (tx.id) {
    const match = tx.id.match(/\d{10,14}/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > 1000000000) {
        return num;
      }
    }
  }

  // 4. Combined date and time strings (e.g., "Sep 30, 2026 10:25 AM")
  if (tx.date) {
    const combined = tx.time ? `${tx.date} ${tx.time}` : tx.date;
    const parsedDate = Date.parse(combined);
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }
  }

  return 0;
};

/**
 * Sorts transactions with the absolute newest transactions in first place.
 * Ensures withdrawals, earnings, deposits, etc. immediately appear at index 0.
 */
export const sortTransactionsNewestFirst = (txs: Transaction[]): Transaction[] => {
  if (!Array.isArray(txs)) return [];

  // Map each item with its original index for stable ordering
  const indexed = txs.map((tx, idx) => ({
    tx,
    idx,
    time: getTransactionTimestamp(tx),
  }));

  indexed.sort((a, b) => {
    // 1. Higher timestamp comes first (most recent)
    if (b.time !== a.time) {
      return b.time - a.time;
    }
    // 2. If timestamps match, preserve insertion order (lower original index stays first)
    return a.idx - b.idx;
  });

  return indexed.map((item) => item.tx);
};
