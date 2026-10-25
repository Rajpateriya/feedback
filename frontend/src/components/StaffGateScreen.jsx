import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext';

export default function StaffGateScreen({ targetPath, showToast }) {
  const { authenticate, STAFF_PASSCODE } = useStaffAuth();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!passcode) {
      setError('Please enter the staff passcode.');
      return;
    }

    const result = authenticate(passcode);
    if (result.success) {
      showToast?.('Staff authorization confirmed! Access granted.', 'success');
      // Authenticated state is reactive; the protected route will immediately render its children.
    } else {
      setError('Incorrect passcode. Please enter the valid staff password.');
    }
  };

  const handleQuickFill = () => {
    setPasscode(STAFF_PASSCODE);
    setError('');
  };

  const pageName = targetPath?.includes('moderation') ? 'Moderation Queue' : 'Executive Analytics';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-[0_20px_60px_rgba(81,34,254,0.12)] border border-purple-200 text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#5122fe] to-[#8c52ff] flex items-center justify-center text-white shadow-xl shadow-[#5122fe]/30 ring-8 ring-purple-100">
          <span className="material-symbols-outlined text-[32px]">shield_person</span>
        </div>

        {/* Heading */}
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5122fe] bg-purple-100 px-3 py-0.5 rounded-full border border-purple-200">
            Protected Staff Route
          </span>
          <h2 className="font-headline text-2xl font-extrabold text-purple-950 tracking-tight mt-2">
            Unlock {pageName}
          </h2>
          <p className="text-xs text-purple-900/60 mt-1.5 max-w-xs mx-auto">
            This dashboard is restricted to authorized moderators and store managers. Please verify your staff credentials to proceed.
          </p>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1.5">
              Staff Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password (12345)..."
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
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
                <span className="material-symbols-outlined text-[15px]">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Fill Helper */}
          <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-purple-900/70">
              <span className="material-symbols-outlined text-[16px] text-[#5122fe]">key</span>
              <span>Passcode: <strong className="text-purple-950 font-mono">12345</strong></span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-[#5122fe] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs"
            >
              Fill 12345
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#5122fe] to-[#7b4eff] hover:from-[#4316df] hover:to-[#6a3bf0] text-white shadow-md shadow-[#5122fe]/30 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[17px]">lock_open</span>
              <span>Authorize & Access {pageName}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-purple-900/70 hover:text-purple-950 hover:bg-purple-50 border border-purple-200/80 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Return to Public Feed</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
