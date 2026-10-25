import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CustomerReviewsHub({ onNavigateWrite, showToast, searchQuery = '' }) {
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [photosOnly, setPhotosOnly] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [lightbox, setLightbox] = useState(null);

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
      + ["ID,Title,Rating,Customer,SKU,Product,Channel,Photos,Status,Created At"]
      + "\n" 
      + reviews.map(r => `"${r.id}","${r.title.replace(/"/g, '""')}","${r.rating}","${r.customer_name}","${r.sku}","${r.product_name}","${r.channel}","${(r.images || []).length}","${r.status}","${r.created_at}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shoe_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported shoe reviews CSV', 'success');
  };

  // Filter for photos only
  const displayedReviews = photosOnly
    ? reviews.filter(r => (r.images && r.images.length > 0) || r.image_url)
    : reviews;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      
      {/* Overview Card: Full Graceful Coverage across max-w-6xl */}
      <div className="bg-white rounded-2xl border border-purple-200/80 shadow-[0_4px_24px_rgba(147,51,234,0.04)] p-5 sm:p-6 transition-all">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left Rating Block (Col 1-4) */}
          <div className="md:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                Shoe Ratings & Feed
              </span>
              <span className="text-[11px] text-purple-400">&bull; Live Customer Aggregate</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-purple-950 tracking-tight">
                {analytics?.average_rating ? analytics.average_rating.toFixed(1) : '4.6'}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined text-[18px] material-symbols-filled">
                      {star <= Math.round(analytics?.average_rating || 5) ? 'star' : 'star_border'}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-purple-900/70 mt-0.5">
                  Based on {analytics?.total_reviews || reviews.length} verified shoe wear tests
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onNavigateWrite}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-semibold shadow-sm shadow-purple-300 transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                Write Review with Photos
              </button>
              <button
                onClick={exportAudit}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 border border-purple-200/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px] text-purple-500">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Center Rating Distribution (Col 5-8) */}
          <div className="md:col-span-4 space-y-1.5 md:border-l border-purple-100 md:pl-6">
            <div className="text-[11px] font-semibold text-purple-900 mb-1">
              Rating Distribution
            </div>
            {[5, 4, 3, 2, 1].map((star) => {
              const key = `${star}_star`;
              const data = analytics?.rating_distribution?.[key] || { count: 0, percentage: 0 };
              const barColor = star >= 4 
                ? 'bg-gradient-to-r from-purple-600 to-violet-500' 
                : star === 3 
                ? 'bg-purple-400' 
                : 'bg-rose-400';
              return (
                <button
                  key={star}
                  onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                  className={`w-full flex items-center gap-2 text-xs transition-colors p-1 rounded-lg hover:bg-purple-50/70 ${
                    selectedRating === star ? 'font-semibold text-purple-900 bg-purple-100/60' : 'text-slate-600'
                  }`}
                >
                  <span className="w-6 text-left flex items-center gap-0.5 text-[11px]">
                    <span>{star}</span>
                    <span className="material-symbols-outlined text-[12px] material-symbols-filled text-amber-400">star</span>
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-purple-100/80 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-medium text-purple-900/60 text-[10px]">{data.percentage}%</span>
                </button>
              );
            })}
          </div>

          {/* Right Highlights & Category Telemetry (Col 9-12) */}
          <div className="md:col-span-3 space-y-2.5 md:border-l border-purple-100 md:pl-6 text-xs">
            <div className="text-[11px] font-semibold text-purple-900 mb-1">
              Shoe Quality Indicators
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-700/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 material-symbols-filled">verified</span>
                  Verified Orders
                </span>
                <span className="font-bold text-purple-950">89.4%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-700/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-purple-600">photo_camera</span>
                  With Photo Proof
                </span>
                <span className="font-bold text-purple-950">78.2%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-700/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-purple-600">bolt</span>
                  Auto-Clear Yield
                </span>
                <span className="font-bold text-emerald-700">{analytics?.auto_clear_rate || 94.2}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Signals Strip */}
        <div className="mt-4 pt-3.5 border-t border-purple-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-purple-900/70">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-emerald-600 material-symbols-filled">verified</span>
            <span>{analytics?.verified_percentage || 88.5}% Verified Buyer Wear-Tests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-purple-600">timer</span>
            <span>{analytics?.median_sla_minutes || 4.2}m SLA Triage Turnaround</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-purple-600">security</span>
            <span>Algorithmic Trust Engine Active</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar with Photos-Only Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-purple-200/80 shadow-2xs">
        
        {/* Rating Pills & Photo Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRating(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedRating === null ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs' : 'text-purple-900/70 hover:bg-purple-50'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedRating(selectedRating === s ? null : s)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedRating === s ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xs' : 'text-purple-900/70 hover:bg-purple-50'
              }`}
            >
              <span>{s}</span>
              <span className="material-symbols-outlined text-[12px] material-symbols-filled text-amber-400">star</span>
            </button>
          ))}

          {/* Toggle Photos Only */}
          <button
            onClick={() => setPhotosOnly(!photosOnly)}
            className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              photosOnly
                ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                : 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            <span>With Photos ({reviews.filter(r => (r.images && r.images.length > 0) || r.image_url).length})</span>
          </button>
        </div>

        {/* Channel & Sort Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:border-purple-500 font-medium"
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
            className="h-8 px-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:border-purple-500 font-medium"
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
          <div className="text-center py-16 bg-white rounded-2xl border border-purple-100">
            <span className="material-symbols-outlined text-purple-600 text-3xl animate-spin">refresh</span>
            <p className="text-xs text-purple-900/60 mt-2 font-medium">Loading shoe evaluations and photo galleries...</p>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-purple-100 p-6">
            <span className="material-symbols-outlined text-purple-300 text-4xl">inventory_2</span>
            <h3 className="text-sm font-semibold text-purple-950 mt-2">No shoe reviews match current filters</h3>
            <p className="text-xs text-purple-900/60 mt-1">
              Try resetting your filters or search terms.
            </p>
            <button
              onClick={() => { setSelectedRating(null); setSelectedChannel(''); setPhotosOnly(false); setLocalSearch(''); }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          displayedReviews.map((r) => {
            const initials = r.customer_name ? r.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU';
            const formattedDate = new Date(r.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Extract photo list: supports array or legacy image_url
            const photoList = (r.images && r.images.length > 0)
              ? r.images
              : (r.image_url ? [r.image_url] : []);

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-purple-100 hover:border-purple-300 shadow-[0_1px_3px_rgba(147,51,234,0.03)] hover:shadow-[0_4px_20px_rgba(147,51,234,0.06)] transition-all flex flex-col space-y-3"
              >
                {/* Header row: User, Product, Rating, Channel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-purple-950">{r.customer_name}</span>
                        {r.verified_purchase && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="material-symbols-outlined text-[11px] material-symbols-filled">verified</span>
                            Verified Purchase
                          </span>
                        )}
                        <span className="text-[11px] text-purple-900/40">&bull; {formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-purple-900/70 mt-0.5">
                        <span className="font-semibold text-purple-900">{r.product_name}</span>
                        <span className="text-purple-300">&bull;</span>
                        <span className="font-mono text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200/60">{r.sku}</span>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
                      {r.channel}
                    </span>
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="space-y-1.5">
                  <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {r.body}
                  </p>
                </div>

                {/* Customer Shoe Photo Gallery (Up to 6 photos with interactive preview) */}
                {photoList.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-purple-950 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-purple-600">photo_library</span>
                        <span>Customer Photos ({photoList.length} of 6)</span>
                      </div>
                      <span className="text-[10px] text-purple-500 font-medium hidden sm:inline-block">Click photo to zoom</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {photoList.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightbox({
                            images: photoList,
                            currentIndex: idx,
                            title: r.title,
                            customer: r.customer_name,
                            product: r.product_name
                          })}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-purple-200/80 bg-purple-50/50 shadow-2xs hover:shadow-md hover:border-purple-600 transition-all cursor-pointer focus:outline-none"
                        >
                          <img
                            src={imgUrl}
                            alt={`Shoe view ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-medium">
                            {idx + 1}
                          </span>
                          <div className="absolute inset-0 bg-purple-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Tags & Recommendation */}
                {r.tags && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {r.tags.split(',').map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/60"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {r.recommend && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px] material-symbols-filled">thumb_up</span>
                        Recommends Shoe
                      </span>
                    )}
                  </div>
                )}

                {/* Footer with Helpful voting */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-100 text-xs text-purple-900/70">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-purple-900/60 font-medium">Helpful wear review?</span>
                    <button
                      onClick={() => handleVote(r.id, 'helpful')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium border border-purple-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                      <span>Yes ({r.helpful_count})</span>
                    </button>
                    <button
                      onClick={() => handleVote(r.id, 'unhelpful')}
                      className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] border border-purple-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_down</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                    AI Trust Confidence: {Math.round(r.sentiment_score * 100)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Photo Lightbox Dialog */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between gap-3 text-white">
              <div>
                <h4 className="font-headline font-bold text-sm text-purple-300">
                  {lightbox.product}
                </h4>
                <p className="text-xs text-slate-400">
                  Review by <strong>{lightbox.customer}</strong> &bull; Photo {lightbox.currentIndex + 1} of {lightbox.images.length}
                </p>
              </div>

              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Lightbox Image Preview with Navigation */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[480px] p-4">
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt="Shoe full size"
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />

              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={() => setLightbox({
                      ...lightbox,
                      currentIndex: (lightbox.currentIndex - 1 + lightbox.images.length) % lightbox.images.length
                    })}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setLightbox({
                      ...lightbox,
                      currentIndex: (lightbox.currentIndex + 1) % lightbox.images.length
                    })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Footer Thumbnails Strip */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto">
              {lightbox.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox({ ...lightbox, currentIndex: i })}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    lightbox.currentIndex === i ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
