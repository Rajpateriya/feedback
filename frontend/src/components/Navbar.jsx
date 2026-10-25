import React, { useState } from 'react';

export default function Navbar({ activeTab, setActiveTab, pendingCount = 0, onSearch, searchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hub', label: 'Reviews Feed', icon: 'forum' },
    { id: 'submit', label: 'Submit Review', icon: 'rate_review' },
    { id: 'moderation', label: 'Moderation Queue', icon: 'verified_user', badge: pendingCount },
    { id: 'analytics', label: 'Analytics', icon: 'bar_chart' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="h-14 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Environment Pill */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button 
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-2 select-none text-left focus:outline-none group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <span className="material-symbols-outlined text-[17px]">rate_review</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline font-bold text-base text-slate-900 tracking-tight">
                Pulse<span className="text-indigo-600 font-extrabold">Review</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">v4.2</span>
            </div>
          </button>
          
          <div className="hidden xl:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/80 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production Feed</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Compact Search Input */}
          <div className="hidden sm:flex items-center relative w-44 lg:w-56">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[16px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <kbd className="absolute right-2 text-[10px] text-slate-400 border border-slate-200 bg-white rounded px-1 py-0.2 pointer-events-none">
              /
            </kbd>
          </div>

          {/* Quick Notification Bell */}
          <button
            aria-label="Queue Notifications"
            onClick={() => setActiveTab('moderation')}
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-semibold flex items-center justify-center border border-slate-200 shadow-2xs">
              EV
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">Eleanor Vance</div>
              <div className="text-[10px] text-slate-500">Moderator</div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 space-y-1 shadow-md">
          <div className="pb-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            />
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === item.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
