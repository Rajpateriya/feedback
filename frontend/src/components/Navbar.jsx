import React, { useState } from 'react';

export default function Navbar({ activeTab, setActiveTab, pendingCount = 0, onSearch, searchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { id: 'hub', label: 'Feed', icon: 'forum' },
    { id: 'submit', label: 'Write Review', icon: 'rate_review' },
    { id: 'moderation', label: 'Moderation', icon: 'verified_user', badge: pendingCount },
    { id: 'analytics', label: 'Analytics', icon: 'insights' },
  ];

  return (
    <>
      {/* Floating Island Navbar */}
      <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto max-w-4xl w-[calc(100%-1.5rem)] z-50">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] rounded-full px-3.5 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 transition-all">
          
          {/* Logo */}
          <button 
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-2 select-none text-left focus:outline-none pl-1"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[15px]">rate_review</span>
            </div>
            <span className="font-headline font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
              Pulse<span className="text-indigo-600">Review</span>
            </span>
          </button>

          {/* Floating Navigation Pill Group */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-full border border-slate-200/50">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-white text-slate-900 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Search */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Search Toggle / Input */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center relative animate-in fade-in zoom-in-95 duration-150">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search reviews..."
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                    className="w-36 sm:w-48 h-7 pl-7 pr-6 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-2 text-slate-400 text-[14px]">
                    search
                  </span>
                  <button
                    onClick={() => { onSearch(''); setSearchOpen(false); }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Search reviews"
                >
                  <span className="material-symbols-outlined text-[17px]">search</span>
                </button>
              )}
            </div>

            {/* Notification Badge */}
            <button
              onClick={() => setActiveTab('moderation')}
              className="relative p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Moderation Queue"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Moderator Avatar */}
            <div 
              className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-semibold flex items-center justify-center shadow-xs"
              title="Eleanor Vance (Staff Moderator)"
            >
              EV
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded-full text-slate-600 hover:bg-slate-100 ml-1"
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
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-2.5 shadow-lg space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-slate-900 text-white font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
