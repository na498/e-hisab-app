import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Calendar,
  Wallet,
  ArrowRight,
  CheckCheck,
  BellOff,
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onClearAll,
  onDeleteNotification,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'due'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'due') return n.type === 'due_alert';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white max-w-md w-full h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-emerald-800/80 rounded-xl border border-emerald-700 shadow-xs">
              <Bell className="w-5 h-5 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-emerald-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight font-serif text-white">
                নোটিফিকেশন সেন্টার
              </h3>
              <p className="text-xs text-emerald-200">
                বাকি তাগাদা ও লেনদেনের প্রয়োজনীয় সসংবাদ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-emerald-800/60 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সবগুলো ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অপঠিত ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('due')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === 'due'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাকি তাগাদা
            </button>
          </div>

          {onMarkAllRead && unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="সবগুলো পঠিত হিসেবে চিহ্নিত করুন"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">পঠিত</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-16 px-4 flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-slate-100 rounded-full mb-3 text-slate-300">
                <BellOff className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-600 text-sm">কোনো নোটিফিকেশন নেই</p>
              <p className="text-xs text-slate-400 mt-1">
                {filter === 'unread'
                  ? 'আপনার কোনো অপঠিত নোটিফিকেশন নেই।'
                  : 'নতুন কোনো তাগাদা বা বার্তা পাওয়া যায়নি।'}
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => {
              const isDueAlert = n.type === 'due_alert';
              const isCashAlert = n.type === 'cash_alert';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all relative group ${
                    !n.read
                      ? isDueAlert
                        ? 'bg-rose-50/90 border-rose-200 shadow-sm'
                        : isCashAlert
                        ? 'bg-amber-50/90 border-amber-200 shadow-sm'
                        : 'bg-emerald-50/90 border-emerald-200 shadow-sm'
                      : 'bg-white border-slate-200/80 shadow-2xs opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon Badge */}
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isDueAlert
                          ? 'bg-rose-100 text-rose-800'
                          : isCashAlert
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isDueAlert ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isCashAlert ? (
                        <Wallet className="w-5 h-5" />
                      ) : (
                        <Info className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 ring-2 ring-white" />
                        )}
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed mb-2 font-medium">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-400 font-sans flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {n.date}
                        </span>

                        <div className="flex items-center gap-2">
                          {isDueAlert && onNavigateTab && (
                            <button
                              type="button"
                              onClick={() => {
                                onMarkAsRead(n.id);
                                onNavigateTab('dues');
                                onClose();
                              }}
                              className="font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>বাকি খাতা</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => onMarkAsRead(n.id)}
                              className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                            >
                              পঠিত মার্ক
                            </button>
                          )}

                          {onDeleteNotification && (
                            <button
                              type="button"
                              onClick={() => onDeleteNotification(n.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shadow-lg">
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs text-rose-700 font-bold hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সব পরিষ্কার করুন</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

