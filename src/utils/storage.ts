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
      // ব্যাকআপের জন্য লোকাল স্টোরেজেও রেখে দেওয়া
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

    // Supabase-এ পাঠানোর আগে 'cashBalance' ফিল্ডটি বাদ দেওয়া হচ্ছে (কারণ এটি ডাটাবেজ কলামে নেই)
    const cleanTransactions = withBalances.map(({ cashBalance, ...rest }) => rest);

    // Supabase ডাটাবেজে সেভ/আপডেট
    const { error } = await supabase
      .from('transactions')
      .upsert(cleanTransactions, { onConflict: 'id' });

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
    const cleanDues = dues || [];
    localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(cleanDues));
    
    const { error } = await supabase
      .from('customer_dues')
      .upsert(cleanDues, { onConflict: 'id' });

    if (error) {
      console.error("Supabase Customer Dues Save Error:", error.message);
    } else {
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.error('Error saving customer dues:', err);
  }
}

/* ==========================================
    ৩. শপ ও সেটিংস (SHOP INFO & SETTINGS)
========================================== */
export async function loadShopInfo(): Promise<ShopInfo> {
  try {
    // ১. প্রথমে Supabase থেকে শপ ইনফো লোড করার চেষ্টা
    const { data, error } = await supabase
      .from('shop_info')
      .select('*')
      .eq('id', 'main_shop')
      .maybeSingle();

    if (error) console.error('Error loading shop info from Supabase:', error.message);

    if (data) {
      localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(data));
      return { ...INITIAL_SHOP_INFO, ...data };
    }

    // Supabase-এ ডেটা না থাকলে বা এরর হলে LocalStorage থেকে ব্যাকআপ পড়া
    const raw = localStorage.getItem(KEYS.SHOP_INFO);
    return raw ? JSON.parse(raw) : INITIAL_SHOP_INFO;
  } catch (err) {
    console.error('Error in loadShopInfo:', err);
    const raw = localStorage.getItem(KEYS.SHOP_INFO);
    return raw ? JSON.parse(raw) : INITIAL_SHOP_INFO;
  }
}

export async function saveShopInfo(info: ShopInfo): Promise<void> {
  try {
    // LocalStorage এ দ্রুত সেভ
    localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(info));

    // Supabase এ সিঙ্ক করা
    const shopData = { id: 'main_shop', ...info };
    const { error } = await supabase
      .from('shop_info')
      .upsert(shopData, { onConflict: 'id' });

    if (error) {
      console.error('Error saving shop info to Supabase:', error.message);
    } else {
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.error('Error saving shop info:', err);
  }
}

export async function loadSettings(): Promise<UserSettings> {
  try {
    // ১. Supabase থেকে সেটিংস লোড করা
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'main_settings')
      .maybeSingle();

    if (error) console.error('Error loading settings from Supabase:', error.message);

    if (data) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
      return { ...INITIAL_SETTINGS, ...data };
    }

    // LocalStorage ব্যাকআপ
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
  } catch (err) {
    console.error('Error in loadSettings:', err);
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    // LocalStorage এ দ্রুত সেভ
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));

    // Supabase এ সিঙ্ক করা
    const settingsData = { id: 'main_settings', ...settings };
    const { error } = await supabase
      .from('settings')
      .upsert(settingsData, { onConflict: 'id' });

    if (error) {
      console.error('Error saving settings to Supabase:', error.message);
    } else {
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.error('Error saving settings:', err);
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

// 🟢 App.tsx এর জন্য Supabase এক্সপোর্ট
export { supabase };