import React, { useState } from 'react';
import {
  Printer,
  FileText,
  CreditCard,
  Edit3,
  Image as ImageIcon,
  Zap,
  Plus,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { CategoryType, QuickPreset } from '../types';
import { formatCurrency } from '../utils/formatters';
import { DEFAULT_PRESETS, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../utils/constants';

interface QuickEntryWidgetProps {
  onAddTransaction: (
    type: 'income' | 'expense',
    amount: number,
    category: CategoryType,
    description: string
  ) => void;
  useBengaliDigits: boolean;
  quickPresets?: QuickPreset[];
  customCategories?: string[];
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
  onOpenSettings?: () => void;
}

export const QuickEntryWidget: React.FC<QuickEntryWidgetProps> = ({
  onAddTransaction,
  useBengaliDigits,
  quickPresets,
  customCategories,
  customIncomeCategories,
  customExpenseCategories,
  onOpenSettings,
}) => {
  const presetsToUse = quickPresets && quickPresets.length > 0 ? quickPresets : DEFAULT_PRESETS;
  
  const incomeCatsToUse = customIncomeCategories || customCategories || [];
  const expenseCatsToUse = customExpenseCategories || customCategories || [];

  const incomeCategories = Array.from(
    new Set([...DEFAULT_INCOME_CATEGORIES, ...incomeCatsToUse])
  );
  const expenseCategories = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, ...expenseCatsToUse])
  );

  const [incomeAmount, setIncomeAmount] = useState<string>('');
  const [incomeDesc, setIncomeDesc] = useState<string>('');
  const [incomeCategory, setIncomeCategory] = useState<CategoryType>(
    (incomeCategories[0] as CategoryType) || 'ফটোকপি ও প্রিন্ট'
  );

  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<CategoryType>(
    (expenseCategories[0] as CategoryType) || 'কাগজ ক্রয় (A4/Legal/Photo)'
  );

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText': return FileText;
      case 'CreditCard': return CreditCard;
      case 'Edit3': return Edit3;
      case 'ImageIcon': return ImageIcon;
      case 'Printer':
      default: return Printer;
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900';
      case 'purple':
        return 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-900';
      case 'amber':
        return 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900';
      case 'rose':
        return 'border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-900';
      case 'indigo':
        return 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900';
      case 'emerald':
      default:
        return 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-900';
    }
  };

  const handlePresetClick = (
    category: CategoryType | string,
    amount: number,
    label: string
  ) => {
    onAddTransaction('income', amount, category as CategoryType, `${label} আয়`);
    showFeedback(`${label}: ${formatCurrency(amount, useBengaliDigits)} যুক্ত হয়েছে`);
  };

  const handleAddIncome = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(incomeAmount);
    if (isNaN(num) || num <= 0) return;

    const desc = incomeDesc.trim() || 'অন্যান্য বিক্রি / সেবা আয়';
    onAddTransaction('income', num, incomeCategory, desc);
    showFeedback(`কাস্টম আয় ${formatCurrency(num, useBengaliDigits)} যুক্ত হয়েছে`);

    setIncomeAmount('');
    setIncomeDesc('');
  };

  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(expenseAmount);
    if (isNaN(num) || num <= 0) return;

    const desc = expenseDesc.trim() || 'অন্যান্য দোকান খরচ';
    onAddTransaction('expense', num, expenseCategory, desc);
    showFeedback(`কাস্টম খরচ ${formatCurrency(num, useBengaliDigits)} যুক্ত হয়েছে`);

    setExpenseAmount('');
    setExpenseDesc('');
  };

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>দ্রুত ক্যাশ এন্ট্রি</span>
          </h2>
          <p className="text-xs text-slate-500">
            দোকানের প্রতিদিনের ছোট খাটো বিক্রি এক ক্লিকে যুক্ত করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {presetsToUse.map((preset) => {
          const Icon = getIcon(preset.iconName);
          const colorClass = getColorClasses(preset.color);
          return (
            <div
              key={preset.id}
              className={`p-3 rounded-lg border ${colorClass} transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 opacity-80 shrink-0" />
                  <span className="text-xs font-bold leading-tight">
                    {preset.title}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {preset.amounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() =>
                      handlePresetClick(preset.category, amt, preset.title)
                    }
                    className="px-2 py-1 bg-white/90 hover:bg-white border border-slate-200/80 hover:border-emerald-500 text-slate-800 rounded font-bold text-xs shadow-2xs hover:shadow-xs transition-all text-center"
                  >
                    +{formatCurrency(amt, useBengaliDigits)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Fast Forms Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custom Income Card */}
        <form
          onSubmit={handleAddIncome}
          className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700 bg-emerald-200/80 rounded-full p-0.5" />
              <span>কাস্টম আয় এন্ট্রি (অন্যান্য বিক্রি/জমা):</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
              + আয় (Income)
            </span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={incomeCategory}
                onChange={(e) => setIncomeCategory(e.target.value as CategoryType)}
                className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {incomeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="টাকা (৳)"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                required
                className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="বিবরণ (যেমন: এ৪ কাগজ ২ রিম / সেবা বিক্রি)"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                className="flex-1 text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!incomeAmount}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ আয় জমা</span>
              </button>
            </div>
          </div>
        </form>

        {/* Custom Expense Card */}
        <form
          onSubmit={handleAddExpense}
          className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-3.5 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <span className="w-4 h-4 text-rose-700 bg-rose-200/80 rounded-full flex items-center justify-center font-bold text-xs">
                -
              </span>
              <span>কাস্টম ব্যয় এন্ট্রি (অন্যান্য দোকান খরচ):</span>
            </span>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-200/60 px-2 py-0.5 rounded">
              - খরচ (Expense)
            </span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as CategoryType)}
                className="w-full text-xs bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="টাকা (৳)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                required
                className="w-full text-xs bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="বিবরণ (যেমন: দোকান ভাড়া / বিদ্যুৎ বিল / চা খরচ)"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="flex-1 text-xs bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!expenseAmount}
                className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>- খরচ জমা</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
