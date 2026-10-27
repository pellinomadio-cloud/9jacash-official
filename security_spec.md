# Security Specification & Invariants for 9jacash

## 1. Core Data Invariants
1. **User Identity & Isolation**: User documents in `/users/{userId}` can be read by the owner or an admin.
2. **Transaction Integrity**: Transactions in `/transactions/{transactionId}` record immutable ledger actions. Users can read their own transactions; admins can read all transactions.
3. **Referral Integrity**: Referral records in `/referrals/{referralId}` record affiliate bonuses. Referrers can read records matching their `referrerId` or `referrerCode`.
4. **Deposit Review**: Deposit requests in `/deposit_requests/{depositId}` are created by users and reviewed/approved by admins.
5. **App Settings**: Global company banking configuration in `/app_settings/{settingId}` is publicly readable for making bank transfers and writable only by admins.

## 2. Hardened Access Control
- Default deny all catch-all rule on `{document=**}`.
- String boundaries, length restrictions, and ID validation checks (`isValidId`).
- Admin access verified via admin status or admin whitelist matching.
