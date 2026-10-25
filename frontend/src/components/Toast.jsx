import React from 'react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
        isSuccess ? 'bg-[#131b2e] text-white border-[#005b3d]' :
        isError ? 'bg-[#93000a] text-white border-[#ba1a1a]' :
        'bg-[#131b2e] text-white border-[#eaedff]'
      }`}>
        <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">
          {isSuccess ? 'check_circle' : isError ? 'error' : 'info'}
        </span>
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/60 hover:text-white"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
