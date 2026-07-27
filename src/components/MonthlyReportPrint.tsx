import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, FileSpreadsheet, Receipt, Plus, Trash2 } from 'lucide-react';
import { Transaction, ShopInfo } from '../types';
import {
  toBengaliNumber,
  formatSimpleDate,
  formatMonthYear,
  exportOfficialMonthlyExcel,
} from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { ConfirmModal } from './ConfirmModal';
import { CashMemoModal } from './CashMemoModal';

// অন্যান্য হিসাবের আইটেমের টাইপ (তারিখ ঐচ্ছিক)
interface OtherExpenseItem {
  id: string;
  date?: string;
  description: string;
  amount: number;
}

interface MonthlyReportPrintProps {
  transactions: Transaction[];
  shopInfo: ShopInfo;
  useBengaliDigits: boolean;
  onDeleteTx?: (id: string) => void;
}

const STORAGE_KEY = 'monthly_other_expenses_data';

export const MonthlyReportPrint: React.FC<MonthlyReportPrintProps> = ({
  transactions,
  shopInfo,
  useBengaliDigits,
  onDeleteTx,
}) => {
  // Available Months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    });
    const arr = Array.from(set).sort().reverse();
    const currentYYYYMM = new Date().toISOString().substring(0, 7);
    if (!arr.includes(currentYYYYMM)) {
      arr.unshift(currentYYYYMM);
    }
    return arr;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // 🔴 ১. localStorage থেকে ডেটা লোড করে প্রাথমিক স্টেট সেট করা
  const [otherExpensesByMonth, setOtherExpensesByMonth] = useState<Record<string, OtherExpenseItem[]>>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : {};
    } catch (error) {
      console.error('Failed to load other expenses from localStorage:', error);
      return {};
    }
  });

  // 🔴 ২. যখনই otherExpensesByMonth পরিবর্তন হবে, সাথে সাথে localStorage-এ সেভ হবে
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(otherExpensesByMonth));
    } catch (error) {
      console.error('Failed to save other expenses to localStorage:', error);
    }
  }, [otherExpensesByMonth]);

  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [selectedMemoTx, setSelectedMemoTx] = useState<Transaction | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'daily' | 'detailed'>('daily');
  const [showAllDaysInMonth, setShowAllDaysInMonth] = useState<boolean>(true);

  // বর্তমানে নির্বাচিত মাসের অন্যান্য খরচের লিস্ট
  const currentOtherExpenses = useMemo(() => {
    return otherExpensesByMonth[selectedMonth] || [];
  }, [otherExpensesByMonth, selectedMonth]);

  const monthNameMap: Record<string, string> = {
    '01': 'জানুয়ারি',
    '02': 'ফেব্রুয়ারি',
    '03': 'মার্চ',
    '04': 'এপ্রিল',
    '05': 'মে',
    '06': 'জুন',
    '07': 'জুলাই',
    '08': 'আগস্ট',
    '09': 'সেপ্টেম্বর',
    '10': 'অক্টোবর',
    '11': 'নভেম্বর',
    '12': 'ডিসেম্বর',
  };

  const getMonthLabel = (mStr: string) => {
    if (mStr === 'all') return 'সম্পূর্ণ সময়ের সব মাস রেজিস্টার';
    const [year, month] = mStr.split('-');
    const mName = monthNameMap[month] || month;
    const yStr = useBengaliDigits ? toBengaliNumber(year, useBengaliDigits) : year;
    return `${mName} ${yStr}`;
  };

  // অন্যান্য হিসাব যোগ করার হ্যান্ডলার (তারিখ ঐচ্ছিক)
  const handleAddOtherExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount || isNaN(Number(newAmount))) return;

    const newItem: OtherExpenseItem = {
      id: Date.now().toString(),
      date: newDate || undefined,
      description: newDesc.trim(),
      amount: Number(newAmount),
    };

    setOtherExpensesByMonth((prev) => {
      const monthItems = prev[selectedMonth] || [];
      return {
        ...prev,
        [selectedMonth]: [...monthItems, newItem],
      };
    });

    setNewDate('');
    setNewDesc('');
    setNewAmount('');
  };

  const handleRemoveOtherExpense = (id: string) => {
    setOtherExpensesByMonth((prev) => {
      const monthItems = prev[selectedMonth] || [];
      return {
        ...prev,
        [selectedMonth]: monthItems.filter((item) => item.id !== id),
      };
    });
  };

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    let list = [...transactions];
    if (selectedMonth !== 'all') {
      list = list.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
    }
    return list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.createdAt - b.createdAt);
  }, [transactions, selectedMonth]);

  // Daily Grouped Summaries
  const dailySummaries = useMemo(() => {
    const dateMap: Record<string, Transaction[]> = {};
    monthTransactions.forEach((tx) => {
      const dKey = tx.date || 'অন্যান্য';
      if (!dateMap[dKey]) dateMap[dKey] = [];
      dateMap[dKey].push(tx);
    });

    let sortedDates: string[] = [];

    if (showAllDaysInMonth && selectedMonth && selectedMonth !== 'all' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dayFormatted = String(d).padStart(2, '0');
        sortedDates.push(`${selectedMonth}-${dayFormatted}`);
      }
    } else {
      sortedDates = Object.keys(dateMap).sort();
    }

    let runningCash = 0;

    return sortedDates.map((dKey) => {
      const dayTxs = dateMap[dKey] || [];
      let dayIncome = 0;
      let dayExpense = 0;
      const catSet = new Set<string>();

      dayTxs.forEach((tx) => {
        if (tx.type === 'income') {
          dayIncome += Number(tx.amount || 0);
        } else {
          dayExpense += Number(tx.amount || 0);
          if (tx.category) catSet.add(tx.category);
        }
      });

      runningCash += dayIncome - dayExpense;
      const mainCategoriesText = catSet.size > 0 ? Array.from(catSet).join(', ') : '-';

      return {
        date: dKey,
        dayIncome,
        dayExpense,
        runningCash,
        mainCategoriesText,
        entryCount: dayTxs.length,
        txs: dayTxs,
      };
    });
  }, [monthTransactions, selectedMonth, showAllDaysInMonth]);

  const transactionsWithRunningCash = useMemo(() => {
    let running = 0;
    return monthTransactions.map((tx) => {
      if (tx.type === 'income') {
        running += Number(tx.amount || 0);
      } else {
        running -= Number(tx.amount || 0);
      }
      return { ...tx, calculatedCash: running };
    });
  }, [monthTransactions]);

  const shouldShowMonthHeader = (currentDate: string, prevDate?: string) => {
    if (selectedMonth !== 'all' || !currentDate) return false;
    return currentDate.slice(0, 7) !== (prevDate ? prevDate.slice(0, 7) : null);
  };

  const totalIncome = monthTransactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc), 0);
  const totalExpense = monthTransactions.reduce((acc, t) => (t.type === 'expense' ? acc + t.amount : acc), 0);
  const finalCash = totalIncome - totalExpense;

  // অন্যান্য খরচের মোট এবং নিট আসল ব্যালেন্স
  const totalOtherExpenses = currentOtherExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netRemainingCash = finalCash - totalOtherExpenses;

  const handlePrint = () => {
    const monthLabel = getMonthLabel(selectedMonth);
    printElement('printable-monthly-sheet', `${shopInfo.shopName || 'মাসিক হিসাব'} - ${monthLabel}`);
  };

  const handleExportOfficialExcel = () => {
    const monthLabel = getMonthLabel(selectedMonth);
    exportOfficialMonthlyExcel(shopInfo.shopName, shopInfo.branchName, monthLabel, monthTransactions, useBengaliDigits);
  };

  const handleConfirmDelete = () => {
    if (deleteTxId && onDeleteTx) {
      onDeleteTx(deleteTxId);
      setDeleteTxId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 print:hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                মাসিক রিপোর্ট নির্বাচন
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)} ({m})
                  </option>
                ))}
                <option value="all">সব মাস (সম্পূর্ণ রেজিস্টার)</option>
              </select>
            </div>

            <div className="ml-2 pl-3 border-l border-slate-200 hidden sm:block">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                রিপোর্ট ভিউ ফরম্যাট
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('daily')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    viewMode === 'daily' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  দৈনিক সারসংক্ষেপ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    viewMode === 'detailed' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  একক বিস্তারিত
                </button>
              </div>
            </div>

            {viewMode === 'daily' && selectedMonth !== 'all' && (
              <div className="ml-2 pl-3 border-l border-slate-200 hidden md:block">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  তারিখ ফিল্টার
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllDaysInMonth(!showAllDaysInMonth)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    showAllDaysInMonth ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {showAllDaysInMonth ? '✓ পুরো মাস (১-৩১ তারিখ)' : 'শুধুমাত্র লেনদেনের দিন'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportOfficialExcel}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>এক্সেল ফাইল ডাউনলোড</span>
            </button>

            <button
              onClick={() => { setSelectedMemoTx(null); setIsMemoOpen(true); }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-indigo-200" />
              <span>ক্যাশ মেমো প্রিন্ট</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>প্রিন্ট করুন / PDF</span>
            </button>
          </div>
        </div>

        {/* ➕ "অন্যান্য হিসাব" যোগ করার ইনপুট (তারিখ ঐচ্ছিক) ➕ */}
        {selectedMonth !== 'all' && (
          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              ➕ [{getMonthLabel(selectedMonth)}] মাসের অন্যান্য হিসাব যোগ করুন:
            </span>
            <form onSubmit={handleAddOtherExpense} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 cursor-pointer"
              />
              <input
                type="text"
                placeholder="বিবরণ (যেমন: মাসুম বিল্লার বেতন)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]"
              />
              <input
                type="number"
                placeholder="টাকা (যেমন: ৮০০০)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 w-28"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> যোগ করুন
              </button>
            </form>

            {/* তালিকা */}
            {currentOtherExpenses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentOtherExpenses.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md border">
                    {item.date ? `${formatSimpleDate(item.date, useBengaliDigits)} - ` : ''}
                    {item.description}: <strong>{item.amount}৳</strong>
                    <button onClick={() => handleRemoveOtherExpense(item.id)} className="text-red-500 hover:text-red-700 ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Sheet Document */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 max-w-5xl mx-auto print:p-0 print:shadow-none print:border-none print:max-w-none text-slate-900 relative flex flex-col justify-between min-h-[280mm]"
        id="printable-monthly-sheet"
      >
        <div>
          {/* Header */}
          <div className="text-center space-y-2 mb-6 border-b-2 border-slate-900 pb-5">
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-950 tracking-tight">
              {shopInfo.shopName || 'ই-সেন্টার'} এর মাসিক আয় ব্যয়ের বিবরণী
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-slate-800">
              <span>শাখা অফিসের নাম : <strong>{shopInfo.branchName || 'চাম্পাফুল'}</strong></span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span>মাসের নাম : <strong>{getMonthLabel(selectedMonth)}</strong></span>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table
              className="w-full text-xs sm:text-sm text-center font-sans border-collapse text-slate-950"
              style={{ border: '2px solid #000000', borderCollapse: 'collapse', width: '100%', emptyCells: 'show' }}
            >
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-950" style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '15%', fontWeight: 'bold' }}>তারিখ</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>আয় (৳)</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>ব্যয় (৳)</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>ক্যাশ (৳)</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', width: '35%', fontWeight: 'bold' }}>খরচের বিবরণ</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '14%', fontWeight: 'bold' }}>মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'daily' ? (
                  dailySummaries.map((dRow, idx) => {
                    const prevRow = dailySummaries[idx - 1];
                    const showHeader = shouldShowMonthHeader(dRow.date, prevRow?.date);
                    const hasTx = dRow.entryCount > 0;
                    const hasExpense = dRow.dayExpense > 0;

                    return (
                      <React.Fragment key={dRow.date}>
                        {showHeader && (
                          <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 'bold', pageBreakInside: 'avoid' }}>
                            <td colSpan={6} style={{ border: '1px solid #000000', padding: '6px 12px', textAlign: 'center', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '900', fontSize: '13px' }}>
                              🗓️ {formatMonthYear(dRow.date, useBengaliDigits)} — এর হিসাব
                            </td>
                          </tr>
                        )}
                        <tr className="font-medium text-slate-950" style={{ pageBreakInside: 'avoid' }}>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {formatSimpleDate(dRow.date, useBengaliDigits)}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {hasTx ? toBengaliNumber(dRow.dayIncome, useBengaliDigits) : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {hasExpense ? toBengaliNumber(dRow.dayExpense, useBengaliDigits) : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {hasTx ? toBengaliNumber(dRow.runningCash, useBengaliDigits) : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>
                            {hasTx ? (dRow.mainCategoriesText || '-') : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center' }}>
                            {hasTx ? '-' : '\u00A0'}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  transactionsWithRunningCash.map((tx, idx) => {
                    const isInc = tx.type === 'income';
                    const prevTx = transactionsWithRunningCash[idx - 1];
                    const showHeader = shouldShowMonthHeader(tx.date, prevTx?.date);

                    return (
                      <React.Fragment key={tx.id || idx}>
                        {showHeader && (
                          <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 'bold', pageBreakInside: 'avoid' }}>
                            <td colSpan={6} style={{ border: '1px solid #000000', padding: '6px 12px', textAlign: 'center', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '900', fontSize: '13px' }}>
                              🗓️ {formatMonthYear(tx.date, useBengaliDigits)} — এর হিসাব
                            </td>
                          </tr>
                        )}
                        <tr className="font-medium text-slate-950" style={{ pageBreakInside: 'avoid' }}>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {formatSimpleDate(tx.date, useBengaliDigits)}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {isInc ? toBengaliNumber(tx.amount || 0, useBengaliDigits) : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {!isInc && tx.amount > 0 ? toBengaliNumber(tx.amount, useBengaliDigits) : '\u00A0'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {toBengaliNumber(tx.calculatedCash || 0, useBengaliDigits)}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>
                            {!isInc ? (tx.category || '-') : '-'}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center' }}>
                            {tx.remarks || tx.customerName || '-'}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}

                {/* Total Row */}
                <tr className="font-bold text-xs sm:text-sm bg-slate-100 text-slate-950" style={{ backgroundColor: '#f1f5f9', pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontWeight: 'black' }}>
                    সর্বমোট (TOTAL)
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontWeight: 'black' }}>
                    {toBengaliNumber(totalIncome, useBengaliDigits)}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontWeight: 'black' }}>
                    {toBengaliNumber(totalExpense, useBengaliDigits)}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontWeight: 'black' }}>
                    {toBengaliNumber(finalCash, useBengaliDigits)}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px 6px', textAlign: 'left', fontWeight: 'black' }}>
                    অবশিষ্ট ক্যাশ জমা
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontWeight: 'black' }}>
                    {toBengaliNumber(finalCash, useBengaliDigits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 🔴 বাম সাইডে "অন্যান্য হিসাব" এবং ডান সাইডে "আসল অবশিষ্ট ক্যাশ" হিসাবের ডাবল টেবিল 🔴 */}
          {currentOtherExpenses.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row gap-6 items-start justify-between" style={{ pageBreakInside: 'avoid' }}>
              {/* বাম সাইডের টেবিল: অন্যান্য হিসাব (তারিখ সহ/ছাড়া) */}
              <div className="w-full md:w-7/12">
                <table
                  className="w-full text-xs sm:text-sm font-sans text-slate-950 border-collapse"
                  style={{ border: '2px solid #000000', borderCollapse: 'collapse' }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th
                        colSpan={3}
                        style={{
                          border: '1px solid #000000',
                          padding: '6px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        অন্যান্য হিসাব
                      </th>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '25%', textAlign: 'center' }}>তারিখ</th>
                      <th style={{ border: '1px solid #000000', padding: '4px 6px', textAlign: 'left' }}>বিবরণ</th>
                      <th style={{ border: '1px solid #000000', padding: '4px 6px', width: '30%', textAlign: 'right' }}>টাকা (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOtherExpenses.map((item) => (
                      <tr key={item.id}>
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: '500' }}>
                          {item.date ? formatSimpleDate(item.date, useBengaliDigits) : '-'}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: '500' }}>
                          {item.description}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                          {toBengaliNumber(item.amount, useBengaliDigits)} ৳
                        </td>
                      </tr>
                    ))}
                    {/* মোট অন্যান্য খরচ */}
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                      <td colSpan={2} style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left' }}>
                        মোট অন্যান্য খরচ
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right', fontWeight: 'black' }}>
                        {toBengaliNumber(totalOtherExpenses, useBengaliDigits)} ৳
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ডান সাইডের টেবিল: চূড়ান্ত আসল জমা টাকা */}
              <div className="w-full md:w-5/12">
                <table
                  className="w-full text-xs sm:text-sm font-sans text-slate-950 border-collapse"
                  style={{ border: '2px solid #000000', borderCollapse: 'collapse' }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th
                        colSpan={2}
                        style={{
                          border: '1px solid #000000',
                          padding: '6px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        চূড়ান্ত হিসাব (আসল জমা)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left' }}>
                        দৈনিক মোট ক্যাশ জমা
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {toBengaliNumber(finalCash, useBengaliDigits)} ৳
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', color: '#b91c1c' }}>
                        (-) মোট অন্যান্য খরচ
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                        {toBengaliNumber(totalOtherExpenses, useBengaliDigits)} ৳
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '13px' }}>
                        অবশিষ্ট প্রকৃত আসল ক্যাশ
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontWeight: '900', fontSize: '14px' }}>
                        {toBengaliNumber(netRemainingCash, useBengaliDigits)} ৳
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Signatures */}
        <div className="mt-12 print:mt-12 pt-8 print:pt-6 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-950 pb-2" style={{ pageBreakInside: 'avoid' }}>
          <div className="text-center">
            <div style={{ width: '200px', borderTop: '2px solid #000000', margin: '0 auto 8px auto' }}></div>
            <span>{shopInfo.managerName || 'মাসুম বিল্লাহ'}</span>
          </div>

          <div className="text-center">
            <div style={{ width: '200px', borderTop: '2px solid #000000', margin: '0 auto 8px auto' }}></div>
            <span>{shopInfo.ownerName || 'আলহাজ্ব সিরাজুল ইসলাম গাইন'}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!deleteTxId}
        title="হিসাব মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে আপনি এই হিসাবটি স্থায়ীভাবে মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTxId(null)}
      />

      <CashMemoModal
        isOpen={isMemoOpen}
        onClose={() => { setIsMemoOpen(false); setSelectedMemoTx(null); }}
        shopInfo={shopInfo}
        transaction={selectedMemoTx}
        useBengaliDigits={useBengaliDigits}
      />
    </div>
  );
};