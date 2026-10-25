import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext';

export default function StaffPasswordModal({ showToast }) {
  const { authModalOpen, closeAuthModal, authenticate, pendingPath, STAFF_PASSCODE } = useStaffAuth();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authModalOpen) {
      setPasscode('');
      setError('');
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!passcode) {
      setError('Please enter the staff passcode.');
      return;
    }

    setIsSubmitting(true);
    const result = authenticate(passcode);
    setIsSubmitting(false);

    if (result.success) {
      showToast?.('Staff access granted! Welcome, Moderator.', 'success');
      closeAuthModal();
      if (pendingPath) {
        navigate(pendingPath);
      }
    } else {
      setError('Incorrect password. Please enter the valid staff passcode.');
    }
  };

  const handleQuickFill = () => {
    setPasscode(STAFF_PASSCODE);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-purple-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog Card */}
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(81,34,254,0.20)] border border-purple-200 z-10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-auth-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-purple-400 hover:text-purple-700 p-1.5 rounded-full hover:bg-purple-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Lock Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5122fe] to-[#8c52ff] flex items-center justify-center text-white shadow-lg shadow-[#5122fe]/30 ring-4 ring-purple-100">
            <span className="material-symbols-outlined text-[28px]">lock</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5122fe] bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                Staff Restricted Area
              </span>
            </div>
            <h2 id="staff-auth-title" className="font-headline text-xl sm:text-2xl font-extrabold text-purple-950 tracking-tight">
              Staff Authorization Required
            </h2>
            <p className="text-xs text-purple-900/60 mt-1.5 max-w-sm">
              Moderation & Analytics portals are restricted to authorized store managers and moderators. Please enter your passcode to continue.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1.5">
              Staff Passcode
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password..."
                className={`w-full h-11 pl-4 pr-11 rounded-2xl bg-purple-50/60 border text-sm text-purple-950 focus:outline-none focus:bg-white transition-all font-mono tracking-wider ${
                  error 
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
                    : 'border-purple-200 focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 p-1"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium animate-in fade-in duration-150">
                <span className="material-symbols-outlined text-[15px]">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Fill / Demo Passcode Helper */}
          <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-purple-900/70">
              <span className="material-symbols-outlined text-[16px] text-[#5122fe]">key</span>
              <span>Default staff passcode: <strong className="text-purple-950 font-mono">12345</strong></span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-[#5122fe] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs"
            >
              Fill 12345
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeAuthModal}
              className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold text-purple-900/70 hover:text-purple-950 hover:bg-purple-50 border border-purple-200/80 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#5122fe] to-[#7b4eff] hover:from-[#4316df] hover:to-[#6a3bf0] text-white shadow-md shadow-[#5122fe]/30 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Unlock Access</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
