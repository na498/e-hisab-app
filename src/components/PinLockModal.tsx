import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle } from 'lucide-react';
import { UserSettings } from '../types';

interface PinLockModalProps {
  settings: UserSettings;
  onUnlock: (pin: string) => boolean;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  settings,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        const success = onUnlock(nextPin);
        if (!success) {
          setError(true);
          setTimeout(() => setEnteredPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/95 backdrop-blur-md animate-fade-in text-white">
      <div className="bg-emerald-900 border border-emerald-700/80 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-amber-500 text-emerald-950 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold font-serif mb-1">পিন কোড লিখুন</h2>
        <p className="text-xs text-emerald-200 mb-6">
          হিসাব খাতা সুরক্ষিত রাখতে আপনার ৪ ডিজিটের পিন নম্বর লিখুন
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? 'bg-amber-400 border-amber-400 scale-110 shadow-xs'
                  : 'border-emerald-600 bg-emerald-800'
              } ${error ? 'bg-rose-500 border-rose-500 animate-pulse' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-300 font-bold mb-4 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ভুল পিন নম্বর! আবার চেষ্টা করুন।</span>
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 bg-emerald-800 hover:bg-emerald-700 active:bg-amber-500 active:text-emerald-950 rounded-2xl font-bold text-xl transition-all shadow-sm flex items-center justify-center border border-emerald-700"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 bg-emerald-800 hover:bg-emerald-700 active:bg-amber-500 active:text-emerald-950 rounded-2xl font-bold text-xl transition-all shadow-sm flex items-center justify-center border border-emerald-700"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 bg-emerald-800/80 hover:bg-rose-900/80 text-rose-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center border border-emerald-700"
          >
            মুছুন
          </button>
        </div>
      </div>
    </div>
  );
};
