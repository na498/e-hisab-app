import React, { useState } from 'react';
import { Lock, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Store } from 'lucide-react';
import { ShopInfo } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: () => void;
  adminPhone: string;
  adminPassword: string;
  shopInfo: ShopInfo;
}

// Convert Bengali digits to standard English digits for comparison
function normalizeDigits(str: string): string {
  if (!str) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bnDigits[i], i.toString());
  }
  // Strip non-digit characters for clean phone comparison
  return res.replace(/\D/g, '');
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  adminPhone,
  adminPassword,
  shopInfo,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInputPhone = normalizeDigits(phoneInput);
    const cleanAdminPhone = normalizeDigits(adminPhone);

    const isPhoneMatch =
      cleanInputPhone === cleanAdminPhone ||
      (cleanInputPhone.length > 0 && cleanAdminPhone.endsWith(cleanInputPhone)) ||
      (cleanAdminPhone.length > 0 && cleanInputPhone.endsWith(cleanAdminPhone));

    const isPasswordMatch = passwordInput.trim() === adminPassword.trim();

    if (isPhoneMatch && isPasswordMatch) {
      onLoginSuccess();
      setPhoneInput('');
      setPasswordInput('');
    } else {
      if (!isPhoneMatch && !isPasswordMatch) {
        setErrorMsg('মোবাইল নম্বর ও পাসওয়ার্ড ভুল হয়েছে!');
      } else if (!isPhoneMatch) {
        setErrorMsg('সঠিক এডমিন মোবাইল নম্বর লিখুন!');
      } else {
        setErrorMsg('পাসওয়ার্ডটি ভুল হয়েছে! আবার চেষ্টা করুন।');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-6 text-center text-white relative">
          <div className="w-14 h-14 bg-emerald-700/60 border-2 border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7 text-emerald-200" />
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">
            {shopInfo.shopName || 'দোকান হিসাব সফটওয়্যার'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 font-medium">
            {shopInfo.branchName ? `${shopInfo.branchName} শাখা — ` : ''}এডমিন নিরাপত্তা লগইন
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mobile Phone Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>এডমিন মোবাইল নম্বর (Mobile Number):</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="যেমন: 01700000000"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>পাসওয়ার্ড (Password):</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>লগইন করুন (Login)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};