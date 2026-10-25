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
      <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto max-w-6xl w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] z-50">
        <div className="bg-white/90 backdrop-blur-xl border border-purple-200/80 shadow-[0_8px_30px_rgba(81,34,254,0.10)] rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all">
          
          {/* Logo */}
          <button 
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-2 select-none text-left focus:outline-none pl-1 group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-700 to-violet-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                Pulse<span className="text-purple-600 font-extrabold">Review</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-200">
                Shoe Hub
              </span>
            </div>
          </button>

          {/* Floating Navigation Pill Group */}
          <nav className="hidden md:flex items-center gap-1 bg-purple-50/70 p-1 rounded-full border border-purple-200/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-1.2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs' 
                      : 'text-purple-900/70 hover:text-purple-900 hover:bg-white/60'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[14px] ${isActive ? 'text-white' : 'text-purple-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-200/70 text-purple-800'
                    }`}>
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
                    placeholder="Search sneaker reviews..."
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                    className="w-36 sm:w-56 h-7.5 pl-7 pr-6 rounded-full bg-purple-50/80 border border-purple-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 transition-all placeholder:text-purple-300"
                  />
                  <span className="material-symbols-outlined absolute left-2 text-purple-400 text-[14px]">
                    search
                  </span>
                  <button
                    onClick={() => { onSearch(''); setSearchOpen(false); }}
                    className="absolute right-2 text-purple-400 hover:text-purple-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-full text-purple-700/80 hover:text-purple-900 hover:bg-purple-100/60 transition-colors"
                  title="Search sneaker reviews"
                >
                  <span className="material-symbols-outlined text-[17px]">search</span>
                </button>
              )}
            </div>

            {/* Notification Badge */}
            <button
              onClick={() => setActiveTab('moderation')}
              className="relative p-1.5 rounded-full text-purple-700/80 hover:text-purple-900 hover:bg-purple-100/60 transition-colors"
              title="Moderation Queue"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Moderator Avatar */}
            <div 
              className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-800 to-violet-900 text-purple-100 text-[10px] font-bold flex items-center justify-center shadow-xs border border-purple-300/40"
              title="Eleanor Vance (Staff Moderator)"
            >
              EV
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded-full text-purple-800 hover:bg-purple-100/60 ml-1"
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
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-purple-200/80 rounded-2xl p-2.5 shadow-lg space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold' 
                    : 'text-purple-900/80 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
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
