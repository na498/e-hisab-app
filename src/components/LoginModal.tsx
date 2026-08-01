import React, { useState } from 'react';
import { Lock, Phone, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { ShopInfo } from '../types';

import loginBgArtwork from '../assets/images/login-bg.png';

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
      sessionStorage.setItem('e_hisab_admin_authenticated', 'true');
      setPhoneInput('');
      setPasswordInput('');
      onLoginSuccess();
    } else {
      if (!isPhoneMatch && !isPasswordMatch) {
        setErrorMsg('মোবাইল নম্বর ও পাসওয়ার্ড ভুল হয়েছে!');
      } else if (!isPhoneMatch) {
        setErrorMsg('সঠিক এডমিন মোবাইল নম্বর লিখুন!');
      } else {
        setErrorMsg('পাসওয়ার্ডটি ভুল হয়েছে! আবার চেষ্টা করুন।');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden select-none bg-black">
      
      {/* 🖼️ BACKGROUND ARTWORK */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBgArtwork})` }}
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* 🔐 WIDER GLASS CARD (চওড়া ও পারফেক্ট শেইপ) */}
      <div className="relative z-10 w-full max-w-[480px] sm:max-w-[510px] rounded-[32px] bg-slate-950/25 backdrop-blur-sm border border-white/20 p-6 sm:p-8 shadow-2xl">
        
        {/* Header Title */}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md mb-1">
            {shopInfo?.name || shopInfo?.shopName || 'ই-হিসাব'}
          </h1>
          <p className="text-emerald-400 font-bold text-sm tracking-wide drop-shadow">
            স্মার্ট ডিজিটাল খাতা ব্যবস্থাপনা
          </p>
          <div className="w-full h-[1px] bg-white/15 mt-4 mb-1" />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/30 border border-rose-500/50 rounded-xl text-rose-100 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mobile Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2 drop-shadow-sm">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>এডমিন মোবাইল নম্বর (Mobile Number):</span>
            </label>
            <input
              type="text"
              required
              placeholder="আপনার মোবাইল নম্বর দিন"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-900/35 border border-slate-400/40 rounded-xl px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all shadow-inner"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2 drop-shadow-sm">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>পাসওয়ার্ড (Password):</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-sm font-semibold bg-slate-900/35 border border-slate-400/40 rounded-xl pl-4 pr-11 py-3 text-white placeholder-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#00875a] hover:bg-[#009b67] active:scale-[0.99] text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer group"
          >
            <span>লগইন করুন (Login)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Footer Note */}
          <div className="pt-1.5 text-center text-xs text-slate-100 font-semibold flex items-center justify-center gap-1.5 drop-shadow">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>সকল হিসাব সুরক্ষিত ও এনক্রিপ্টেড</span>
          </div>
        </form>
      </div>

      {/* Developer Credit Text */}
      <div className="mt-5 text-center z-10 px-4">
        <p className="text-xs font-semibold text-slate-200/90 tracking-wide drop-shadow-md">
          ©2026 E-Center Designed & Developed by MEHEDI HASAN SAKIB
        </p>
      </div>
    </div>
  );
};