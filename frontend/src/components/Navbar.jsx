import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext';

export default function Navbar({ onSearch, searchQuery }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useStaffAuth();

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto max-w-5xl w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-[0_8px_30px_rgba(81,34,254,0.08)] rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 transition-all">
        
        {/* Logo (Directs to Feed) */}
        <button 
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 select-none text-left focus:outline-none pl-1 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5122fe] to-[#8c52ff] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[17px]">rate_review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Pulse<span className="text-[#5122fe] font-extrabold">Review</span>
            </span>
            <span className="text-[10px] font-bold text-[#5122fe] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Shoe Hub
            </span>
          </div>
        </button>

        {/* Right Action Area: Search & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sneaker Reviews Search Input */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center relative animate-in fade-in zoom-in-95 duration-150">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearch?.(e.target.value)}
                  placeholder="Search sneaker reviews..."
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                  className="w-44 sm:w-64 h-8 pl-8 pr-7 rounded-full bg-purple-50/80 border border-purple-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#5122fe] transition-all placeholder:text-purple-300 font-medium"
                />
                <span className="material-symbols-outlined absolute left-2.5 text-purple-400 text-[15px]">
                  search
                </span>
                <button
                  type="button"
                  onClick={() => { onSearch?.(''); setSearchOpen(false); }}
                  className="absolute right-2 text-purple-400 hover:text-purple-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50/80 hover:bg-purple-100/70 border border-purple-200/70 text-purple-900/70 hover:text-purple-950 transition-colors cursor-pointer text-xs font-semibold"
                title="Search sneaker reviews"
              >
                <span className="material-symbols-outlined text-[16px] text-[#5122fe]">search</span>
                <span className="hidden sm:inline">Search reviews...</span>
              </button>
            )}
          </div>

          {/* If staff session is active, show small lock/sign-out pill */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 bg-purple-100/90 pl-2.5 pr-1 py-0.5 rounded-full border border-purple-300/80 shadow-2xs">
              <span className="text-[10px] font-bold text-[#5122fe] hidden sm:inline">
                Staff Active
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-6 h-6 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 text-purple-700 flex items-center justify-center text-[12px] transition-colors shadow-2xs cursor-pointer"
                title="Lock / Exit Staff Mode"
              >
                <span className="material-symbols-outlined text-[13px]">lock</span>
              </button>
            </div>
          )}

          {/* User Avatar */}
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5122fe] to-[#8c52ff] text-white text-[11px] font-bold flex items-center justify-center shadow-xs border border-purple-300/40 select-none cursor-pointer"
            title={isAuthenticated ? 'Eleanor Vance (Staff Moderator)' : 'Shopper Profile'}
          >
            {isAuthenticated ? 'EV' : 'USR'}
          </div>

        </div>

      </div>
    </header>
  );
}
