import { Transaction, CustomerDue, ShopInfo, UserSettings, AppNotification } from '../types';
import {
  INITIAL_SHOP_INFO,
  INITIAL_SETTINGS,
} from '../data/sampleData';
import { supabase } from './supabase';

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
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    if (data) {
      const formattedData = calculateRunningBalances(data);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(formattedData));
      return formattedData;
    }

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
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(withBalances));

    if (withBalances.length === 0) return;

    const cleanTransactions = withBalances.map(({ cashBalance, ...rest }) => rest);

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

export async function deleteTransactionFromSupabase(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error("Error deleting transaction from Supabase:", error.message);
    }

    const local = localStorage.getItem(KEYS.TRANSACTIONS);
    if (local) {
      const list: Transaction[] = JSON.parse(local);
      const filtered = list.filter((t) => t.id !== id);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
    }
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error("Error in deleteTransactionFromSupabase:", err);
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

    if (cleanDues.length === 0) return;
    
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

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('customer_dues').delete().eq('id', id);
    if (error) {
      console.error("Error deleting customer from Supabase:", error.message);
    }

    const raw = localStorage.getItem(KEYS.CUSTOMER_DUES);
    if (raw) {
      const list: CustomerDue[] = JSON.parse(raw);
      const filtered = list.filter((c) => c.id !== id);
      localStorage.setItem(KEYS.CUSTOMER_DUES, JSON.stringify(filtered));
    }
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error("Error in deleteCustomerFromSupabase:", err);
  }
}

