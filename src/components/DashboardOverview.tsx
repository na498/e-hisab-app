import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Users,
  Printer,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, CustomerDue, CategoryType } from '../types';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';
import { QuickEntryWidget } from './QuickEntryWidget';

import { QuickPreset } from '../types';

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

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  customerDues,
  onAddTransaction,
  onNavigateTab,
  onOpenNewTxModal,
  useBengaliDigits,
  quickPresets,
  customCategories,
  customIncomeCategories,
  customExpenseCategories,
}) => {
  // Current Totals
  const totalIncome = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const totalExpense = transactions.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const currentCashBalance =
    transactions.length > 0
      ? transactions[transactions.length - 1].cashBalance || 0
      : 0;

  const totalDuesOutstanding = customerDues.reduce(
    (acc, c) => acc + (c.totalDue - c.totalPaid),
    0
  );

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Top Due Customers
  const topDueCustomers = [...customerDues]
    .filter((c) => c.totalDue - c.totalPaid > 0)
    .sort((a, b) => b.totalDue - b.totalPaid - (a.totalDue - a.totalPaid))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Card */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="ক্যাশ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-200 group-hover:text-white transition-colors">
              সর্বমোট বিক্রয় ও আয় (তালিকা দেখুন)
            </span>
            <div className="p-2 bg-emerald-700/60 group-hover:bg-emerald-600/80 rounded-xl text-emerald-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(totalIncome, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-1 flex items-center justify-between">
              <span>{toBengaliNumber(transactions.filter((t) => t.type === 'income').length, useBengaliDigits)} টি জমার এন্ট্রি</span>
             </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-rose-800 to-rose-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="দোকান খরচ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-200 group-hover:text-white transition-colors">
              সর্বমোট দোকান খরচ (তালিকা দেখুন)
            </span>
            <div className="p-2 bg-rose-700/60 group-hover:bg-rose-600/80 rounded-xl text-rose-100 transition-colors">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(totalExpense, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-rose-300 mt-1 flex items-center justify-between">
              <span>কাগজ, কালি ও বিল বাবদ খরচ</span>
            </p>
          </div>
        </div>

        {/* Cash Balance Card */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
          title="ক্যাশ রেজিস্টার তালিকায় যান"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-100 group-hover:text-white transition-colors">
              চলতি ক্যাশ স্থিতি (তালিকা দেখুন)
            </span>
            <div className="p-2 bg-amber-500/60 group-hover:bg-amber-400/80 rounded-xl text-amber-950 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
              {formatCurrency(currentCashBalance, useBengaliDigits)}
            </p>
            <p className="text-[11px] text-amber-100 mt-1 flex items-center justify-between">
              <span>হাতে ক্যাশ অবশিষ্ট আছে</span>
              </p>
          </div>
        </div>

        {/* Outstanding Dues Card */}
        <div
          onClick={() => onNavigateTab('dues')}
          className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all group"
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
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>সাম্প্রতিক ক্যাশ লেনদেন</span>
              </h3>
              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
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
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>বাকি খাতা (সর্বোচ্চ বকেয়া)</span>
              </h3>
              <button
                onClick={() => onNavigateTab('dues')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>বাকি খাতা</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topDueCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  কোনো বকেয়া খরিদ্দার নেই।
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
              className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors"
            >
              বাকি খাতায় যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
