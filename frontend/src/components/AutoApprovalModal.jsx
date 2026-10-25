import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AutoApprovalModal({ isOpen, onClose, showToast }) {
  const [rules, setRules] = useState({
    min_rating_for_auto_approve: 4,
    max_toxicity_threshold: 0.15,
    require_verified_purchase: true,
    require_sentiment_positive: true,
    auto_flag_keywords: 'scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getRules()
        .then(res => setRules(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateRules(rules);
      showToast?.('Auto-approval governance rules updated successfully!', 'success');
      onClose();
    } catch (err) {
      showToast?.(`Error saving rules: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[16px]">tune</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-slate-900">
                Auto-Approval Engine
              </h3>
              <p className="text-[11px] text-slate-500">Trust Engine v4.2 Policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-indigo-600 text-2xl animate-spin">refresh</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            
            {/* Min Rating */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Minimum Rating For Instant Clearance
              </label>
              <select
                value={rules.min_rating_for_auto_approve}
                onChange={(e) => setRules({ ...rules, min_rating_for_auto_approve: parseInt(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium"
              >
                <option value={5}>5 Stars only</option>
                <option value={4}>4 Stars or higher (Recommended)</option>
                <option value={3}>3 Stars or higher</option>
                <option value={1}>All ratings (No minimum)</option>
              </select>
            </div>

            {/* Max Toxicity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-800">
                  Toxicity Threshold Ceiling
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {Math.round(rules.max_toxicity_threshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={rules.max_toxicity_threshold}
                onChange={(e) => setRules({ ...rules, max_toxicity_threshold: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400">
                Submissions exceeding this algorithmic toxicity score will automatically flag for moderator review.
              </p>
            </div>

            {/* Verified Purchase Requirement */}
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.require_verified_purchase}
                onChange={(e) => setRules({ ...rules, require_verified_purchase: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-800">
                Require Verified Buyer Certificate
              </span>
            </label>

            {/* Auto-flag Keywords */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Restricted Keywords (Comma Separated)
              </label>
              <textarea
                rows={2}
                value={rules.auto_flag_keywords}
                onChange={(e) => setRules({ ...rules, auto_flag_keywords: e.target.value })}
                placeholder="scam, fake, lawsuit, refund..."
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
              ></textarea>
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rules.is_active}
                onChange={(e) => setRules({ ...rules, is_active: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Enable Automated Clearance Rule Engine
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                {saving ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
