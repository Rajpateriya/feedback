import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext';

export default function Navbar({ pendingCount = 0, onSearch, searchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, logout } = useStaffAuth();

  const navItems = [
    { 
      id: 'hub', 
      path: '/', 
      label: 'Feed', 
      icon: 'forum',
      requiresAuth: false,
    },
    { 
      id: 'moderation', 
      path: '/moderation', 
      label: 'Moderation', 
      icon: 'verified_user', 
      badge: pendingCount,
      requiresAuth: true,
    },
    { 
      id: 'analytics', 
      path: '/analytics', 
      label: 'Analytics', 
      icon: 'insights',
      requiresAuth: true,
    },
  ];

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated) {
      openAuthModal(item.path);
    } else {
      navigate(item.path);
    }
    setMobileMenuOpen(false);
  };

  const isCurrentActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/' || location.pathname === '/feed';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Floating Island Navbar */}
      <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto max-w-6xl w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-[0_8px_30px_rgba(81,34,254,0.10)] rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all">
          
          {/* Logo */}
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 select-none text-left focus:outline-none pl-1 group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#5122fe] to-[#8c52ff] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                Pulse<span className="text-[#5122fe] font-extrabold">Review</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-[#5122fe] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Shoe Hub
              </span>
            </div>
          </button>

          {/* Floating Navigation Pill Group */}
          <nav className="hidden md:flex items-center gap-1 bg-purple-50/70 p-1 rounded-full border border-purple-200/60">
            {navItems.map((item) => {
              const active = isCurrentActive(item);
              const isLocked = item.requiresAuth && !isAuthenticated;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`relative px-3.5 py-1.2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-[#5122fe] to-[#7b4eff] text-white font-semibold shadow-xs' 
                      : 'text-purple-900/70 hover:text-purple-950 hover:bg-white/70'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[14px] ${active ? 'text-white' : 'text-purple-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {/* Lock Indicator when unauthenticated */}
                  {isLocked && (
                    <span 
                      className="material-symbols-outlined text-[12px] text-purple-400" 
                      title="Password required (12345)"
                    >
                      lock
                    </span>
                  )}

                  {/* Pending Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      active ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-200/80 text-purple-900'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Search Toggle / Input */}
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
                    className="w-36 sm:w-52 h-7.5 pl-7 pr-6 rounded-full bg-purple-50/80 border border-purple-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#5122fe] transition-all placeholder:text-purple-300"
                  />
                  <span className="material-symbols-outlined absolute left-2 text-purple-400 text-[14px]">
                    search
                  </span>
                  <button
                    type="button"
                    onClick={() => { onSearch?.(''); setSearchOpen(false); }}
                    className="absolute right-2 text-purple-400 hover:text-purple-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-full text-purple-700/80 hover:text-purple-900 hover:bg-purple-100/60 transition-colors cursor-pointer"
                  title="Search sneaker reviews"
                >
                  <span className="material-symbols-outlined text-[17px]">search</span>
                </button>
              )}
            </div>

            {/* Notification Badge */}
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('/moderation');
                } else {
                  navigate('/moderation');
                }
              }}
              className="relative p-1.5 rounded-full text-purple-700/80 hover:text-purple-900 hover:bg-purple-100/60 transition-colors cursor-pointer"
              title="Moderation Queue"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#5122fe] rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Authenticated Staff Pill / Normal Lock Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-purple-100/80 pl-2.5 pr-1 py-0.5 rounded-full border border-purple-200">
                <span className="text-[10px] font-bold text-[#5122fe] hidden sm:inline-block">
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
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('/moderation')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5122fe] text-[11px] font-bold border border-purple-200 shadow-2xs transition-colors cursor-pointer"
                title="Staff Login (passcode: 12345)"
              >
                <span className="material-symbols-outlined text-[13px]">lock</span>
                <span>Staff Portal</span>
              </button>
            )}

            {/* Moderator Avatar */}
            <div 
              className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5122fe] to-[#8c52ff] text-white text-[10px] font-bold flex items-center justify-center shadow-xs border border-purple-300/40 select-none"
              title={isAuthenticated ? 'Eleanor Vance (Staff Moderator - Active)' : 'Visitor (Normal User)'}
            >
              {isAuthenticated ? 'EV' : 'USR'}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded-full text-purple-800 hover:bg-purple-100/60 ml-1 cursor-pointer"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-purple-200/90 rounded-2xl p-2.5 shadow-lg space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const active = isCurrentActive(item);
              const isLocked = item.requiresAuth && !isAuthenticated;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-[#5122fe] to-[#7b4eff] text-white font-semibold' 
                      : 'text-purple-900/80 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                    <span>{item.label}</span>
                    {isLocked && (
                      <span className="material-symbols-outlined text-[13px] text-purple-400">
                        lock
                      </span>
                    )}
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile Staff Status toggle */}
            <div className="pt-2 border-t border-purple-100 flex items-center justify-between px-2 text-xs">
              <span className="text-purple-900/60 font-medium">
                {isAuthenticated ? 'Staff Mode Active' : 'Normal User Mode'}
              </span>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-600 font-bold hover:underline text-[11px]"
                >
                  Lock / Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('/moderation');
                    setMobileMenuOpen(false);
                  }}
                  className="text-[#5122fe] font-bold hover:underline text-[11px]"
                >
                  Unlock Staff
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
