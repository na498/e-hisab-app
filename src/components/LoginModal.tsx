import React, { useState } from 'react';
import { Lock, Phone, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { ShopInfo } from '../types';

// আপনার প্রজেক্টের ফোল্ডার থেকে লোকাল ছবি ইমপোর্ট করা হলো 
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
      (cleanAdminPhone.length > 0 && cleanAdminPhone.endsWith(cleanAdminPhone));

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden select-none bg-slate-950/20">
      
      {/* 🖼️ HIGH-END ARTWORK BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBgArtwork})` }}
        />
        <div className="absolute inset-0 bg-slate-950/25" />
      </div>

      {/* 🪙 FLOATING TAKA (৳) COINS & SYMBOLS */}
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [-8, 8, -8], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden md:flex absolute top-16 left-12 lg:left-24 items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/40 border border-amber-400/30 backdrop-blur-md shadow-lg z-10"
      >
        <span className="text-3xl font-black text-amber-400">৳</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 20, 0], rotate: [10, -6, 10], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="hidden md:flex absolute bottom-16 left-16 lg:left-28 items-center justify-center w-20 h-20 rounded-full bg-slate-900/40 border border-emerald-400/30 backdrop-blur-md shadow-lg z-10"
      >
        <span className="text-4xl font-black text-emerald-400">৳</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -16, 0], rotate: [6, -10, 6], scale: [1, 1.06, 1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="hidden md:flex absolute top-20 right-12 lg:right-24 items-center justify-center w-20 h-20 rounded-3xl bg-slate-900/40 border border-emerald-400/30 backdrop-blur-md shadow-lg z-10"
      >
        <span className="text-4xl font-black text-emerald-400">৳</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 18, 0], rotate: [-8, 10, -8], scale: [1, 1.08, 1] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="hidden md:flex absolute bottom-20 right-16 lg:right-28 items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/40 border border-amber-400/30 backdrop-blur-md shadow-lg z-10"
      >
        <span className="text-3xl font-black text-amber-400">৳</span>
      </motion.div>

      {/* 🔐 MAIN STRAIGHT & LIGHT GLASS LOGIN CARD (Without Header Box) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 bg-slate-950/25 backdrop-blur-md w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/30 overflow-hidden"
      >
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          
          {/* Shop Title inside form directly since header was removed */}
          <div className="text-center pb-2 border-b border-white/10">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow">
              {shopInfo?.name || shopInfo?.shopName || 'ই-হিসাব সফটওয়্যার'}
            </h1>
            <p className="text-xs text-emerald-300 font-semibold mt-1">স্মার্ট ডিজিটাল খাতা ব্যবস্থাপনা</p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-950/60 border border-rose-400/40 rounded-2xl text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-sm backdrop-blur-sm"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Mobile Field */}
          <div>
            <label className="block text-xs font-bold text-slate-100 mb-1.5 flex items-center gap-1.5 drop-shadow">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>এডমিন মোবাইল নম্বর (Mobile Number):</span>
            </label>
            <input
              type="text"
              required
              placeholder="আপনার মোবাইল নম্বর দিন"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full text-sm font-bold bg-slate-900/40 border border-white/25 rounded-xl px-4 py-3 text-white placeholder-slate-300 focus:bg-slate-900/70 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all shadow-inner backdrop-blur-sm"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-100 mb-1.5 flex items-center gap-1.5 drop-shadow">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>পাসওয়ার্ড (Password):</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-sm font-bold bg-slate-900/40 border border-white/25 rounded-xl pl-4 pr-11 py-3 text-white placeholder-slate-300 focus:bg-slate-900/70 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all shadow-inner backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer group border border-emerald-400/40"
          >
            <span>লগইন করুন (Login)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Footer note */}
          <div className="pt-2 text-center text-[11px] text-slate-200 font-medium flex items-center justify-center gap-1.5 drop-shadow">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>সকল হিসাব সুরক্ষিত ও এনক্রিপ্টেড</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};