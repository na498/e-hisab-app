import React from 'react';
import {
  Lock,
  Bell,
  PlusCircle,
  Store,
} from 'lucide-react';
import { ShopInfo, UserSettings, AppNotification } from '../types';

interface HeaderProps {
  shopInfo: ShopInfo;
  settings: UserSettings;
  notifications: AppNotification[];
  isOnline: boolean;
  onOpenNewTx: () => void;
  onLockApp: () => void;
  onLogout?: () => void;
  onOpenNotifications: () => void;
  onQuickPrint?: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  shopInfo,
  settings,
  notifications,
  isOnline,
  onOpenNewTx,
  onLockApp,
  onLogout,
  onOpenNotifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Shop Branding */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-700/80 rounded-lg text-emerald-100 border border-emerald-600 shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                    {shopInfo.shopName || 'ই-সেন্টার'}
                  </h1>
                  <span className="bg-emerald-800 text-emerald-200 text-xs px-2 py-0.5 rounded-full border border-emerald-700 font-medium">
                    শাখা: {shopInfo.branchName || 'প্রধান শাখা'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 font-sans">
                  ডিজিটাল ক্যাশ বুক ও অনলাইন-অফলাইন বাকি খাতা
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors"
                title="নোটিফিকেশন"
                id="header-mobile-notification-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-emerald-900 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Status & Control Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 md:pt-0">

            {/* Notification Bell (Desktop) */}
            <button
              onClick={onOpenNotifications}
              className="hidden md:flex items-center gap-1.5 p-2 bg-emerald-800/70 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-medium border border-emerald-700/80 transition-all relative"
              id="header-desktop-notification-btn"
            >
              <Bell className="w-4 h-4" />
              <span>নোটিফিকেশন</span>
              {unreadCount > 0 && (
                <span className="ml-1 bg-amber-400 text-emerald-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Security Lock */}
            {settings.pinEnabled && (
              <button
                onClick={onLockApp}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-800/70 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-medium border border-emerald-700/80 transition-all"
                title="অ্যাপ লক করুন"
                id="header-lock-app-btn"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">লক</span>
              </button>
            )}

            {/* New Entry Button */}
            <button
              onClick={onOpenNewTx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg text-xs sm:text-sm shadow-md transition-all active:scale-95"
              id="header-add-transaction-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন এন্ট্রি</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
