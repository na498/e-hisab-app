import { Transaction, CustomerDue, ShopInfo, UserSettings, AppNotification } from '../types';
import {
  INITIAL_SHOP_INFO,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_CUSTOMER_DUES,
  INITIAL_NOTIFICATIONS,
} from '../data/sampleData';

const KEYS = {
  TRANSACTIONS: 'e_hisab_transactions_v1',
  CUSTOMER_DUES: 'e_hisab_customer_dues_v1',
  SHOP_INFO: 'e_hisab_shop_info_v1',
  SETTINGS: 'e_hisab_settings_v1',
  NOTIFICATIONS: 'e_hisab_notifications_v1',
  LAST_SYNC: 'e_hisab_last_sync_v1',
};

export function calculateRunningBalances(transactions: Transaction[]): Transaction[] {
  if (!Array.isArray(transactions)) return [];
  const valid = transactions.filter((t) => t && typeof t === 'object');
  const sorted = [...valid].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA === dateB) {
      return (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
    }
    return dateA.localeCompare(dateB);
  });

  let runningCash = 0;
  return sorted.map((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      runningCash += amt;
    } else if (tx.type === 'expense') {
      runningCash -= amt;
    }
    return {
      ...tx,
      cashBalance: runningCash,
    };
  });
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? calculateRunningBalances(parsed) : [];
  } catch (err) {
    console.error('Error loading transactions', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]) {
  try {
    const withBalances = calculateRunningBalances(transactions || []);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(withBalances));
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Error saving transactions', err);
  }
}

export function loadCustomerDues(): CustomerDue[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOMER_DUES);
    if (!raw) {
      saveCustomerDues([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    console.error('Error loading customer dues', err);
    return [];
  }
}

export function saveCustomerDues(dues: CustomerDue[]) {
  try {
    localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(dues || []));
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Error saving customer dues', err);
  }
}

export function loadShopInfo(): ShopInfo {
  try {
    const raw = localStorage.getItem(KEYS.SHOP_INFO);
    if (!raw) {
      saveShopInfo(INITIAL_SHOP_INFO);
      return INITIAL_SHOP_INFO;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...INITIAL_SHOP_INFO, ...parsed } : INITIAL_SHOP_INFO;
  } catch (err) {
    return INITIAL_SHOP_INFO;
  }
}

export function saveShopInfo(info: ShopInfo) {
  try {
    localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(info));
  } catch (err) {
    console.error('Error saving shop info', err);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...INITIAL_SETTINGS, ...parsed } : INITIAL_SETTINGS;
  } catch (err) {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!raw) {
      saveNotifications([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  try {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error saving notifications', err);
  }
}

export function getLastSyncTime(): string {
  return localStorage.getItem(KEYS.LAST_SYNC) || new Date().toISOString();
}

export function resetAllToDefault() {
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.removeItem(KEYS.CUSTOMER_DUES);
  localStorage.removeItem(KEYS.NOTIFICATIONS);
  localStorage.removeItem(KEYS.LAST_SYNC);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify([]));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
}
