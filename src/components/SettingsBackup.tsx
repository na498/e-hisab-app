import React, { useState } from 'react';
import {
  Store,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Check,
  Smartphone,
  Database,
  Zap,
  Plus,
  Trash2,
  Calendar,
  ListPlus,
  Printer,
  FileText,
  CreditCard,
  Edit3,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ShopInfo, UserSettings, Transaction, CustomerDue, QuickPreset } from '../types';
import {
  DEFAULT_PRESETS,
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../utils/constants';
import { ConfirmModal } from './ConfirmModal';

interface SettingsBackupProps {
  shopInfo: ShopInfo;
  onUpdateShopInfo: (info: ShopInfo) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  transactions: Transaction[];
  customerDues: CustomerDue[];
  onImportFullBackup: (data: {
    transactions: Transaction[];
    customerDues: CustomerDue[];
    shopInfo: ShopInfo;
    settings: UserSettings;
  }) => void;
  lastSyncTime: string;
  useBengaliDigits: boolean;
}

export const SettingsBackup: React.FC<SettingsBackupProps> = ({
  shopInfo,
  onUpdateShopInfo,
  settings,
  onUpdateSettings,
  transactions,
  customerDues,
  onImportFullBackup,
  lastSyncTime,
  useBengaliDigits,
}) => {
  // Local state for Shop Info form
  const [sName, setSName] = useState(shopInfo.shopName);
  const [bName, setBName] = useState(shopInfo.branchName);
  const [oName, setOName] = useState(shopInfo.ownerName);
  const [mName, setMName] = useState(shopInfo.managerName);
  const [phone, setPhone] = useState(shopInfo.phone);
  const [address, setAddress] = useState(shopInfo.address);
  const [infoSaved, setInfoSaved] = useState(false);

  // Local state for PIN
  const [pinCode, setPinCode] = useState(settings.pin);
  const [pinEnabled, setPinEnabled] = useState(settings.pinEnabled);
  const [pinSaved, setPinSaved] = useState(false);

  // Local state for Admin Auth Credentials
  const [adminPhone, setAdminPhone] = useState(settings.adminPhone || '01810957959');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || '01810957959');
  const [authEnabled, setAuthEnabled] = useState(settings.authEnabled ?? true);
  const [authSaved, setAuthSaved] = useState(false);

  // Local state for Month Start Day
  const [monthStartDay, setMonthStartDay] = useState<number>(settings.monthStartDay || 1);
  const [monthCycleSaved, setMonthCycleSaved] = useState(false);

  // Quick Preset Admin Management State
  const currentPresets = settings.quickPresets && settings.quickPresets.length > 0
    ? settings.quickPresets
    : DEFAULT_PRESETS;
  const currentCustomCats = settings.customCategories || [];
  const currentCustomIncomeCats = settings.customIncomeCategories || settings.customCategories || [];
  const currentCustomExpenseCats = settings.customExpenseCategories || [];

  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newPresetAmounts, setNewPresetAmounts] = useState('10, 20, 50, 100');
  const [newPresetColor, setNewPresetColor] = useState('emerald');
  const [newPresetIcon, setNewPresetIcon] = useState('Printer');
  const [presetSavedMsg, setPresetSavedMsg] = useState<string | null>(null);

  // Preset Card Edit State
  const [editingPreset, setEditingPreset] = useState<QuickPreset | null>(null);
  const [editPresetTitle, setEditPresetTitle] = useState('');
  const [editPresetCategory, setEditPresetCategory] = useState('');
  const [editPresetAmounts, setEditPresetAmounts] = useState('');
  const [editPresetColor, setEditPresetColor] = useState('emerald');
  const [editPresetIcon, setEditPresetIcon] = useState('Printer');

  // Custom Category states for Income and Expense separately
  const [newIncomeCatInput, setNewIncomeCatInput] = useState('');
  const [newExpenseCatInput, setNewExpenseCatInput] = useState('');

  // Deletion & Confirm Modal States
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null);
  const [deleteCategoryInfo, setDeleteCategoryInfo] = useState<{
    name: string;
    isExpense?: boolean;
  } | null>(null);
  const [confirmResetPresets, setConfirmResetPresets] = useState<boolean>(false);

  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShopInfo({
      shopName: sName,
      branchName: bName,
      ownerName: oName,
      managerName: mName,
      phone,
      address,
    });
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 2500);
  };

  const handleSavePinSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      pinEnabled,
      pin: pinCode.length === 4 ? pinCode : settings.pin,
    });
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2500);
  };

  const handleSaveAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) {
      alert('অনুগ্রহ করে এডমিন মোবাইল নম্বর লিখুন');
      return;
    }
    if (!adminPassword.trim()) {
      alert('অনুগ্রহ করে এডমিন পাসওয়ার্ড লিখুন');
      return;
    }
    onUpdateSettings({
      ...settings,
      adminPhone: adminPhone.trim(),
      adminPassword: adminPassword.trim(),
      authEnabled,
    });
    setAuthSaved(true);
    setTimeout(() => setAuthSaved(false), 2500);
  };

  const handleSaveMonthCycle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      monthStartDay: Math.max(1, Math.min(31, monthStartDay)),
    });
    setMonthCycleSaved(true);
    setTimeout(() => setMonthCycleSaved(false), 2500);
  };

  const handleAddPresetCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetTitle.trim()) return;

    const parsedAmounts = newPresetAmounts
      .split(',')
      .map((a) => parseFloat(a.trim()))
      .filter((a) => !isNaN(a) && a > 0);

    if (parsedAmounts.length === 0) {
      alert('অনুগ্রহ করে কমা দিয়ে আলাদা করে টাকার পরিমাণ দিন (যেমন: 10, 20, 50, 100)');
      return;
    }

    const newPreset: QuickPreset = {
      id: `preset_${Date.now()}`,
      title: newPresetTitle.trim(),
      category: newPresetCategory,
      amounts: parsedAmounts,
      color: newPresetColor,
      iconName: newPresetIcon,
    };

    const updatedPresets = [...currentPresets, newPreset];
    onUpdateSettings({
      ...settings,
      quickPresets: updatedPresets,
    });

    setNewPresetTitle('');
    setNewPresetAmounts('10, 20, 50, 100');
    showPresetMsg('নতুন এন্ট্রি বাটন সফলভাবে যোগ করা হয়েছে!');
  };

  const handleConfirmDeletePreset = () => {
    if (!deletePresetId) return;
    const updatedPresets = currentPresets.filter((p) => p.id !== deletePresetId);
    onUpdateSettings({
      ...settings,
      quickPresets: updatedPresets,
    });
    setDeletePresetId(null);
    showPresetMsg('এন্ট্রি বাটন মুছে ফেলা হয়েছে!');
  };

  const handleConfirmResetPresets = () => {
    onUpdateSettings({
      ...settings,
      quickPresets: DEFAULT_PRESETS,
    });
    setConfirmResetPresets(false);
    showPresetMsg('ডিফল্ট এন্ট্রি বাটনসমূহ রিস্টোর করা হয়েছে!');
  };

  const handleAddCustomIncomeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newIncomeCatInput.trim();
    if (!catName) return;

    if (
      DEFAULT_INCOME_CATEGORIES.includes(catName as any) ||
      currentCustomIncomeCats.includes(catName)
    ) {
      alert('এই আয়ের ক্যাটাগরি নাম আগেই আছে!');
      return;
    }

    const updatedIncomeCats = [...currentCustomIncomeCats, catName];
    onUpdateSettings({
      ...settings,
      customIncomeCategories: updatedIncomeCats,
      customCategories: Array.from(new Set([...currentCustomCats, catName])),
    });
    setNewIncomeCatInput('');
    showPresetMsg(`নতুন আয়ের ক্যাটাগরি '${catName}' যোগ হয়েছে!`);
  };

  const handleAddCustomExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newExpenseCatInput.trim();
    if (!catName) return;

    if (
      DEFAULT_EXPENSE_CATEGORIES.includes(catName as any) ||
      currentCustomExpenseCats.includes(catName)
    ) {
      alert('এই ব্যয়ের ক্যাটাগরি নাম আগেই আছে!');
      return;
    }

    const updatedExpenseCats = [...currentCustomExpenseCats, catName];
    onUpdateSettings({
      ...settings,
      customExpenseCategories: updatedExpenseCats,
      customCategories: Array.from(new Set([...currentCustomCats, catName])),
    });
    setNewExpenseCatInput('');
    showPresetMsg(`নতুন ব্যয়ের ক্যাটাগরি '${catName}' যোগ হয়েছে!`);
  };

  const hiddenCats = settings.hiddenCategories || [];

  const handleToggleHideDefaultCategory = (catName: string) => {
    const isHidden = hiddenCats.includes(catName);
    const updatedHidden = isHidden
      ? hiddenCats.filter((c) => c !== catName)
      : [...hiddenCats, catName];

    onUpdateSettings({
      ...settings,
      hiddenCategories: updatedHidden,
    });

    showPresetMsg(
      isHidden
        ? `ক্যাটাগরি '${catName}' পুনরায় সক্রিয় করা হয়েছে!`
        : `ক্যাটাগরি '${catName}' তালিকা থেকে সরিয়ে নেওয়া হয়েছে!`
    );
  };

  const handleConfirmDeleteCustomCategory = () => {
    if (!deleteCategoryInfo) return;
    const { name: catName, isExpense } = deleteCategoryInfo;

    if (DEFAULT_CATEGORIES.includes(catName as any)) {
      handleToggleHideDefaultCategory(catName);
    } else if (isExpense) {
      const updatedExpense = currentCustomExpenseCats.filter((c) => c !== catName);
      onUpdateSettings({
        ...settings,
        customExpenseCategories: updatedExpense,
        customCategories: currentCustomCats.filter((c) => c !== catName),
      });
      showPresetMsg(`ব্যয়ের ক্যাটাগরি '${catName}' মুছে ফেলা হয়েছে!`);
    } else {
      const updatedIncome = currentCustomIncomeCats.filter((c) => c !== catName);
      onUpdateSettings({
        ...settings,
        customIncomeCategories: updatedIncome,
        customCategories: currentCustomCats.filter((c) => c !== catName),
      });
      showPresetMsg(`আয়ের ক্যাটাগরি '${catName}' মুছে ফেলা হয়েছে!`);
    }
    setDeleteCategoryInfo(null);
  };

  const handleStartEditPreset = (preset: QuickPreset) => {
    setEditingPreset(preset);
    setEditPresetTitle(preset.title);
    setEditPresetCategory(preset.category);
    setEditPresetAmounts(preset.amounts.join(', '));
    setEditPresetColor(preset.color || 'emerald');
    setEditPresetIcon(preset.iconName || 'Printer');
  };

  const handleSavePresetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;

    const parsedAmounts = editPresetAmounts
      .split(',')
      .map((a) => parseFloat(a.trim()))
      .filter((a) => !isNaN(a) && a > 0);

    if (parsedAmounts.length === 0) {
      alert('অনুগ্রহ করে কমা দিয়ে আলাদা করে টাকার পরিমাণ দিন (যেমন: 10, 20, 50, 100)');
      return;
    }

    const updatedPresets = currentPresets.map((p) =>
      p.id === editingPreset.id
        ? {
            ...p,
            title: editPresetTitle.trim() || p.title,
            category: editPresetCategory || p.category,
            amounts: parsedAmounts,
            color: editPresetColor,
            iconName: editPresetIcon,
          }
        : p
    );

    onUpdateSettings({
      ...settings,
      quickPresets: updatedPresets,
    });

    setEditingPreset(null);
    showPresetMsg('এন্ট্রি বাটন কার্ড সফলভাবে এডিট (সংশোধন) করা হয়েছে!');
  };

  const showPresetMsg = (msg: string) => {
    setPresetSavedMsg(msg);
    setTimeout(() => setPresetSavedMsg(null), 3000);
  };

  const handleToggleBengaliDigits = () => {
    onUpdateSettings({
      ...settings,
      useBengaliDigits: !settings.useBengaliDigits,
    });
  };

  const handleExportJSON = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopInfo,
      settings,
      transactions,
      customerDues,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `E_Hisab_Backup_${shopInfo.shopName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.customerDues) {
          onImportFullBackup({
            transactions: parsed.transactions,
            customerDues: parsed.customerDues,
            shopInfo: parsed.shopInfo || shopInfo,
            settings: parsed.settings || settings,
          });
          alert('ব্যাকআপ সফলভাবে ইম্পোর্ট করা হয়েছে!');
        } else {
          alert('অকার্যকর ব্যাকআপ ফাইল!');
        }
      } catch (err) {
        alert('ফাইল পড়তে সমস্যা হয়েছে। সঠিকভাবে প্রস্তুতকৃত JSON ফাইল দিন।');
      }
    };
    reader.readAsText(file);
  };

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...currentCustomCats])
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Shop Info Settings */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Store className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-800">
            দোকান ও শাখা অফিসের তথ্য (Shop Profile)
          </h2>
        </div>

        <form onSubmit={handleSaveShopInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                দোকান/প্রতিষ্ঠানের নাম *
              </label>
              <input
                type="text"
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শাখা অফিসের নাম
              </label>
              <input
                type="text"
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                দোকান পরিচালকের নাম
              </label>
              <input
                type="text"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                দোকান মালিকের নাম
              </label>
              <input
                type="text"
                value={oName}
                onChange={(e) => setOName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ঠিকানা
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {infoSaved && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> সংরক্ষিত হয়েছে
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-emerald-900 transition-all"
            >
              তথ্য আপডেট করুন
            </button>
          </div>
        </form>
      </div>

      {/* NEW: Month Start Cycle Settings */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                মাসিক হিসাব চক্র ও নতুন মাস শুরুর তারিখ (Month Accounting Cycle)
              </h2>
              <p className="text-xs text-slate-500">
                ১ তারিখ থেকে হিসাব শুরু করলে লেনদেন খাতায় তা নতুন মাসের হিসাব হিসেবে রিবন দিয়ে পৃথক থাকবে
              </p>
            </div>
          </div>
          {monthCycleSaved && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Check className="w-4 h-4" /> সেভ হয়েছে
            </span>
          )}
        </div>

        <form onSubmit={handleSaveMonthCycle} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              মাসের হিসাব শুরুর নির্দিষ্ট তারিখ (মাসের ১ তারিখ নির্ধারণ করা ভালো):
            </label>
            <p className="text-xs text-slate-600">
              ডিফল্টভাবে প্রতি মাসের <b>১ই তারিখ</b> নতুন মাসের হিসাব চক্রের সূচনা গণ্য করা হবে।
            </p>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-300 rounded-lg">
              <span className="text-xs font-bold text-slate-700">তারিখ:</span>
              <input
                type="number"
                min={1}
                max={31}
                value={monthStartDay}
                onChange={(e) => setMonthStartDay(parseInt(e.target.value, 10) || 1)}
                className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded px-2 py-1 text-slate-900"
              />
            </div>
          </div>
          <div className="sm:col-span-2 text-right">
            <button
              type="submit"
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-all"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      </div>

      {/* NEW: Admin Quick Presets & Categories Manager */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                এডমিন দ্রুত ক্যাশ এন্ট্রি বাটন ও ক্যাটাগরি অপশন ব্যবস্থাপনা (Quick Presets Admin)
              </h2>
              <p className="text-xs text-slate-500">
                ড্যাশবোর্ডের ফটোকপি ও প্রিন্ট দ্রুত এন্ট্রি বাটনগুলো ইচ্ছামতো যোগ, এডিট বা ক্যাটাগরি বাড়ান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmResetPresets(true)}
            className="text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট বাটনে রিসেট</span>
          </button>
        </div>

        {presetSavedMsg && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{presetSavedMsg}</span>
          </div>
        )}

        {/* Existing Presets List */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            বর্তমান সক্রিয় দ্রুত এন্ট্রি বাটন কার্ডসমূহ ({currentPresets.length} টি):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.title}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditPreset(preset)}
                        title="বাটন এডিট করুন"
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-slate-200/60"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>এডিট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePresetId(preset.id)}
                        title="বাটনটি মুছুন"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2 font-medium">
                    ক্যাটাগরি: <span className="text-slate-800 font-bold">{preset.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preset.amounts.map((amt) => (
                      <span
                        key={amt}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                      >
                        +{amt}৳
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Preset Modal */}
        {editingPreset && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-800">
                    এন্ট্রি বাটন কার্ড এডিট (সংশোধন)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePresetEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কার্ডের শিরোনাম / বিষয়:
                  </label>
                  <input
                    type="text"
                    value={editPresetTitle}
                    onChange={(e) => setEditPresetTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি:
                  </label>
                  <select
                    value={editPresetCategory}
                    onChange={(e) => setEditPresetCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[...DEFAULT_CATEGORIES, ...currentCustomCats].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টাকার বাটনসমূহ (কমা দিয়ে আলাদা করুন):
                  </label>
                  <input
                    type="text"
                    value={editPresetAmounts}
                    onChange={(e) => setEditPresetAmounts(e.target.value)}
                    placeholder="যেমন: 5, 10, 20, 50, 100"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    প্রতিটি সংখ্যার পর কমা (,) দিন
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      রং এর থিম:
                    </label>
                    <select
                      value={editPresetColor}
                      onChange={(e) => setEditPresetColor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="emerald">Emerald (সবুজ)</option>
                      <option value="blue">Blue (নীল)</option>
                      <option value="purple">Purple (বেগুনি)</option>
                      <option value="amber">Amber (হলুদ)</option>
                      <option value="rose">Rose (লাল)</option>
                      <option value="indigo">Indigo (ঘন নীল)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      আইকন:
                    </label>
                    <select
                      value={editPresetIcon}
                      onChange={(e) => setEditPresetIcon(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Printer">Printer (প্রিন্টার)</option>
                      <option value="FileText">FileText (ফাইল/কাগজ)</option>
                      <option value="CreditCard">CreditCard (কার্ড/রিচার্জ)</option>
                      <option value="Edit3">Edit3 (কলম)</option>
                      <option value="ImageIcon">Image (ছবি/ফটোকপি)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPreset(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Preset Form */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
          <h3 className="text-xs font-bold text-emerald-900 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>নতুন এন্ট্রি কার্ড যোগ করুন:</span>
          </h3>
          <form onSubmit={handleAddPresetCard} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                কার্ডের শিরোনাম / বিষয়:
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: পাসপোর্ট ছবি, ল্যামিনেটিং"
                value={newPresetTitle}
                onChange={(e) => setNewPresetTitle(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ক্যাটাগরি নির্ধারণ:
              </label>
              <select
                value={newPresetCategory}
                onChange={(e) => setNewPresetCategory(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                টাকার বাটনসমূহ (কমা দিয়ে):
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: 10, 20, 50, 100"
                value={newPresetAmounts}
                onChange={(e) => setNewPresetAmounts(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                রং এর থিম:
              </label>
              <select
                value={newPresetColor}
                onChange={(e) => setNewPresetColor(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold"
              >
                <option value="emerald">সবুজ (Emerald)</option>
                <option value="blue">নীল (Blue)</option>
                <option value="purple">বেগুনি (Purple)</option>
                <option value="amber">হলুদ (Amber)</option>
                <option value="rose">লালচে (Rose)</option>
                <option value="indigo">ইন্ডিগো (Indigo)</option>
              </select>
            </div>

            <div className="sm:col-span-12 text-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন কার্ড যোগ করুন</span>
              </button>
            </div>
          </form>
        </div>

        {/* All Categories Manager (Income & Expense Separately) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ListPlus className="w-4 h-4 text-emerald-800" />
              <span>ক্যাটাগরি সমূহ ও ডিলিট অপশন (Category Management):</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              আয় ও ব্যয়ের জন্য আলাদা আলাদা ক্যাটাগরি যোগ ও নিয়ন্ত্রণ করুন
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Categories Section */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700 bg-emerald-200 rounded-full p-0.5" />
                  <span>আয়ের ক্যাটাগরি সমূহ (Income Categories):</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                  + জমা / আয়
                </span>
              </div>

              {/* Add Custom Income Category Form */}
              <form onSubmit={handleAddCustomIncomeCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="নতুন আয়ের ক্যাটাগরি (যেমন: পাসপোর্ট সেবা, ভোটার আইডি)"
                  value={newIncomeCatInput}
                  onChange={(e) => setNewIncomeCatInput(e.target.value)}
                  className="flex-1 text-xs bg-white border border-emerald-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  + আয় যোগ
                </button>
              </form>

              {/* Default Income Categories List */}
              <div>
                <span className="text-[11px] font-bold text-emerald-900/80 block mb-1.5">
                  সিস্টেমের আয়ের ডিফল্ট ক্যাটাগরি:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_INCOME_CATEGORIES.map((cat) => {
                    const isHidden = hiddenCats.includes(cat);
                    return (
                      <span
                        key={cat}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 border transition-all ${
                          isHidden
                            ? 'bg-slate-200 text-slate-400 line-through border-slate-300'
                            : 'bg-white border-emerald-300 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <span>{cat}</span>
                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => handleToggleHideDefaultCategory(cat)}
                            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-extrabold ml-1 underline cursor-pointer no-underline"
                            title="পুনরায় সক্রিয় করুন"
                          >
                            + পুনঃসক্রিয়
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteCategoryInfo({ name: cat, isExpense: false })}
                            className="text-slate-400 hover:text-rose-600 font-bold p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                            title="ক্যাটাগরি মুছুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Custom Income Categories List */}
              {currentCustomIncomeCats.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-emerald-800 block mb-1.5">
                    ব্যবহারকারীর তৈরি কাস্টম আয়ের ক্যাটাগরি:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCustomIncomeCats.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteCategoryInfo({ name: cat, isExpense: false })}
                          className="text-emerald-600 hover:text-rose-600 font-bold p-0.5 hover:bg-emerald-200/80 rounded cursor-pointer"
                          title="ক্যাটাগরি মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expense Categories Section */}
            <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 text-rose-700 bg-rose-200 rounded-full flex items-center justify-center font-bold text-xs">
                    -
                  </span>
                  <span>ব্যয়ের ক্যাটাগরি সমূহ (Expense Categories):</span>
                </span>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-200/70 px-2 py-0.5 rounded">
                  - খরচ / ব্যয়
                </span>
              </div>

              {/* Add Custom Expense Category Form */}
              <form onSubmit={handleAddCustomExpenseCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="নতুন ব্যয়ের ক্যাটাগরি (যেমন: নাস্তা বিল, পরিচ্ছন্নতা খরচ)"
                  value={newExpenseCatInput}
                  onChange={(e) => setNewExpenseCatInput(e.target.value)}
                  className="flex-1 text-xs bg-white border border-rose-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  - ব্যয় যোগ
                </button>
              </form>

              {/* Default Expense Categories List */}
              <div>
                <span className="text-[11px] font-bold text-rose-900/80 block mb-1.5">
                  সিস্টেমের ব্যয়ের ডিফল্ট ক্যাটাগরি:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_EXPENSE_CATEGORIES.map((cat) => {
                    const isHidden = hiddenCats.includes(cat);
                    return (
                      <span
                        key={cat}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 border transition-all ${
                          isHidden
                            ? 'bg-slate-200 text-slate-400 line-through border-slate-300'
                            : 'bg-white border-rose-300 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <span>{cat}</span>
                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => handleToggleHideDefaultCategory(cat)}
                            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-extrabold ml-1 underline cursor-pointer no-underline"
                            title="পুনরায় সক্রিয় করুন"
                          >
                            + পুনঃসক্রিয়
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteCategoryInfo({ name: cat, isExpense: true })}
                            className="text-slate-400 hover:text-rose-600 font-bold p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                            title="ক্যাটাগরি মুছুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Custom Expense Categories List */}
              {currentCustomExpenseCats.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-rose-800 block mb-1.5">
                    ব্যবহারকারীর তৈরি কাস্টম ব্যয়ের ক্যাটাগরি:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCustomExpenseCats.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteCategoryInfo({ name: cat, isExpense: true })}
                          className="text-rose-600 hover:text-rose-800 font-bold p-0.5 hover:bg-rose-200/80 rounded cursor-pointer"
                          title="ক্যাটাগরি মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Login & Security Settings */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-800" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                এডমিন লগইন মোবাইল নম্বর ও পাসওয়ার্ড (Admin Login Credentials)
              </h2>
              <p className="text-xs text-slate-500">
                অ্যাপে প্রবেশের মোবাইল নম্বর এবং নিরাপত্তা পাসওয়ার্ড পরিবর্তন করুন
              </p>
            </div>
          </div>
          {authSaved && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Check className="w-4 h-4" /> সেভ হয়েছে
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAdminAuth} className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                মোবাইল ও পাসওয়ার্ড লগইন সুরক্ষাকবচ সক্রিয় রাখুন
              </span>
              <span className="text-[11px] text-slate-500">
                অ্যাপে প্রবেশের সময় এডমিন মোবাইল নম্বর ও পাসওয়ার্ড চাইবে
              </span>
            </div>
            <input
              type="checkbox"
              checked={authEnabled}
              onChange={(e) => setAuthEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-700 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                এডমিন মোবাইল নম্বর (Admin Mobile Number):
              </label>
              <input
                type="text"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="যেমন: 01700000000"
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                এডমিন প্রবেশ পাসওয়ার্ড (Admin Password):
              </label>
              <input
                type="text"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-all"
            >
              মোবাইল ও পাসওয়ার্ড সেভ করুন
            </button>
          </div>
        </form>
      </div>

      {/* Security & Display Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security PIN */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-800">
              পাসওয়ার্ড / পিন প্রোটেকশন (Security PIN)
            </h2>
          </div>

          <form onSubmit={handleSavePinSettings} className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  পিন নিরাপত্তা সক্রিয়
                </span>
                <span className="text-[11px] text-slate-500">
                  অ্যাপে প্রবেশে ৪ ডিজিটের পিন চাইবে
                </span>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="w-5 h-5 accent-emerald-700 rounded cursor-pointer"
              />
            </div>

            {pinEnabled && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ৪ ডিজিটের পিন কোড:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono font-bold text-lg bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {pinSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> সেভ হয়েছে
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-900 transition-all"
              >
                পিন সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>

        {/* Display Digit Preferences */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">
                ডিজিট ও সংখ্যা প্রদর্শন (Bengali Digits)
              </h2>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  বাংলা সংখ্যা ব্যবহার (১, ২, ৩)
                </span>
                <span className="text-[11px] text-slate-500">
                  টাকার পরিমাণ ও তারিখ বাংলা সংখ্যায় দেখাবে
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleBengaliDigits}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  settings.useBengaliDigits
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {settings.useBengaliDigits ? 'চালু আছে (১২৩৪)' : 'বন্ধ (1234)'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
            <div className="font-bold mb-1">অফলাইন স্টোরেজ স্টেটাস:</div>
            <p>
              সব ডেটা আপনার ব্রাউজারের লোকাল ডেটাবেসে সিঙ্কড আছে।
              সর্বশেষ সিঙ্ক: {new Date(lastSyncTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Data Backup, Export & Restore */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-purple-700" />
          <h2 className="text-base font-bold text-slate-800">
            ডেটা এক্সপোর্ট, ব্যাকআপ ও রিস্টোর (Backup & Export)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* JSON Full Backup */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <Download className="w-6 h-6 text-emerald-700 mb-2" />
              <h3 className="font-bold text-sm text-slate-900 mb-1">
                সম্পূর্ণ ব্যাকআপ (JSON)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                সব লেনদেন, বাকি খাতা ও সেটিংস ব্যাকআপ ফাইল হিসেবে সেভ করুন
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-all"
            >
              JSON ডাউনলোড
            </button>
          </div>

          {/* Import Backup */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <Upload className="w-6 h-6 text-blue-700 mb-2" />
              <h3 className="font-bold text-sm text-slate-900 mb-1">
                ব্যাকআপ ফাইল রিস্টোর
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                আগে থেকে সেভ করা JSON ব্যাকআপ ফাইল আপলোড করে ডেটা ফিরে আনুন
              </p>
            </div>
            <label className="w-full text-center py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer block transition-all">
              ফাইল পছন্দ করুন
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Preset Card Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletePresetId}
        title="ক্যাশ এন্ট্রি বাটন মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে এই এন্ট্রি বাটন কার্ডটি মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDeletePreset}
        onClose={() => setDeletePresetId(null)}
      />

      {/* Reset Presets Confirm Modal */}
      <ConfirmModal
        isOpen={confirmResetPresets}
        title="ডিফল্ট এন্ট্রি বাটন রিস্টোর"
        message="আপনি কি সব এন্ট্রি বাটন প্রথম ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?"
        confirmLabel="হ্যাঁ, রিস্টোর করুন"
        onConfirm={handleConfirmResetPresets}
        onClose={() => setConfirmResetPresets(false)}
      />

      {/* Category Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteCategoryInfo !== null}
        title="ক্যাটাগরি মুছে ফেলা"
        message={`আপনি কি নিশ্চিত যে '${deleteCategoryInfo?.name}' ক্যাটাগরি মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleConfirmDeleteCustomCategory}
        onClose={() => setDeleteCategoryInfo(null)}
      />
    </div>
  );
};
