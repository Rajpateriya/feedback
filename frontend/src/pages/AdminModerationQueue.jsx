import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StaffToolbar from '../components/StaffToolbar';

export default function AdminModerationQueue({ showToast, onQueueUpdated, searchQuery = '' }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData] = useState({ metrics: {}, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [localSearch, setLocalSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectPhoto, setInspectPhoto] = useState(null);

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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      
      {/* Staff Portal Toolbar */}
      <StaffToolbar pendingCount={metrics.pending_count || 0} />

      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-purple-200/80 shadow-[0_4px_24px_rgba(81,34,254,0.06)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
              Moderation Pipeline
            </span>
            <span className="text-[11px] text-purple-400">&bull; Shoe Photo Verification Active</span>
          </div>
          <h1 className="font-headline text-lg sm:text-xl font-bold text-purple-950 tracking-tight mt-1">
            Shoe Review Moderation Queue
          </h1>
        </div>

        {/* Compact SLA Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-200 text-left">
            <div className="text-[9px] font-semibold text-purple-500 uppercase">Median SLA</div>
            <div className="text-xs font-bold text-purple-950">{metrics.median_sla_minutes || 4.2}m</div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-200 text-left">
            <div className="text-[9px] font-semibold text-purple-500 uppercase">Auto-Clear</div>
            <div className="text-xs font-bold text-emerald-700">{metrics.auto_clear_rate || 94.8}%</div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-100/80 border border-purple-300 text-left">
            <div className="text-[9px] font-semibold text-purple-800 uppercase">Pending Triage</div>
            <div className="text-xs font-bold text-purple-900">{metrics.pending_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Multi-Select Operations */}
      <div className="bg-white rounded-2xl p-2.5 shadow-2xs border border-purple-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Triage Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs'
                : 'text-purple-900/70 hover:bg-purple-50'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {metrics.pending_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs'
                : 'text-purple-900/70 hover:bg-purple-50'
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px]">
              {metrics.approved_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'flagged'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs'
                : 'text-purple-900/70 hover:bg-purple-50'
            }`}
          >
            <span>Flagged</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
              {metrics.flagged_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'escalated'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs'
                : 'text-purple-900/70 hover:bg-purple-50'
            }`}
          >
            <span>Escalated</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 text-[9px] font-bold">
              {metrics.escalated_count || 0}
            </span>
          </button>
        </div>

        {/* Batch Operations Bar */}
        <div className="flex items-center gap-2">
          {reviews.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-purple-700 hover:text-purple-950 font-medium px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
            >
              {selectedIds.length === reviews.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-purple-200">
              <span className="text-xs font-bold text-purple-900 px-1">
                {selectedIds.length} chosen
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs"
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
          <div className="text-center py-16 bg-white rounded-2xl border border-purple-100">
            <span className="material-symbols-outlined text-purple-600 text-3xl animate-spin">refresh</span>
            <p className="text-xs text-purple-900/60 mt-2 font-medium">Checking moderation triage pipeline...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-purple-100 p-6">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">task_alt</span>
            <h3 className="text-sm font-semibold text-purple-950 mt-2">No items in {activeTab} queue</h3>
            <p className="text-xs text-purple-900/60 mt-0.5">
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

            const statusBadge = 
              r.status === 'flagged' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              r.status === 'pending' ? 'bg-purple-100 text-purple-800 border-purple-200' :
              r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200';

            const photoList = (r.images && r.images.length > 0)
              ? r.images
              : (r.image_url ? [r.image_url] : []);

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isSelected 
                    ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md' 
                    : 'border-purple-100 hover:border-purple-300 shadow-[0_1px_3px_rgba(81,34,254,0.04)]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left Column: Select, Info, Text, Photo Thumbnails */}
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(r.id)}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />

                    <div className="space-y-2 flex-1">
                      {/* Sub-header row */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                          {r.status}
                        </span>
                        <span className="font-bold text-purple-950">{r.customer_name}</span>
                        <span className="text-purple-400">({r.customer_email})</span>
                        <span className="text-purple-200">&bull;</span>
                        <span className="font-mono text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200/60">{r.sku}</span>
                        <span className="text-purple-200">&bull;</span>
                        <span className="text-purple-700 font-medium">{r.channel}</span>
                        <span className="text-purple-200">&bull;</span>
                        <span className="text-purple-400">{formattedDate}</span>
                      </div>

                      {/* Stars & Title */}
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="material-symbols-outlined text-[14px] material-symbols-filled">
                                {star <= r.rating ? 'star' : 'star_border'}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-purple-950">{r.rating}/5</span>
                        </div>
                        <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">
                          {r.title}
                        </h3>
                      </div>

                      {/* Review Body */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                        {r.body}
                      </p>

                      {/* Shoe Photo Gallery in Moderation (Up to 6 photos preview) */}
                      {photoList.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-900 mb-1.5">
                            <span className="material-symbols-outlined text-[14px] text-purple-600">photo_library</span>
                            <span>Shoe Photos Uploaded ({photoList.length} of 6)</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {photoList.map((imgUrl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setInspectPhoto(imgUrl)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-purple-200 hover:border-purple-600 transition-all cursor-pointer relative group"
                              >
                                <img src={imgUrl} alt="Shoe" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes / Risk callouts */}
                      {r.moderation_note && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-rose-600">info</span>
                          <div>
                            <span className="font-bold">Audit Flag:</span> {r.moderation_note}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Telemetry & Actions */}
                  <div className="lg:w-64 flex flex-col gap-2.5 pt-3 lg:pt-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-purple-100">
                    
                    {/* Telemetry Indicator */}
                    <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-900/60 font-medium">Toxicity Risk</span>
                        <span className={`font-bold ${toxicityPct > 50 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {toxicityPct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-purple-200/70 overflow-hidden">
                        <div
                          className={`h-full ${toxicityPct > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${toxicityPct}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-purple-900/60 font-medium">Sentiment</span>
                        <span className="font-bold text-purple-700">{sentimentPct}% ({r.sentiment_label})</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleAction(r.id, 'approve')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        Approve
                      </button>

                      <button
                        onClick={() => {
                          setTargetReviewId(r.id);
                          setRejectModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                        Reject
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleAction(r.id, 'flag', 'Manual flag by moderator')}
                        className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium border border-purple-200 flex items-center justify-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">flag</span>
                        Flag
                      </button>

                      <button
                        onClick={() => handleAction(r.id, 'escalate', 'Escalated to Safety & Compliance')}
                        className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium border border-purple-200 flex items-center justify-center gap-0.5"
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

      {/* Photo Inspector Modal */}
      {inspectPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectPhoto(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden p-3 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 text-white">
              <span className="text-xs font-bold text-purple-300">Moderation Photo Audit</span>
              <button onClick={() => setInspectPhoto(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <img src={inspectPhoto} alt="Shoe audit" className="max-h-[70vh] w-full object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-purple-200 space-y-3 animate-in zoom-in-95">
            <h3 className="font-headline font-bold text-sm text-purple-950">
              Reject Review
            </h3>
            <p className="text-xs text-purple-900/60">
              Provide an internal audit note explaining why this shoe review does not meet broadcast criteria.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Inappropriate language, counterfeit accusation without receipt..."
              className="w-full p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs focus:outline-none focus:border-rose-500"
            ></textarea>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setTargetReviewId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50"
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
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
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
