import React, { useState, useEffect, useCallback } from 'react';
import {
  loadTransactions,
  saveTransactions,
  deleteTransactionFromSupabase, // 🟢 ডিলিট ফাংশন ইম্পোর্ট
  loadCustomerDues,
  saveCustomerDues,
  deleteCustomerFromSupabase, // 🟢 ডিলিট ফাংশন ইম্পোর্ট
  loadShopInfo,
  saveShopInfo,
  loadSettings,
  saveSettings,
  loadNotifications,
  saveNotifications,
  getLastSyncTime,
  supabase,
} from './utils/storage';
import {
  Transaction,
  CustomerDue,
  DueHistory,
  ShopInfo,
  UserSettings,
  AppNotification,
  CategoryType,
  TransactionType,
} from './types';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { DashboardOverview } from './components/DashboardOverview';
import { DailyLedger } from './components/DailyLedger';
import { DueDashboard } from './components/DueDashboard';
import { MonthlyReportPrint } from './components/MonthlyReportPrint';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { SettingsBackup } from './components/SettingsBackup';
import { TransactionFormModal } from './components/TransactionFormModal';
import { PinLockModal } from './components/PinLockModal';
import { LoginModal } from './components/LoginModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { formatShortMonthDay } from './utils/formatters';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerDues, setCustomerDues] = useState<CustomerDue[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopInfo>({
    name: 'ই-হিসাব',
    owner: '',
    phone: '',
    address: '',
    logo: ''
  });
  const [settings, setSettings] = useState<UserSettings>({
    pin: '1234',
    pinEnabled: false,
    authEnabled: true,
    adminPhone: '01810957959',
    adminPassword: '01810957959',
    useBengaliDigits: true,
    monthStartDay: 1,
    quickPresets: [],
    customCategories: [],
    customIncomeCategories: [],
    customExpenseCategories: [],
    hiddenCategories: []
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [lastSyncTime, setLastSyncTime] = useState<string>(getLastSyncTime());

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('e_hisab_admin_authenticated') === 'true';
  });

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('e_hisab_admin_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('e_hisab_admin_authenticated');
  };

  // 🔄 ডাটা লোড করার কেন্দ্রীয় ফাংশন (লাইভ সিঙ্কের জন্য)
  const fetchAllData = useCallback(async () => {
    try {
      const loadedTx = await loadTransactions();
      setTransactions(loadedTx || []);

      const loadedDues = await loadCustomerDues();
      setCustomerDues(loadedDues || []);

      const loadedShop = await loadShopInfo();
      if (loadedShop) setShopInfo(loadedShop);

      const loadedSet = await loadSettings();
      if (loadedSet) {
        setSettings(loadedSet);
        setIsLocked(Boolean(loadedSet?.pinEnabled));
      }

      setNotifications(loadNotifications() || []);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

// 🟢 ১. fetchAllData ফাংশনটি ঠিক এরকম হতে হবে
const fetchAllData = useCallback(async () => {
  try {
    // একসাথে সব ডাটা ফ্রেচ করা
    const [txData, duesData, shopData, settingsData] = await Promise.all([
      loadTransactions(),
      loadCustomerDues(),
      loadShopInfo(),
      loadSettings(),
    ]);

    // রিঅ্যাক্ট স্টেট আপডেট নিশ্চিত করা
    setTransactions(txData);
    setCustomerDues(duesData);
    setShopInfo(shopData);
    setSettings({ ...settingsData }); // New object reference to trigger re-render
  } catch (error) {
    console.error("Error fetching all data:", error);
  }
}, []);

// 🟢 ২. Realtime & Auto-Reconnect useEffect
useEffect(() => {
  // অ্যাপ লোড হলে প্রথম ফ্রেচ
  fetchAllData();

  // ⚡ Supabase Realtime Subscription
  const channel = supabase
    .channel('e-hisab-live-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('Realtime change detected:', payload);
        fetchAllData(); // যেকোনো টেবিলে (settings সহ) চেঞ্জ হলে সাথে সাথে রি-লোড হবে
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime sync connected!');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // কানেকশন ড্রপ করলে অটো রিকানেক্ট
        supabase.removeChannel(channel);
      }
    });

  // 📱 মোবাইল ব্যাকগ্রাউন্ড থেকে আবার সামনে আসলে বা স্ক্রিন অন হলে ফ্রেচ
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchAllData();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange); // বাড়তি ফোকাস লিসেনার

  return () => {
    supabase.removeChannel(channel);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
  };
}, [fetchAllData]);

  // Save Helpers
  const updateTransactions = useCallback(async (newTxList: Transaction[]) => {
    setTransactions(newTxList);
    await saveTransactions(newTxList);
    setLastSyncTime(new Date().toISOString());
  }, []);

  const updateCustomerDues = useCallback(async (newDuesList: CustomerDue[]) => {
    setCustomerDues(newDuesList);
    await saveCustomerDues(newDuesList);
    setLastSyncTime(new Date().toISOString());
  }, []);

  const updateShopInfoState = useCallback(async (info: ShopInfo) => {
    setShopInfo(info);
    await saveShopInfo(info);
    setLastSyncTime(new Date().toISOString());
  }, []);

  const updateSettingsState = useCallback(async (set: UserSettings) => {
    setSettings(set);
    await saveSettings(set);
    setLastSyncTime(new Date().toISOString());
  }, []);

  const updateNotificationsState = useCallback((notifs: AppNotification[]) => {
    setNotifications(notifs);
    saveNotifications(notifs);
  }, []);

  // Handlers for Transactions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    if (editingTx) {
      const updated = transactions.map((t) =>
        t.id === editingTx.id
          ? {
              ...t,
              ...txData,
            }
          : t
      );
      updateTransactions(updated);
      setEditingTx(null);
    } else {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        time: timeStr,
        ...txData,
        createdAt: Date.now(),
      };
      updateTransactions([...transactions, newTx]);
    }
  };

  const handleQuickAddTransaction = (
    type: TransactionType,
    amount: number,
    category: CategoryType,
    description: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const displayDateStr = formatShortMonthDay(
      todayStr,
      settings?.useBengaliDigits ?? true
    );

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      time: timeStr,
      displayDate: displayDateStr,
      type,
      amount,
      category,
      description,
      createdAt: Date.now(),
    };

    updateTransactions([...transactions, newTx]);
  };

  // 🔴১. ট্রানজ্যাকশন স্থায়ীভাবে ডিলিট করার আপডেট করা ফনশন
  const handleDeleteTransaction = async (id: string) => {
    const filtered = transactions.filter((t) => t.id !== id);
    setTransactions(filtered);
    await deleteTransactionFromSupabase(id); // Supabase DB থেকে মোছা হবে
  };

  // Handlers for Customer Dues
  const handleAddCustomer = (
    customerData: Omit<CustomerDue, 'id' | 'history' | 'lastUpdated'>
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newCustomer: CustomerDue = {
      id: `c_${Date.now()}`,
      ...customerData,
      lastUpdated: todayStr,
      history:
        customerData.totalDue > 0
          ? [
              {
                id: `h_${Date.now()}`,
                date: todayStr,
                amount: customerData.totalDue,
                type: 'due',
                description: 'প্রাথমিক বকেয়া বাকি',
              },
            ]
          : [],
    };

    updateCustomerDues([...customerDues, newCustomer]);
  };

  const handleRecordPayment = (
    customerId: string,
    amount: number,
    type: 'due' | 'payment',
    description: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const displayDateStr = formatShortMonthDay(
      todayStr,
      settings?.useBengaliDigits ?? true
    );

    const updatedDues = customerDues.map((c) => {
      if (c.id === customerId) {
        const newHistoryItem = {
          id: `h_${Date.now()}`,
          date: todayStr,
          amount,
          type,
          description,
        };

        const updatedHistory = [newHistoryItem, ...c.history];
        const newTotalDue = type === 'due' ? c.totalDue + amount : c.totalDue;
        const newTotalPaid = type === 'payment' ? c.totalPaid + amount : c.totalPaid;

        return {
          ...c,
          totalDue: newTotalDue,
          totalPaid: newTotalPaid,
          lastUpdated: todayStr,
          history: updatedHistory,
        };
      }
      return c;
    });

    updateCustomerDues(updatedDues);

    if (type === 'payment') {
      const targetCustomer = customerDues.find((c) => c.id === customerId);
      const customerName = targetCustomer ? targetCustomer.name : '';
      const customerPhone = targetCustomer ? targetCustomer.phone : '';

      const autoIncomeTx: Transaction = {
        id: `tx_${Date.now()}`,
        date: todayStr,
        time: timeStr,
        displayDate: displayDateStr,
        type: 'income',
        amount,
        category: 'বাকি আদায়',
        description: `বাকি আদায়: ${description}`,
        customerName,
        customerPhone,
        createdAt: Date.now(),
      };

      updateTransactions([...transactions, autoIncomeTx]);
    }
  };

  // 🔴২. কাস্টমার স্থায়ীভাবে ডিলিট করার আপডেট করা ফনশন
  const handleDeleteCustomer = async (id: string) => {
    const filtered = customerDues.filter((c) => c.id !== id);
    setCustomerDues(filtered);
    await deleteCustomerFromSupabase(id); // Supabase DB থেকে মোছা হবে
  };

  const handleUpdateCustomerPromiseDate = (
    customerId: string,
    newPromiseDate: string,
    reason?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetCust = customerDues.find((c) => c.id === customerId);
    if (!targetCust) return;

    const oldPromiseDate = targetCust.promiseDate;
    if (oldPromiseDate === newPromiseDate) return;

    const oldDateLabel = oldPromiseDate
      ? formatShortMonthDay(oldPromiseDate, settings?.useBengaliDigits ?? true)
      : 'কোনো তারিখ ছিল না';
    const newDateLabel = newPromiseDate
      ? formatShortMonthDay(newPromiseDate, settings?.useBengaliDigits ?? true)
      : 'তারিখ বাদ দেওয়া হয়েছে';

    const reasonSuffix = reason && reason.trim() ? ` (${reason.trim()})` : '';
    const historyDesc = newPromiseDate
      ? `পরিশোধের তারিখ পরিবর্তন: ${oldDateLabel} ➔ ${newDateLabel}${reasonSuffix}`
      : `পরিশোধের তারিখ বাতিল করা হয়েছে: (${oldDateLabel})${reasonSuffix}`;

    const newHistoryItem: DueHistory = {
      id: `h_${Date.now()}`,
      date: todayStr,
      amount: 0,
      type: 'reschedule',
      description: historyDesc,
    };

    const updated = customerDues.map((c) =>
      c.id === customerId
        ? {
            ...c,
            promiseDate: newPromiseDate || undefined,
            history: [newHistoryItem, ...(c.history || [])],
          }
        : c
    );

    updateCustomerDues(updated);
  };

  // Notifications logic
  useEffect(() => {
    if (!customerDues || customerDues.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    setNotifications((prevNotifs) => {
      const currentList = Array.isArray(prevNotifs) ? prevNotifs : [];

      const validNotifs = currentList.filter((n) => {
        if (!n || n.type !== 'due_alert') return true;

        const cust = customerDues.find((c) => {
          if (!c || !c.name) return false;
          return (
            (n.title && n.title.includes(c.name)) ||
            (n.message && n.message.includes(c.name))
          );
        });

        if (!cust) return false;
        const remainingDue = (cust.totalDue || 0) - (cust.totalPaid || 0);
        if (remainingDue <= 0) return false;
        if (!cust.promiseDate) return false;
        if (cust.promiseDate > todayStr) return false;

        if (n.id && n.id.startsWith('due_today_') && cust.promiseDate !== todayStr) {
          return false;
        }
        if (n.id && n.id.startsWith('due_overdue_') && cust.promiseDate >= todayStr) {
          return false;
        }

        return true;
      });

      const newNotifs: AppNotification[] = [];

      customerDues.forEach((customer) => {
        if (!customer) return;
        const remainingDue = (customer.totalDue || 0) - (customer.totalPaid || 0);
        if (remainingDue <= 0) return;

        if (customer.promiseDate) {
          if (customer.promiseDate === todayStr) {
            const notifId = `due_today_${customer.id}_${todayStr}`;
            if (!validNotifs.some((n) => n.id === notifId)) {
              newNotifs.push({
                id: notifId,
                title: `🔔 আজ পরিশোধের তারিখ: ${customer.name}`,
                message: `প্রিয় গ্রাহক ${customer.name}-এর ৳ ${remainingDue} টাকা পরিশোধ করার কথা রয়েছে।`,
                type: 'due_alert',
                read: false,
                date: todayStr,
              });
            }
          } else if (customer.promiseDate < todayStr) {
            const notifId = `due_overdue_${customer.id}_${todayStr}`;
            if (!validNotifs.some((n) => n.id === notifId)) {
              newNotifs.push({
                id: notifId,
                title: `⚠️ পরিশোধের তারিখ অতিক্রান্ত: ${customer.name}`,
                message: `গ্রাহক ${customer.name}-এর ৳ ${remainingDue} টাকা জমার তারিখ (${customer.promiseDate}) পার হয়েছে। তাগাদা দেওয়ার পরামর্শ দেওয়া হচ্ছে।`,
                type: 'due_alert',
                read: false,
                date: todayStr,
              });
            }
          }
        }
      });

      if (validNotifs.length === currentList.length && newNotifs.length === 0) {
        return currentList;
      }

      const updated = [...newNotifs, ...validNotifs];
      saveNotifications(updated);
      return updated;
    });
  }, [customerDues]);

  const handleDeleteHistoryItem = (customerId: string, historyId: string) => {
    const updatedDues = customerDues.map((c) => {
      if (c.id === customerId) {
        const historyList = c.history || [];
        const itemToDelete = historyList.find((h) => h.id === historyId);
        if (!itemToDelete) return c;

        const updatedHistory = historyList.filter((h) => h.id !== historyId);
        let newTotalDue = c.totalDue || 0;
        let newTotalPaid = c.totalPaid || 0;

        if (itemToDelete.type === 'due') {
          newTotalDue = Math.max(0, (c.totalDue || 0) - itemToDelete.amount);
        } else if (itemToDelete.type === 'payment') {
          newTotalPaid = Math.max(0, (c.totalPaid || 0) - itemToDelete.amount);
        }

        return {
          ...c,
          totalDue: newTotalDue,
          totalPaid: newTotalPaid,
          history: updatedHistory,
        };
      }
      return c;
    });

    updateCustomerDues(updatedDues);
  };

  const handleImportFullBackup = (data: {
    transactions: Transaction[];
    customerDues: CustomerDue[];
    shopInfo: ShopInfo;
    settings: UserSettings;
  }) => {
    if (data.transactions) updateTransactions(data.transactions);
    if (data.customerDues) updateCustomerDues(data.customerDues);
    if (data.shopInfo) updateShopInfoState(data.shopInfo);
    if (data.settings) updateSettingsState(data.settings);
  };

  const handleUnlock = (pin: string): boolean => {
    if (pin === settings.pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    updateNotificationsState(updated);
  };

  const handleClearAllNotifications = () => {
    updateNotificationsState([]);
  };

  const activeDueCount = (customerDues || []).filter(
    (c) => c && ((c.totalDue || 0) - (c.totalPaid || 0) > 0)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-200">
      {isLocked && (
        <PinLockModal settings={settings} onUnlock={handleUnlock} />
      )}

      {(settings?.authEnabled ?? true) && !isLoggedIn && (
        <LoginModal
          isOpen={true}
          onLoginSuccess={handleLoginSuccess}
          adminPhone={settings?.adminPhone || '01810957959'}
          adminPassword={settings?.adminPassword || '01810957959'}
          shopInfo={shopInfo}
        />
      )}

      <Header
        shopInfo={shopInfo}
        settings={settings}
        notifications={notifications}
        isOnline={isOnline}
        onOpenNewTx={() => {
          setEditingTx(null);
          setIsNewTxModalOpen(true);
        }}
        onLockApp={() => setIsLocked(true)}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onQuickPrint={() => setActiveTab('monthly_report')}
        activeTab={activeTab}
      />

      <div className="flex flex-col md:flex-row flex-1 max-w-[1400px] w-full mx-auto">
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueCount={activeDueCount}
          onLogout={handleLogout}
          authEnabled={settings?.authEnabled ?? true}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              transactions={transactions}
              customerDues={customerDues}
              onAddTransaction={handleQuickAddTransaction}
              onNavigateTab={setActiveTab}
              onOpenNewTxModal={() => {
                setEditingTx(null);
                setIsNewTxModalOpen(true);
              }}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
              quickPresets={settings?.quickPresets || []}
              customCategories={settings?.customCategories || []}
              customIncomeCategories={settings?.customIncomeCategories || []}
              customExpenseCategories={settings?.customExpenseCategories || []}
            />
          )}

          {activeTab === 'ledger' && (
            <DailyLedger
              transactions={transactions}
              shopInfo={shopInfo}
              onOpenNewTx={() => {
                setEditingTx(null);
                setIsNewTxModalOpen(true);
              }}
              onEditTx={(tx) => {
                setEditingTx(tx);
                setIsNewTxModalOpen(true);
              }}
              onDeleteTx={handleDeleteTransaction}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
              monthStartDay={settings?.monthStartDay || 1}
              customCategories={settings?.customCategories || []}
            />
          )}

          {activeTab === 'dues' && (
            <DueDashboard
              customerDues={customerDues}
              shopInfo={shopInfo}
              onAddCustomer={handleAddCustomer}
              onRecordPayment={handleRecordPayment}
              onDeleteCustomer={handleDeleteCustomer}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onUpdatePromiseDate={handleUpdateCustomerPromiseDate}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
            />
          )}

          {activeTab === 'monthly_report' && (
            <MonthlyReportPrint
              transactions={transactions}
              shopInfo={shopInfo}
              onDeleteTx={handleDeleteTransaction}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
              monthStartDay={settings?.monthStartDay || 1}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsCharts
              transactions={transactions}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsBackup
              shopInfo={shopInfo}
              onUpdateShopInfo={updateShopInfoState}
              settings={settings}
              onUpdateSettings={updateSettingsState}
              transactions={transactions}
              customerDues={customerDues}
              onImportFullBackup={handleImportFullBackup}
              lastSyncTime={lastSyncTime}
              useBengaliDigits={settings?.useBengaliDigits ?? true}
            />
          )}
        </main>
      </div>

      <TransactionFormModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTx}
        useBengaliDigits={settings?.useBengaliDigits ?? true}
        customCategories={settings?.customCategories || []}
        customIncomeCategories={settings?.customIncomeCategories || []}
        customExpenseCategories={settings?.customExpenseCategories || []}
        hiddenCategories={settings?.hiddenCategories || []}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onClearAll={handleClearAllNotifications}
      />

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header, nav, .print\\:hidden, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          #printable-monthly-sheet, #printable-memo, #printable-cash-memo {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}