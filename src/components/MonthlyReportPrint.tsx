import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, FileSpreadsheet, Trash2, Receipt, PlusCircle } from 'lucide-react';
import { Transaction, ShopInfo, CategoryType } from '../types';
import {
  formatCurrency,
  toBengaliNumber,
  formatDateTime,
  formatSimpleDate,
  exportOfficialMonthlyExcel,
} from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { ConfirmModal } from './ConfirmModal';
import { CashMemoModal } from './CashMemoModal';

interface MonthlyReportPrintProps {
  transactions: Transaction[];
  shopInfo: ShopInfo;
  useBengaliDigits: boolean;
  onDeleteTx?: (id: string) => void;
  onAddTx?: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  monthStartDay?: number;
}

export const MonthlyReportPrint: React.FC<MonthlyReportPrintProps> = ({
  transactions,
  shopInfo,
  useBengaliDigits,
  onDeleteTx,
  onAddTx,
}) => {
  // Month options based on existing data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (!tx.date) return;
      let yyyymm = '';
      const cleanDate = tx.date.trim();
      if (/^\d{4}-\d{2}/.test(cleanDate)) {
        yyyymm = cleanDate.substring(0, 7);
      } else {
        const parts = cleanDate.split(/[-/]/);
        if (parts.length === 3 && parts[2].length === 4) {
          const yr = parts[2];
          const p0 = parts[0].padStart(2, '0');
          yyyymm = `${yr}-${p0}`;
        } else {
          const d = new Date(cleanDate);
          if (!isNaN(d.getTime())) {
            yyyymm = d.toISOString().substring(0, 7);
          }
        }
      }
      if (yyyymm && /^\d{4}-\d{2}$/.test(yyyymm)) {
        set.add(yyyymm);
      }
    });
    const arr = Array.from(set).sort().reverse();
    const currentYYYYMM = new Date().toISOString().substring(0, 7);
    if (!arr.includes(currentYYYYMM)) {
      arr.unshift(currentYYYYMM);
    }
    return arr;
  }, [transactions]);

  // Default to current month or first available month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const currentYYYYMM = new Date().toISOString().substring(0, 7);
    return currentYYYYMM;
  });

  // Deletion Confirmation state
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  // Cash Memo Modal state
  const [selectedMemoTx, setSelectedMemoTx] = useState<Transaction | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);

  // View mode: 'daily' (grouped by day) or 'detailed' (every transaction)
  const [viewMode, setViewMode] = useState<'daily' | 'detailed'>('daily');

  // Option to show all days of the month (1 to 30/31) or only days with transactions
  const [showAllDaysInMonth, setShowAllDaysInMonth] = useState<boolean>(true);

  // Quick Add Other Accounts / Owner's Deposit state
  const [quickType, setQuickType] = useState<'expense_other' | 'income_owner' | 'income_other' | 'expense_owner'>('expense_other');
  const [quickDate, setQuickDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quickDesc, setQuickDesc] = useState<string>('');
  const [quickAmount, setQuickAmount] = useState<string>('');

  useEffect(() => {
    if (selectedMonth && selectedMonth !== 'all' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const todayYYYYMM = new Date().toISOString().substring(0, 7);
      if (selectedMonth === todayYYYYMM) {
        setQuickDate(new Date().toISOString().split('T')[0]);
      } else {
        setQuickDate(`${selectedMonth}-01`);
      }
    }
  }, [selectedMonth]);

  // Month label helper
  const monthNameMap: Record<string, string> = {
    '01': 'জানুয়ারি',
    '02': 'ফেব্রুয়ারি',
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
    if (mStr === 'all') return 'সম্পূর্ণ সময়ের সব মাস রেজিস্টার';
    const [year, month] = mStr.split('-');
    const mName = monthNameMap[month] || month;
    const yStr = useBengaliDigits ? toBengaliNumber(year) : year;
    return `${mName} ${yStr}`;
  };

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    let list = [...transactions];
    if (selectedMonth !== 'all') {
      const [selYear, selMonth] = selectedMonth.split('-');
      list = list.filter((tx) => {
        if (tx.reportMonth && tx.reportMonth === selectedMonth) return true;
        if (!tx.date) return false;
        const cleanDate = tx.date.trim();
        // Standard ISO check (YYYY-MM-DD or YYYY-MM)
        if (cleanDate.startsWith(selectedMonth)) return true;

        // Custom date formats like DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD
        const parts = cleanDate.split(/[-/]/);
        if (parts.length === 3) {
          // e.g. 07/01/2026 or 01/07/2026
          if (parts[2] === selYear) {
            const p0 = parts[0].padStart(2, '0');
            const p1 = parts[1].padStart(2, '0');
            if (p0 === selMonth || p1 === selMonth) return true;
          }
          // e.g. 2026/07/01
          if (parts[0] === selYear) {
            const p1 = parts[1].padStart(2, '0');
            if (p1 === selMonth) return true;
          }
        }

        // Fallback Date object parsing
        const d = new Date(cleanDate);
        if (!isNaN(d.getTime())) {
          const yr = String(d.getFullYear());
          const mn = String(d.getMonth() + 1).padStart(2, '0');
          if (`${yr}-${mn}` === selectedMonth) return true;
        }

        return false;
      });
    }
    return list.sort((a, b) => a.createdAt - b.createdAt);
  }, [transactions, selectedMonth]);

  // Separate regular daily transactions from other account / owner transactions
  const regularMonthTxs = useMemo(() => {
    return monthTransactions.filter(
      (tx) => !tx.isOtherAccount && !tx.description?.includes('মালিকের জমা') && !tx.description?.includes('মালিকের উত্তোলন')
    );
  }, [monthTransactions]);

  const otherAccountMonthTxs = useMemo(() => {
    return monthTransactions.filter(
      (tx) => tx.isOtherAccount === true || tx.description?.includes('মালিকের জমা') || tx.description?.includes('মালিকের উত্তোলন')
    );
  }, [monthTransactions]);

  // Daily Grouped Summary Calculation (using regular daily transactions only)
  const dailySummaries = useMemo(() => {
    const dateMap: Record<string, Transaction[]> = {};
    regularMonthTxs.forEach((tx) => {
      const dKey = tx.date || 'অন্যান্য';
      if (!dateMap[dKey]) dateMap[dKey] = [];
      dateMap[dKey].push(tx);
    });

    let sortedDates: string[] = [];

    if (showAllDaysInMonth && selectedMonth && selectedMonth !== 'all' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-12
      const daysInMonth = new Date(year, month, 0).getDate(); // Total days in month

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
          if (tx.category) {
            catSet.add(tx.category);
          }
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
  }, [regularMonthTxs, selectedMonth, showAllDaysInMonth]);

  // Recalculate running cash for individual detailed regular transactions
  const transactionsWithRunningCash = useMemo(() => {
    let running = 0;
    return regularMonthTxs.map((tx) => {
      if (tx.type === 'income') {
        running += Number(tx.amount || 0);
      } else {
        running -= Number(tx.amount || 0);
      }
      return {
        ...tx,
        calculatedCash: running,
      };
    });
  }, [regularMonthTxs]);

  // Regular Daily Ledger Totals
  const totalIncome = regularMonthTxs.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const totalExpense = regularMonthTxs.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const finalCash = totalIncome - totalExpense;

  // Other Account / Owner Deposit & Withdrawal Totals
  const otherTotalIncome = otherAccountMonthTxs.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const otherTotalExpense = otherAccountMonthTxs.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const otherNet = otherTotalIncome - otherTotalExpense;

  const finalTotalNetCash = finalCash + otherNet;

  const handlePrint = () => {
    const monthLabel = getMonthLabel(selectedMonth);
    printElement('printable-monthly-sheet', `${shopInfo.shopName || 'মাসিক হিসাব'} - ${monthLabel}`);
  };

  const handleExportOfficialExcel = () => {
    const monthLabel = getMonthLabel(selectedMonth);
    exportOfficialMonthlyExcel(
      shopInfo.shopName,
      shopInfo.branchName,
      monthLabel,
      regularMonthTxs,
      useBengaliDigits
    );
  };

  const handleConfirmDelete = () => {
    if (deleteTxId && onDeleteTx) {
      onDeleteTx(deleteTxId);
      setDeleteTxId(null);
    }
  };

  const handleQuickAdd = () => {
    const numAmount = parseFloat(quickAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ প্রদান করুন');
      return;
    }

    let txType: 'income' | 'expense' = 'expense';
    let categoryStr: CategoryType = 'দোকান ভাড়া ও অন্যান্য';
    let defaultDesc = 'অন্যান্য খরচ';

    if (quickType === 'expense_other') {
      txType = 'expense';
      categoryStr = 'দোকান ভাড়া ও অন্যান্য';
      defaultDesc = 'অন্যান্য খরচ';
    } else if (quickType === 'income_owner') {
      txType = 'income';
      categoryStr = 'অন্যান্য আয়';
      defaultDesc = 'মালিকের জমা';
    } else if (quickType === 'income_other') {
      txType = 'income';
      categoryStr = 'অন্যান্য আয়';
      defaultDesc = 'অন্যান্য আয়';
    } else if (quickType === 'expense_owner') {
      txType = 'expense';
      categoryStr = 'দোকান ভাড়া ও অন্যান্য';
      defaultDesc = 'মালিকের উত্তোলন';
    }

    let finalDate = '';
    let reportMonthVal: string | undefined = undefined;

    if (selectedMonth !== 'all') {
      reportMonthVal = selectedMonth;
      let dayStr = '01';
      if (quickDate) {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const clean = quickDate.trim().replace(/[০-৯]/g, (w) => String(bengaliDigits.indexOf(w)));
        const parts = clean.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            const d = parseInt(parts[2], 10);
            if (!isNaN(d) && d >= 1 && d <= 31) dayStr = String(d).padStart(2, '0');
          } else if (parts[2].length === 4) {
            // DD/MM/YYYY or MM/DD/YYYY
            const d0 = parseInt(parts[0], 10);
            const d1 = parseInt(parts[1], 10);
            if (!isNaN(d0) && d0 >= 1 && d0 <= 31) dayStr = String(d0).padStart(2, '0');
            else if (!isNaN(d1) && d1 >= 1 && d1 <= 31) dayStr = String(d1).padStart(2, '0');
          }
        } else {
          const d = parseInt(clean, 10);
          if (!isNaN(d) && d >= 1 && d <= 31) {
            dayStr = String(d).padStart(2, '0');
          }
        }
      }
      finalDate = `${selectedMonth}-${dayStr}`;
    } else {
      finalDate = quickDate.trim() || new Date().toISOString().split('T')[0];
    }

    const finalDesc = quickDesc.trim() || defaultDesc;

    if (onAddTx) {
      onAddTx({
        date: finalDate,
        reportMonth: reportMonthVal,
        displayDate: formatSimpleDate(finalDate, useBengaliDigits),
        type: txType,
        amount: numAmount,
        category: categoryStr,
        description: finalDesc,
        paymentMethod: 'ক্যাশ',
        isOtherAccount: true,
      });

      setQuickDesc('');
      setQuickAmount('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar - Hidden during Print */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  viewMode === 'daily'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                দৈনিক সারসংক্ষেপ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
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
                  showAllDaysInMonth
                    ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
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
            title="পিডিএফ এর মতো উপরে টাইটেল সহ এক্সেল ডাউনলোড"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>এক্সেল ফাইল ডাউনলোড (Excel Download)</span>
          </button>

          <button
            onClick={() => {
              setSelectedMemoTx(null);
              setIsMemoOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-indigo-200" />
            <span>ক্যাশ মেমো প্রিন্ট</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            id="monthly-report-print-btn"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>প্রিন্ট করুন / PDF</span>
          </button>
        </div>
      </div>

      {/* Quick Add Other Accounts / Owner's Deposit Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 print:hidden space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
          অন্যান্য হিসাব / মালিকের জমা যোগ করুন (প্রয়োজন না থাকলে খালি রাখুন)
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={quickType}
            onChange={(e) => setQuickType(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="expense_other">অন্যান্য খরচ (-)</option>
            <option value="income_owner">মালিকের জমা (+)</option>
            <option value="income_other">অন্যান্য আয় (+)</option>
            <option value="expense_owner">মালিকের উত্তোলন (-)</option>
          </select>

          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            value={quickDesc}
            onChange={(e) => setQuickDesc(e.target.value)}
            placeholder="খরচের বিবরণ"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 min-w-[180px]"
          />

          <input
            type="number"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            placeholder="টাকা (৳)"
            className="w-full sm:w-36 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={handleQuickAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Official Monthly Accounting Sheet Document Container */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 max-w-5xl mx-auto print:p-0 print:m-0 print:shadow-none print:border-none print:max-w-none text-slate-900 relative flex flex-col justify-between min-h-[280mm] print:min-h-[275mm]"
        id="printable-monthly-sheet"
      >
        <div>
          {/* Document Header */}
          <div className="text-center space-y-1.5 mb-4 print:mb-2 border-b-2 border-slate-900 pb-3 print:pb-1">
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-950 tracking-tight">
              {shopInfo.shopName || 'ই-সেন্টার'} এর মাসিক আয় ব্যয়ের বিবরণী
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-slate-800">
              <span>শাখা অফিসের নাম : <strong>{shopInfo.branchName || 'চাম্পাফুল'}</strong></span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span>
                মাসের নাম : <strong>{getMonthLabel(selectedMonth)}</strong>
              </span>
            </div>
          </div>

          {/* Structured Table */}
          <div className="overflow-x-auto">
            <table
              className="w-full text-xs sm:text-sm text-center font-sans border-collapse text-slate-950"
              style={{ border: '2px solid #000000', borderCollapse: 'collapse', width: '100%', emptyCells: 'show' }}
            >
              <thead>
                {/* Header Titles */}
                <tr className="bg-slate-100 font-bold text-slate-950" style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '15%', fontWeight: 'bold' }}>
                    তারিখ
                  </th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>
                    আয় (৳)
                  </th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>
                    ব্যয় (৳)
                  </th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '12%', fontWeight: 'bold' }}>
                    ক্যাশ (৳)
                  </th>
                  <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', width: '35%', fontWeight: 'bold' }}>
                    খরচের বিবরণ
                  </th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '14%', fontWeight: 'bold' }}>
                    মন্তব্য
                  </th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'daily' ? (
                  /* Daily Grouped Rows (1 row per date, main subjects only) */
                  dailySummaries.map((dRow) => (
                    <tr
                      key={dRow.date}
                      className="font-medium text-slate-950"
                      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    >
                      <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {formatSimpleDate(dRow.date, useBengaliDigits)}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {dRow.dayIncome > 0 ? toBengaliNumber(dRow.dayIncome, useBengaliDigits) : '\u00A0'}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {dRow.dayExpense > 0 ? toBengaliNumber(dRow.dayExpense, useBengaliDigits) : '\u00A0'}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {toBengaliNumber(dRow.runningCash, useBengaliDigits)}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>
                        {dRow.mainCategoriesText || '-'}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center' }}>
                        -
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Individual Transaction Rows */
                  transactionsWithRunningCash.map((tx, idx) => {
                    const isInc = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id || idx}
                        className="font-medium text-slate-950"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {formatSimpleDate(tx.date, useBengaliDigits)}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {isInc ? toBengaliNumber(tx.amount, useBengaliDigits) : '\u00A0'}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {!isInc && tx.amount > 0 ? toBengaliNumber(tx.amount, useBengaliDigits) : '\u00A0'}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {toBengaliNumber(tx.calculatedCash, useBengaliDigits)}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>
                          {!isInc ? (tx.category || '-') : '-'}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'center' }}>
                          {tx.remarks || tx.customerName || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Footer Row */}
                <tr className="font-bold text-xs sm:text-sm bg-slate-100 text-slate-950" style={{ backgroundColor: '#f1f5f9', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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
                  <td style={{ border: '1px solid #000000', padding: '6px 4px' }}>{'\u00A0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Left (Other Accounts/Owner's Statement) & Right (Net Month Settlement) - Only rendered if other account items exist for this month */}
        {otherAccountMonthTxs.length > 0 && (
          <div className="mt-4 print:mt-3 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4 items-start" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            {/* Left Table: অন্যান্য হিসাব / মালিকের জমার বিবরণী */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-950 mb-2 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                <span>অন্যান্য হিসাব / মালিকের জমার বিবরণী:</span>
              </h4>
              <table
                className="w-full text-xs text-center font-sans border-collapse text-slate-950"
                style={{ border: '2px solid #000000', borderCollapse: 'collapse', width: '100%' }}
              >
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-950" style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000000', padding: '5px 4px', width: '30%', fontWeight: 'bold' }}>তারিখ</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>বিবরণ</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 4px', width: '28%', fontWeight: 'bold' }}>টাকা (৳)</th>
                    <th className="print:hidden" style={{ border: '1px solid #000000', padding: '5px 4px', width: '28px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {otherAccountMonthTxs.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const amtDisplay = isExpense
                      ? `-${toBengaliNumber(tx.amount, useBengaliDigits)}`
                      : `+${toBengaliNumber(tx.amount, useBengaliDigits)}`;
                    return (
                      <tr key={tx.id} className="font-medium text-slate-950" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {formatSimpleDate(tx.date, useBengaliDigits)}
                        </td>
                        <td style={{ border: '1px solid #000000', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>
                          {tx.description}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '4px',
                            textAlign: 'center',
                            fontWeight: 'black',
                            color: isExpense ? '#dc2626' : '#15803d',
                          }}
                        >
                          {amtDisplay}
                        </td>
                        <td className="print:hidden" style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDeleteTxId(tx.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right Table: মাসের নিট হিসাব সমন্বয় */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-950 mb-2 border-b-2 border-slate-900 pb-1">
                মাসের নিট হিসাব সমন্বয়:
              </h4>
              <table
                className="w-full text-xs text-center font-sans border-collapse text-slate-950"
                style={{ border: '2px solid #000000', borderCollapse: 'collapse', width: '100%' }}
              >
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-950" style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold' }}>খাত / বিবরণ</th>
                    <th style={{ border: '1px solid #000000', padding: '5px 6px', width: '32%', textAlign: 'right', fontWeight: 'bold' }}>টাকা (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-medium text-slate-950" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>
                      দৈনিক হিসাবের মোট ক্যাশ জমা:
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {toBengaliNumber(finalCash, useBengaliDigits)}
                    </td>
                  </tr>
                  <tr className="font-medium text-slate-950" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>
                      (-) অন্যান্য মোট খরচ / সমন্বয়:
                    </td>
                    <td
                      style={{
                        border: '1px solid #000000',
                        padding: '6px 8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: otherNet < 0 ? '#dc2626' : otherNet > 0 ? '#15803d' : 'inherit',
                      }}
                    >
                      {otherNet < 0
                        ? `-${toBengaliNumber(Math.abs(otherNet), useBengaliDigits)}`
                        : otherNet > 0
                        ? `+${toBengaliNumber(otherNet, useBengaliDigits)}`
                        : '০'}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/80 font-black text-slate-950" style={{ backgroundColor: '#fef3c7', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'left', fontWeight: 'black' }}>
                      মাসিক নিট সর্বমোট ক্যাশ:
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'right', fontWeight: 'black', textDecoration: 'underline' }}>
                      {toBengaliNumber(finalTotalNetCash, useBengaliDigits)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signature Footer - Pushed cleanly to bottom of A4 page */}
        <div className="mt-auto pt-6 print:pt-4 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-950 pb-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="text-center">
            <div style={{ width: '180px', borderTop: '2px solid #000000', margin: '0 auto 6px auto' }}></div>
            <span className="block font-bold text-slate-950">{shopInfo.managerName || 'মাছুম বিল্লাহ'}</span>
            <span className="text-xs font-normal text-slate-700">দোকান পরিচালক</span>
          </div>

          <div className="text-center">
            <div style={{ width: '180px', borderTop: '2px solid #000000', margin: '0 auto 6px auto' }}></div>
            <span className="block font-bold text-slate-950">{shopInfo.ownerName || 'আলহাজ্ব সিরাজুল ইসলাম গাইন'}</span>
            <span className="text-xs font-normal text-slate-700">দোকান মালিক</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTxId}
        title="হিসাব মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে আপনি এই হিসাবটি স্থায়ীভাবে মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTxId(null)}
      />

      {/* Cash Memo Printable Modal */}
      <CashMemoModal
        isOpen={isMemoOpen}
        onClose={() => {
          setIsMemoOpen(false);
          setSelectedMemoTx(null);
        }}
        shopInfo={shopInfo}
        transaction={selectedMemoTx}
        useBengaliDigits={useBengaliDigits}
      />
    </div>
  );
};
