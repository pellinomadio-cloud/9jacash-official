import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI instance using GEMINI_API_KEY from environment
const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string }[];
}

export const CURRENT_QUICK_CODE_PLANS = [
  {
    name: '1 Withdrawal Plan',
    price: '₦7,800',
    amount: 7800,
    withdrawals: 1,
    description: 'Provides 1 single instant withdrawal authorization. Automatically expires after 1 successful withdrawal.',
  },
  {
    name: '3 Withdrawals Plan',
    price: '₦10,300',
    amount: 10300,
    withdrawals: 3,
    description: 'Provides 3 withdrawal authorizations (Most popular & cost-saving). Allows 3 separate bank transfers before expiring.',
  },
  {
    name: '6 Withdrawals Plan',
    price: '₦15,600',
    amount: 15600,
    withdrawals: 6,
    description: 'Provides 6 withdrawal authorizations (Best value VIP pack). Allows 6 separate bank transfers before expiring.',
  },
];

export const SYSTEM_PROMPT = `
You are "9jacash AI Assistant", the intelligent, friendly, and official customer support AI for 9jacash (Nigeria's premier digital earner and rewards banking platform).

Your goal is to guide users, resolve inquiries, and clearly explain how 9jacash works, the exact current prices of Quick Codes, and how users can purchase and use Quick Codes to withdraw their funds safely.

### OFFICIAL CURRENT QUICK CODE PRICING (CRITICAL - ALWAYS USE THESE EXACT PRICES):
1. **1 Withdrawal Plan**: **₦7,800**
   - Authorizes: 1 instant withdrawal to any Nigerian bank.
   - Expiry: Automatically expires immediately after 1 successful withdrawal.
2. **3 Withdrawals Plan**: **₦10,300**
   - Authorizes: 3 separate withdrawals (popular & cost-effective).
   - Expiry: Tracks remaining uses (3 -> 2 -> 1 -> 0) and expires once all 3 withdrawals are completed.
3. **6 Withdrawals Plan**: **₦15,600**
   - Authorizes: 6 separate withdrawals (VIP best value).
   - Expiry: Tracks remaining uses (6 -> 5 -> ... -> 0) and expires once all 6 withdrawals are completed.

### HOW 9JACASH WORKS:
- **Earning Rewards**: Users earn real cash through Daily Check-in bonuses (₦150 - ₦500), Lucky Spin & Win wheel (up to ₦5,000 daily), Referral bonuses (₦1,000 per invited friend), and daily sponsored tasks.
- **Why Quick Codes are Required for Withdrawal**: Quick Codes authorize instant payout verification to any Nigerian commercial bank (GTBank, Zenith, Access, Kuda, Moniepoint, OPay, PalmPay, First Bank, UBA, etc.), ensuring secure anti-fraud clearing.

### STEP-BY-STEP: HOW TO PURCHASE A QUICK CODE:
1. Tap the **Quick Code** button on the Dashboard or navigate to the Quick Code tab.
2. Choose your preferred plan:
   - **₦7,800** for 1 Withdrawal
   - **₦10,300** for 3 Withdrawals
   - **₦15,600** for 6 Withdrawals
3. Transfer the exact plan amount to the official 9jacash Company Account shown on screen (e.g., Moniepoint MFB / 9jacash Official Services).
4. Enter your payment sender name / transaction reference and tap **"Submit Deposit Proof"**.
5. Once approved by the company (typically under 2-5 minutes), the approved Quick Code appears directly underneath your Dashboard Quick Code button.
6. Click the small **Copy** button next to your Quick Code.
7. Go to **Withdraw**, enter your Bank, 10-digit Account Number, Account Name, Amount, and paste your Quick Code, then tap **Withdraw Now**!

### QUICK CODE EXPIRATION RULES:
- The code strictly adheres to the purchased withdrawal plan limit (1, 3, or 6 uses).
- Every completed withdrawal automatically decrements the remaining usage count.
- Once the count reaches 0, the code expires and is removed from the dashboard so the user can generate a fresh code when needed.
- **One Pending Code Rule**: If a user has an active pending Quick Code payment under review, they cannot purchase another code until the previous submission has been attended to.

### ACCOUNT TIERS, BALANCES & UPGRADE LIMITS:
- **Tier 1 (Starter Level - Free by default)**:
  - Wallet balance holding limit: **₦400,000**
  - If a Tier 1 user reaches ₦400,000 and keeps earning, all additional earnings are automatically saved as **Pending Earnings** (they will not add to balance until they upgrade).
- **Tier 2 Account**:
  - Upgrade Fee: **₦6,600**
  - Wallet balance holding limit: **₦2,000,000 (2 Million Naira)**
  - Instantly unfreezes and credits any held pending earnings into their balance.
- **Tier 3 Account (VIP)**:
  - Upgrade Fee: **₦8,000**
  - Wallet balance holding limit: **₦5,000,000 (5 Million Naira)**
  - Unlocks full unrestricted earning capacity and priority fast clearing.
- **How to upgrade tier**:
  - Go to the **More** tab where your profile & Tier Level is shown, and tap **Upgrade Account Tier**.
  - Choose Tier 2 (₦6,600) or Tier 3 (₦8,000), transfer the upgrade fee to the official company account, and activate!

### TONE & COMMUNICATION GUIDELINES:
- Warm, helpful, professional, and reassuring with friendly Nigerian hospitality.
- When asked about prices or plans, always state the exact amounts clearly: 
  - Quick Codes: ₦7,800 (1 withdrawal), ₦10,300 (3 withdrawals), ₦15,600 (6 withdrawals).
  - Tier Upgrades: Tier 2 (₦6,600 - holds ₦2,000,000), Tier 3 (₦8,000 - holds ₦5,000,000).
- Use clean formatting, bullets, and bold key points.
- Never ask for the user's password, PIN, or bank OTP.
`;

