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
    link.setAttribute("download", `analytics_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported analytics CSV successfully!', 'success');
  };

  if (loading || !data) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-indigo-600 text-3xl animate-spin">refresh</span>
        <p className="text-xs text-slate-500 mt-2">Aggregating analytics telemetry...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
              Executive Analytics
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500">Channel SLA & Performance</span>
          </div>
          <h1 className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
            Feedback & Sentiment Telemetry
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === '30d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('q1')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === 'q1' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Q1 2025
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-500">download</span>
            <span>Export</span>
          </button>

          <button
            onClick={onOpenConfigRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Overall Score</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
              +0.3 vs Mo
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-bold text-slate-900 flex items-baseline gap-1">
              {data.average_rating ? data.average_rating.toFixed(1) : '4.8'}
              <span className="text-xs font-normal text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center text-amber-400 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[13px] material-symbols-filled">
                  {s <= Math.round(data.average_rating) ? 'star' : 'star_border'}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Across all catalog items
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Verified Volume</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
              {data.verified_percentage}%
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-bold text-slate-900">
              {data.total_reviews}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Live evaluations recorded
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Multi-channel telemetry
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Auto-Clear Rate</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
              Target Met
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-bold text-slate-900">
              {data.auto_clear_rate}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Instant AI clearance
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Toxicity &lt; 0.15 threshold
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Median SLA</span>
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
              &lt; 15m Target
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-bold text-slate-900">
              {data.median_sla_minutes}m
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Moderator review time
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            99.2% compliance rate
          </div>
        </div>
      </div>

      {/* Grid: Rating Breakdown & Sentiment Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Rating Distribution */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm text-slate-900">Star Rating Distribution</h3>
              <p className="text-[11px] text-slate-500">Tier volume across 1 through 5-star tiers</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">equalizer</span>
          </div>

          <div className="space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const item = data.rating_distribution?.[`${s}_star`] || { count: 0, percentage: 0 };
              const barColor = s >= 4 ? 'bg-indigo-600' : s === 3 ? 'bg-indigo-400' : 'bg-rose-500';
              return (
                <div key={s} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <span>{s} Stars</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{item.count} reviews ({item.percentage}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
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
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm text-slate-900">Sentiment & Channels</h3>
              <p className="text-[11px] text-slate-500">Sentiment classification and source attribution</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">donut_small</span>
          </div>

          {/* Sentiment Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
              <div className="text-[10px] font-semibold text-emerald-800 uppercase">Positive</div>
              <div className="font-headline font-bold text-lg text-emerald-700 mt-0.5">
                {data.sentiment_breakdown?.Positive || 0}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-semibold text-slate-600 uppercase">Neutral</div>
              <div className="font-headline font-bold text-lg text-slate-800 mt-0.5">
                {data.sentiment_breakdown?.Neutral || 0}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-center">
              <div className="text-[10px] font-semibold text-rose-800 uppercase">Risk / Low</div>
              <div className="font-headline font-bold text-lg text-rose-700 mt-0.5">
                {data.sentiment_breakdown?.Negative || 0}
              </div>
            </div>
          </div>

          {/* Channel list */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Channel Share</div>
            {Object.entries(data.channel_breakdown || {}).map(([ch, cnt]) => {
              const pct = Math.round((cnt / maxVal(data.total_reviews, 1)) * 100);
              return (
                <div key={ch} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                  <span className="font-medium text-slate-800">{ch}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-indigo-600">{cnt} reviews</span>
                    <span className="text-[11px] text-slate-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Velocity Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-sm text-slate-900">Weekly Intake Velocity</h3>
            <p className="text-[11px] text-slate-500">Incoming daily review trajectory and auto-clear ratio</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Auto-Cleared</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Moderated</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4 pb-1">
          {data.daily_volume.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600">
                {item.volume}
              </div>
              <div className="w-full max-w-[32px] bg-slate-100 rounded-t overflow-hidden flex flex-col justify-end h-full">
                <div
                  className="bg-indigo-600 w-full group-hover:bg-indigo-700 transition-colors"
                  style={{ height: `${(item.approved / 100) * 100}%` }}
                ></div>
                <div
                  className="bg-rose-500 w-full"
                  style={{ height: `${(item.flagged / 100) * 100}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-medium text-slate-600">{item.day}</div>
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
