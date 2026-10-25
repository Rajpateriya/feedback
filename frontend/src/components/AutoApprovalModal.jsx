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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4 animate-in zoom-in-95">
        
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-purple-950">
                Shoe Auto-Approval Engine
              </h3>
              <p className="text-[11px] text-purple-400">Trust Engine v4.2 Policy Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-purple-600 text-3xl animate-spin">refresh</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            {/* Min Rating */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Minimum Rating For Instant Clearance
              </label>
              <select
                value={rules.min_rating_for_auto_approve}
                onChange={(e) => setRules({ ...rules, min_rating_for_auto_approve: parseInt(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-950 font-medium focus:outline-none focus:border-purple-600"
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
                <label className="block text-xs font-semibold text-purple-950">
                  Toxicity Threshold Ceiling
                </label>
                <span className="text-xs font-bold text-purple-700">
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
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-purple-400">
                Submissions exceeding this algorithmic toxicity score will automatically flag for moderator review.
              </p>
            </div>

            {/* Verified Purchase Requirement */}
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.require_verified_purchase}
                onChange={(e) => setRules({ ...rules, require_verified_purchase: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-semibold text-purple-950">
                Require Verified Buyer Order
              </span>
            </label>

            {/* Auto-flag Keywords */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Restricted Keywords (Comma Separated)
              </label>
              <textarea
                rows={2}
                value={rules.auto_flag_keywords}
                onChange={(e) => setRules({ ...rules, auto_flag_keywords: e.target.value })}
                placeholder="scam, fake, lawsuit, refund, counterfeit..."
                className="w-full p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono text-purple-950 focus:outline-none focus:border-purple-600"
              ></textarea>
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rules.is_active}
                onChange={(e) => setRules({ ...rules, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-bold text-purple-950">
                Enable Automated Clearance Rule Engine
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors"
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
