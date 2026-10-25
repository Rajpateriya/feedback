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
    link.setAttribute("download", `analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported analytics CSV', 'success');
  };

  if (loading || !data) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-indigo-600 text-2xl animate-spin">refresh</span>
        <p className="text-[11px] text-slate-400 mt-1">Aggregating telemetry data...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
              Executive Analytics
            </span>
            <span className="text-[11px] text-slate-400">&bull; SLA & Yield Telemetry</span>
          </div>
          <h1 className="font-headline text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
            Feedback & Sentiment Telemetry
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                timeRange === '30d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('q1')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                timeRange === 'q1' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Q1 2025
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-200/80 shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[13px] text-slate-400">download</span>
            <span>Export</span>
          </button>

          <button
            onClick={onOpenConfigRules}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">tune</span>
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Metric 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Overall Score</span>
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
              +0.3
            </span>
          </div>
          <div className="my-1.5">
            <div className="font-headline text-xl font-bold text-slate-900 flex items-baseline gap-1">
              {data.average_rating ? data.average_rating.toFixed(1) : '3.8'}
              <span className="text-[10px] font-normal text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center text-amber-400 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[11px] material-symbols-filled">
                  {s <= Math.round(data.average_rating) ? 'star' : 'star_border'}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Overall Satisfaction
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Volume</span>
            <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
              {data.verified_percentage}%
            </span>
          </div>
          <div className="my-1.5">
            <div className="font-headline text-xl font-bold text-slate-900">
              {data.total_reviews}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Recorded evaluations
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Multi-channel feed
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Auto-Clear</span>
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
              Target Met
            </span>
          </div>
          <div className="my-1.5">
            <div className="font-headline text-xl font-bold text-slate-900">
              {data.auto_clear_rate}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Instant clearance
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Passed rule thresholds
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Median SLA</span>
            <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
              &lt; 15m
            </span>
          </div>
          <div className="my-1.5">
            <div className="font-headline text-xl font-bold text-slate-900">
              {data.median_sla_minutes}m
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Triage response time
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Compliance SLA
          </div>
        </div>
      </div>

      {/* Grid: Rating Breakdown & Sentiment Trajectory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Rating Distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-headline font-bold text-xs sm:text-sm text-slate-900">Rating Distribution</h3>
              <p className="text-[10px] text-slate-400">Proportion across 1-star to 5-star tiers</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[16px]">equalizer</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const item = data.rating_distribution?.[`${s}_star`] || { count: 0, percentage: 0 };
              const barColor = s >= 4 ? 'bg-indigo-600' : s === 3 ? 'bg-indigo-400' : 'bg-rose-400';
              return (
                <div key={s} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-700 flex items-center gap-0.5">
                      <span>{s} Stars</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
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
        <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-headline font-bold text-xs sm:text-sm text-slate-900">Sentiment & Channels</h3>
              <p className="text-[10px] text-slate-400">Attribution and automated polarity</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[16px]">donut_small</span>
          </div>

          {/* Sentiment Badges */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-100 text-center">
              <div className="text-[9px] font-semibold text-emerald-800 uppercase">Positive</div>
              <div className="font-headline font-bold text-sm text-emerald-700 mt-0.5">
                {data.sentiment_breakdown?.Positive || 0}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-center">
              <div className="text-[9px] font-semibold text-slate-600 uppercase">Neutral</div>
              <div className="font-headline font-bold text-sm text-slate-800 mt-0.5">
                {data.sentiment_breakdown?.Neutral || 0}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-100 text-center">
              <div className="text-[9px] font-semibold text-rose-800 uppercase">Risk</div>
              <div className="font-headline font-bold text-sm text-rose-700 mt-0.5">
                {data.sentiment_breakdown?.Negative || 0}
              </div>
            </div>
          </div>

          {/* Channel list */}
          <div className="space-y-1 pt-1">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Channel Share</div>
            {Object.entries(data.channel_breakdown || {}).map(([ch, cnt]) => {
              const pct = Math.round((cnt / maxVal(data.total_reviews, 1)) * 100);
              return (
                <div key={ch} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-[11px]">
                  <span className="font-medium text-slate-700">{ch}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-indigo-600">{cnt}</span>
                    <span className="text-[10px] text-slate-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Velocity Chart */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-headline font-bold text-xs sm:text-sm text-slate-900">Weekly Intake Trajectory</h3>
            <p className="text-[10px] text-slate-400">Daily incoming review pace and automated approval ratio</p>
          </div>
          <div className="flex items-center gap-2.5 text-[10px]">
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Auto-Cleared</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Moderated</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-3 pb-0.5">
          {data.daily_volume.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group">
              <div className="text-[9px] font-semibold text-slate-400 group-hover:text-indigo-600">
                {item.volume}
              </div>
              <div className="w-full max-w-[24px] bg-slate-100 rounded-t overflow-hidden flex flex-col justify-end h-full">
                <div
                  className="bg-indigo-600 w-full group-hover:bg-indigo-700 transition-colors"
                  style={{ height: `${(item.approved / 100) * 100}%` }}
                ></div>
                <div
                  className="bg-rose-400 w-full"
                  style={{ height: `${(item.flagged / 100) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] font-medium text-slate-500">{item.day}</div>
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
