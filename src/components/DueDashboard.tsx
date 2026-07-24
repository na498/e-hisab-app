import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  PhoneCall,
  MessageSquare,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  UserPlus,
  X,
  Trash2,
  Receipt,
  Clock,
  Calendar,
} from 'lucide-react';
import { CustomerDue, DueHistory, ShopInfo } from '../types';
import {
  formatCurrency,
  toBengaliNumber,
  formatDateTime,
  formatSimpleDate,
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { CashMemoModal } from './CashMemoModal';

interface DueDashboardProps {
  customerDues: CustomerDue[];
  shopInfo: ShopInfo;
  onAddCustomer: (customer: Omit<CustomerDue, 'id' | 'history' | 'lastUpdated'>) => void;
  onRecordPayment: (
    customerId: string,
    amount: number,
    type: 'due' | 'payment',
    description: string
  ) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteHistoryItem?: (customerId: string, historyId: string) => void;
  onUpdatePromiseDate?: (customerId: string, promiseDate: string, reason?: string) => void;
  useBengaliDigits: boolean;
}

export const DueDashboard: React.FC<DueDashboardProps> = ({
  customerDues,
  shopInfo,
  onAddCustomer,
  onRecordPayment,
  onDeleteCustomer,
  onDeleteHistoryItem,
  onUpdatePromiseDate,
  useBengaliDigits,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDue | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Promise Date Modal state
  const [promiseModalCust, setPromiseModalCust] = useState<CustomerDue | null>(null);
  const [promiseDateValue, setPromiseDateValue] = useState<string>('');
  const [promiseReason, setPromiseReason] = useState<string>('');

  // Deletion modals state
  const [deleteCustId, setDeleteCustId] = useState<string | null>(null);
  const [deleteHistData, setDeleteHistData] = useState<{
    customerId: string;
    historyId: string;
  } | null>(null);

  // Cash Memo state
  const [memoData, setMemoData] = useState<{
    customerName: string;
    customerPhone: string;
    amount: number;
    description: string;
  } | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);

  // New Customer Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [initialDue, setInitialDue] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPromiseDate, setNewPromiseDate] = useState('');

  // Payment/Due Form
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'payment' | 'due'>('payment');
  const [payDesc, setPayDesc] = useState('');

  // Sync selectedCustomer with customerDues state updates
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customerDues.find((c) => c.id === selectedCustomer.id);
      if (updated) {
        setSelectedCustomer(updated);
      }
    }
  }, [customerDues]);

  // Filtered
  const filteredCustomers = customerDues.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Totals
  const totalDuesOutstanding = customerDues.reduce(
    (acc, c) => acc + (c.totalDue - c.totalPaid),
    0
  );
  const totalPaidSum = customerDues.reduce((acc, c) => acc + c.totalPaid, 0);
  const activeDueCount = customerDues.filter(
    (c) => c.totalDue - c.totalPaid > 0
  ).length;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const dueAmt = parseFloat(initialDue) || 0;
    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      totalDue: dueAmt,
      totalPaid: 0,
      notes: newNotes.trim(),
      promiseDate: newPromiseDate ? newPromiseDate : undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setInitialDue('');
    setNewNotes('');
    setNewPromiseDate('');
    setShowAddModal(false);
  };

  const handleSavePromiseDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (promiseModalCust && onUpdatePromiseDate) {
      onUpdatePromiseDate(promiseModalCust.id, promiseDateValue, promiseReason);
      setPromiseModalCust(null);
      setPromiseReason('');
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    const descText = payDesc.trim() || (payType === 'payment' ? 'বাকি নগদ জমা' : 'নতুন বাকি পণ্য/সেবা');

    onRecordPayment(
      selectedCustomer.id,
      amt,
      payType,
      descText
    );

    // If payment recorded, trigger cash memo option
    if (payType === 'payment') {
      setMemoData({
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        amount: amt,
        description: `বাকি আদায়: ${descText}`,
      });
      setIsMemoOpen(true);
    }

    setPayAmount('');
    setPayDesc('');
    setShowPaymentModal(false);
  };

  const handleConfirmDeleteCustomer = () => {
    if (deleteCustId) {
      onDeleteCustomer(deleteCustId);
      setDeleteCustId(null);
      if (selectedCustomer?.id === deleteCustId) {
        setSelectedCustomer(null);
      }
    }
  };

  const handleConfirmDeleteHistory = () => {
    if (deleteHistData && onDeleteHistoryItem) {
      onDeleteHistoryItem(deleteHistData.customerId, deleteHistData.historyId);
      setDeleteHistData(null);
      
      // Update local view
      if (selectedCustomer) {
        setSelectedCustomer({
          ...selectedCustomer,
          history: selectedCustomer.history.filter((h) => h.id !== deleteHistData.historyId),
        });
      }
    }
  };

  const generateWhatsAppMessage = (customer: CustomerDue) => {
    const dueAmount = customer.totalDue - customer.totalPaid;
    const text = `প্রিয় ${customer.name} সাহেব, আসসালামু আলাইকুম। আমাদের ${shopInfo.shopName || 'ফটোকপি সেন্টারে'} আপনার বকেয়া বাকির পরিমাণ ৳ ${dueAmount} টাকা। অনুগ্রহ করে সুবিধাজনক সময়ে পরিশোধের অনুরোধ করা হচ্ছে। ধন্যবাদ।`;
    const encoded = encodeURIComponent(text);
    return `https://wa.me/880${customer.phone.replace(/^0/, '')}?text=${encoded}`;
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-800">মোট বকেয়া (Total Dues)</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {formatCurrency(totalDuesOutstanding, useBengaliDigits)}
            </p>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-emerald-800">মোট পরিশোধিত বাকি</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {formatCurrency(totalPaidSum, useBengaliDigits)}
            </p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-blue-800">বাকি থাকা খরিদ্দার</p>
            <p className="text-2xl font-black text-blue-950 mt-1">
              {toBengaliNumber(activeDueCount, useBengaliDigits)} জন
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, ফোন নম্বর বা ঠিকানা দিয়ে খাতা খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          id="due-add-customer-btn"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>নতুন বাকি খরিদ্দার</span>
        </button>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
            কোনো বকেয়া খরিদ্দার পাওয়া যায়নি।
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const currentDue = customer.totalDue - customer.totalPaid;
            const isCleared = currentDue <= 0;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">
                        {customer.name}
                      </h3>
                      {customer.phone && (
                        <p className="text-xs text-slate-600 font-bold flex items-center gap-1 mt-1">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                      {customer.address && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {customer.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          isCleared
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isCleared ? 'পরিশোধিত' : 'বাকি আছে'}
                      </span>
                      <button
                        onClick={() => setDeleteCustId(customer.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="গ্রাহকের খাতা মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl mb-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">
                        মোট বাকি ধরা:
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {formatCurrency(customer.totalDue, useBengaliDigits)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">
                        পরিশোধিত:
                      </span>
                      <span className="font-bold text-emerald-700 text-xs">
                        {formatCurrency(customer.totalPaid, useBengaliDigits)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold text-slate-500">
                      বর্তমান অবশিষ্ট বাকি:
                    </span>
                    <p className="text-2xl font-black text-rose-700 mt-0.5">
                      {formatCurrency(currentDue, useBengaliDigits)}
                    </p>
                  </div>

                  {/* Promised Date Badge */}
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (!customer.promiseDate) {
                      return (
                        <div className="mb-3 flex items-center justify-between bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs">
                          <span className="text-slate-400 font-medium">কোনো জমার তারিখ দেওয়া নেই</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPromiseModalCust(customer);
                              setPromiseDateValue('');
                              setPromiseReason('');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                          >
                            + তারিখ দিন
                          </button>
                        </div>
                      );
                    }

                    const isToday = customer.promiseDate === todayStr;
                    const isOverdue = customer.promiseDate < todayStr && currentDue > 0;

                    return (
                      <div
                        className={`mb-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                          isToday
                            ? 'bg-amber-100/90 text-amber-950 border-amber-300 shadow-2xs animate-pulse'
                            : isOverdue
                            ? 'bg-rose-100/90 text-rose-950 border-rose-300 shadow-2xs'
                            : 'bg-indigo-50/90 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${isToday ? 'text-amber-700' : isOverdue ? 'text-rose-700' : 'text-indigo-600'}`} />
                          <span>
                            {isToday
                              ? `আজ পরিশোধের দিন! (${formatSimpleDate(customer.promiseDate, useBengaliDigits)})`
                              : isOverdue
                              ? `পরিশোধের মেয়াদ উত্তীর্ণ! (${formatSimpleDate(customer.promiseDate, useBengaliDigits)})`
                              : `জমা দেওয়ার প্রতিশ্রুতি: ${formatSimpleDate(customer.promiseDate, useBengaliDigits)}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPromiseModalCust(customer);
                            setPromiseDateValue(customer.promiseDate || '');
                            setPromiseReason('');
                          }}
                          className="text-[11px] underline ml-1 hover:opacity-80 cursor-pointer shrink-0"
                        >
                          পরিবর্তন
                        </button>
                      </div>
                    );
                  })()}

                  {customer.notes && (
                    <p className="text-xs text-slate-600 font-medium italic bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl mb-3">
                      নোট: {customer.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {/* WhatsApp Reminder */}
                    {customer.phone && currentDue > 0 && (
                      <a
                        href={generateWhatsAppMessage(customer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        title="হোয়াটসঅ্যাপে তাগাদা পাঠান"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">তাগাদা</span>
                      </a>
                    )}

                    {/* History */}
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="হিস্ট্রি ও বিস্তারিত"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>হিস্ট্রি</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowPaymentModal(true);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>জমা / নতুন বাকি</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                নতুন বাকি খরিদ্দার যোগ করুন
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  গ্রাহকের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="01711000000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ঠিকানা / প্রতিষ্ঠান
                </label>
                <input
                  type="text"
                  placeholder="যেমন: চাম্পাফুল বাজার"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রাথমিক বকেয়া বাকি (৳)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্রশ্নপত্র ৫ সেট বাকি"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>টাকা জমা দেওয়ার তারিখ (সংকেত/নোটিফিকেশন)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">ঐচ্ছিক</span>
                </label>
                <input
                  type="date"
                  value={newPromiseDate}
                  onChange={(e) => setNewPromiseDate(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promise Date Change Modal */}
      {promiseModalCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  পরিশোধের প্রতিশ্রুতি তারিখ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPromiseModalCust(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePromiseDate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  গ্রাহকের নাম: <span className="text-emerald-800">{promiseModalCust.name}</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  এই তারিখে গ্রাহক বাকি টাকা পরিশোধ করার কথা দিলে নির্বাচন করুন। তারিখ পরিবর্তন করলে সিস্টেমে নোটিফিকেশন আপডেট হবে এবং হিস্টোরিতে সংরক্ষিত থাকবে।
                </p>
                <input
                  type="date"
                  required
                  value={promiseDateValue}
                  onChange={(e) => setPromiseDateValue(e.target.value)}
                  className="w-full text-base bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 mb-3"
                />
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কারণ / মন্তব্য (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ২ দিন পর পরিশোধ করার সময় চেয়েছেন"
                  value={promiseReason}
                  onChange={(e) => setPromiseReason(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {promiseModalCust.promiseDate && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdatePromiseDate) {
                        onUpdatePromiseDate(promiseModalCust.id, '');
                      }
                      setPromiseModalCust(null);
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    তারিখ বাদ দিন
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setPromiseModalCust(null)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment or Additional Due Entry Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {selectedCustomer.name} - বাকি লেনদেন
                </h3>
                <p className="text-xs text-amber-300 font-bold mt-0.5">
                  বর্তমান অবশিষ্ট: {formatCurrency(selectedCustomer.totalDue - selectedCustomer.totalPaid, useBengaliDigits)}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  লেনদেনের প্রকার
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayType('payment')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border ${
                      payType === 'payment'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    + বাকি জমা (Payment)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayType('due')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border ${
                      payType === 'due'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    - নতুন বাকি (Add Due)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-lg bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ক্যাশ জমার রশিদ / ফটোকপি বাকি"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  সংরক্ষণ ও মেমো
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {selectedCustomer && !showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {selectedCustomer.name} - বাকি রেজিস্টার
                </h3>
                <p className="text-xs text-amber-300 font-bold mt-0.5">
                  মোবাইল: {selectedCustomer.phone || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl flex justify-between border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">মোট বাকি:</span>
                  <span className="font-black text-slate-900">
                    {formatCurrency(selectedCustomer.totalDue, useBengaliDigits)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">মোট জমা:</span>
                  <span className="font-black text-emerald-700">
                    {formatCurrency(selectedCustomer.totalPaid, useBengaliDigits)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">অবশিষ্ট:</span>
                  <span className="font-black text-rose-700">
                    {formatCurrency(
                      selectedCustomer.totalDue - selectedCustomer.totalPaid,
                      useBengaliDigits
                    )}
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
                লেনদেনের ইতিহাস (History Logs):
              </h4>

              <div className="space-y-2">
                {(!selectedCustomer.history || selectedCustomer.history.length === 0) ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    কোনো হিস্ট্রি রেকর্ডিং পাওয়া যায়নি।
                  </p>
                ) : (
                  selectedCustomer.history.map((h) => {
                    const isPayment = h.type === 'payment';
                    const isReschedule = h.type === 'reschedule';
                    return (
                      <div
                        key={h.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isReschedule
                            ? 'bg-blue-50/70 border-blue-200/90'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isReschedule && (
                              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span>{h.description}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatSimpleDate(h.date, useBengaliDigits)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isReschedule ? (
                            <span className="bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap">
                              তারিখ পরিবর্তন
                            </span>
                          ) : (
                            <div
                              className={`font-black text-sm ${
                                isPayment ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isPayment ? '+' : '-'}
                              {formatCurrency(h.amount, useBengaliDigits)}
                            </div>
                          )}
                          {onDeleteHistoryItem && (
                            <button
                              onClick={() =>
                                setDeleteHistData({
                                  customerId: selectedCustomer.id,
                                  historyId: h.id,
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="হিস্ট্রি আইটেম ডিলিট"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteCustId}
        title="গ্রাহকের খাতা মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে আপনি এই কাস্টমারের সমস্ত বাকি হিসাব মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDeleteCustomer}
        onClose={() => setDeleteCustId(null)}
      />

      {/* Delete History Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteHistData}
        title="হিস্ট্রি এন্ট্রি মুছে ফেলা"
        message="আপনি কি এই বাকি/জমা এনট্রিটি বাতিল করতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDeleteHistory}
        onClose={() => setDeleteHistData(null)}
      />

      {/* Cash Memo Printable Modal */}
      <CashMemoModal
        isOpen={isMemoOpen}
        onClose={() => {
          setIsMemoOpen(false);
          setMemoData(null);
        }}
        shopInfo={shopInfo}
        transaction={
          memoData
            ? {
                id: `memo_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                displayDate: new Date().toLocaleDateString('bn-BD'),
                type: 'income',
                amount: memoData.amount,
                category: 'বাকি আদায়',
                description: memoData.description,
                customerName: memoData.customerName,
                customerPhone: memoData.customerPhone,
                createdAt: Date.now(),
              }
            : null
        }
        useBengaliDigits={useBengaliDigits}
      />
    </div>
  );
};
