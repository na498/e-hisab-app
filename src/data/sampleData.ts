import { Transaction, CustomerDue, ShopInfo, UserSettings, AppNotification } from '../types';
import { DEFAULT_PRESETS } from '../utils/constants';

export const INITIAL_SHOP_INFO: ShopInfo = {
  shopName: 'ই-সেন্টার',
  branchName: 'চাম্পাফুল',
  ownerName: '',
  managerName: '',
  phone: '০১৮১০৯৫৭৯৫৯',
  address: 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
};

export const INITIAL_SETTINGS: UserSettings = {
  pinEnabled: false,
  pin: '1234',
  isLocked: false,
  adminPhone: '01810957959',
  adminPassword: '01810957959',
  authEnabled: true,
  useBengaliDigits: true,
  dueAlertThresholdDays: 15,
  lowCashAlertThreshold: 2000,
  monthStartDay: 1,
  quickPresets: DEFAULT_PRESETS,
  customCategories: [],
};

// Clean empty transactions and dues - no pre-populated sample transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CUSTOMER_DUES: CustomerDue[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