/* ==========================================
    ৩. শপ ও সেটিংস (SHOP INFO & SETTINGS)
========================================== */
export async function loadShopInfo(): Promise<ShopInfo> {
  try {
    const { data, error } = await supabase
      .from('shop_info')
      .select('*')
      .eq('id', 'main_shop')
      .maybeSingle();

    if (error) console.error('Error loading shop info from Supabase:', error.message);

    if (data) {
      const mergedShop: ShopInfo = {
        ...INITIAL_SHOP_INFO,
        ...data,
        name: data.name ?? data.shopName ?? data.shop_name ?? INITIAL_SHOP_INFO.name ?? '',
        shopName: data.shopName ?? data.shop_name ?? data.name ?? (INITIAL_SHOP_INFO as any).shopName ?? '',
        ownerName: data.ownerName ?? data.owner_name ?? data.owner ?? INITIAL_SHOP_INFO.ownerName ?? '',
        branchName: data.branchName ?? data.branch_name ?? INITIAL_SHOP_INFO.branchName ?? '',
        managerName: data.managerName ?? data.manager_name ?? (INITIAL_SHOP_INFO as any).managerName ?? '',
        phone: data.phone ?? INITIAL_SHOP_INFO.phone ?? '',
        address: data.address ?? INITIAL_SHOP_INFO.address ?? '',
        logo: data.logo ?? INITIAL_SHOP_INFO.logo ?? '',
      };
      localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(mergedShop));
      return mergedShop;
    }

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
    const cleanInfo = {
      ...info,
      name: info?.name || '',
      phone: info?.phone || '',
      address: info?.address || '',
      logo: info?.logo || '',
    };

    localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(cleanInfo));

    const shopTitle = (cleanInfo as any).shopName || (cleanInfo as any).shop_name || cleanInfo.name || '';
    const shopOwner = (cleanInfo as any).ownerName || (cleanInfo as any).owner_name || (cleanInfo as any).owner || '';
    const shopBranch = (cleanInfo as any).branchName || (cleanInfo as any).branch_name || '';
    const shopManager = (cleanInfo as any).managerName || (cleanInfo as any).manager_name || '';

    const shopData = {
      id: 'main_shop',
      name: cleanInfo.name || shopTitle,
      shopName: shopTitle,
      shop_name: shopTitle,
      owner: (cleanInfo as any).owner || shopOwner,
      ownerName: shopOwner,
      owner_name: shopOwner,
      branchName: shopBranch,
      branch_name: shopBranch,
      managerName: shopManager,
      manager_name: shopManager,
      phone: cleanInfo.phone || '',
      address: cleanInfo.address || '',
      logo: cleanInfo.logo || '',
    };

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
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'main_settings')
      .maybeSingle();

    if (error) console.error('Error loading settings from Supabase:', error.message);

    if (data) {
      const parsedSettings: UserSettings = {
        ...INITIAL_SETTINGS,
        pin: data.pin ?? INITIAL_SETTINGS.pin,
        pinEnabled: data.pinEnabled ?? data.pin_enabled ?? INITIAL_SETTINGS.pinEnabled,
        authEnabled: data.authEnabled ?? data.auth_enabled ?? INITIAL_SETTINGS.authEnabled,
        adminPhone: data.adminPhone ?? data.admin_phone ?? INITIAL_SETTINGS.adminPhone,
        adminPassword: data.adminPassword ?? data.admin_password ?? INITIAL_SETTINGS.adminPassword,
        useBengaliDigits: data.useBengaliDigits ?? data.use_bengali_digits ?? INITIAL_SETTINGS.useBengaliDigits,
        monthStartDay: data.monthStartDay ?? data.month_start_day ?? INITIAL_SETTINGS.monthStartDay,
        
        quickPresets: data.quickPresets || data.quick_presets || INITIAL_SETTINGS.quickPresets || [],
        customCategories: data.customCategories || data.custom_categories || INITIAL_SETTINGS.customCategories || [],
        customIncomeCategories: data.customIncomeCategories || data.custom_income_categories || INITIAL_SETTINGS.customIncomeCategories || [],
        customExpenseCategories: data.customExpenseCategories || data.custom_expense_categories || INITIAL_SETTINGS.customExpenseCategories || [],
        hiddenCategories: data.hiddenCategories || data.hidden_categories || INITIAL_SETTINGS.hiddenCategories || [],
      };

      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsedSettings));
      return parsedSettings;
    }

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
    const cleanSettings: UserSettings = {
      ...INITIAL_SETTINGS,
      ...settings,
      quickPresets: settings?.quickPresets || [],
      customCategories: settings?.customCategories || [],
      customIncomeCategories: settings?.customIncomeCategories || [],
      customExpenseCategories: settings?.customExpenseCategories || [],
      hiddenCategories: settings?.hiddenCategories || [],
    };

    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cleanSettings));

    const settingsData = {
      id: 'main_settings',
      pin: cleanSettings.pin || '',
      pinEnabled: cleanSettings.pinEnabled,
      pin_enabled: cleanSettings.pinEnabled,
      authEnabled: cleanSettings.authEnabled,
      auth_enabled: cleanSettings.authEnabled,
      adminPhone: cleanSettings.adminPhone || '',
      admin_phone: cleanSettings.adminPhone || '',
      adminPassword: cleanSettings.adminPassword || '',
      admin_password: cleanSettings.adminPassword || '',
      useBengaliDigits: cleanSettings.useBengaliDigits,
      use_bengali_digits: cleanSettings.useBengaliDigits,
      monthStartDay: cleanSettings.monthStartDay,
      month_start_day: cleanSettings.monthStartDay,
      quickPresets: cleanSettings.quickPresets,
      quick_presets: cleanSettings.quickPresets,
      customCategories: cleanSettings.customCategories,
      custom_categories: cleanSettings.customCategories,
      customIncomeCategories: cleanSettings.customIncomeCategories,
      custom_income_categories: cleanSettings.customIncomeCategories,
      customExpenseCategories: cleanSettings.customExpenseCategories,
      custom_expense_categories: cleanSettings.customExpenseCategories,
      hiddenCategories: cleanSettings.hiddenCategories,
      hidden_categories: cleanSettings.hiddenCategories,
    };

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

export { supabase };