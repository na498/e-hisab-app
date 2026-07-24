import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  PlusCircle,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Clock,
} from 'lucide-react';
import { Transaction, ShopInfo } from '../types';
import {
  formatCurrency,
  toBengaliNumber,
  formatDateTime,
  exportToCSV,
  formatMonthYear,
  exportOfficialMonthlyExcel,
} from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import { ConfirmModal } from './ConfirmModal';
import { CashMemoModal } from './CashMemoModal';

interface DailyLedgerProps {
  transactions: Transaction[];
  shopInfo: ShopInfo;
  onOpenNewTx: () => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  useBengaliDigits: boolean;
  monthStartDay?: number;
  customCategories?: string[];
}

export const DailyLedger: React.FC<DailyLedgerProps> = ({
  transactions,
  shopInfo,
  onOpenNewTx,
  onEditTx,
  onDeleteTx,
  useBengaliDigits,
  monthStartDay = 1,
  customCategories = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Cash Memo state
  const [memoTx, setMemoTx] = useState<Transaction | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...customCategories])
  );

  const shouldShowNewMonthBanner = (
    tx: Transaction,
    index: number,
    allTx: Transaction[],
    targetDay: number = 1
  ) => {
    if (!tx.date) return false;
    const parts = tx.date.split('-');
    if (parts.length < 3) return false;

    const dayNum = parseInt(parts[2], 10);
    const currentMonthKey = `${parts[0]}-${parts[1]}`;

    // If day matches monthStartDay (e.g. 1st) and is first tx of that day in sequence
    const isTargetDay = dayNum === targetDay;
    if (isTargetDay) {
      if (index === 0) return true;
      const prevTx = allTx[index - 1];
      return prevTx.date !== tx.date;
    }

    // Also if month changes from previous transaction in sequence
    if (index > 0) {
      const prevTx = allTx[index - 1];
      const prevParts = prevTx.date.split('-');
      if (prevParts.length >= 2) {
        const prevMonthKey = `${prevParts[0]}-${prevParts[1]}`;
        return currentMonthKey !== prevMonthKey;
      }
    }

    return false;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const matchesSearch =
        !searchTerm ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.remarks && tx.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.displayDate.includes(searchTerm);

      // Type
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      // Category
      const matchesCat =
        categoryFilter === 'all' || tx.category === categoryFilter;

      // Date Range
      const matchesStart = !startDate || tx.date >= startDate;
      const matchesEnd = !endDate || tx.date <= endDate;

      return matchesSearch && matchesType && matchesCat && matchesStart && matchesEnd;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, startDate, endDate]);

  // Totals
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else if (t.type === 'expense') exp += t.amount;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const exportData = filteredTransactions.map((t) => ({
      তারিখ_ও_সময়: formatDateTime(t.date, t.time, t.createdAt, useBengaliDigits),
      ধরণ: t.type === 'income' ? 'আয়' : 'ব্যয়',
      ক্যাটাগরি: t.category,
      পরিমাণ_টাকা: t.amount,
      চলতি_ক্যাশ: t.cashBalance || 0,
      বিবরণ: t.description,
      গ্রাহকের_নাম: t.customerName || '',
      মন্তব্য: t.remarks || '',
    }));
    exportToCSV('E_Hisab_Transactions.csv', exportData);
  };

  const handleExportOfficialExcel = () => {
    const monthLabel = formatMonthYear(new Date().toISOString().split('T')[0], useBengaliDigits);
    exportOfficialMonthlyExcel(
      shopInfo.shopName,
      shopInfo.branchName,
      monthLabel,
      filteredTransactions,
      useBengaliDigits
    );
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteTx(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-emerald-800">মোট আয় (Total Income)</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {formatCurrency(totalIncome, useBengaliDigits)}
            </p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-rose-800">মোট ব্যয় (Total Expense)</p>
            <p className="text-2xl font-black text-rose-950 mt-1">
              {formatCurrency(totalExpense, useBengaliDigits)}
            </p>
          </div>
          <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-800">নিট ব্যালেন্স / ক্যাশ</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {formatCurrency(netBalance, useBengaliDigits)}
            </p>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="বিবরণ, কাস্টমার নাম বা তারিখ দিয়ে ক্যাশ খাতা খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Official Excel Download */}
            <button
              onClick={handleExportOfficialExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="অফিশিয়াল ছকে তৈরি মাসিক এক্সেল ছক ডাউনলোড"
            >
              <Download className="w-3.5 h-3.5" />
              <span>মাসিক এক্সেল (.xls)</span>
            </button>

            {/* CSV Download */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* New Entry */}
            <button
              onClick={onOpenNewTx}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>নতুন লেনদেন</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              লেনদেনের ধরণ:
            </label>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'all' | 'income' | 'expense')
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            >
              <option value="all">সব লেনদেন</option>
              <option value="income">শুধু আয় (+)</option>
              <option value="expense">শুধু ব্যয় (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              ক্যাটাগরি:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            >
              <option value="all">সব ক্যাটাগরি</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              শুরুর তারিখ:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              শেষ তারিখ:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-sans border-b border-slate-800">
                <th className="py-3.5 px-3.5 font-bold w-44 text-left">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>তারিখ ও সময়</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 font-bold text-emerald-300">আয় / জমা (৳)</th>
                <th className="py-3.5 px-3 font-bold text-rose-300">ব্যয় / খরচ (৳)</th>
                <th className="py-3.5 px-3 font-bold text-amber-300">ক্যাশ (৳)</th>
                <th className="py-3.5 px-4 font-bold">বিবরণ (Description)</th>
                <th className="py-3.5 px-3 font-bold">ক্যাটাগরি</th>
                <th className="py-3.5 px-3 font-bold text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 font-normal"
                  >
                    কোনো লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, index) => {
                  const isIncome = tx.type === 'income';
                  const showMonthBanner = shouldShowNewMonthBanner(
                    tx,
                    index,
                    filteredTransactions,
                    monthStartDay
                  );

                  return (
                    <React.Fragment key={tx.id || index}>
                      {showMonthBanner && (
                        <tr className="bg-emerald-900 text-white font-bold">
                          <td
                            colSpan={7}
                            className="py-2.5 px-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-emerald-100 border-y-2 border-emerald-950 shadow-inner"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black tracking-wide flex items-center gap-2">
                                  <span>🗓️</span>
                                  <span>
                                    নতুন মাসের হিসাব শুরু — {formatMonthYear(tx.date, useBengaliDigits)}
                                  </span>
                                </span>
                              </div>
                              <span className="text-[11px] bg-emerald-800/80 text-amber-200 px-3 py-0.5 rounded-full border border-emerald-600/60 font-bold">
                                {toBengaliNumber(monthStartDay, useBengaliDigits)}ই তারিখ নতুন হিসাব চক্র
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-3.5 text-left font-bold text-slate-800 whitespace-nowrap bg-slate-50/50">
                        {formatDateTime(tx.date, tx.time, tx.createdAt, useBengaliDigits)}
                      </td>

                      {/* Income */}
                      <td className="py-3.5 px-3 font-black text-emerald-700 whitespace-nowrap text-base">
                        {isIncome ? formatCurrency(tx.amount, useBengaliDigits) : '—'}
                      </td>

                      {/* Expense */}
                      <td className="py-3.5 px-3 font-black text-rose-700 whitespace-nowrap text-base">
                        {!isIncome ? formatCurrency(tx.amount, useBengaliDigits) : '—'}
                      </td>

                      {/* Running Cash */}
                      <td className="py-3.5 px-3 font-black text-slate-900 bg-amber-50/40 whitespace-nowrap">
                        {formatCurrency(tx.cashBalance || 0, useBengaliDigits)}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {tx.description || '—'}
                        </div>
                        {tx.customerName && (
                          <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
                            গ্রাহক: {tx.customerName}
                          </div>
                        )}
                        {tx.remarks && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            নোট: {tx.remarks}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200">
                          {tx.category}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setMemoTx(tx);
                              setIsMemoOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="মেমো প্রিন্ট করুন"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTx(tx)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(tx.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="লেনদেন মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* Cash Memo Modal */}
      <CashMemoModal
        isOpen={isMemoOpen}
        onClose={() => {
          setIsMemoOpen(false);
          setMemoTx(null);
        }}
        shopInfo={shopInfo}
        transaction={memoTx}
        useBengaliDigits={useBengaliDigits}
      />
    </div>
  );
};
