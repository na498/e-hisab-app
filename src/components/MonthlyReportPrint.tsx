import React, { useState, useMemo } from 'react';
import { Printer, Calendar, FileSpreadsheet, Trash2, Receipt } from 'lucide-react';
import { Transaction, ShopInfo } from '../types';
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
}

export const MonthlyReportPrint: React.FC<MonthlyReportPrintProps> = ({
  transactions,
  shopInfo,
  useBengaliDigits,
  onDeleteTx,
}) => {
  // Month options based on existing data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7)); // YYYY-MM
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
      list = list.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
    }
    return list.sort((a, b) => a.createdAt - b.createdAt);
  }, [transactions, selectedMonth]);

  // Daily Grouped Summary Calculation (Running Cash starts from 0 for the month)
  const dailySummaries = useMemo(() => {
    const dateMap: Record<string, Transaction[]> = {};
    monthTransactions.forEach((tx) => {
      const dKey = tx.date || 'অন্যান্য';
      if (!dateMap[dKey]) dateMap[dKey] = [];
      dateMap[dKey].push(tx);
    });

    const sortedDates = Object.keys(dateMap).sort();
    let runningCash = 0;

    return sortedDates.map((dKey) => {
      const dayTxs = dateMap[dKey];
      let dayIncome = 0;
      let dayExpense = 0;
      const catSet = new Set<string>();

      dayTxs.forEach((tx) => {
        if (tx.type === 'income') {
          dayIncome += Number(tx.amount || 0);
        } else {
          dayExpense += Number(tx.amount || 0);
        }
        if (tx.category) {
          catSet.add(tx.category);
        }
      });

      runningCash += dayIncome - dayExpense;

      const mainCategoriesText = Array.from(catSet).join(', ') || 'অন্যান্য';

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
  }, [monthTransactions]);

  // Recalculate running cash for individual detailed transactions
  const transactionsWithRunningCash = useMemo(() => {
    let running = 0;
    return monthTransactions.map((tx) => {
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
  }, [monthTransactions]);

  // Calculate totals
  const totalIncome = monthTransactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const totalExpense = monthTransactions.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const finalCash = totalIncome - totalExpense;

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
      monthTransactions,
      useBengaliDigits
    );
  };

  const handleConfirmDelete = () => {
    if (deleteTxId && onDeleteTx) {
      onDeleteTx(deleteTxId);
      setDeleteTxId(null);
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
                দৈনিক সারসংক্ষেপ (ডিফল্ট)
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
                একক বিস্তারিত এন্ট্রি
              </button>
            </div>
          </div>
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

      {/* Official Monthly Accounting Sheet Document Container */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 max-w-5xl mx-auto print:p-0 print:shadow-none print:border-none print:max-w-none text-slate-900 relative"
        id="printable-monthly-sheet"
      >
        {/* Document Header */}
        <div className="text-center space-y-2 mb-6 border-b-2 border-slate-900 pb-5">
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
          <table className="w-full text-xs sm:text-sm border-2 border-slate-900 text-center font-sans border-collapse">
            <thead>
              {/* Header Titles */}
              <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold text-slate-900">
                <th className="border-r border-slate-900 py-2.5 px-2 w-32">তারিখ</th>
                <th className="border-r border-slate-900 py-2.5 px-2 w-24">আয় (৳)</th>
                <th className="border-r border-slate-900 py-2.5 px-2 w-24">ব্যয় (৳)</th>
                <th className="border-r border-slate-900 py-2.5 px-2 w-28">ক্যাশ (৳)</th>
                <th className="border-r border-slate-900 py-2.5 px-3 text-left">খরচের বিবরণ</th>
                <th className="border-r border-slate-900 py-2.5 px-2 w-28">মন্তব্য</th>
                <th className="py-2.5 px-1 w-16 print:hidden">অ্যাকশন</th>
              </tr>
              {/* Column Numbers Row */}
              <tr className="border-b border-slate-900 bg-slate-50 text-[11px] font-semibold text-slate-700">
                <td className="border-r border-slate-900 py-1">০১</td>
                <td className="border-r border-slate-900 py-1">০২</td>
                <td className="border-r border-slate-900 py-1">০৩</td>
                <td className="border-r border-slate-900 py-1">০৪</td>
                <td className="border-r border-slate-900 py-1 text-left px-3">০৫</td>
                <td className="border-r border-slate-900 py-1">০৬</td>
                <td className="py-1 print:hidden">-</td>
              </tr>
            </thead>
            <tbody>
              {viewMode === 'daily' ? (
                /* Daily Grouped Rows (1 row per date, main subjects only) */
                dailySummaries.map((dRow) => (
                  <tr
                    key={dRow.date}
                    className="border-b border-slate-300 font-medium hover:bg-slate-50 text-slate-900"
                  >
                    <td className="border-r border-slate-400 py-2.5 px-2 text-left font-bold text-[11px] sm:text-xs text-slate-900">
                      {formatSimpleDate(dRow.date, useBengaliDigits)}
                    </td>
                    <td className="border-r border-slate-400 py-2.5 px-2 font-black text-emerald-800">
                      {dRow.dayIncome > 0 ? toBengaliNumber(dRow.dayIncome, useBengaliDigits) : ''}
                    </td>
                    <td className="border-r border-slate-400 py-2.5 px-2 font-black text-rose-800">
                      {dRow.dayExpense > 0 ? toBengaliNumber(dRow.dayExpense, useBengaliDigits) : ''}
                    </td>
                    <td className="border-r border-slate-400 py-2.5 px-2 font-black text-slate-900">
                      {toBengaliNumber(dRow.runningCash, useBengaliDigits)}
                    </td>
                    <td className="border-r border-slate-400 py-2.5 px-3 text-left font-bold text-slate-900">
                      {dRow.mainCategoriesText}
                    </td>
                    <td className="border-r border-slate-400 py-2.5 px-2 text-slate-700 text-xs">
                      -
                    </td>
                    <td className="py-2.5 px-1 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {dRow.txs.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedMemoTx(dRow.txs[0]);
                              setIsMemoOpen(true);
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="প্রথম ক্যাশ মেমো"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
                      className="border-b border-slate-300 font-medium hover:bg-slate-50 text-slate-900"
                    >
                      <td className="border-r border-slate-400 py-2 px-2 text-left font-bold text-[11px] sm:text-xs text-slate-900">
                        {formatSimpleDate(tx.date, useBengaliDigits)}
                      </td>
                      <td className="border-r border-slate-400 py-2 px-2 font-black text-emerald-800">
                        {isInc ? toBengaliNumber(tx.amount, useBengaliDigits) : ''}
                      </td>
                      <td className="border-r border-slate-400 py-2 px-2 font-black text-rose-800">
                        {!isInc && tx.amount > 0 ? toBengaliNumber(tx.amount, useBengaliDigits) : ''}
                      </td>
                      <td className="border-r border-slate-400 py-2 px-2 font-black text-slate-900">
                        {toBengaliNumber(tx.calculatedCash, useBengaliDigits)}
                      </td>
                      <td className="border-r border-slate-400 py-2 px-3 text-left">
                        <div className="font-bold text-slate-900">{tx.category}</div>
                      </td>
                      <td className="border-r border-slate-400 py-2 px-2 text-slate-700 text-xs">
                        {tx.remarks || tx.customerName || '-'}
                      </td>
                      <td className="py-2 px-1 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedMemoTx(tx);
                              setIsMemoOpen(true);
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="ক্যাশ মেমো প্রিন্ট"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {onDeleteTx && (
                            <button
                              onClick={() => setDeleteTxId(tx.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="মুছে ফেলুন (Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Total Footer Row */}
              <tr className="border-t-2 border-slate-900 font-black text-xs sm:text-sm bg-slate-100">
                <td className="border-r border-slate-900 py-2.5 px-2 text-center">সর্বমোট (TOTAL)</td>
                <td className="border-r border-slate-900 py-2.5 px-2 text-emerald-900">
                  {toBengaliNumber(totalIncome, useBengaliDigits)}
                </td>
                <td className="border-r border-slate-900 py-2.5 px-2 text-rose-900">
                  {toBengaliNumber(totalExpense, useBengaliDigits)}
                </td>
                <td className="border-r border-slate-900 py-2.5 px-2 text-slate-950">
                  {toBengaliNumber(finalCash, useBengaliDigits)}
                </td>
                <td className="border-r border-slate-900 py-2.5 px-3 text-left">
                  অবশিষ্ট ক্যাশ জমা
                </td>
                <td className="border-r border-slate-900 py-2.5 px-2"></td>
                <td className="py-2.5 px-1 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Footer - Matching Page 2 of the uploaded document */}
        <div className="mt-20 pt-10 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-950">
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto"></div>
            <span>{shopInfo.managerName || 'দোকান পরিচালকের স্বাক্ষর'}</span>
          </div>

          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto"></div>
            <span>{shopInfo.ownerName || 'দোকান মালিকের স্বাক্ষর'}</span>
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
