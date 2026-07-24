import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Calendar, Tag, FileText, User, Clock, CreditCard } from 'lucide-react';
import { Transaction, TransactionType, CategoryType } from '../types';
import { formatShortMonthDay } from '../utils/formatters';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../utils/constants';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  editingTransaction?: Transaction | null;
  useBengaliDigits: boolean;
  customCategories?: string[];
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
  hiddenCategories?: string[];
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  useBengaliDigits,
  customCategories = [],
  customIncomeCategories,
  customExpenseCategories,
  hiddenCategories = [],
}) => {
  const incomeCats = customIncomeCategories || customCategories;
  const expenseCats = customExpenseCategories || customCategories;

  const incomeCategories = Array.from(
    new Set([...DEFAULT_INCOME_CATEGORIES, ...incomeCats])
  ).filter((cat) => !hiddenCategories.includes(cat));

  const expenseCategories = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, ...expenseCats])
  ).filter((cat) => !hiddenCategories.includes(cat));
  const [type, setType] = useState<TransactionType>('income');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const [category, setCategory] = useState<CategoryType>('ফটোকপি ও প্রিন্ট');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('ক্যাশ (Cash)');
  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCategory(editingTransaction.category);
      setAmount(editingTransaction.amount.toString());
      setPaymentMethod(editingTransaction.paymentMethod || 'ক্যাশ (Cash)');
      setDescription(editingTransaction.description || '');
      setRemarks(editingTransaction.remarks || '');
      setCustomerName(editingTransaction.customerName || '');
      setCustomerPhone(editingTransaction.customerPhone || '');
    } else {
      setType('income');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCategory('ফটোকপি ও প্রিন্ট');
      setAmount('');
      setPaymentMethod('ক্যাশ (Cash)');
      setDescription('');
      setRemarks('');
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt < 0) return;

    const displayDateStr = formatShortMonthDay(date, useBengaliDigits);

    onSave({
      date,
      time,
      displayDate: displayDateStr,
      type,
      amount: parsedAmt,
      category,
      paymentMethod,
      description: description.trim(),
      remarks: remarks.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-bold">
              {editingTransaction ? 'লেনদেন এডিট করুন' : 'নতুন হিসাব যুক্ত করুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Income / Expense Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              লেনদেনের ধরণ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  if (!incomeCategories.includes(category)) {
                    setCategory((incomeCategories[0] || 'ফটোকপি ও প্রিন্ট') as CategoryType);
                  }
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                  type === 'income'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>+ জমা / আয়</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (!expenseCategories.includes(category)) {
                    setCategory((expenseCategories[0] || 'কাগজ ক্রয় (A4/Legal/Photo)') as CategoryType);
                  }
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                  type === 'expense'
                    ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>- খরচ / ব্যয়</span>
              </button>
            </div>
          </div>

          {/* Date, Time & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>তারিখ</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>সময়</span>
              </label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                টাকা (৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>ক্যাটাগরি</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>পেমেন্ট মাধ্যম</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ক্যাশ (Cash)">ক্যাশ (Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                <option value="বকেয়া (Due)">বকেয়া (Due)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>বিবরণ (Description)</span>
            </label>
            <input
              type="text"
              placeholder="যেমন: ফটোস্ট্যাট ৫০ কপি ও প্রশ্নপ্রত্র টাইপ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>গ্রাহকের নাম (ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                placeholder="গ্রাহকের নাম"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                গ্রাহকের ফোন নম্বর
              </label>
              <input
                type="tel"
                placeholder="01700000000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মন্তব্য (Remarks)
            </label>
            <input
              type="text"
              placeholder="নোট বা ক্যাশ রিমার্ক"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
