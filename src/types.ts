export type TransactionType = 'income' | 'expense';

export type CategoryType =
  | 'ফটোকপি ও প্রিন্ট'
  | 'কম্পিউটার কম্পোজ'
  | 'ল্যামিনেটিং ও আইডি কার্ড'
  | 'কাগজ ক্রয় (A4/Legal/Photo)'
  | 'মেশিন মেরামত ও সার্ভিসিং'
  | 'কালি ও টোনার (Ink/Toner)'
  | 'বিদ্যুৎ ও ওয়াইফাই বিল'
  | 'দোকান ভাড়া ও অন্যান্য'
  | 'অন্যান্য আয়'
  | 'বাকি আদায়';

export interface MemoItem {
  productName: string;
  quantity: number;
  unit?: string;
  price: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM AM/PM or 24h
  displayDate: string; // e.g., "মে-২৭, ১০:৩০ AM"
  type: TransactionType;
  amount: number;
  category: CategoryType;
  description: string; // খরচের বিবরণ / আইটেমের বিবরণ
  remarks?: string; // মন্তব্য
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string; // 'ক্যাশ' | 'বিকাশ' | 'নগদ' | 'বকেয়া'
  deliveryAddress?: string;
  district?: string;
  deliveryCharge?: number;
  items?: MemoItem[];
  cashBalance?: number; // Calculated running cash balance
  createdAt: number;
}

export interface CustomerDue {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
  totalPaid: number;
  notes?: string;
  promiseDate?: string; // YYYY-MM-DD (টাকা পরিশোধের প্রতিশ্রুতি তারিখ)
  lastUpdated: string;
  history: DueHistory[];
}

export interface DueHistory {
  id: string;
  date: string;
  time?: string;
  amount: number;
  type: 'due' | 'payment' | 'reschedule'; // 'due' = বাকি বৃদ্ধি, 'payment' = বাকি পরিশোধ, 'reschedule' = তারিখ পরিবর্তন
  description: string;
}

export interface ShopInfo {
  shopName: string; // e.g., "ই-সেন্টার"
  branchName: string; // e.g., "চাম্পাফুল"
  ownerName: string;
  managerName: string;
  phone: string;
  address: string;
  storeSlogan?: string;
  storeLogo?: string;
  contactOffice?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface QuickPreset {
  id: string;
  title: string;
  category: CategoryType | string;
  amounts: number[];
  color?: string; // 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo' | 'slate'
  iconName?: string;
}

export interface UserSettings {
  pinEnabled: boolean;
  pin: string; // 4-digit PIN code
  isLocked: boolean;
  adminPhone: string; // Admin login mobile number
  adminPassword: string; // Admin login password
  authEnabled: boolean; // Whether login protection is enabled
  useBengaliDigits: boolean;
  dueAlertThresholdDays: number;
  lowCashAlertThreshold: number;
  monthStartDay: number; // Day of the month accounting cycle starts (default 1)
  quickPresets?: QuickPreset[];
  customCategories?: string[];
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
  hiddenCategories?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'due_alert' | 'cash_alert' | 'sync_alert' | 'info';
  date: string;
  read: boolean;
}
