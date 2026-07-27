import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Calendar, Tag, FileText, User, Clock, CreditCard, Edit3, Store } from 'lucide-react';
import { Transaction, TransactionType, CategoryType } from '../types';
import { formatShortMonthDay } from '../utils/formatters';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../utils/constants';

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

  // Category States
  const [category, setCategory] = useState<string>('ফটোকপি ও প্রিন্ট');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');

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

      const availableCategories = editingTransaction.type === 'income' ? incomeCategories : expenseCategories;

      if (availableCategories.includes(editingTransaction.category)) {
        setCategory(editingTransaction.category);
        setIsCustomCategory(false);
        setCustomCategoryName('');
      } else {
        setCategory('custom');
        setIsCustomCategory(true);
        setCustomCategoryName(editingTransaction.category);
      }

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
      setCategory(incomeCategories[0] || 'ফটোকপি ও প্রিন্ট');
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setAmount('');
      setPaymentMethod('ক্যাশ (Cash)');
      setDescription('');
      setRemarks('');
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (val: string) => {
    if (val === 'custom') {
      setIsCustomCategory(true);
      setCategory('custom');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  // দোকান বন্ধের দিন অটো সেট করার শর্টকাট ফাংশন
  const handleSetShopClosed = () => {
    setAmount('0');
    setIsCustomCategory(true);
    setCustomCategoryName('দোকান বন্ধ');
    setDescription('দোকান বন্ধ ছিল');
    setRemarks('ছুটি / বন্ধ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    
    // ০ টাকা অনুমোদিত, কিন্তু নেগেটিভ বা খালি থাকা যাবে না
    if (isNaN(parsedAmt) || parsedAmt < 0) return;

    // ০ টাকা হলে এবং ক্যাটাগরি কাস্টম না থাকলে 'দোকান বন্ধ' ডিফল্ট হিসেবে নেওয়া
    let finalCategory = isCustomCategory
      ? (customCategoryName.trim() || 'অন্যান্য')
      : category;

    if (parsedAmt === 0 && !isCustomCategory && !customCategoryName) {
      finalCategory = 'দোকান বন্ধ';
    }

    const displayDateStr = formatShortMonthDay(date, useBengaliDigits);

    onSave({
      date,
      time,
      displayDate: displayDateStr,
      type,
      amount: parsedAmt,
      category: finalCategory as CategoryType,
      paymentMethod,
      description: description.trim() || (parsedAmt === 0 ? 'দোকান বন্ধ ছিল' : ''),
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
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* Quick Action: Shop Closed Button */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <Store className="w-4 h-4 text-amber-600" />
              <span>আজকে দোকান বন্ধ ছিল?</span>
            </div>
            <button
              type="button"
              onClick={handleSetShopClosed}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              ০ ৳ (দোকান বন্ধ সেট করুন)
            </button>
          </div>

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
                  setIsCustomCategory(false);
                  setCategory(incomeCategories[0] || 'ফটোকপি ও প্রিন্ট');
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>+ জমা / আয়</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setIsCustomCategory(false);
                  setCategory(expenseCategories[0] || 'কাগজ ক্রয় (A4/Legal/Photo)');
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>- খরচ / ব্যয়</span>
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
                <span>সময়</span>
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
                value={isCustomCategory ? 'custom' : category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom" className="font-bold text-indigo-600">
                  ✏️ ম্যানুয়ালি লিখুন (Custom)
                </option>
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
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="ক্যাশ (Cash)">ক্যাশ (Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                <option value="বকেয়া (Due)">বকেয়া (Due)</option>
              </select>
            </div>
          </div>

          {/* Manual / Custom Category Input Field */}
          {isCustomCategory && (
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 transition-all">
              <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>ক্যাটাগরির নাম লিখে দিন *</span>
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ওয়াইফাই বিল, দোকান বন্ধ ইত্যাদি..."
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="w-full text-xs bg-white border border-indigo-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>বিবরণ (Description)</span>
            </label>
            <input
              type="text"
              placeholder="যেমন: ফটোস্ট্যাট ৫০ কপি বা দোকান বন্ধ ছিল"
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
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
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