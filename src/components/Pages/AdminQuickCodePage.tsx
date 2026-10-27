import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AdminQuickCode } from '../../types/index.ts';
import {
  ArrowLeft,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Send,
  Hash,
} from 'lucide-react';

interface AdminQuickCodePageProps {
  onBack: () => void;
}

export const AdminQuickCodePage: React.FC<AdminQuickCodePageProps> = ({ onBack }) => {
  const { adminQuickCodes, createAdminQuickCode, deleteAdminQuickCode } = useAuth();

  // Generator State
  const [customCode, setCustomCode] = useState('');
  const [codeNote, setCodeNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Ticker for real-time second-by-second countdown
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update tick every second so countdowns decrement live
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format remaining time
  const getRemainingTime = (expiresTimestamp: number) => {
    const diff = expiresTimestamp - currentTime;
    if (diff <= 0) return { expired: true, text: '00:00', minutes: 0, seconds: 0, totalSeconds: 0 };
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      expired: false,
      text: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      minutes,
      seconds,
      totalSeconds,
    };
  };

  // Generate a random suggestion
  const generateRandomCodeSuggestion = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `QC-9JA-${num}`;
  };

  // Prepopulate random suggestion on mount
  useEffect(() => {
    if (!customCode) {
      setCustomCode(generateRandomCodeSuggestion());
    }
  }, []);

  // Handlers
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    const targetCode = customCode.trim() || generateRandomCodeSuggestion();

    const res = await createAdminQuickCode(targetCode, codeNote.trim());
    setIsCreating(false);

    if (res.success) {
      setActionSuccessMsg(`Universal Quick Code ${res.code} created! Valid for exactly 10 minutes.`);
      // Rotate input with a fresh suggestion for next creation
      setCustomCode(generateRandomCodeSuggestion());
      setCodeNote('');
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } else {
      setActionErrorMsg(res.message || 'Failed to create Quick Code.');
      setTimeout(() => setActionErrorMsg(''), 4000);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCode = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete/revoke Quick Code "${code}"?`)) {
      await deleteAdminQuickCode(id);
    }
  };

  // Categorize codes
  const { activeCodes, usedCodes, expiredCodes, allSortedCodes } = useMemo(() => {
    const sorted = [...(adminQuickCodes || [])].sort((a, b) => b.createdTimestamp - a.createdTimestamp);
    const active: AdminQuickCode[] = [];
    const used: AdminQuickCode[] = [];
    const expired: AdminQuickCode[] = [];

    sorted.forEach((item) => {
      const isPastTenMins = currentTime > item.expiresTimestamp;
      if (item.status === 'used') {
        used.push(item);
      } else if (item.status === 'expired' || isPastTenMins) {
        expired.push(item);
      } else {
        active.push(item);
      }
    });

    return {
      activeCodes: active,
      usedCodes: used,
      expiredCodes: expired,
      allSortedCodes: sorted,
    };
  }, [adminQuickCodes, currentTime]);

  // Filtered list for display
  const displayCodes = useMemo(() => {
    let list = allSortedCodes;
    if (filterStatus === 'active') {
      list = activeCodes;
    } else if (filterStatus === 'used') {
      list = usedCodes;
    } else if (filterStatus === 'expired') {
      list = expiredCodes;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((c) => {
      const codeMatch = (c.code || '').toLowerCase().includes(q);
      const noteMatch = (c.note || '').toLowerCase().includes(q);
      const userMatch = (c.usedByUserName || '').toLowerCase().includes(q);
      const emailMatch = (c.usedByUserEmail || '').toLowerCase().includes(q);
      return codeMatch || noteMatch || userMatch || emailMatch;
    });
  }, [allSortedCodes, activeCodes, usedCodes, expiredCodes, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen pb-20 space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              10-Minute Universal Quick Codes <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-[11px] text-stone-400">
              One-Time Single-Use Withdrawal Authorization • Auto-Expires in 10 Minutes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTime(Date.now())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          title="Refresh timers"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#181922] to-[#14151b] border border-amber-500/30 shadow-lg flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">How Universal Quick Codes Work</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Single-Use Policy
            </span>
          </div>
          <p className="text-stone-300 text-[11px] leading-relaxed">
            Admin can generate a quick code that can be used <strong>once by any user</strong> to authorize withdrawal.
            Once it has been used by a user, it immediately <strong>expires</strong> so no other user can use it.
            If <strong>10 minutes</strong> pass after creation and no one uses it, it will automatically expire.
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#14151b] border border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Total Created</span>
          <span className="text-lg font-extrabold text-white">{allSortedCodes.length}</span>
          <span className="text-[10px] text-stone-500 block">All-time codes</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151b] border border-emerald-500/30">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Active Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-lg font-extrabold text-emerald-400">{activeCodes.length}</span>
          <span className="text-[10px] text-emerald-500/80 block">Valid for withdrawal</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151b] border border-indigo-500/30">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">Used Once</span>
          <span className="text-lg font-extrabold text-indigo-400">{usedCodes.length}</span>
          <span className="text-[10px] text-indigo-400/80 block">Redeemed by users</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151b] border border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Expired</span>
          <span className="text-lg font-extrabold text-stone-400">{expiredCodes.length}</span>
          <span className="text-[10px] text-stone-500 block">Past 10 minutes</span>
        </div>
      </div>

      {/* Code Generator Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#14151b] border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create Universal Quick Code</h2>
              <p className="text-[11px] text-stone-400">Generates a 1-use code with strict 10-minute validity</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            ⏱ 10 Mins Window
          </span>
        </div>

        <form onSubmit={handleCreateCode} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between mb-1.5">
                <span>Quick Code (Custom or Random)</span>
                <button
                  type="button"
                  onClick={() => setCustomCode(generateRandomCodeSuggestion())}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QC-9JA-84920"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#1b1c24] border border-stone-700 rounded-xl text-white font-mono font-bold tracking-wider text-sm focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Admin Note / Tag (Optional)
              </label>
              <input
                type="text"
                value={codeNote}
                onChange={(e) => setCodeNote(e.target.value)}
                placeholder="e.g. For VIP user, Telegram giveaway, etc."
                className="w-full px-3 py-2.5 bg-[#1b1c24] border border-stone-700 rounded-xl text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {actionSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {actionErrorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>{isCreating ? 'Generating Quick Code...' : '⚡ Create 10-Minute Universal Quick Code'}</span>
          </button>
        </form>
      </div>

      {/* Code List Management */}
      <div className="space-y-3">
        {/* Filter & Search Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#14151b] border border-stone-800 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-stone-700 text-white shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({allSortedCodes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-stone-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Active ({activeCodes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('used')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'used'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
                  : 'text-stone-400 hover:text-indigo-400'
              }`}
            >
              Used ({usedCodes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('expired')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'expired'
                  ? 'bg-stone-800 text-stone-300 border border-stone-700 shadow'
                  : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              Expired ({expiredCodes.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, user, note..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#14151b] border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Display Codes */}
        {displayCodes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#14151b] border border-stone-800 text-center space-y-2">
            <Clock className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs font-bold text-stone-300">No Quick Codes found</p>
            <p className="text-[11px] text-stone-500">
              {filterStatus !== 'all'
                ? `No codes currently match the "${filterStatus}" filter.`
                : 'Click "Create Universal Quick Code" above to generate a 10-minute code.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayCodes.map((item) => {
              const remaining = getRemainingTime(item.expiresTimestamp);
              const isPastTenMins = currentTime > item.expiresTimestamp;
              const isUsed = item.status === 'used';
              const isExpired = !isUsed && (item.status === 'expired' || isPastTenMins);
              const isActive = !isUsed && !isExpired;

              // Calculate percentage of 10 minutes elapsed (10 mins = 600,000 ms)
              const totalDurationMs = 10 * 60 * 1000;
              const elapsedMs = Math.max(0, currentTime - item.createdTimestamp);
              const percentRemaining = Math.max(0, Math.min(100, Math.round(((totalDurationMs - elapsedMs) / totalDurationMs) * 100)));

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl bg-[#14151b] border transition-all ${
                    isActive
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : isUsed
                      ? 'border-indigo-500/30'
                      : 'border-stone-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Code & Badges */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* The Code */}
                        <span className="font-mono text-base sm:text-lg font-extrabold text-white tracking-widest bg-[#1b1c24] px-2.5 py-1 rounded-lg border border-stone-700">
                          {item.code}
                        </span>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code, item.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Status Badge */}
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>ACTIVE • {remaining.text} left</span>
                          </span>
                        )}

                        {isUsed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                            <span>USED &amp; EXPIRED</span>
                          </span>
                        )}

                        {isExpired && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-400 text-[11px] font-semibold">
                            <XCircle className="w-3 h-3 text-stone-500" />
                            <span>EXPIRED (Past 10m)</span>
                          </span>
                        )}
                      </div>

                      {/* Timer Bar for Active Codes */}
                      {isActive && (
                        <div className="space-y-1 pt-1 max-w-md">
                          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-1000"
                              style={{ width: `${percentRemaining}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span>Auto-expires after 10 minutes if unused</span>
                            <span className="font-mono font-bold text-amber-400">{remaining.text} remaining</span>
                          </div>
                        </div>
                      )}

                      {/* Recipient Details if Used */}
                      {isUsed && (
                        <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200 space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Redeemed by: {item.usedByUserName || 'Registered User'}</span>
                          </div>
                          <div className="text-[11px] text-indigo-300/80">
                            Email: {item.usedByUserEmail || 'N/A'} • Used at:{' '}
                            {item.usedAt ? new Date(item.usedAt).toLocaleTimeString() : 'Recently'}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            This code has completed its single-use and cannot be used again by anyone.
                          </div>
                        </div>
                      )}

                      {/* Note / Created Timestamps */}
                      <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-wrap">
                        <span>Created: {new Date(item.createdTimestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>
                          Expiry Deadline: {new Date(item.expiresTimestamp).toLocaleTimeString()}
                        </span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300/90 font-medium">Note: {item.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete / Revoke Action */}
                    <div className="flex sm:flex-col items-center justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                      <button
                        type="button"
                        onClick={() => handleDeleteCode(item.id, item.code)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete this quick code record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
