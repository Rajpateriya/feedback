import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AnalyticsInsights({ showToast, onOpenConfigRules }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (err) {
      console.error(err);
      showToast?.('Error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Metric,Value\n"
      + `Total Reviews,${data.total_reviews}\n`
      + `Average Rating,${data.average_rating}\n`
      + `Auto-Clear Rate,${data.auto_clear_rate}%\n`
      + `Median SLA (min),${data.median_sla_minutes}\n`
      + `Verified Purchase %,${data.verified_percentage}%\n`;
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `shoe_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported analytics CSV', 'success');
  };

  if (loading || !data) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-purple-600 text-3xl animate-spin">refresh</span>
        <p className="text-xs text-purple-900/60 mt-2 font-medium">Aggregating footwear telemetry & sentiment...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-purple-200/80 shadow-[0_4px_24px_rgba(81,34,254,0.06)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
              Executive Analytics
            </span>
            <span className="text-[11px] text-purple-400">&bull; Footwear SLA & Yield Telemetry</span>
          </div>
          <h1 className="font-headline text-lg sm:text-xl font-bold text-purple-950 tracking-tight mt-1">
            Shoe Feedback & Sentiment Intelligence
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-purple-50/80 p-0.5 rounded-xl border border-purple-200 text-xs">
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === '30d' ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xs' : 'text-purple-900/70 hover:text-purple-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('q1')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === 'q1' ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xs' : 'text-purple-900/70 hover:text-purple-900'
              }`}
            >
              Q1 2025
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-purple-600">download</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenConfigRules}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Policy Rules</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Overall Score</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
              +0.3 vs Ly
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-extrabold text-purple-950 flex items-baseline gap-1">
              {data.average_rating ? data.average_rating.toFixed(1) : '4.6'}
              <span className="text-xs font-normal text-purple-400">/ 5.0</span>
            </div>
            <div className="flex items-center text-amber-400 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[13px] material-symbols-filled">
                  {s <= Math.round(data.average_rating || 5) ? 'star' : 'star_border'}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-1.5 border-t border-purple-50">
            Customer Satisfaction
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Verified Volume</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-200">
              {data.verified_percentage}%
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-extrabold text-purple-950">
              {data.total_reviews}
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Logged wear evaluations
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-1.5 border-t border-purple-50">
            Multi-channel feed
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Instant Clearance</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-extrabold text-purple-950">
              {data.auto_clear_rate}%
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Zero-touch auto approve
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-1.5 border-t border-purple-50">
            Passed Trust Engine
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Median SLA</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-200">
              &lt; 10m Goal
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-extrabold text-purple-950">
              {data.median_sla_minutes}m
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Moderator turnaround
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-1.5 border-t border-purple-50">
            Compliance Target
          </div>
        </div>
      </div>

      {/* Grid: Rating Breakdown & Sentiment Trajectory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Rating Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] space-y-3">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">Rating Distribution</h3>
              <p className="text-xs text-purple-900/50">Proportion across 1-star to 5-star tiers</p>
            </div>
            <span className="material-symbols-outlined text-purple-400 text-[18px]">equalizer</span>
          </div>

          <div className="space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const item = data.rating_distribution?.[`${s}_star`] || { count: 0, percentage: 0 };
              const barColor = s >= 4 
                ? 'bg-gradient-to-r from-purple-600 to-violet-500' 
                : s === 3 
                ? 'bg-purple-400' 
                : 'bg-rose-400';
              return (
                <div key={s} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-950 flex items-center gap-1">
                      <span>{s} Stars</span>
                    </span>
                    <span className="text-[11px] text-purple-900/60">{item.count} reviews ({item.percentage}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-purple-100/70 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment & Multi-Channel Feed Yield */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] space-y-3">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">Sentiment & Channels</h3>
              <p className="text-xs text-purple-900/50">Footwear review attribution and automated polarity</p>
            </div>
            <span className="material-symbols-outlined text-purple-400 text-[18px]">donut_small</span>
          </div>

          {/* Sentiment Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Positive</div>
              <div className="font-headline font-extrabold text-base text-emerald-700 mt-0.5">
                {data.sentiment_breakdown?.Positive || 0}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <div className="text-[10px] font-bold text-purple-800 uppercase">Neutral</div>
              <div className="font-headline font-extrabold text-base text-purple-900 mt-0.5">
                {data.sentiment_breakdown?.Neutral || 0}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-center">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Risk / Low</div>
              <div className="font-headline font-extrabold text-base text-rose-700 mt-0.5">
                {data.sentiment_breakdown?.Negative || 0}
              </div>
            </div>
          </div>

          {/* Channel list */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Channel Share</div>
            {Object.entries(data.channel_breakdown || {}).map(([ch, cnt]) => {
              const pct = Math.round((cnt / maxVal(data.total_reviews, 1)) * 100);
              return (
                <div key={ch} className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 text-xs">
                  <span className="font-semibold text-purple-950">{ch}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-purple-700">{cnt} reviews</span>
                    <span className="text-[11px] text-purple-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Velocity Chart */}
      <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] space-y-3">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">Weekly Intake Trajectory</h3>
            <p className="text-xs text-purple-900/50">Daily incoming shoe reviews and automated clearance ratio</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-purple-900/70 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>Auto-Cleared</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-900/70 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>Moderated</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4 pb-1">
          {data.daily_volume.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="text-[10px] font-bold text-purple-400 group-hover:text-purple-700 transition-colors">
                {item.volume}
              </div>
              <div className="w-full max-w-[28px] bg-purple-100/70 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                <div
                  className="bg-gradient-to-t from-purple-700 to-violet-500 w-full group-hover:from-purple-800 group-hover:to-violet-600 transition-colors"
                  style={{ height: `${(item.approved / 100) * 100}%` }}
                ></div>
                <div
                  className="bg-rose-400 w-full"
                  style={{ height: `${(item.flagged / 100) * 100}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-semibold text-purple-900/70">{item.day}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function maxVal(a, b) {
  return a > b ? a : b;
}