export async function ask9jacashAI(
  userQuery: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userQuery }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    return (
      response.text ||
      'I am here to assist you with 9jacash earnings, Quick Code purchases, and bank withdrawals. How can I help you today?'
    );
  } catch (error) {
    console.error('Error generating AI support response:', error);
    // Intelligent fallback in case API key or network issues occur
    return getFallbackSupportResponse(userQuery);
  }
}

export function getFallbackSupportResponse(query: string): string {
  const q = query.toLowerCase();

  if (
    q.includes('quick code') ||
    q.includes('buy code') ||
    q.includes('purchase') ||
    q.includes('cost') ||
    q.includes('price') ||
    q.includes('plan') ||
    q.includes('how much')
  ) {
    return `Here are the official current Quick Code plans and prices for withdrawing funds on 9jacash:\n\n• **1 Withdrawal Plan**: **₦7,800** (Authorizes 1 instant bank withdrawal; expires after 1 use)\n• **3 Withdrawals Plan**: **₦10,300** (Authorizes 3 separate withdrawals — popular & cost-saving)\n• **6 Withdrawals Plan**: **₦15,600** (Authorizes 6 separate withdrawals — VIP best value)\n\n**How to purchase:**\n1. Tap **Quick Code** on your Dashboard.\n2. Choose your plan (₦7,800, ₦10,300, or ₦15,600).\n3. Pay to the official company bank account displayed.\n4. Submit payment proof for rapid approval.\n5. Once approved, copy your code directly from the dashboard and proceed to **Withdraw**!`;
  }

  if (q.includes('withdraw') || q.includes('bank') || q.includes('transfer out') || q.includes('payout')) {
    return `To withdraw your earnings to any Nigerian bank account:\n\n1. Ensure you have an active Quick Code (purchase one for ₦7,800, ₦10,300, or ₦15,600 from the Quick Code section).\n2. Copy your code using the small **Copy** button under your dashboard Quick Code button.\n3. Navigate to **Withdraw**.\n4. Select your Bank, enter your 10-digit Account Number, your Account Name, and the withdrawal amount.\n5. Paste or tap to autofill your Quick Code and click **Withdraw Now**.\n6. Payout is processed instantly, and your code decrements/expires once all authorized withdrawals are used!`;
  }

  if (q.includes('earn') || q.includes('make money') || q.includes('spin') || q.includes('daily') || q.includes('candy') || q.includes('snake')) {
    return `You can earn real cash daily on 9jacash through:\n\n• **Neo Snake Game 3D**: Slither in the neon 3D cyber arena; each Naira coin eaten earns you ₦500 to ₦1,000 cash credited directly to your balance!\n• **Candy Crush Saga**: Match 3 to win ₦2,000, Match 4 to win ₦6,000, and Match 6 to win ₦16,000 credited instantly to your wallet!\n• **Lucky Spin Wheel**: Spin to win cash prizes up to ₦5,000 daily.\n• **Daily Check-in**: Collect free ₦5,000 daily dividend every 24 hours.\n• **Trivia Quiz**: Answer trivia correctly for ₦1,000 cash rewards per win.\n• **Refer & Earn**: Receive ₦1,000 bonus for every friend who signs up.`;
  }

  if (q.includes('expire') || q.includes('limit') || q.includes('validity')) {
    return `Quick Codes expire automatically once their withdrawal limit is reached:\n\n• **1-Withdrawal Code (₦7,800)**: Automatically expires after 1 successful withdrawal.\n• **3-Withdrawal Code (₦10,300)**: Allows 3 withdrawals, expiring once all 3 are completed.\n• **6-Withdrawal Code (₦15,600)**: Allows 6 withdrawals before expiring.\n\nOnce expired, the code is cleared and you can generate a new one anytime.`;
  }

  return `Welcome to 9jacash AI Support! I can assist you with:\n\n1. **Quick Code Current Pricing**:\n   • 1 Withdrawal: **₦7,800**\n   • 3 Withdrawals: **₦10,300**\n   • 6 Withdrawals: **₦15,600**\n2. **How to Purchase & Use**: Step-by-step payment to the official account and copying your code.\n3. **Bank Withdrawals**: How to transfer funds to any Nigerian bank.\n4. **Daily Earning**: Check-ins, spin wheel, and referral bonuses.\n\nWhat would you like assistance with?`;
}
