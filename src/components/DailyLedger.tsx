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
  Calendar,
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // বর্তমানে থাকা সমস্ত ইউনিক মাস বের করে অপশন লিস্ট তৈরি
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.slice(0, 7)); // 'YYYY-MM'
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // ডিফল্টভাবে রানিং মাস অথবা প্রথম মাস সিলেক্ট থাকবে
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0] || currentMonth
  );

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

    const isTargetDay = dayNum === targetDay;
    if (isTargetDay) {
      if (index === 0) return true;
      const prevTx = allTx[index - 1];
      return prevTx.date !== tx.date;
    }

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
      // Month Filter
      const matchesMonth =
        selectedMonth === 'all' || !selectedMonth || (tx.date && tx.date.startsWith(selectedMonth));

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
      const matchesCat = categoryFilter === 'all' || tx.category === categoryFilter;

      // Date Range
      const matchesStart = !startDate || tx.date >= startDate;
      const matchesEnd = !endDate || tx.date <= endDate;

      return (
        matchesMonth &&
        matchesSearch &&
        matchesType &&
        matchesCat &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    transactions,
    selectedMonth,
    searchTerm,
    typeFilter,
    categoryFilter,
    startDate,
    endDate,
  ]);

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
      তারিখ_ও_সময়: formatDateTime(t.date, t.time, t.createdAt, useBengaliDigits),
      ধরণ: t.type === 'income' ? 'আয়' : 'ব্যয়',
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
    const monthLabel = formatMonthYear(
      selectedMonth && selectedMonth !== 'all' ? `${selectedMonth}-01` : new Date().toISOString().split('T')[0],
      useBengaliDigits
    );
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
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-emerald-800">মোট আয় (Total Income)</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-0.5">
              {formatCurrency(totalIncome, useBengaliDigits)}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-rose-800">মোট ব্যয় (Total Expense)</p>
            <p className="text-xl sm:text-2xl font-black text-rose-950 mt-0.5">
              {formatCurrency(totalExpense, useBengaliDigits)}
            </p>
          </div>
          <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-800">নিট ব্যালেন্স / ক্যাশ</p>
            <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
              {formatCurrency(netBalance, useBengaliDigits)}
            </p>
          </div>
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="বিবরণ, কাস্টমার নাম বা তারিখ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportOfficialExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>মাসিক এক্সেল (.xls)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={onOpenNewTx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>নতুন লেনদেন</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 border-t border-slate-100">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-600" />
              মাস নির্বাচন:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full text-xs bg-emerald-50/80 border border-emerald-300 rounded-xl p-1.5 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">সব মাস (একসাথে)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(`${m}-01`, useBengaliDigits)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              লেনদেনের ধরণ:
            </label>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'all' | 'income' | 'expense')
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-slate-800"
            >
              <option value="all">সব লেনদেন</option>
              <option value="income">শুধু আয় (+)</option>
              <option value="expense">শুধু ব্যয় (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              ক্যাটাগরি:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-slate-800"
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
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setSelectedMonth('all');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              শেষ তারিখ:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setSelectedMonth('all');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[550px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-white font-sans border-b border-slate-800">
                <th className="py-2.5 px-3 font-bold w-36 text-left">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>তারিখ ও সময়</span>
                  </div>
                </th>
                <th className="py-2.5 px-2.5 font-bold text-emerald-300">আয় / জমা (৳)</th>
                <th className="py-2.5 px-2.5 font-bold text-rose-300">ব্যয় / খরচ (৳)</th>
                <th className="py-2.5 px-2.5 font-bold text-amber-300">ক্যাশ (৳)</th>
                <th className="py-2.5 px-3 font-bold">বিবরণ</th>
                <th className="py-2.5 px-2.5 font-bold">ক্যাটাগরি</th>
                <th className="py-2.5 px-2.5 font-bold text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-normal">
                    কোনো লেনদেন পাওয়া যায়নি।
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
                            className="py-1.5 px-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-emerald-100 border-y border-emerald-950 shadow-inner"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                                <span>🗓️</span>
                                <span>নতুন মাসের হিসাব শুরু — {formatMonthYear(tx.date, useBengaliDigits)}</span>
                              </span>
                              <span className="text-[10px] bg-emerald-800/80 text-amber-200 px-2 py-0.5 rounded-full border border-emerald-600/60 font-bold">
                                {toBengaliNumber(monthStartDay, useBengaliDigits)}ই তারিখ নতুন হিসাব চক্র
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {/* মাউস নিয়ে গেলে আরও গাঢ় ও স্পষ্ট সবুজ হাইলাইট (hover:bg-emerald-100/80) দেখা যাবে */}
                      <tr className="hover:bg-emerald-100/80 transition-colors cursor-pointer group">
                        {/* Date & Time */}
                        <td className="py-2.5 px-3 text-left font-bold text-slate-800 whitespace-nowrap bg-slate-50/50 group-hover:bg-emerald-200/50">
                          {formatDateTime(tx.date, tx.time, tx.createdAt, useBengaliDigits)}
                        </td>

                        {/* Income */}
                        <td className="py-2.5 px-2.5 font-black text-emerald-700 whitespace-nowrap text-sm">
                          {isIncome ? formatCurrency(tx.amount, useBengaliDigits) : '—'}
                        </td>

                        {/* Expense */}
                        <td className="py-2.5 px-2.5 font-black text-rose-700 whitespace-nowrap text-sm">
                          {!isIncome ? formatCurrency(tx.amount, useBengaliDigits) : '—'}
                        </td>

                        {/* Running Cash */}
                        <td className="py-2.5 px-2.5 font-black text-slate-900 bg-amber-50/40 group-hover:bg-amber-100/80 whitespace-nowrap">
                          {formatCurrency(tx.cashBalance || 0, useBengaliDigits)}
                        </td>

                        {/* Description */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 leading-snug">
                            {tx.description || '—'}
                          </div>
                          {tx.customerName && (
                            <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                              গ্রাহক: {tx.customerName}
                            </div>
                          )}
                          {tx.remarks && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              নোট: {tx.remarks}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold border border-slate-200 group-hover:border-emerald-300">
                            {tx.category}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setMemoTx(tx);
                                setIsMemoOpen(true);
                              }}
                              className="p-1 text-indigo-600 hover:bg-indigo-200/60 rounded-lg transition-colors"
                              title="মেমো প্রিন্ট করুন"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditTx(tx)}
                              className="p-1 text-slate-600 hover:text-emerald-800 hover:bg-emerald-200/70 rounded-lg transition-colors"
                              title="এডিট করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-200/60 rounded-lg transition-colors"
                              title="মুছে ফেলুন (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modals */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="লেনদেন মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />

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