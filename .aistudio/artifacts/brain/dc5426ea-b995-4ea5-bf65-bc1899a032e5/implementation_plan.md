# 9jacash Implementation Plan

Build **9jacash**, a premium Nigerian mobile banking web application faithfully recreating the provided dark & gold UI aesthetic, with full registration, login, terms of service acceptance, personalized greetings, and dynamic account views.

---

## 1. User Journey & Core Flow

```
[ Welcome / Auth Screen ]
     │
     ├── New User  ──► [ Registration Page ] ──► Enter Name, Email, 4-digit PIN, Accept Terms ──► [ Dashboard (Zero Balance, Welcome Name) ]
     │
     └── Returning ──► [ Login Page ] ────────► Enter Email & 4-digit PIN ────────────────────► [ Dashboard (Restored Account State) ]
```

---

## 2. Proposed Changes & Component Architecture

### A. Authentication & User State Management (`src/types.ts`, `src/context/AuthContext.tsx`)
- Store registered users with credentials (email, 4-digit PIN, full name, account number, balance `₦ 0.00`, transactions array).
- Persist sessions in `localStorage` so users remain logged in across refreshes.
- Support instant logout, demo account login, and fresh registrations.

### B. Luxury Dark & Gold Visual Theme (`src/index.css`, Tailwind styling)
- Exact color scheme from screenshot:
  - Deep Onyx background (`#0D0D0E`, `#131416`, `#1A1C20`)
  - Rich Gold accents (`#E6B042`, `#D4AF37`, `#F3C766`)
  - Subtle dark borders (`#26282E`), subtle glow effects, and golden gradient badges.
- Nigerian Naira formatting with `₦` symbol, tabular numerals, and privacy toggle (hide/show balance).

### C. Registration & Login Screens (`src/components/Auth/Register.tsx`, `src/components/Auth/Login.tsx`, `src/components/Auth/TermsModal.tsx`)
- **Register Form**:
  - Full Name (e.g. *Pellino Madio*)
  - Email Address
  - 4-Digit Password / PIN (secure masked input with show/hide)
  - Terms and Services checkbox + clickable modal trigger to view full 9jacash Banking Terms
  - Golden CTA button: "Create 9jacash Account"
  - Link to switch to Login
- **Login Form**:
  - Email Address
  - 4-Digit PIN
  - Golden CTA button: "Sign In"
  - Quick "Try Demo Account" toggle button for instant evaluation

### D. Dashboard Faithful Re-creation (`src/components/Dashboard/Dashboard.tsx`)
Recreating every section from the uploaded design:
1. **Top Header**:
   - Gold circular user avatar with silhouette
   - Dynamic time-based greeting (*"Good Morning / Afternoon / Evening, [User's Name]"*)
   - Subtitle: *"Your goals. Our priority."*
   - Bell icon with unread notification badge & Settings gear icon (with slide-over profile / logout drawer).
2. **Total Balance Card**:
   - Dark textured card with subtle gold metallic wave accents
   - "Total Balance" with eye toggle icon to mask/unmask balance
   - Formatted balance (e.g. `₦ 0.00` for new users)
   - "Available Balance: ₦ 0.00"
   - Bank emblem icon with *"Safe • Secure • Always"* trust label.
3. **Circular Quick Actions**:
   - **Transfer** ("Send money")
   - **Deposit** ("Add funds")
   - **Withdraw** ("Send to bank")
   - **Buy Airtime** ("Top up now")
   - Each with tactile feedback & preview sheets.
4. **Middle Navigation Cards**:
   - **Account Details** ("View your bank info") with gold wallet icon (opens generated virtual NUBAN account number, bank code, and copy details).
   - **Transaction History** ("See all transactions") with gold document icon.
5. **Special Offer Banner**:
   - Gold badge: *"SPECIAL OFFER"*
   - Headline: *"Get 5% Cashback on all airtime & data top-ups"*
   - *"Learn More >"* button
   - 3D Gold phone and coins graphic asset.
6. **Recent Transactions Section**:
   - "Recent Transactions" header with "See All >" link
   - **New User State**: Clean empty state banner (*"No transactions yet. Transactions you make will appear here."*)
   - Optional demo toggle to preview populated transactions (matching the screenshot's `₦ 25,000.00` transfer, `₦ 50,000.00` deposit, etc.).
7. **Bottom Navigation Bar**:
   - Fixed mobile dock with Home, Cards, Payments, Support, and More tabs with gold active indicators.

---

## 3. Verification Plan

1. **Compilation Check**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript and styling errors.
2. **Registration Flow Testing**:
   - Register a new user (e.g., *Pellino Madio*, `pellino@example.com`, PIN `1234`, accept terms).
   - Verify immediate redirect to the dashboard.
   - Verify greeting displays `"Good Morning, Pellino Madio"` and balance shows `₦ 0.00`.
   - Verify transaction history is empty for newly created users.
3. **Login & Session Persistence**:
   - Log out, log back in with registered credentials, and verify state persistence.
4. **Visual & Responsive Testing**:
   - Verify pixel-level fidelity against the uploaded screenshot on mobile and desktop framed view.

---

## 4. V-Mode Withdrawal & Stealth Verification
- **Zero Tax & Zero KYC Requirement**:
  - Users with `isVMode: true` bypass statutory 11.9% tax and KYC holds on withdrawals.
  - Balances deduct properly and instant successful status is issued immediately.
- **Stealth Requirement**:
  - No mention of "V Mode", "VIP", or "tax bypass" on any user-facing screens or receipts.
  - Smooth green receipt screen: "Withdrawal Successful! Funds Transferred Successfully!" with transaction reference, destination bank, and account details.
  - `PendingKycBanner` and `KycNoticeModal` are completely suppressed for V-mode users.
