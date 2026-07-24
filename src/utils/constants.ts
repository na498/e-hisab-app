import { QuickPreset, CategoryType } from '../types';

export const DEFAULT_PRESETS: QuickPreset[] = [
  {
    id: 'preset_photocopy',
    title: 'ফটোকপি (Photocopy)',
    category: 'ফটোকপি ও প্রিন্ট',
    amounts: [10, 20, 50, 100],
    color: 'emerald',
    iconName: 'Printer',
  },
  {
    id: 'preset_print',
    title: 'এ ৪ কাগজ ও প্রিন্ট (Print)',
    category: 'ফটোকপি ও প্রিন্ট',
    amounts: [15, 30, 60, 150],
    color: 'blue',
    iconName: 'FileText',
  },
  {
    id: 'preset_lamination',
    title: 'আইডি কার্ড ও ল্যামিনেটিং',
    category: 'ল্যামিনেটিং ও আইডি কার্ড',
    amounts: [20, 30, 50, 100],
    color: 'purple',
    iconName: 'CreditCard',
  },
  {
    id: 'preset_compose',
    title: 'কম্পিউটার কম্পোজ',
    category: 'কম্পিউটার কম্পোজ',
    amounts: [50, 100, 200, 300],
    color: 'amber',
    iconName: 'Edit3',
  },
  {
    id: 'preset_photo',
    title: 'ছবি ও ফটোপ্রিন্ট',
    category: 'ফটোকপি ও প্রিন্ট',
    amounts: [30, 50, 100, 150],
    color: 'rose',
    iconName: 'ImageIcon',
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryType[] = [
  'ফটোকপি ও প্রিন্ট',
  'কম্পিউটার কম্পোজ',
  'ল্যামিনেটিং ও আইডি কার্ড',
  'অন্যান্য আয়',
  'বাকি আদায়',
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryType[] = [
  'কাগজ ক্রয় (A4/Legal/Photo)',
  'মেশিন মেরামত ও সার্ভিসিং',
  'কালি ও টোনার (Ink/Toner)',
  'বিদ্যুৎ ও ওয়াইফাই বিল',
  'দোকান ভাড়া ও অন্যান্য',
];

export const DEFAULT_CATEGORIES: CategoryType[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
