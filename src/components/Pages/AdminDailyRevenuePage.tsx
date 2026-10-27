import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Zap,
  ShieldCheck,
  Building2,
  Sparkles,
  Search,
  RotateCw,
  Clock,
  Layers,
  ChevronRight,
  Filter,
  DollarSign,
  Download,
  Users,
} from 'lucide-react';

interface AdminDailyRevenuePageProps {
  onBack: () => void;
}

interface DailySummary {
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Thu, Oct 22, 2026"
  isToday: boolean;
  isYesterday: boolean;
  totalEarn: number;
  totalTransactions: number;
  codeCount: number;
  codeEarn: number;
  kycCount: number;
  kycEarn: number;
  taxCount: number;
  taxEarn: number;
  otherCount: number;
  otherEarn: number;
  payments: DepositRequest[];
}

// Convert any date/string/timestamp to local calendar YYYY-MM-DD
function getLocalDateKey(dateVal?: string | number | Date | null): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function formatDisplayDate(dateKey: string): string {
  try {
    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

function formatSafeTime(dateVal?: string | null): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export const AdminDailyRevenuePage: React.FC<AdminDailyRevenuePageProps> = ({ onBack }) => {
  const { depositRequests, formatNaira, refreshAllUsers } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'yesterday' | 'week' | 'all' | 'custom'>('today');
  const [customDateInput, setCustomDateInput] = useState<string>(getLocalDateKey(new Date()));
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'quickcode' | 'kyc' | 'tax_payment' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return getLocalDateKey(y);
  }, []);

  // Compute 7 days ago key
  const sevenDaysAgoKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateKey(d);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllUsers();
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMsg('Live daily revenue synchronized!');
      setTimeout(() => setRefreshMsg(''), 3000);
    }, 600);
  };

  // Group all approved deposit requests by local calendar day
  const dailyBreakdown = useMemo(() => {
    const map: Record<string, DailySummary> = {};

    (depositRequests || []).forEach((req) => {
      // Consider approved requests
      if (!req || req.status !== 'approved') return;

      const timeVal = req.approvedAt || req.reviewedAt || req.submittedAt;
      const dateKey = getLocalDateKey(timeVal);
      if (!dateKey) return;

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          displayDate: formatDisplayDate(dateKey),
          isToday: dateKey === todayKey,
          isYesterday: dateKey === yesterdayKey,
          totalEarn: 0,
          totalTransactions: 0,
          codeCount: 0,
          codeEarn: 0,
          kycCount: 0,
          kycEarn: 0,
          taxCount: 0,
          taxEarn: 0,
          otherCount: 0,
          otherEarn: 0,
          payments: [],
        };
      }

      const summary = map[dateKey];
      const amount = Number(req.amount) || 0;
      summary.totalEarn += amount;
      summary.totalTransactions += 1;
      summary.payments.push(req);

      const isTax = req.requestType === 'tax_payment';
      const isKyc = req.requestType === 'kyc';
      const isCode = req.requestType === 'quickcode' || (!isTax && !isKyc && !!req.planName);

      if (isCode) {
        summary.codeCount += 1;
        summary.codeEarn += amount;
      } else if (isKyc) {
        summary.kycCount += 1;
        summary.kycEarn += amount;
      } else if (isTax) {
        summary.taxCount += 1;
        summary.taxEarn += amount;
      } else {
        summary.otherCount += 1;
        summary.otherEarn += amount;
      }
    });

    // Ensure Today exists even if zero transactions yet today
    if (!map[todayKey]) {
      map[todayKey] = {
        dateKey: todayKey,
        displayDate: formatDisplayDate(todayKey),
        isToday: true,
        isYesterday: false,
        totalEarn: 0,
        totalTransactions: 0,
        codeCount: 0,
        codeEarn: 0,
        kycCount: 0,
        kycEarn: 0,
        taxCount: 0,
        taxEarn: 0,
        otherCount: 0,
        otherEarn: 0,
        payments: [],
      };
    }

    return Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [depositRequests, todayKey, yesterdayKey]);

  // Selected date key based on filter
  const activeDateKey = useMemo(() => {
    if (selectedFilter === 'today') return todayKey;
    if (selectedFilter === 'yesterday') return yesterdayKey;
    if (selectedFilter === 'custom') return customDateInput || todayKey;
    return null; // for 'week' or 'all'
  }, [selectedFilter, todayKey, yesterdayKey, customDateInput]);

  // Aggregate stats based on current view (single day or multiple days)
  const activeStats = useMemo(() => {
    if (selectedFilter === 'week') {
      const weekDays = dailyBreakdown.filter((d) => d.dateKey >= sevenDaysAgoKey && d.dateKey <= todayKey);
      return weekDays.reduce(
        (acc, day) => ({
          title: 'Past 7 Days Combined',
          subTitle: `From ${formatDisplayDate(sevenDaysAgoKey)} to Today`,
          totalEarn: acc.totalEarn + day.totalEarn,
          totalTransactions: acc.totalTransactions + day.totalTransactions,
          codeCount: acc.codeCount + day.codeCount,
          codeEarn: acc.codeEarn + day.codeEarn,
          kycCount: acc.kycCount + day.kycCount,
          kycEarn: acc.kycEarn + day.kycEarn,
          taxCount: acc.taxCount + day.taxCount,
          taxEarn: acc.taxEarn + day.taxEarn,
          otherCount: acc.otherCount + day.otherCount,
          otherEarn: acc.otherEarn + day.otherEarn,
          payments: [...acc.payments, ...day.payments],
        }),
        {
          title: 'Past 7 Days Combined',
          subTitle: '',
          totalEarn: 0,
          totalTransactions: 0,
          codeCount: 0,
          codeEarn: 0,
          kycCount: 0,
          kycEarn: 0,
          taxCount: 0,
          taxEarn: 0,
          otherCount: 0,
          otherEarn: 0,
          payments: [] as DepositRequest[],
        }
      );
    }

    if (selectedFilter === 'all') {
      return dailyBreakdown.reduce(
        (acc, day) => ({
          title: 'All-Time Total Earnings',
          subTitle: `Aggregated across all ${dailyBreakdown.length} active recorded days`,
          totalEarn: acc.totalEarn + day.totalEarn,
          totalTransactions: acc.totalTransactions + day.totalTransactions,
          codeCount: acc.codeCount + day.codeCount,
          codeEarn: acc.codeEarn + day.codeEarn,
          kycCount: acc.kycCount + day.kycCount,
          kycEarn: acc.kycEarn + day.kycEarn,
          taxCount: acc.taxCount + day.taxCount,
          taxEarn: acc.taxEarn + day.taxEarn,
          otherCount: acc.otherCount + day.otherCount,
          otherEarn: acc.otherEarn + day.otherEarn,
          payments: [...acc.payments, ...day.payments],
        }),
        {
          title: 'All-Time Total Earnings',
          subTitle: '',
          totalEarn: 0,
          totalTransactions: 0,
          codeCount: 0,
          codeEarn: 0,
          kycCount: 0,
          kycEarn: 0,
          taxCount: 0,
          taxEarn: 0,
          otherCount: 0,
          otherEarn: 0,
          payments: [] as DepositRequest[],
        }
      );
    }

    // Single day target
    const targetDay = dailyBreakdown.find((d) => d.dateKey === activeDateKey) || {
      dateKey: activeDateKey || todayKey,
      displayDate: formatDisplayDate(activeDateKey || todayKey),
      isToday: (activeDateKey || todayKey) === todayKey,
      isYesterday: (activeDateKey || todayKey) === yesterdayKey,
      totalEarn: 0,
      totalTransactions: 0,
      codeCount: 0,
      codeEarn: 0,
      kycCount: 0,
      kycEarn: 0,
      taxCount: 0,
      taxEarn: 0,
      otherCount: 0,
      otherEarn: 0,
      payments: [] as DepositRequest[],
    };

    return {
      title: targetDay.isToday
        ? "Today's Revenue (Refreshes Daily)"
        : targetDay.isYesterday
        ? "Yesterday's Revenue"
        : `${targetDay.displayDate} Revenue`,
      subTitle: `Calendar Date: ${targetDay.displayDate} (Auto-refreshed daily at 00:00)`,
      ...targetDay,
    };
  }, [selectedFilter, dailyBreakdown, activeDateKey, sevenDaysAgoKey, todayKey, yesterdayKey]);

  // Filter individual payments for the selected day/view
  const filteredPayments = useMemo(() => {
    let list = activeStats.payments || [];

    if (paymentTypeFilter !== 'all') {
      list = list.filter((r) => {
        const isTax = r.requestType === 'tax_payment';
        const isKyc = r.requestType === 'kyc';
        const isCode = r.requestType === 'quickcode' || (!isTax && !isKyc && !!r.planName);

        if (paymentTypeFilter === 'quickcode') return isCode;
        if (paymentTypeFilter === 'kyc') return isKyc;
        if (paymentTypeFilter === 'tax_payment') return isTax;
        if (paymentTypeFilter === 'other') return !isCode && !isKyc && !isTax;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.userName || '').toLowerCase().includes(q) ||
          (r.userEmail || '').toLowerCase().includes(q) ||
          (r.reference || '').toLowerCase().includes(q) ||
          (r.planName || '').toLowerCase().includes(q) ||
          (r.senderBank || '').toLowerCase().includes(q)
      );
    }

    // Sort newest approval first
    return [...list].sort((a, b) => {
      const tA = new Date(a.approvedAt || a.reviewedAt || a.submittedAt || 0).getTime();
      const tB = new Date(b.approvedAt || b.reviewedAt || b.submittedAt || 0).getTime();
      return tB - tA;
    });
  }, [activeStats.payments, paymentTypeFilter, searchQuery]);

  return (
    <div className="min-h-screen pb-16 space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
            title="Return to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Daily Revenue &amp; Income Tracker
            </h1>
            <p className="text-[11px] text-stone-400">
              Live automated accounting • Daily reset • Quick code, KYC, &amp; Tax earnings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            title="Synchronize live payment data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {refreshMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{refreshMsg}</span>
        </div>
      )}

      {/* Date Navigation & Range Selector */}
      <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-300 font-bold">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Select Day to View Income:</span>
          </div>

          <div className="text-[11px] text-stone-400 font-mono">
            Today: <strong className="text-white">{formatDisplayDate(todayKey)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'today'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-[#1a1c26] text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today (Refreshes Daily)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'yesterday'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-[#1a1c26] text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'week'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-[#1a1c26] text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            Last 7 Days
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-[#1a1c26] text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            All-Time Total
          </button>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] text-stone-400 font-semibold hidden sm:inline">Pick Date:</span>
            <input
              type="date"
              value={customDateInput}
              onChange={(e) => {
                setCustomDateInput(e.target.value);
                setSelectedFilter('custom');
              }}
              className="py-1 px-2.5 bg-[#1a1c26] border border-stone-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Income Highlight Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121c16] via-[#14151b] to-[#1a1813] border-2 border-emerald-500/40 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {activeStats.title}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {activeStats.totalTransactions} Total Payments
          </span>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
            {formatNaira(activeStats.totalEarn)}
          </div>
          <span className="text-xs font-semibold text-emerald-400">Total Money Earned</span>
        </div>

        <p className="text-[11px] text-stone-400 font-mono">
          {activeStats.subTitle}
        </p>
      </div>

      {/* 4 Breakdown Metrics Cards: Code Purchases, KYC Clearances, Tax Payments, Other Payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Quick Code Purchases */}
        <div className="p-4 rounded-2xl bg-[#14151b] border border-purple-500/30 hover:border-purple-500/60 transition-all space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Code Purchases
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              {activeStats.codeCount} Buyer(s)
            </span>
          </div>

          <div className="text-xl font-extrabold text-white font-mono">
            {formatNaira(activeStats.codeEarn)}
          </div>

          <div className="pt-1.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Successful Buyers:</span>
            <strong className="text-purple-300 font-mono font-bold">{activeStats.codeCount} Users</strong>
          </div>
        </div>

        {/* 2. KYC Account Verification */}
        <div className="p-4 rounded-2xl bg-[#14151b] border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> KYC Clearances
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {activeStats.kycCount} User(s)
            </span>
          </div>

          <div className="text-xl font-extrabold text-white font-mono">
            {formatNaira(activeStats.kycEarn)}
          </div>

          <div className="pt-1.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Completed KYC:</span>
            <strong className="text-emerald-300 font-mono font-bold">{activeStats.kycCount} Users</strong>
          </div>
        </div>

        {/* 3. 11.9% Statutory Tax Payments */}
        <div className="p-4 rounded-2xl bg-[#14151b] border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" /> Tax Payments (11.9%)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {activeStats.taxCount} User(s)
            </span>
          </div>

          <div className="text-xl font-extrabold text-white font-mono">
            {formatNaira(activeStats.taxEarn)}
          </div>

          <div className="pt-1.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Paid Tax Fee:</span>
            <strong className="text-amber-300 font-mono font-bold">{activeStats.taxCount} Users</strong>
          </div>
        </div>

        {/* 4. Other App Payments */}
        <div className="p-4 rounded-2xl bg-[#14151b] border border-blue-500/30 hover:border-blue-500/60 transition-all space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-blue-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Other Payments
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              {activeStats.otherCount} Payment(s)
            </span>
          </div>

          <div className="text-xl font-extrabold text-white font-mono">
            {formatNaira(activeStats.otherEarn)}
          </div>

          <div className="pt-1.5 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Upgrades &amp; Deposits:</span>
            <strong className="text-blue-300 font-mono font-bold">{activeStats.otherCount} Users</strong>
          </div>
        </div>
      </div>

      {/* Historical Day-by-Day Income Table */}
      <div className="p-4 rounded-2xl bg-[#14151b] border border-stone-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            Daily Income History Log
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">
            {dailyBreakdown.length} Recorded Day(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Total Earned</th>
                <th className="py-2.5 px-3">Codes Sold</th>
                <th className="py-2.5 px-3">KYC Cleared</th>
                <th className="py-2.5 px-3">Tax Cleared</th>
                <th className="py-2.5 px-3">Other</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {dailyBreakdown.slice(0, 15).map((day) => {
                const isSelected = activeDateKey === day.dateKey && (selectedFilter === 'today' || selectedFilter === 'yesterday' || selectedFilter === 'custom');
                return (
                  <tr
                    key={day.dateKey}
                    className={`hover:bg-stone-800/40 transition-colors ${
                      isSelected ? 'bg-amber-400/10 border-l-2 border-amber-400' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{day.displayDate}</span>
                        {day.isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-sans font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            TODAY
                          </span>
                        )}
                        {day.isYesterday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-sans font-bold bg-stone-700 text-stone-300">
                            YESTERDAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                      {formatNaira(day.totalEarn)}
                    </td>
                    <td className="py-3 px-3 text-purple-300">
                      {day.codeCount > 0 ? (
                        <span>{day.codeCount} ({formatNaira(day.codeEarn)})</span>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-emerald-300">
                      {day.kycCount > 0 ? (
                        <span>{day.kycCount} ({formatNaira(day.kycEarn)})</span>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-amber-300">
                      {day.taxCount > 0 ? (
                        <span>{day.taxCount} ({formatNaira(day.taxEarn)})</span>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-blue-300">
                      {day.otherCount > 0 ? (
                        <span>{day.otherCount} ({formatNaira(day.otherEarn)})</span>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDateInput(day.dateKey);
                          setSelectedFilter('custom');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-sans font-semibold cursor-pointer transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Payment Transaction Records for Selected Day */}
      <div className="p-4 rounded-2xl bg-[#14151b] border border-stone-800 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              Users Payment Transactions ({filteredPayments.length})
            </h3>
            <p className="text-[11px] text-stone-400">
              Breakdown of individual user payments approved on this date.
            </p>
          </div>

          {/* Payment Type Filter Pills */}
          <div className="flex gap-1 bg-[#1a1c26] p-1 rounded-xl border border-stone-800 text-[10px]">
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentTypeFilter === 'all'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({activeStats.payments.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('quickcode')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentTypeFilter === 'quickcode'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Codes ({activeStats.codeCount})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('kyc')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentTypeFilter === 'kyc'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              KYC ({activeStats.kycCount})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('tax_payment')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentTypeFilter === 'tax_payment'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Tax ({activeStats.taxCount})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('other')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentTypeFilter === 'other'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Other ({activeStats.otherCount})
            </button>
          </div>
        </div>

        {/* Search bar for payments */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Search by payer name, email, ref code, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1c26] border border-stone-800 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Payments List */}
        <div className="space-y-2">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center bg-[#181a24] rounded-2xl border border-stone-800 text-stone-400 text-xs space-y-1.5">
              <DollarSign className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="font-bold text-white">No Payment Records Found</p>
              <p className="text-stone-500">
                No approved payments matching this category were recorded for the selected date.
              </p>
            </div>
          ) : (
            filteredPayments.map((p) => {
              const isTax = p.requestType === 'tax_payment';
              const isKyc = p.requestType === 'kyc';
              const isCode = p.requestType === 'quickcode' || (!isTax && !isKyc && !!p.planName);

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#181a24] border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                        isCode
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : isKyc
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isTax
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {isCode ? (
                        <Zap className="w-4 h-4 text-purple-400" />
                      ) : isKyc ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : isTax ? (
                        <Building2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Layers className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">{p.userName || 'User'}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            isCode
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : isKyc
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isTax
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isCode
                            ? `Quick Code (${p.planName || 'Plan'})`
                            : isKyc
                            ? 'KYC Clearance'
                            : isTax
                            ? '11.9% Tax Clearance'
                            : (p.requestType || 'Payment')}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                        {p.userEmail || 'No email'} • Ref: <span className="text-amber-400">{p.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      +{formatNaira(p.amount || 0)}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {formatSafeTime(p.approvedAt || p.reviewedAt || p.submittedAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
