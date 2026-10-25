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
      showToast?.(`Thank you! Your feedback has been recorded.`, 'success');
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
    link.setAttribute("download", `reviews_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported reviews CSV successfully!', 'success');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Overview & Summary Card - Clean, Proportional SaaS Style */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Average Rating Column */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-3 lg:pr-6 lg:border-r border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Customer Feedback
              </span>
              <span className="text-[11px] text-slate-500">Live Aggregate</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-headline text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.average_rating ? analytics.average_rating.toFixed(1) : '4.8'}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined text-[18px] material-symbols-filled text-amber-400">
                      {star <= Math.round(analytics?.average_rating || 5) ? 'star' : 'star_border'}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-0.5">
                  Based on {analytics?.total_reviews || reviews.length} verified ratings
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onNavigateWrite}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-2xs transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                Write a Review
              </button>
              <button
                onClick={exportAudit}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-2 lg:px-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const key = `${star}_star`;
              const data = analytics?.rating_distribution?.[key] || { count: 0, percentage: 0 };
              const barColor = star >= 4 ? 'bg-indigo-600' : star === 3 ? 'bg-indigo-400' : 'bg-rose-500';
              return (
                <button
                  key={star}
                  onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                  className={`flex items-center gap-2.5 text-xs transition-colors p-1 rounded-md hover:bg-slate-50 ${
                    selectedRating === star ? 'bg-indigo-50/80 ring-1 ring-indigo-300 font-semibold text-indigo-900' : 'text-slate-600'
                  }`}
                >
                  <span className="w-11 text-left flex items-center gap-1">
                    <span>{star}</span>
                    <span className="material-symbols-outlined text-[13px] material-symbols-filled text-amber-400">star</span>
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-9 text-right font-medium text-slate-500 text-[11px]">{data.percentage}%</span>
                </button>
              );
            })}
          </div>

          {/* Key Signals */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-2.5 lg:pl-6 lg:border-l border-slate-200/80">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold mb-0.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 material-symbols-filled">verified</span>
                Verified Orders
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {analytics?.verified_percentage || 98}% of ratings tied to verified enterprise transactions.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold mb-0.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">shield_check</span>
                Active SLA Engine
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Real-time sentiment and toxicity inspection on all channel reviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        
        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRating(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedRating === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedRating(selectedRating === s ? null : s)}
              className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedRating === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{s}</span>
              <span className="material-symbols-outlined text-[13px] material-symbols-filled text-amber-400">star</span>
            </button>
          ))}
        </div>

        {/* Channel & Sort Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
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
            className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-indigo-600 text-3xl animate-spin">refresh</span>
            <p className="text-xs text-slate-500 mt-2">Loading customer evaluations...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6">
            <span className="material-symbols-outlined text-slate-300 text-4xl">inventory_2</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-2">No reviews match current filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your rating or channel filters to view customer feedback.
            </p>
            <button
              onClick={() => { setSelectedRating(null); setSelectedChannel(''); setLocalSearch(''); }}
              className="mt-3 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
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
                className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col space-y-3"
              >
                {/* Header row: User, Rating, Channel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{r.customer_name}</span>
                        {r.verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            <span className="material-symbols-outlined text-[12px] material-symbols-filled">verified</span>
                            Verified Buyer
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">&bull; {formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{r.product_name}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 rounded">{r.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="material-symbols-outlined text-[15px] material-symbols-filled">
                          {star <= r.rating ? 'star' : 'star_border'}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-medium border border-slate-200">
                      {r.channel}
                    </span>
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-sm text-slate-900 tracking-tight">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {r.body}
                  </p>
                </div>

                {/* Feature Tags & Recommendation */}
                {r.tags && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {r.tags.split(',').map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {r.recommend && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] material-symbols-filled">thumb_up</span>
                        Recommends product
                      </span>
                    )}
                  </div>
                )}

                {/* Footer with Helpful voting */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">Helpful?</span>
                    <button
                      onClick={() => handleVote(r.id, 'helpful')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] border border-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                      <span>Yes ({r.helpful_count})</span>
                    </button>
                    <button
                      onClick={() => handleVote(r.id, 'unhelpful')}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 text-[11px] border border-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_down</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400">
                    AI Trust: {Math.round(r.sentiment_score * 100)}%
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
