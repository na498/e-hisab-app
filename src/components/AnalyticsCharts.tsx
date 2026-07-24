import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart2,
  DollarSign,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  useBengaliDigits: boolean;
}

const COLORS = [
  '#059669', // Emerald
  '#dc2626', // Rose
  '#d97706', // Amber
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#0284c7', // Sky
  '#e11d48', // Pink
  '#4d7c0f', // Lime
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  useBengaliDigits,
}) => {
  // Aggregate daily income vs expense
  const dailyData = useMemo(() => {
    const map: Record<
      string,
      { date: string; displayDate: string; income: number; expense: number; cash: number }
    > = {};

    transactions.forEach((tx) => {
      const key = tx.date;
      if (!map[key]) {
        map[key] = {
          date: key,
          displayDate: tx.displayDate || key,
          income: 0,
          expense: 0,
          cash: tx.cashBalance || 0,
        };
      }
      if (tx.type === 'income') {
        map[key].income += tx.amount;
      } else {
        map[key].expense += tx.amount;
      }
      map[key].cash = tx.cashBalance || map[key].cash;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  // Aggregate category-wise expenses
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.amount > 0) {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    });

    return Object.keys(map).map((cat) => ({
      name: cat,
      value: map[cat],
    }));
  }, [transactions]);

  // Key metrics
  const totalIncome = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc),
    0
  );
  const totalExpense = transactions.reduce(
    (acc, t) => (t.type === 'expense' ? acc + t.amount : acc),
    0
  );
  const highestExpenseCategory = expenseByCategory.sort(
    (a, b) => b.value - a.value
  )[0];

  return (
    <div className="space-y-6">
      {/* Top Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>মোট অর্জিত আয়</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(totalIncome, useBengaliDigits)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>মোট খরচ / ব্যয়</span>
          </div>
          <p className="text-2xl font-black text-rose-700">
            {formatCurrency(totalExpense, useBengaliDigits)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Award className="w-4 h-4 text-amber-500" />
            <span>সর্বোচ্চ খরচের খাত</span>
          </div>
          <p className="text-lg font-bold text-amber-900 truncate">
            {highestExpenseCategory
              ? `${highestExpenseCategory.name} (${formatCurrency(
                  highestExpenseCategory.value,
                  useBengaliDigits
                )})`
              : '—'}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Daily Area Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-700" />
                <span>দৈনিক আয় ও খরচের প্রবণতা (Income vs Expense)</span>
              </h3>
              <p className="text-xs text-slate-500">দিনভিত্তিক আয় এবং ব্যয়ের তুলনা</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) =>
                    formatCurrency(val, useBengaliDigits)
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="দৈনিক আয় (+)"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorInc)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="দৈনিক ব্যয় (-)"
                  stroke="#dc2626"
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-rose-700" />
                <span>খাতভিত্তিক খরচের বিশ্লেষণ (Expense Distribution)</span>
              </h3>
              <p className="text-xs text-slate-500">কোন খাতে কত টাকা ব্যয় হয়েছে</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {expenseByCategory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                কোনো খরচের ডেটা নেই।
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) =>
                      formatCurrency(val, useBengaliDigits)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Running Cash Balance Growth Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span>চলতি ক্যাশ জমার বৃদ্ধি (Cash Balance Flow)</span>
              </h3>
              <p className="text-xs text-slate-500">
                সময়ের সাথে সাথে দোকানের ক্যাশ জমার পরিমাণ বৃদ্ধি
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) =>
                    formatCurrency(val, useBengaliDigits)
                  }
                />
                <Bar
                  dataKey="cash"
                  name="ক্যাশ ব্যালেন্স (৳)"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
