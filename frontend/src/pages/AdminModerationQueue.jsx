import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminModerationQueue({ showToast, onQueueUpdated, searchQuery = '' }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData] = useState({ metrics: {}, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [localSearch, setLocalSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const effectiveSearch = searchQuery || localSearch;

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getModerationQueue({
        tab: activeTab,
        search: effectiveSearch || undefined
      });
      setData(res);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      showToast?.('Error loading moderation queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [activeTab, effectiveSearch]);

  const handleAction = async (reviewId, action, note = '') => {
    try {
      await api.executeAction(reviewId, action, note, 'Eleanor Vance');
      showToast?.(`Review ${action}d successfully!`, 'success');
      loadQueue();
      onQueueUpdated?.();
    } catch (err) {
      showToast?.(`Error updating review: ${err.message}`, 'error');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      await api.executeBulkAction(selectedIds, action, 'Bulk operation by Eleanor Vance');
      showToast?.(`Applied ${action} to ${selectedIds.length} reviews`, 'success');
      setSelectedIds([]);
      loadQueue();
      onQueueUpdated?.();
    } catch (err) {
      showToast?.(`Bulk operation failed: ${err.message}`, 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.reviews.map(r => r.id));
    }
  };

  const metrics = data.metrics || {};
  const reviews = data.reviews || [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
              Moderation Pipeline
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Algorithmic Trust Engine v4.2</span>
          </div>
          <h1 className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
            Review Moderation Queue
          </h1>
        </div>

        {/* Compact SLA Counter Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-left">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Median SLA</div>
            <div className="text-sm font-bold text-slate-800">{metrics.median_sla_minutes || 4.2}m</div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-left">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Auto-Clear</div>
            <div className="text-sm font-bold text-emerald-600">{metrics.auto_clear_rate || 94.8}%</div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-left">
            <div className="text-[10px] font-semibold text-indigo-500 uppercase">Pending</div>
            <div className="text-sm font-bold text-indigo-700">{metrics.pending_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Multi-Select Operations */}
      <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Triage Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'pending' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {metrics.pending_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {metrics.approved_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'flagged'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Flagged Risk</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
              {metrics.flagged_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'escalated'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Escalated</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              {metrics.escalated_count || 0}
            </span>
          </button>
        </div>

        {/* Batch Operations Bar */}
        <div className="flex items-center gap-2">
          {reviews.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
            >
              {selectedIds.length === reviews.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] font-semibold text-slate-700 px-1">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Flag
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Queue List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-indigo-600 text-3xl animate-spin">refresh</span>
            <p className="text-xs text-slate-500 mt-2">Checking moderation queue...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">task_alt</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-2">No items in {activeTab} queue</h3>
            <p className="text-xs text-slate-500 mt-1">
              All submissions in this category have been processed.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const isSelected = selectedIds.includes(r.id);
            const toxicityPct = Math.round(r.toxicity_score * 100);
            const sentimentPct = Math.round(r.sentiment_score * 100);
            const formattedDate = new Date(r.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const statusBorder = 
              r.status === 'flagged' ? 'border-l-4 border-l-rose-500' :
              r.status === 'pending' ? 'border-l-4 border-l-amber-500' :
              r.status === 'approved' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-indigo-500';

            return (
              <div
                key={r.id}
                className={`bg-white rounded-xl p-4 sm:p-5 border transition-all ${statusBorder} ${
                  isSelected ? 'border-indigo-400 ring-1 ring-indigo-200 shadow-xs' : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left Column: Select, Info, Text */}
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(r.id)}
                      className="mt-1 w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="space-y-2 flex-1">
                      {/* Sub-header row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{r.customer_name}</span>
                        <span className="text-[11px] text-slate-400">({r.customer_email})</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">{r.sku}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-[11px] text-slate-500">{r.channel}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-[11px] text-slate-400">{formattedDate}</span>
                      </div>

                      {/* Stars & Title */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="material-symbols-outlined text-[14px] material-symbols-filled">
                                {star <= r.rating ? 'star' : 'star_border'}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700">{r.rating}/5</span>
                        </div>
                        <h3 className="font-headline font-bold text-xs sm:text-sm text-slate-900">
                          {r.title}
                        </h3>
                      </div>

                      {/* Review Body */}
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {r.body}
                      </p>

                      {/* Notes / Risk callouts */}
                      {r.moderation_note && (
                        <div className="p-2 rounded-md bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-[14px] mt-0.5 text-rose-600">info</span>
                          <div>
                            <span className="font-semibold">Audit Flag:</span> {r.moderation_note}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Telemetry Badges & Action Buttons */}
                  <div className="lg:w-64 flex flex-col gap-3 pt-3 lg:pt-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-100">
                    
                    {/* Telemetry Indicator */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Toxicity Risk</span>
                        <span className={`font-semibold ${toxicityPct > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {toxicityPct}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full ${toxicityPct > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${toxicityPct}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 font-medium">Sentiment</span>
                        <span className="font-semibold text-indigo-700">{sentimentPct}% ({r.sentiment_label})</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleAction(r.id, 'approve')}
                        className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Approve
                      </button>

                      <button
                        onClick={() => {
                          setTargetReviewId(r.id);
                          setRejectModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Reject
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleAction(r.id, 'flag', 'Manual flag by moderator')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">flag</span>
                        Flag
                      </button>

                      <button
                        onClick={() => handleAction(r.id, 'escalate', 'Escalated to Safety & Compliance')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-indigo-600 text-[11px] font-medium border border-slate-200 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">shield</span>
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Note Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <h3 className="font-headline font-bold text-sm text-slate-900">
              Reject Review
            </h3>
            <p className="text-xs text-slate-500">
              Provide an internal note explaining why this review does not meet broadcast criteria.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Inappropriate language or spam pattern..."
              className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
            ></textarea>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setTargetReviewId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction(targetReviewId, 'reject', rejectionReason);
                  setRejectModalOpen(false);
                  setTargetReviewId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
