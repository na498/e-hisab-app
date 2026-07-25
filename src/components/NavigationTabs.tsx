import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Printer,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueCount?: number;
  onLogout?: () => void;
  authEnabled?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  dueCount = 0,
  onLogout,
  authEnabled = true,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'ledger', label: 'লেনদেন খাতা', icon: BookOpen },
    {
      id: 'dues',
      label: 'বাকি খাতা',
      icon: Users,
      badge: dueCount > 0 ? dueCount : null,
    },
    { id: 'monthly_report', label: 'মাসিক রিপোর্ট', icon: Printer },
    { id: 'analytics', label: 'গ্রাফ অ্যানালিটিক্স', icon: BarChart3 },
    { id: 'settings', label: 'সেটিংস ও ব্যাকআপ', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 shadow-xs shrink-0 print:hidden md:sticky md:top-[61px] self-start z-20 flex flex-col justify-between">
      <div className="p-2 sm:p-3">
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`nav-tab-${tab.id}`}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap md:whitespace-normal transition-all w-full text-left ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-emerald-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-300' : 'text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                      isActive
                        ? 'bg-amber-400 text-emerald-950'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Logout Button */}
      {authEnabled && onLogout && (
        <div className="p-2 sm:p-3 border-t border-slate-200 mt-2 bg-slate-50/50 md:bg-transparent">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            id="sidebar-logout-btn"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all w-full text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
            <span>এডমিন লগআউট (Logout)</span>
          </button>
        </div>
      )}
    </aside>
  );
};