import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, FileSpreadsheet, Trash2, Receipt, PlusCircle } from 'lucide-react';
import { Transaction, ShopInfo, ExtraExpense } from '../types';
import {
  toBengaliNumber,
  formatSimpleDate,
  exportOfficialMonthlyExcel,
} from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { ConfirmModal } from './ConfirmModal';
import { CashMemoModal } from './CashMemoModal';
import { supabase } from '../utils/supabase';

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

  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [extraDate, setExtraDate] = useState('');
  const [extraType, setExtraType] = useState<'expense' | 'income'>('expense');
  const [extraTitle, setExtraTitle] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  useEffect(() => {
    if (!selectedMonth || selectedMonth === 'all') {
      setExtraExpenses([]);
      return;
    }

    const fetchExtraExpenses = async () => {
      const { data, error } = await supabase
        .from('extra_expenses')
        .select('*')
        .eq('month', selectedMonth)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setExtraExpenses(data as ExtraExpense[]);
      }
    };

    fetchExtraExpenses();

    const channel = supabase
      .channel(`public:extra_expenses:${selectedMonth}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extra_expenses',
          filter: `month=eq.${selectedMonth}`,
        },
        () => {
          fetchExtraExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth]);

  const handleAddExtraExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTitle.trim() || !extraAmount || isNaN(Number(extraAmount)) || selectedMonth === 'all') return;

    const newExpense = {
      month: selectedMonth,
      date: extraDate ? extraDate : undefined,
      title: extraTitle.trim(),
      type: extraType,
      amount: Number(extraAmount),
    };

    const { data, error } = await supabase
      .from('extra_expenses')
      .insert([newExpense])
      .select();

    if (!error && data) {
      setExtraExpenses((prev) => [...prev, data[0] as ExtraExpense]);
      setExtraDate('');
      setExtraTitle('');
      setExtraAmount('');
    }
  };

  const handleDeleteExtraExpense = async (id: string) => {
    const { error } = await supabase
      .from('extra_expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      setExtraExpenses((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [selectedMemoTx, setSelectedMemoTx] = useState<Transaction | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'daily' | 'detailed'>('daily');
  const [showAllDaysInMonth, setShowAllDaysInMonth] = useState<boolean>(true);

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

  const monthTransactions = useMemo(() => {
    let list = [...transactions];
    if (selectedMonth !== 'all') {
      list = list.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
    }
    return list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.createdAt - b.createdAt);
  }, [transactions, selectedMonth]);

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
  }, [monthTransactions, selectedMonth, showAllDaysInMonth]);

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

  const totalIncome = monthTransactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const totalExpense = monthTransactions.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const finalCash = totalIncome - totalExpense;

  const netExtraBalance = useMemo(() => {
    return extraExpenses.reduce((acc, curr) => {
      const amt = Number(curr.amount || 0);
      return curr.type === 'income' ? acc + amt : acc - amt;
    }, 0);
  }, [extraExpenses]);

  const netFinalCash = finalCash + netExtraBalance;
  const hasExtraExpenses = extraExpenses.length > 0;

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
      {/* Strict Print CSS Fixes */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm !important;
          }
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #printable-monthly-sheet {
            width: 100% !important;
            height: 96vh !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          
          .main-content-area {
            display: flex !important;
            flex-direction: column !important;
            flex-grow: 1 !important;
          }

          .report-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            ${!hasExtraExpenses ? 'height: 100% !important;' : ''}
          }
          
          .report-table th, 
          .report-table td {
            border: 1.2px solid #000000 !important;
            padding: ${hasExtraExpenses ? '3px 4px' : '7.5px 6px'} !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            color: #000 !important;
          }

          .date-col {
            width: 25% !important;
            white-space: nowrap !important;
            word-break: keep-all !important;
          }
          .income-col { width: 12% !important; }
          .expense-col { width: 12% !important; }
          .cash-col { width: 12% !important; }
          .desc-col { width: 26% !important; }
          .remarks-col { width: 13% !important; }

          .signature-section {
            margin-top: auto !important;
            padding-top: 25px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            width: 100% !important;
            page-break-inside: avoid !important;
          }
          .sig-box {
            text-align: center !important;
            width: 220px !important;
          }
          .sig-line {
            border-top: 1.5px solid #000000 !important;
            margin-bottom: 6px !important;
          }
        }
      `}</style>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 print:hidden flex flex-col gap-4">
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
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>এক্সেল ফাইল (Excel)</span>
            </button>

            <button
              onClick={() => {
                setSelectedMemoTx(null);
                setIsMemoOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-indigo-200" />
              <span>ক্যাশ মেমো</span>
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

        {/* Extra Expenses Form */}
        {selectedMonth !== 'all' && (
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              অন্যান্য হিসাব / মালিকের জমা যোগ করুন (প্রয়োজন না থাকলে খালি রাখুন)
            </label>
            <form onSubmit={handleAddExtraExpense} className="flex flex-wrap items-center gap-3">
              <select
                value={extraType}
                onChange={(e) => setExtraType(e.target.value as 'expense' | 'income')}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="expense">অন্যান্য খরচ (-)</option>
                <option value="income">মালিকের জমা (+)</option>
              </select>

              <input
                type="date"
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
                className="w-36 text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />

              <input
                type="text"
                placeholder={extraType === 'expense' ? 'খরচের বিবরণ' : 'বিবরণ'}
                value={extraTitle}
                onChange={(e) => setExtraTitle(e.target.value)}
                className="flex-1 min-w-[200px] text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="number"
                placeholder="টাকা (৳)"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                className="w-32 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>যোগ করুন</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Print Container */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 max-w-4xl mx-auto min-h-[1050px] text-slate-900 flex flex-col justify-between"
        id="printable-monthly-sheet"
      >
        <div className="main-content-area flex flex-col flex-grow">
          {/* Main Title Header */}
          <div className="text-center mb-3 border-b-2 border-slate-900 pb-2">
            <h1 className="text-2xl font-black font-serif text-slate-950 tracking-tight mb-1">
              {shopInfo.shopName || 'ই-সেন্টার'} এর মাসিক আয় ব্যয়ের বিবরণী
            </h1>
            <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-800">
              <span>শাখা অফিসের নাম : <strong>{shopInfo.branchName || 'চাম্পাফুল'}</strong></span>
              <span className="text-slate-400">|</span>
              <span>মাসের নাম : <strong>{getMonthLabel(selectedMonth)}</strong></span>
            </div>
          </div>

          {/* Core Register Table */}
          <div className="flex-grow flex flex-col justify-between">
            <table className="report-table w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-950">
                  <th className="date-col border border-black p-2 font-bold">তারিখ</th>
                  <th className="income-col border border-black p-2 font-bold">আয় (৳)</th>
                  <th className="expense-col border border-black p-2 font-bold">ব্যয় (৳)</th>
                  <th className="cash-col border border-black p-2 font-bold">ক্যাশ (৳)</th>
                  <th className="desc-col border border-black p-2 text-left font-bold">খরচের বিবরণ</th>
                  <th className="remarks-col border border-black p-2 font-bold">মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'daily' ? (
                  dailySummaries.map((dRow) => {
                    const hasTx = dRow.entryCount > 0;
                    const hasExpense = dRow.dayExpense > 0;

                    return (
                      <tr key={dRow.date} className="font-medium text-slate-950">
                        <td className="date-col border border-black p-1.5 text-center font-bold whitespace-nowrap">
                          {formatSimpleDate(dRow.date, useBengaliDigits)}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {hasTx ? toBengaliNumber(dRow.dayIncome, useBengaliDigits) : ''}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {hasExpense ? toBengaliNumber(dRow.dayExpense, useBengaliDigits) : ''}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {hasTx ? toBengaliNumber(dRow.runningCash, useBengaliDigits) : ''}
                        </td>
                        <td className="border border-black p-1.5 text-left font-bold">
                          {hasTx ? (dRow.mainCategoriesText || '-') : ''}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {hasTx ? '-' : ''}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  transactionsWithRunningCash.map((tx, idx) => {
                    const isInc = tx.type === 'income';

                    return (
                      <tr key={tx.id || idx} className="font-medium text-slate-950">
                        <td className="date-col border border-black p-1.5 text-center font-bold whitespace-nowrap">
                          {formatSimpleDate(tx.date, useBengaliDigits)}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {isInc ? toBengaliNumber(tx.amount || 0, useBengaliDigits) : ''}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {!isInc && tx.amount > 0 ? toBengaliNumber(tx.amount, useBengaliDigits) : ''}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {toBengaliNumber(tx.calculatedCash || 0, useBengaliDigits)}
                        </td>
                        <td className="border border-black p-1.5 text-left font-bold">
                          {!isInc ? (tx.category || '-') : '-'}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {tx.remarks || tx.customerName || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Footer Row */}
                <tr className="font-bold text-xs bg-slate-100 text-slate-950">
                  <td className="border border-black p-2 text-center font-black">
                    সর্বমোট (TOTAL)
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliNumber(totalIncome, useBengaliDigits)}
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliNumber(totalExpense, useBengaliDigits)}
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliNumber(finalCash, useBengaliDigits)}
                  </td>
                  <td className="border border-black p-2 text-left font-black">
                    অবশিষ্ট ক্যাশ জমা
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliNumber(finalCash, useBengaliDigits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Extra Expense Breakdown (Only displays if entries exist) */}
          {hasExtraExpenses && (
            <div className="mt-4 flex flex-row items-start justify-between gap-4">
              <div className="w-1/2">
                <h3 className="text-xs font-bold text-slate-900 mb-1 text-center">
                  অন্যান্য হিসাব / মালিকের জমার বিবরণী:
                </h3>
                <table className="report-table w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-1 text-center">তারিখ</th>
                      <th className="border border-black p-1 text-left">বিবরণ</th>
                      <th className="border border-black p-1 text-right">টাকা (৳)</th>
                      <th className="print:hidden border border-black p-1 w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraExpenses.map((ex) => (
                      <tr key={ex.id}>
                        <td className="border border-black p-1 text-center whitespace-nowrap">
                          {ex.date ? formatSimpleDate(ex.date, useBengaliDigits) : '-'}
                        </td>
                        <td className="border border-black p-1 text-left">{ex.title}</td>
                        <td className="border border-black p-1 text-right font-bold">
                          {ex.type === 'income' ? '+' : '-'}{toBengaliNumber(ex.amount, useBengaliDigits)}
                        </td>
                        <td className="print:hidden border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraExpense(ex.id)}
                            className="text-red-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="w-1/2">
                <h3 className="text-xs font-bold text-slate-900 mb-1 text-center">
                  মাসের নিট হিসাব সমন্বয়:
                </h3>
                <table className="report-table w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-1 text-left">খাত / বিবরণ</th>
                      <th className="border border-black p-1 text-right">টাকা (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 font-bold">দৈনিক হিসাবের মোট ক্যাশ জমা:</td>
                      <td className="border border-black p-1 text-right font-bold">
                        {toBengaliNumber(finalCash, useBengaliDigits)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1">
                        {netExtraBalance >= 0 ? '(+) অন্যান্য মোট জমা:' : '(-) অন্যান্য মোট খরচ:'}
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {netExtraBalance >= 0 ? '+' : ''}{toBengaliNumber(netExtraBalance, useBengaliDigits)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-black p-1">মাসিক নিট সর্বমোট ক্যাশ:</td>
                      <td className="border border-black p-1 text-right underline">
                        {toBengaliNumber(netFinalCash, useBengaliDigits)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Signature Block */}
        <div className="signature-section flex items-end justify-between font-bold text-slate-950 w-full pt-8">
          <div className="sig-box text-center">
            <div className="sig-line border-t-2 border-black mb-1 w-48 mx-auto"></div>
            <span className="text-sm font-black block">{shopInfo.managerName || 'মাসুম বিল্লাহ'}</span>
            <span className="text-xs font-semibold text-slate-700">দোকান পরিচালক</span>
          </div>

          <div className="sig-box text-center">
            <div className="sig-line border-t-2 border-black mb-1 w-48 mx-auto"></div>
            <span className="text-sm font-black block">{shopInfo.ownerName || 'আলহাজ্ব সিরাজুল ইসলাম গাইন'}</span>
            <span className="text-xs font-semibold text-slate-700">দোকান মালিক</span>
          </div>
        </div>
      </div>

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