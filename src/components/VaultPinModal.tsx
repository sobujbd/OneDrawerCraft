import React, { useState } from 'react';
import { Fingerprint, Lock, Unlock, X } from 'lucide-react';

interface VaultPinModalProps {
  isOpen: boolean;
  expectedPin: string;
  onUnlockSuccess: () => void;
  onClose: () => void;
}

export const VaultPinModal: React.FC<VaultPinModalProps> = ({
  isOpen,
  expectedPin,
  onUnlockSuccess,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setError('');
    const next = (pinInput + digit).slice(0, 4);
    setPinInput(next);
    if (next.length === 4) {
      if (next === expectedPin) {
        setPinInput('');
        onUnlockSuccess();
      } else {
        setError(`Incorrect PIN (Default PIN is ${expectedPin})`);
        setPinInput('');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Hidden App Vault"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-2xl text-slate-900 dark:text-zinc-100 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Hidden App Vault</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel Vault Unlock"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
          Enter 4-digit PIN (default <span className="font-mono font-semibold">{expectedPin}</span>) or tap Biometric Sensor
        </p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 my-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                pinInput.length > idx
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-slate-300 dark:border-zinc-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-500 font-medium mb-2">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 my-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-mono font-bold text-sm transition-colors cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPinInput('')}
            className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-mono font-bold text-sm transition-colors cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              setPinInput('');
              onUnlockSuccess();
            }}
            title="Instant Biometric Unlock"
            aria-label="Unlock with Biometric Fingerprint"
            className="h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Fingerprint className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onUnlockSuccess}
          className="w-full min-h-[42px] mt-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>Quick Biometric Unlock</span>
        </button>
      </div>
    </div>
  );
};
