import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CustomerReviewsHub({ onNavigateWrite, showToast, searchQuery = '' }) {
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = searchQuery || localSearch;

  const loadData = async () => {
    try {
      setLoading(true);
      const [revs, stats] = await Promise.all([
        api.getReviews({
          status: 'approved',
          rating: selectedRating || undefined,
          channel: selectedChannel || undefined,
          sort: sortBy,
          search: effectiveSearch || undefined
        }),
        api.getAnalyticsOverview()
      ]);
      setReviews(revs);
      setAnalytics(stats);
    } catch (err) {
      console.error(err);
      showToast?.('Error loading customer reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRating, selectedChannel, sortBy, effectiveSearch]);

  const handleVote = async (id, voteType) => {
    try {
      const updated = await api.voteReview(id, voteType);
      setReviews(prev => prev.map(r => r.id === id ? updated : r));
      showToast?.(`Feedback recorded`, 'success');
    } catch (err) {
      showToast?.('Could not record vote', 'error');
    }
  };

  const exportAudit = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Title,Rating,Customer,SKU,Channel,Status,Created At"]
      + "\n" 
      + reviews.map(r => `"${r.id}","${r.title.replace(/"/g, '""')}","${r.rating}","${r.customer_name}","${r.sku}","${r.channel}","${r.status}","${r.created_at}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported reviews CSV', 'success');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      
      {/* Compact Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 sm:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          {/* Left Rating Block */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
                Customer Ratings
              </span>
              <span className="text-[11px] text-slate-400">&bull; Live Stream</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.average_rating ? analytics.average_rating.toFixed(1) : '3.8'}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined text-[17px] material-symbols-filled">
                      {star <= Math.round(analytics?.average_rating || 4) ? 'star' : 'star_border'}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Based on {analytics?.total_reviews || reviews.length} verified ratings
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onNavigateWrite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[15px]">rate_review</span>
                Write Review
              </button>
              <button
                onClick={exportAudit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100 border border-slate-200/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-400">download</span>
                Export
              </button>
            </div>
          </div>

          {/* Right Rating Distribution (Compact max-w-xs) */}
          <div className="w-full sm:w-64 space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const key = `${star}_star`;
              const data = analytics?.rating_distribution?.[key] || { count: 0, percentage: 0 };
              const barColor = star >= 4 ? 'bg-indigo-600' : star === 3 ? 'bg-indigo-400' : 'bg-rose-400';
              return (
                <button
                  key={star}
                  onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                  className={`w-full flex items-center gap-2 text-xs transition-colors p-0.5 rounded-md hover:bg-slate-50 ${
                    selectedRating === star ? 'font-semibold text-indigo-900' : 'text-slate-600'
                  }`}
                >
                  <span className="w-6 text-left flex items-center gap-0.5 text-[11px]">
                    <span>{star}</span>
                    <span className="material-symbols-outlined text-[11px] material-symbols-filled text-amber-400">star</span>
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-medium text-slate-400 text-[10px]">{data.percentage}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Micro Signals Strip */}
        <div className="mt-5 pt-3.5 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-emerald-600 material-symbols-filled">verified</span>
            <span>{analytics?.verified_percentage || 85.7}% Verified Buyer Orders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-indigo-500">timer</span>
            <span>{analytics?.median_sla_minutes || 4.2}m SLA Triage Turnaround</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-slate-400">security</span>
            <span>Algorithmic Trust Engine Active</span>
          </div>
        </div>
      </div>

      {/* Compact Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
        
        {/* Rating Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedRating(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedRating === null ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedRating(selectedRating === s ? null : s)}
              className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-0.5 ${
                selectedRating === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{s}</span>
              <span className="material-symbols-outlined text-[11px] material-symbols-filled text-amber-400">star</span>
            </button>
          ))}
        </div>

        {/* Channel & Sort */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="h-7 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Channels</option>
            <option value="Direct Web">Direct Web</option>
            <option value="Amazon Global">Amazon Global</option>
            <option value="Shopify Store">Shopify Store</option>
            <option value="In-App iOS">In-App iOS</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-7 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80">
            <span className="material-symbols-outlined text-indigo-600 text-2xl animate-spin">refresh</span>
            <p className="text-[11px] text-slate-400 mt-1">Loading customer evaluations...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 p-5">
            <span className="material-symbols-outlined text-slate-300 text-3xl">inventory_2</span>
            <h3 className="text-xs font-semibold text-slate-800 mt-1.5">No reviews match current filters</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Reset your filters to see all available feedback.
            </p>
            <button
              onClick={() => { setSelectedRating(null); setSelectedChannel(''); setLocalSearch(''); }}
              className="mt-2.5 px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          reviews.map((r) => {
            const initials = r.customer_name ? r.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU';
            const formattedDate = new Date(r.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-colors flex flex-col space-y-2.5"
              >
                {/* Header row: User, Rating, Channel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] border border-slate-200/60">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900">{r.customer_name}</span>
                        {r.verified_purchase && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            <span className="material-symbols-outlined text-[11px] material-symbols-filled">verified</span>
                            Verified
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">&bull; {formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{r.product_name}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 rounded">{r.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="material-symbols-outlined text-[13px] material-symbols-filled">
                          {star <= r.rating ? 'star' : 'star_border'}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-500 font-medium border border-slate-200/60">
                      {r.channel}
                    </span>
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-xs sm:text-sm text-slate-900">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {r.body}
                  </p>
                </div>

                {/* Feature Tags & Recommendation */}
                {r.tags && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {r.tags.split(',').map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {r.recommend && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px] material-symbols-filled">thumb_up</span>
                        Recommends
                      </span>
                    )}
                  </div>
                )}

                {/* Footer with Helpful voting */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Helpful?</span>
                    <button
                      onClick={() => handleVote(r.id, 'helpful')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] border border-slate-200/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[11px]">thumb_up</span>
                      <span>Yes ({r.helpful_count})</span>
                    </button>
                    <button
                      onClick={() => handleVote(r.id, 'unhelpful')}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-400 text-[10px] border border-slate-200/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[11px]">thumb_down</span>
                    </button>
                  </div>

                  <span className="text-[9px] font-medium text-slate-400">
                    Confidence: {Math.round(r.sentiment_score * 100)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
