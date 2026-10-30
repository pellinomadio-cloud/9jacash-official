import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Building2,
  UserCheck,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  NIGERIAN_BANKS,
  BankItem,
  verifyBankAccount,
  VerificationResponse,
} from '../../utils/bankVerification.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface BankVerificationWidgetProps {
  initialBankCode?: string;
  initialAccountNumber?: string;
  onVerified?: (data: {
    bank: BankItem;
    accountNumber: string;
    accountName: string;
  }) => void;
  onClear?: () => void;
  showSaveButton?: boolean;
  className?: string;
}

export const BankVerificationWidget: React.FC<BankVerificationWidgetProps> = ({
  initialBankCode = '044',
  initialAccountNumber = '',
  onVerified,
  onClear,
  showSaveButton = false,
  className = '',
}) => {
  const { isLight } = useTheme();
  const [selectedBank, setSelectedBank] = useState<BankItem>(() => {
    const found = NIGERIAN_BANKS.find((b) => b.code === initialBankCode);
    return found || NIGERIAN_BANKS[0];
  });

  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualAccountName, setManualAccountName] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastVerifiedKey = useRef<string>('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter banks based on search query and optional aliases
  const query = searchQuery.trim().toLowerCase();
  const filteredBanks = NIGERIAN_BANKS.filter(
    (b) =>
      !query ||
      b.name.toLowerCase().includes(query) ||
      b.code.toLowerCase().includes(query) ||
      (b.aliases && b.aliases.some((a) => a.toLowerCase().includes(query)))
  );

  // Trigger verification
  const executeVerification = async (bank: BankItem, accNum: string) => {
    const cleanNum = accNum.replace(/\D/g, '');
    if (cleanNum.length !== 10 || !bank) {
      setVerifiedName(null);
      setErrorMessage(null);
      return;
    }

    const currentKey = `${bank.code}_${cleanNum}`;
    if (lastVerifiedKey.current === currentKey && verifiedName) {
      return; // Already verified this exact combination
    }

    setIsLoading(true);
    setErrorMessage(null);
    setVerifiedName(null);

    try {
      const res: VerificationResponse = await verifyBankAccount(bank.code, cleanNum, bank.name);

      if (res.success && res.accountName) {
        setVerifiedName(res.accountName);
        setErrorMessage(null);
        lastVerifiedKey.current = currentKey;
        if (onVerified) {
          onVerified({
            bank,
            accountNumber: cleanNum,
            accountName: res.accountName,
          });
        }
      } else {
        setVerifiedName(null);
        setErrorMessage(res.error || 'Invalid Account or verification failed.');
        lastVerifiedKey.current = '';
        if (onClear) onClear();
      }
    } catch (e) {
      setVerifiedName(null);
      setErrorMessage('Verification request failed. Please retry.');
      lastVerifiedKey.current = '';
      if (onClear) onClear();
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically verify once bank is selected and account number reaches 10 digits
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length === 10 && selectedBank) {
      executeVerification(selectedBank, cleanAcc);
    } else {
      setVerifiedName(null);
      setErrorMessage(null);
      lastVerifiedKey.current = '';
      if (onClear) onClear();
    }
  }, [selectedBank, accountNumber]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(digits);
    setManualAccountName('');
  };

  const handleSelectBank = (bank: BankItem) => {
    setSelectedBank(bank);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setManualAccountName('');
  };

  const handleCopyName = () => {
    if (!verifiedName) return;
    navigator.clipboard.writeText(verifiedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Searchable Bank Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Bank</span>
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
            Code: {selectedBank.code}
          </span>
        </label>

        {/* Selected Bank Trigger */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full p-3.5 rounded-xl text-left flex items-center justify-between text-xs focus:outline-none transition-colors cursor-pointer border ${
            isLight
              ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm'
              : 'bg-[#1a1c24] border-stone-800 hover:border-stone-700 text-white focus:border-amber-500'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 ${
              isLight ? 'bg-amber-100/60 border-amber-300 text-amber-700' : 'bg-stone-800 border-stone-700/60 text-amber-400'
            }`}>
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold truncate">{selectedBank.name}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? 'rotate-180 text-amber-500' : (isLight ? 'text-slate-400' : 'text-stone-400')
            }`}
          />
        </button>

        {/* Dropdown Menu with Search */}
        {isDropdownOpen && (
          <div className={`absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 border ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/20' : 'bg-[#14161f] border-stone-700/80 text-white'
          }`}>
            {/* Search Input Box */}
            <div className={`p-2 border-b ${isLight ? 'border-slate-100 bg-slate-50' : 'border-stone-800 bg-[#12131a]'}`}>
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-stone-500'}`} />
                <input
                  type="text"
                  placeholder="Search bank name or bank code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs placeholder-stone-500 focus:outline-none border ${
                    isLight ? 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500' : 'bg-[#1c1e26] border-stone-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Banks List */}
            <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
              {filteredBanks.length === 0 ? (
                <div className={`p-4 text-center text-xs ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                  No bank found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <button
                    key={`${bank.code}_${bank.name}`}
                    type="button"
                    onClick={() => handleSelectBank(bank)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isLight
                        ? (selectedBank.code === bank.code
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-100')
                        : (selectedBank.code === bank.code
                            ? 'bg-amber-500/10 text-amber-300 font-bold'
                            : 'text-stone-300 hover:bg-stone-800/60')
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{bank.name}</span>
                      {bank.popular && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                          isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                        }`}>
                          Popular
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                      isLight ? 'bg-slate-200 text-slate-600' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {bank.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. 10-Digit Account Number Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            Account Number (10 Digits)
          </label>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
            {accountNumber.length}/10 digits
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="0123456789"
            value={accountNumber}
            onChange={handleAccountChange}
            className={`w-full p-3.5 border rounded-xl text-base tracking-widest font-mono font-semibold focus:outline-none transition-colors ${
              isLight
                ? (verifiedName
                    ? 'bg-slate-50 border-emerald-500 text-slate-900 focus:border-emerald-600'
                    : errorMessage
                    ? 'bg-slate-50 border-red-500 text-slate-900 focus:border-red-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500')
                : (verifiedName
                    ? 'bg-[#1a1c24] border-emerald-500/80 text-white focus:border-emerald-500'
                    : errorMessage
                    ? 'bg-[#1a1c24] border-red-500/80 text-white focus:border-red-500'
                    : 'bg-[#1a1c24] border-stone-800 text-white placeholder-stone-600 focus:border-amber-500')
            }`}
          />

          {/* Verification Status Icon on Right */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isLoading && (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            )}
            {!isLoading && verifiedName && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in-75 duration-150" />
            )}
            {!isLoading && errorMessage && (
              <AlertCircle className="w-5 h-5 text-red-500 animate-in zoom-in-75 duration-150" />
            )}
          </div>
        </div>
      </div>

      {/* 3. Verification State Output */}
      {/* Loading state indicator */}
      {isLoading && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-pulse ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <Loader2 className="w-4 h-4 animate-spin text-amber-500 flex-shrink-0" />
          <span>Verifying account details with {selectedBank.name}...</span>
        </div>
      )}

      {/* Success State: Account Holder Name Card */}
      {!isLoading && verifiedName && (
        <div className={`p-3.5 rounded-2xl border space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-sm ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-[#122019] to-[#15251d] border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/5'
        }`}>
          <div className="flex items-center justify-between text-[11px]">
            <span className={`flex items-center gap-1.5 font-bold uppercase tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <ShieldCheck className="w-4 h-4" />
              Verified Account Name
            </span>
            <button
              type="button"
              onClick={handleCopyName}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                isLight ? 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs' : 'text-stone-400 hover:text-white bg-stone-800/80'
              }`}
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
              isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {verifiedName}
              </h4>
              <p className={`text-[10px] font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400/80'}`}>
                {selectedBank.name} • {accountNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failure State: Error alert message with optional manual account name input */}
      {!isLoading && errorMessage && (
        <div className={`p-3.5 rounded-2xl border space-y-3 animate-in slide-in-from-top-2 duration-150 ${
          isLight ? 'bg-amber-50/70 border-amber-300 text-slate-800' : 'bg-red-500/10 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className={`font-bold block text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Verification Incomplete</span>
              <span className={`text-[11px] leading-tight block ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                {errorMessage}
              </span>
            </div>
            <button
              type="button"
              onClick={() => executeVerification(selectedBank, accountNumber)}
              className="p-1 text-stone-400 hover:text-amber-500 flex-shrink-0 cursor-pointer"
              title="Retry Verification"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`pt-2.5 border-t space-y-1.5 ${isLight ? 'border-amber-200/80' : 'border-stone-800'}`}>
            <label className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
              Enter Account Name Manually:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ADEWALE CHUKWU JOHN"
                value={manualAccountName}
                onChange={(e) => setManualAccountName(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs uppercase font-medium focus:outline-none border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 placeholder-slate-400'
                    : 'bg-[#181920] border-stone-700 text-white focus:border-amber-500 placeholder-stone-500'
                }`}
              />
              <button
                type="button"
                disabled={!manualAccountName.trim()}
                onClick={() => {
                  if (!manualAccountName.trim()) return;
                  const confirmedName = manualAccountName.trim().toUpperCase();
                  setVerifiedName(confirmedName);
                  setErrorMessage(null);
                  const cleanNum = accountNumber.replace(/\D/g, '');
                  lastVerifiedKey.current = `${selectedBank.code}_${cleanNum}`;
                  if (onVerified) {
                    onVerified({
                      bank: selectedBank,
                      accountNumber: cleanNum,
                      accountName: confirmedName,
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Use Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
