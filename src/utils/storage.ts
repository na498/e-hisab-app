import { Transaction, CustomerDue, ShopInfo, UserSettings, AppNotification } from '../types';
import {
  INITIAL_SHOP_INFO,
  INITIAL_SETTINGS,
} from '../data/sampleData';
import { supabase } from './supabase'; // Supabase Client কানেক্ট করা হলো

const KEYS = {
  TRANSACTIONS: 'e_hisab_transactions_v1',
  CUSTOMER_DUES: 'e_hisab_customer_dues_v1',
  SHOP_INFO: 'e_hisab_shop_info_v1',
  SETTINGS: 'e_hisab_settings_v1',
  NOTIFICATIONS: 'e_hisab_notifications_v1',
  LAST_SYNC: 'e_hisab_last_sync_v1',
};

// রানিং ব্যালেন্স ক্যালকুলেশন
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

/* ==========================================
   ১. লেনদেন (TRANSACTIONS)
========================================== */
export async function loadTransactions(): Promise<Transaction[]> {
  try {
    // সরাসরি Supabase থেকে ডেটা আনা হচ্ছে
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const formattedData = calculateRunningBalances(data);
      // ব্যাকআপের জন্য লোকাল স্টোরেজেও রেখে দেওয়া
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(formattedData));
      return formattedData;
    }

    // Supabase ফাঁকা থাকলে লোকাল থেকে ট্রাই করবে
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  } catch (err) {
    console.error("Error loading transactions from Supabase, fetching local fallback:", err);
    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    return local ? JSON.parse(local) : [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  try {
    const withBalances = calculateRunningBalances(transactions || []);

    // লোকাল স্টোরেজে দ্রুত আপডেট
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(withBalances));

    // Supabase ডাটাবেজে সেভ/আপডেট
    const { error } = await supabase
      .from('transactions')
      .upsert(withBalances, { onConflict: 'id' });

    if (error) {
      console.error("Supabase Save Error:", error.message);
    } else {
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.error("Error saving transactions:", err);
  }
}

/* ==========================================
   ২. কাস্টমার বাকি (CUSTOMER DUES)
========================================== */
export async function loadCustomerDues(): Promise<CustomerDue[]> {
  try {
    const { data, error } = await supabase.from('customer_dues').select('*');
    if (error) throw error;

    if (data) {
      localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(data));
      return data;
    }

    const raw = localStorage.getItem(KEYS.CUSTOMER_DUES);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading customer dues:', err);
    const raw = localStorage.getItem(KEYS.CUSTOMER_DUES);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveCustomerDues(dues: CustomerDue[]): Promise<void> {
  try {
    localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(dues || []));
    
    const { error } = await supabase
      .from('customer_dues')
      .upsert(dues || [], { onConflict: 'id' });

    if (!error) {
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.error('Error saving customer dues:', err);
  }
}

/* ==========================================
   ৩. শপ ও সেটিংস (SHOP INFO & SETTINGS)
========================================== */
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
    return raw ? JSON.parse(raw) : [];
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
  localStorage.clear();
}