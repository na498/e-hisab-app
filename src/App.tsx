import React, { useState, useEffect, useCallback } from 'react';
import {
  loadTransactions,
  saveTransactions,
  loadCustomerDues,
  saveCustomerDues,
  loadShopInfo,
  saveShopInfo,
  loadSettings,
  saveSettings,
  loadNotifications,
  saveNotifications,
  getLastSyncTime,
} from './utils/storage';
import {
  Transaction,
  CustomerDue,
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
  const [shopInfo, setShopInfo] = useState<ShopInfo>(loadShopInfo());
  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>(getLastSyncTime());

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(settings.pinEnabled);
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

  // Load Initial Data directly using storage helpers (Supabase / Local)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const txs = await loadTransactions();
        setTransactions(txs || []);

        const dues = await loadCustomerDues();
        setCustomerDues(dues || []);

        const shop = loadShopInfo();
        setShopInfo(shop);

        const set = loadSettings();
        setSettings(set);
        setIsLocked(set.pinEnabled);
      } catch (err) {
        console.warn('Data load error:', err);
      }
    };

    fetchInitialData();
    setNotifications(loadNotifications());
  }, []);

  // Window Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOffline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save Helpers (updates local state + Supabase storage)
  const updateTransactions = useCallback(async (newTxList: Transaction[]) => {
    setTransactions(newTxList);
    setLastSyncTime(new Date().toISOString());
    await saveTransactions(newTxList);
  }, []);

  const updateCustomerDues = useCallback(async (newDues: CustomerDue[]) => {
    setCustomerDues(newDues);
    setLastSyncTime(new Date().toISOString());
    await saveCustomerDues(newDues);
  }, []);

  const updateShopInfoState = useCallback((info: ShopInfo) => {
    setShopInfo(info);
    saveShopInfo(info);
  }, []);

  const updateSettingsState = useCallback((set: UserSettings) => {
    setSettings(set);
    saveSettings(set);
  }, []);

  const updateNotificationsState = useCallback((notifs: AppNotification[]) => {
    setNotifications(notifs);
    saveNotifications(notifs);
  }, []);

  // Handlers for Transactions
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const formattedTxData = {
      ...txData,
      amount: Number(txData.amount) || 0,
    };

    if (editingTx) {
      // Edit
      const updated = transactions.map((t) =>
        t.id === editingTx.id
          ? {
              ...t,
              ...formattedTxData,
            }
          : t
      );
      await updateTransactions(updated);
      setEditingTx(null);
    } else {
      // New
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        time: timeStr,
        ...formattedTxData,
        createdAt: Date.now(),
      };

      await updateTransactions([newTx, ...transactions]);
    }
  };

  const handleQuickAddTransaction = async (
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
      settings.useBengaliDigits
    );

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      time: timeStr,
      displayDate: displayDateStr,
      type,
      amount: Number(amount) || 0,
      category,
      description,
      createdAt: Date.now(),
    };

    // 🚀 Async await দিয়ে নতুন লেনদেনটি তালিকার শুরুতে সেভ করা হচ্ছে
    await updateTransactions([newTx, ...transactions]);
  };

  const handleDeleteTransaction = async (id: string) => {
    const filtered = transactions.filter((t) => t.id !== id);
    await updateTransactions(filtered);
  };

  // Handlers for Customer Dues
  const handleAddCustomer = async (
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

    await updateCustomerDues([...customerDues, newCustomer]);
  };

  const handleRecordPayment = async (
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
      settings.useBengaliDigits
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

    await updateCustomerDues(updatedDues);

    // If payment collected, automatically log income into cash ledger
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

      await updateTransactions([autoIncomeTx, ...transactions]);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const filtered = customerDues.filter((c) => c.id !== id);
    await updateCustomerDues(filtered);
  };

  const handleUpdateCustomerPromiseDate = async (customerId: string, promiseDate: string) => {
    const updated = customerDues.map((c) =>
      c.id === customerId ? { ...c, promiseDate } : c
    );
    await updateCustomerDues(updated);
  };

  // Check customer promise dates and generate notifications
  useEffect(() => {
    if (customerDues.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedNotifs: AppNotification[] = [];

    customerDues.forEach((customer) => {
      const remainingDue = customer.totalDue - customer.totalPaid;
      if (remainingDue <= 0) return;

      if (customer.promiseDate) {
        if (customer.promiseDate === todayStr) {
          const notifId = `due_today_${customer.id}_${todayStr}`;
          if (!notifications.some((n) => n.id === notifId)) {
            generatedNotifs.push({
              id: notifId,
              title: `🔔 আজ পরিশোধের তারিখ: ${customer.name}`,
              message: `প্রিয় গ্রাহক ${customer.name}-এর ৳ ${remainingDue} টাকা পরিশোধ করার কথা রয়েছে।`,
              type: 'due_alert',
              read: false,
              date: new Date().toISOString().split('T')[0],
            });
          }
        } else if (customer.promiseDate < todayStr) {
          const notifId = `due_overdue_${customer.id}_${todayStr}`;
          if (!notifications.some((n) => n.id === notifId)) {
            generatedNotifs.push({
              id: notifId,
              title: `⚠️ পরিশোধের তারিখ অতিক্রান্ত: ${customer.name}`,
              message: `গ্রাহক ${customer.name}-এর ৳ ${remainingDue} টাকা জমার তারিখ (${customer.promiseDate}) পার হয়েছে। তাগাদা দেওয়ার পরামর্শ দেওয়া হচ্ছে।`,
              type: 'due_alert',
              read: false,
              date: new Date().toISOString().split('T')[0],
            });
          }
        }
      }
    });

    if (generatedNotifs.length > 0) {
      updateNotificationsState([...generatedNotifs, ...notifications]);
    }
  }, [customerDues, notifications, updateNotificationsState]);

  const handleDeleteHistoryItem = async (customerId: string, historyId: string) => {
    const updatedDues = customerDues.map((c) => {
      if (c.id === customerId) {
        const itemToDelete = c.history.find((h) => h.id === historyId);
        if (!itemToDelete) return c;

        const updatedHistory = c.history.filter((h) => h.id !== historyId);
        let newTotalDue = c.totalDue;
        let newTotalPaid = c.totalPaid;

        if (itemToDelete.type === 'due') {
          newTotalDue = Math.max(0, c.totalDue - itemToDelete.amount);
        } else if (itemToDelete.type === 'payment') {
          newTotalPaid = Math.max(0, c.totalPaid - itemToDelete.amount);
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

    await updateCustomerDues(updatedDues);
  };

  const handleImportFullBackup = (data: {
    transactions: Transaction[];
    customerDues: CustomerDue[];
    shopInfo: ShopInfo;
    settings: UserSettings;
  }) => {
    updateTransactions(data.transactions);
    updateCustomerDues(data.customerDues);
    updateShopInfoState(data.shopInfo);
    updateSettingsState(data.settings);
  };

  // Lock unlock handler
  const handleUnlock = (pin: string): boolean => {
    if (pin === settings.pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    updateNotificationsState(updated);
  };

  const handleClearAllNotifications = () => {
    updateNotificationsState([]);
  };

  // Calculate due count
  const activeDueCount = customerDues.filter(
    (c) => c.totalDue - c.totalPaid > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-200">
      {/* Security Pin Lock */}
      {isLocked && (
        <PinLockModal settings={settings} onUnlock={handleUnlock} />
      )}

      {/* Login Auth Modal */}
      {(settings.authEnabled ?? true) && !isLoggedIn && (
        <LoginModal
          isOpen={true}
          onLoginSuccess={handleLoginSuccess}
          adminPhone={settings.adminPhone || '01810957959'}
          adminPassword={settings.adminPassword || '01810957959'}
          shopInfo={shopInfo}
        />
      )}

      {/* Main App Bar */}
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

      {/* Main Container with Left Sidebar Navigation */}
      <div className="flex flex-col md:flex-row flex-1 max-w-[1400px] w-full mx-auto">
        {/* Navigation Left Sidebar */}
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueCount={activeDueCount}
          onLogout={handleLogout}
          authEnabled={settings.authEnabled ?? true}
        />

        {/* Primary Page Content */}
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
              useBengaliDigits={settings.useBengaliDigits}
              quickPresets={settings.quickPresets}
              customCategories={settings.customCategories}
              customIncomeCategories={settings.customIncomeCategories}
              customExpenseCategories={settings.customExpenseCategories}
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
              useBengaliDigits={settings.useBengaliDigits}
              monthStartDay={settings.monthStartDay}
              customCategories={settings.customCategories}
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
              useBengaliDigits={settings.useBengaliDigits}
            />
          )}

          {activeTab === 'monthly_report' && (
            <MonthlyReportPrint
              transactions={transactions}
              shopInfo={shopInfo}
              onDeleteTx={handleDeleteTransaction}
              useBengaliDigits={settings.useBengaliDigits}
              monthStartDay={settings.monthStartDay}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsCharts
              transactions={transactions}
              useBengaliDigits={settings.useBengaliDigits}
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
              useBengaliDigits={settings.useBengaliDigits}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <TransactionFormModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTx}
        useBengaliDigits={settings.useBengaliDigits}
        customCategories={settings.customCategories}
        customIncomeCategories={settings.customIncomeCategories}
        customExpenseCategories={settings.customExpenseCategories}
        hiddenCategories={settings.hiddenCategories}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onClearAll={handleClearAllNotifications}
      />

      {/* Print Footer Styles */}
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