import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Users,
  Calendar,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Transaction, CustomerDue, CategoryType, QuickPreset } from '../types';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';
import { QuickEntryWidget } from './QuickEntryWidget';

interface DashboardOverviewProps {
  transactions: Transaction[];
  customerDues: CustomerDue[];
  onAddTransaction: (
    type: 'income' | 'expense',
    amount: number,
    category: CategoryType,
    description: string
  ) => void;
  onNavigateTab: (tab: string) => void;
  onOpenNewTxModal: () => void;
  useBengaliDigits: boolean;
  quickPresets?: QuickPreset[];
  customCategories?: string[];
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
}

const MONTH_NAMES = [
  { id: '01', name: 'জানুয়ারি' },
  { id: '02', name: 'ফেব্রুয়ারি' },
  { id: '03', name: 'মার্চ' },
  { id: '04', name: 'এপ্রিল' },
  { id: '05', name: 'মে' },
  { id: '06', name: 'জুন' },
  { id: '07', name: 'জুলাই' },
  { id: '08', name: 'আগস্ট' },
  { id: '09', name: 'সেপ্টেম্বর' },
  { id: '10', name: 'অক্টোবর' },
  { id: '11', name: 'নভেম্বর' },
  { id: '12', name: 'ডিসেম্বর' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  customerDues,
  onAddTransaction,
  onNavigateTab,
  useBengaliDigits,
  quickPresets,
  customCategories,
  customIncomeCategories,
  customExpenseCategories,
}) => {
  // Safe fallback arrays
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeDues = Array.isArray(customerDues) ? customerDues : [];

  // Filter States
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 🔒 বছরের হিসাব ডিফল্টভাবে হাইড (Hide) রাখার জন্য স্টেট
  const [showYearlySummary, setShowYearlySummary] = useState<boolean>(false);

  // Available Dynamic Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYearStr);
    safeTx.forEach((tx) => {
      if (tx?.date && tx.date.length >= 4) {
        yearsSet.add(tx.date.substring(0, 4));
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [safeTx, currentYearStr]);

  // Selected Year Calculation
  const yearlyData = useMemo(() => {
    let income = 0;
    let expense = 0;

    safeTx.forEach((tx) => {
      if (tx?.date && tx.date.startsWith(selectedYear)) {
        if (tx.type === 'income') income += Number(tx.amount || 0);
        else if (tx.type === 'expense') expense += Number(tx.amount || 0);
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [safeTx, selectedYear]);

  // Selected Month Calculation
  const monthlyData = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    const yearMonth = `${selectedYear}-${selectedMonth}`;

    safeTx.forEach((tx) => {
      if (tx?.date && tx.date.startsWith(yearMonth)) {
        if (tx.type === 'income') {
          income += Number(tx.amount || 0);
          incomeCount++;
        } else if (tx.type === 'expense') {
          expense += Number(tx.amount || 0);
        }
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      incomeCount,
    };
  }, [safeTx, selectedYear, selectedMonth]);

  // খরিদ্দারদের মোট বকেয়া
  const totalDuesOutstanding = safeDues.reduce(
    (acc, c) => acc + ((Number(c?.totalDue) || 0) - (Number(c?.totalPaid) || 0)),
    0
  );

  // Recent 5 transactions
  const recentTransactions = [...safeTx]
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  // Top Due Customers
  const topDueCustomers = [...safeDues]
    .filter((c) => c && (Number(c.totalDue) || 0) - (Number(c.totalPaid) || 0) > 0)
    .sort((a, b) => {
      const dueA = (Number(a.totalDue) || 0) - (Number(a.totalPaid) || 0);
      const dueB = (Number(b.totalDue) || 0) - (Number(b.totalPaid) || 0);
      return dueB - dueA;
    })
    .slice(0, 4);

  const selectedMonthObj = MONTH_NAMES.find((m) => m.id === selectedMonth);

  return (
    <div className="space-y-6">
      {/* 🔹 ১. মূল ৪টি স্ট্যাটাস কার্ড */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ১. নির্বাচিত মাসের আয় */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="ক্যাশ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-200 group-hover:text-white transition-colors">
              {selectedMonthObj?.name} মাসের বিক্রয় ও আয়
            </span>
            <div className="p-2 bg-emerald-700/60 group-hover:bg-emerald-600/80 rounded-xl text-emerald-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(monthlyData.income, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-1 flex items-center justify-between">
              <span>{toBengaliNumber(monthlyData.incomeCount, useBengaliDigits)} টি আয়ের এন্ট্রি</span>
            </p>
          </div>
        </div>

        {/* ২. নির্বাচিত মাসের খরচ */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-rose-800 to-rose-950 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="দোকান খরচ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-200 group-hover:text-white transition-colors">
              {selectedMonthObj?.name} মাসের দোকান খরচ
            </span>
            <div className="p-2 bg-rose-700/60 group-hover:bg-rose-600/80 rounded-xl text-rose-100 transition-colors">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(monthlyData.expense, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-rose-300 mt-1 flex items-center justify-between">
              <span>কাগজ, কালি ও অন্যান্য খরচ</span>
            </p>
          </div>
        </div>

        {/* ৩. নির্বাচিত মাসের স্থিতি */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="ক্যাশ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-100 group-hover:text-white transition-colors">
              {selectedMonthObj?.name} মাসের ক্যাশ স্থিতি
            </span>
            <div className="p-2 bg-amber-500/60 group-hover:bg-amber-400/80 rounded-xl text-amber-950 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(monthlyData.balance, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-amber-100 mt-1 flex items-center justify-between">
              <span>চলতি মাসের নীট স্থিতি</span>
            </p>
          </div>
        </div>

        {/* ৪. খরিদ্দারদের মোট বাকি */}
        <div
          onClick={() => onNavigateTab('dues')}
          className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="বাকি খাতা ড্যাশবোর্ডে যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
              খরিদ্দারদের মোট বাকি (তালিকা দেখুন)
            </span>
            <div className="p-2 bg-slate-700/80 group-hover:bg-slate-600 rounded-xl text-amber-400 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-amber-300 tracking-tight">
              {formatCurrency(totalDuesOutstanding, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
              <span>বাকি খাতা ড্যাশবোর্ডে তাগাদা দিন</span>
            </p>
          </div>
        </div>
      </div>

      {/* 🔹 ২. হিসাব নির্বাচন ফিল্টার বার */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900">হিসাব নির্বাচন:</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* সাল নির্বাচন */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {useBengaliDigits ? toBengaliNumber(yr) : yr} সাল
              </option>
            ))}
          </select>

          {/* মাস নির্বাচন */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {MONTH_NAMES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔹 ৩. বাৎসরিক সারসংক্ষেপ (চোখের আইকনে ক্লিকে ড্রপডাউন আকারে শো হবে) */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-4 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold text-lg">📈</span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {useBengaliDigits ? toBengaliNumber(selectedYear) : selectedYear} সালের সারসংক্ষেপ
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowYearlySummary(!showYearlySummary)}
            className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {showYearlySummary ? (
              <>
                <EyeOff className="w-4 h-4 text-rose-600" />
                <span>লুকান</span>
                <ChevronUp className="w-4 h-4 ml-0.5" />
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>দেখুন</span>
                <ChevronDown className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </div>

        {/* 👁️ বাৎসরিক হিসাব যা বাটন ক্লিকে শো হবে */}
        {showYearlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-slate-100 pt-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                বাৎসরিক মোট আয়
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrency(yearlyData.income, useBengaliDigits)}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-1">
                বাৎসরিক মোট ব্যয়
              </span>
              <div className="text-2xl font-black text-rose-700">
                {formatCurrency(yearlyData.expense, useBengaliDigits)}
              </div>
            </div>

            <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                বাৎসরিক মোট স্থিতি
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(yearlyData.balance, useBengaliDigits)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Entry Widget */}
      <QuickEntryWidget
        onAddTransaction={onAddTransaction}
        useBengaliDigits={useBengaliDigits}
        quickPresets={quickPresets}
        customCategories={customCategories}
        customIncomeCategories={customIncomeCategories}
        customExpenseCategories={customExpenseCategories}
        onOpenSettings={() => onNavigateTab('settings')}
      />

      {/* Grid: Recent Transactions & Top Due Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-2xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>সাম্প্রতিক ক্যাশ লেনদেন</span>
              </h3>
              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>সব লেনদেন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isInc ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-800">
                          {tx.description || tx.category}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {tx.displayDate || tx.date} • {tx.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black text-xs sm:text-sm ${
                          isInc ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isInc ? '+' : '-'}
                        {formatCurrency(tx.amount, useBengaliDigits)}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ক্যাশ: {formatCurrency(tx.cashBalance || 0, useBengaliDigits)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Due Customers List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-2xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>বাকি খাতা (সর্বোচ্চ বকেয়া)</span>
              </h3>
              <button
                onClick={() => onNavigateTab('dues')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>বাকি খাতা</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topDueCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  কোনো বকেয়া খরিদ্দার নেই।
                </p>
              ) : (
                topDueCustomers.map((customer) => {
                  const due = customer.totalDue - customer.totalPaid;
                  return (
                    <div
                      key={customer.id}
                      className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {customer.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ফোন: {customer.phone || 'N/A'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-rose-700 text-xs sm:text-sm block">
                          {formatCurrency(due, useBengaliDigits)}
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium">
                          বাকি
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateTab('dues')}
              className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
            >
              বাকি খাতায় যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};