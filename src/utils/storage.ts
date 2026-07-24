import { supabase } from './supabase';
import { Transaction, CustomerDue, ShopInfo, UserSettings, AppNotification } from '../types';
import {
  INITIAL_SHOP_INFO,
  INITIAL_SETTINGS,
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
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => {
    if (a.date === b.date) {
      return a.createdAt - b.createdAt;
    }
    return a.date.localeCompare(b.date);
  });

  let runningCash = 0;
  return sorted.map((tx) => {
    if (tx.type === 'income') {
      runningCash += Number(tx.amount || 0);
    } else if (tx.type === 'expense') {
      runningCash -= Number(tx.amount || 0);
    }
    return {
      ...tx,
      cashBalance: runningCash,
    };
  });
}

// --- TRANSACTIONS ---
export async function loadTransactions(): Promise<Transaction[]> {
  try {
    // ১. প্রথমে Supabase থেকে ডাটা আনার চেষ্টা
    const { data: dbData, error } = await supabase.from('transactions').select('*');

    if (!error && dbData && dbData.length > 0) {
      const formattedTx: Transaction[] = dbData.map((row) => ({
        id: row.id,
        date: row.date || '',
        time: row.time || '',
        displayDate: row.display_date || '',
        type: row.type || 'income',
        amount: Number(row.amount) || 0,
        category: row.category || '',
        description: row.description || '',
        customerName: row.customer_name || '',
        customerPhone: row.customer_phone || '',
        createdAt: Number(row.created_at) || Date.now(),
      }));

      const withBalances = calculateRunningBalances(formattedTx);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(withBalances));
      return withBalances;
    }

    // ২. ফলব্যাক হিসেবে LocalStorage থেকে ডাটা নেওয়া
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (raw) {
      const parsed: Transaction[] = JSON.parse(raw);
      return calculateRunningBalances(parsed);
    }

    return [];
  } catch (err) {
    console.error('Error loading transactions', err);
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]) {
  try {
    const withBalances = calculateRunningBalances(transactions);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(withBalances));
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());

    // 🚀 সরাসরি Supabase টেবিলে Upsert (Insert/Update) করা
    const payload = withBalances.map((tx) => ({
      id: tx.id,
      date: tx.date,
      time: tx.time,
      display_date: tx.displayDate,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      customer_name: tx.customerName || null,
      customer_phone: tx.customerPhone || null,
      created_at: tx.createdAt,
    }));

    const { error } = await supabase.from('transactions').upsert(payload);

    if (error) {
      console.error('Supabase Sync Error (Transactions):', error.message);
    } else {
      console.log('Successfully synced transactions to Supabase!');
    }
  } catch (err) {
    console.error('Error saving transactions', err);
  }
}

// --- CUSTOMER DUES ---
export async function loadCustomerDues(): Promise<CustomerDue[]> {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOMER_DUES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading customer dues', err);
    return [];
  }
}

export async function saveCustomerDues(dues: CustomerDue[]) {
  try {
    localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(dues));
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Error saving customer dues', err);
  }
}

// --- SHOP INFO ---
export function loadShopInfo(): ShopInfo {
  try {
    const raw = localStorage.getItem(KEYS.SHOP_INFO);
    if (!raw) {
      saveShopInfo(INITIAL_SHOP_INFO);
      return INITIAL_SHOP_INFO;
    }
    return JSON.parse(raw);
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

// --- SETTINGS ---
export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return JSON.parse(raw);
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

// --- NOTIFICATIONS ---
export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!raw) {
      saveNotifications([]);
      return [];
    }
    return JSON.parse(raw);
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