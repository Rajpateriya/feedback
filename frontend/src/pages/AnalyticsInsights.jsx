import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const SHOE_MODELS = [
  { sku: 'SHOE-NIKE-PULSE', name: 'Nike Air Max Pulse', category: 'Air Cushioning', baseRating: 4.8, baseVolume: 34 },
  { sku: 'SHOE-ADIDAS-BOOST', name: 'Adidas Ultraboost Light', category: 'Performance Run', baseRating: 4.7, baseVolume: 28 },
  { sku: 'SHOE-AJ1-RETRO', name: 'Air Jordan 1 High OG', category: 'Heritage Classic', baseRating: 4.9, baseVolume: 42 },
  { sku: 'SHOE-NB-9060', name: 'New Balance 9060', category: 'Chunky Lifestyle', baseRating: 4.6, baseVolume: 25 },
  { sku: 'SHOE-ON-MONSTER', name: 'On Cloudmonster 2', category: 'Max Road Cushion', baseRating: 4.8, baseVolume: 30 },
  { sku: 'SHOE-SALOMON-XT6', name: 'Salomon XT-6 Expanse', category: 'Trail / All-Terrain', baseRating: 4.9, baseVolume: 38 },
];

export default function AnalyticsInsights({ showToast, onOpenConfigRules }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [chartMode, setChartMode] = useState('grouped'); // 'grouped' or 'stacked'
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeSilhouetteTab, setActiveSilhouetteTab] = useState('rating'); // 'rating' or 'volume'

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
    link.setAttribute("download", `footwear_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported analytics CSV successfully!', 'success');
  };

  if (loading || !data) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-[#5122fe] text-4xl animate-spin">refresh</span>
        <p className="text-xs text-purple-900/60 mt-2 font-medium">Aggregating footwear telemetry & sentiment...</p>
      </div>
    );
  }

  // Daily volume data adjusted for timeRange
  const dailyData = (data.daily_volume || []).map((item, idx) => {
    const multiplier = timeRange === '7d' ? 0.7 : timeRange === '90d' ? 1.4 : 1.0;
    return {
      day: item.day,
      fullName: getDayFullName(item.day),
      approved: Math.round(item.approved * multiplier),
      flagged: Math.round(item.flagged * multiplier),
      volume: Math.round(item.volume * multiplier),
    };
  });

  const maxDailyVolume = Math.max(...dailyData.map(d => chartMode === 'stacked' ? d.volume : Math.max(d.approved, d.flagged)), 90);

  // Calculate sentiment total for segmented bar
  const totalSentiment = (data.sentiment_breakdown?.Positive || 0) + 
                         (data.sentiment_breakdown?.Neutral || 0) + 
                         (data.sentiment_breakdown?.Negative || 0) || 1;
  const positivePct = Math.round(((data.sentiment_breakdown?.Positive || 0) / totalSentiment) * 100);
  const neutralPct = Math.round(((data.sentiment_breakdown?.Neutral || 0) / totalSentiment) * 100);
  const negativePct = Math.round(((data.sentiment_breakdown?.Negative || 0) / totalSentiment) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-5">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-purple-200/90 shadow-[0_4px_24px_rgba(81,34,254,0.06)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
              Executive Analytics
            </span>
            <span className="text-[11px] text-purple-400">&bull; Footwear SLA & Yield Telemetry</span>
          </div>
          <h1 className="font-headline text-lg sm:text-2xl font-extrabold text-purple-950 tracking-tight mt-1">
            Shoe Feedback & Sentiment Intelligence
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-purple-50 p-1 rounded-2xl border border-purple-200/80 text-xs">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-[#5122fe] to-[#7b4eff] text-white shadow-xs'
                    : 'text-purple-900/70 hover:text-purple-950 hover:bg-white/60'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#5122fe]">download</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenConfigRules}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5122fe] hover:bg-[#4316df] text-white text-xs font-bold shadow-sm shadow-[#5122fe]/30 transition-all cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Policy Rules</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Overall Score</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              +0.3 vs Ly
            </span>
          </div>
          <div className="my-2.5">
            <div className="font-headline text-3xl font-extrabold text-purple-950 flex items-baseline gap-1.5">
              {data.average_rating ? data.average_rating.toFixed(1) : '4.6'}
              <span className="text-xs font-semibold text-purple-400">/ 5.0</span>
            </div>
            <div className="flex items-center text-amber-400 mt-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[16px] material-symbols-filled">
                  {s <= Math.round(data.average_rating || 5) ? 'star' : 'star_border'}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-2 border-t border-purple-50">
            Customer Satisfaction Aggregate
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Verified Volume</span>
            <span className="text-[10px] font-bold text-[#5122fe] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {data.verified_percentage}%
            </span>
          </div>
          <div className="my-2.5">
            <div className="font-headline text-3xl font-extrabold text-purple-950">
              {data.total_reviews}
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Logged footwear wear evaluations
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-2 border-t border-purple-50">
            Multi-channel verification active
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Instant Clearance</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <div className="my-2.5">
            <div className="font-headline text-3xl font-extrabold text-emerald-600">
              {data.auto_clear_rate}%
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Zero-touch automated approval
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-2 border-t border-purple-50">
            Passed Trust Engine heuristics
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(81,34,254,0.04)] flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-purple-900/60">
            <span>Median SLA</span>
            <span className="text-[10px] font-bold text-[#5122fe] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              &lt; 10m Goal
            </span>
          </div>
          <div className="my-2.5">
            <div className="font-headline text-3xl font-extrabold text-purple-950">
              {data.median_sla_minutes}m
            </div>
            <div className="text-[11px] text-purple-900/70 mt-1">
              Average moderator triage turnaround
            </div>
          </div>
          <div className="text-[11px] text-purple-900/50 pt-2 border-t border-purple-50">
            100% Compliance Target Met
          </div>
        </div>
      </div>

      {/* PRIMARY FEATURED BAR GRAPH: Weekly Intake & Moderation Trajectory */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-purple-200/90 shadow-[0_4px_24px_rgba(81,34,254,0.06)] space-y-4">
        
        {/* Graph Header with Legend & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#5122fe]">bar_chart</span>
              <h2 className="font-headline text-base sm:text-lg font-bold text-purple-950">
                Weekly Review Intake & Moderation Trajectory
              </h2>
            </div>
            <p className="text-xs text-purple-900/50 mt-0.5">
              Daily incoming wear evaluations categorized by auto-cleared vs manual moderator intervention
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-purple-900/80 font-semibold">
                <span className="w-3 h-3 rounded-md bg-[#5122fe] shadow-2xs"></span>
                <span>Auto-Cleared</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-900/80 font-semibold">
                <span className="w-3 h-3 rounded-md bg-[#f43f5e] shadow-2xs"></span>
                <span>Moderated</span>
              </div>
            </div>

            {/* Bar Mode Toggle */}
            <div className="flex items-center bg-purple-50 p-0.5 rounded-xl border border-purple-200 text-xs">
              <button
                type="button"
                onClick={() => setChartMode('grouped')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  chartMode === 'grouped' ? 'bg-white text-[#5122fe] shadow-2xs' : 'text-purple-600 hover:text-purple-950'
                }`}
              >
                Grouped
              </button>
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  chartMode === 'stacked' ? 'bg-white text-[#5122fe] shadow-2xs' : 'text-purple-600 hover:text-purple-950'
                }`}
              >
                Stacked
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Interactive SVG Bar Chart */}
        <div className="relative pt-2">
          {/* Floating Hover Tooltip */}
          {hoveredDay && (
            <div 
              className="absolute z-20 top-0 left-1/2 -translate-x-1/2 bg-purple-950 text-white px-3.5 py-2 rounded-xl shadow-xl border border-purple-400/30 text-xs flex items-center gap-3 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="font-bold border-r border-white/20 pr-3 text-purple-200">
                {hoveredDay.fullName}
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5122fe]"></span>
                  <span className="text-purple-200">Auto:</span>
                  <strong className="text-white">{hoveredDay.approved}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
                  <span className="text-purple-200">Moderated:</span>
                  <strong className="text-white">{hoveredDay.flagged}</strong>
                </span>
                <span className="text-purple-300 font-medium">
                  Total: <strong className="text-white">{hoveredDay.volume}</strong>
                </span>
              </div>
            </div>
          )}

          {/* SVG Viewport */}
          <div className="w-full h-64 sm:h-72">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 700 240" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="purpleBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7b4eff" />
                  <stop offset="100%" stopColor="#5122fe" />
                </linearGradient>
                <linearGradient id="roseBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5122fe" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Scale */}
              {[100, 75, 50, 25, 0].map((val) => {
                const y = 200 - (val / 100) * 160;
                return (
                  <g key={val} className="text-purple-300/40">
                    <line 
                      x1="45" 
                      y1={y} 
                      x2="690" 
                      y2={y} 
                      stroke="currentColor" 
                      strokeDasharray={val === 0 ? "0" : "4 4"} 
                      strokeWidth={val === 0 ? "1.5" : "1"} 
                    />
                    <text 
                      x="35" 
                      y={y + 4} 
                      textAnchor="end" 
                      className="fill-purple-900/40 text-[10px] font-mono font-medium"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {dailyData.map((item, idx) => {
                const groupWidth = 85;
                const startX = 55 + idx * groupWidth;
                const isHovered = hoveredDay?.day === item.day;

                if (chartMode === 'grouped') {
                  const barWidth = 24;
                  const approvedH = (item.approved / 100) * 160;
                  const flaggedH = (item.flagged / 100) * 160;
                  const approvedY = 200 - approvedH;
                  const flaggedY = 200 - flaggedH;

                  return (
                    <g 
                      key={item.day}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="cursor-pointer group"
                    >
                      {/* Column background hover highlight */}
                      <rect
                        x={startX - 6}
                        y="20"
                        width={groupWidth - 8}
                        height="180"
                        rx="10"
                        className={`transition-colors ${isHovered ? 'fill-purple-100/40' : 'fill-transparent'}`}
                      />

                      {/* Auto-Cleared Bar */}
                      <rect
                        x={startX}
                        y={approvedY}
                        width={barWidth}
                        height={approvedH}
                        rx="5"
                        fill="url(#purpleBarGradient)"
                        filter={isHovered ? "url(#barGlow)" : "none"}
                        className="transition-all duration-300 group-hover:brightness-110"
                      />

                      {/* Moderated Bar */}
                      <rect
                        x={startX + barWidth + 4}
                        y={flaggedY}
                        width={barWidth}
                        height={flaggedH}
                        rx="5"
                        fill="url(#roseBarGradient)"
                        className="transition-all duration-300 group-hover:brightness-110"
                      />

                      {/* Top Metric Indicator */}
                      <text
                        x={startX + barWidth + 2}
                        y={approvedY - 6}
                        textAnchor="middle"
                        className={`text-[10px] font-mono font-bold transition-all ${
                          isHovered ? 'fill-[#5122fe]' : 'fill-purple-900/60'
                        }`}
                      >
                        {item.volume}
                      </text>

                      {/* X-Axis Day Label */}
                      <text
                        x={startX + barWidth + 2}
                        y="222"
                        textAnchor="middle"
                        className={`text-[12px] font-bold transition-colors ${
                          isHovered ? 'fill-[#5122fe]' : 'fill-purple-950'
                        }`}
                      >
                        {item.day}
                      </text>
                    </g>
                  );
                } else {
                  // Stacked Bar Mode
                  const barWidth = 36;
                  const approvedH = (item.approved / 100) * 160;
                  const flaggedH = (item.flagged / 100) * 160;
                  const totalH = approvedH + flaggedH;
                  const totalY = 200 - totalH;

                  return (
                    <g 
                      key={item.day}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x={startX - 4}
                        y="20"
                        width={groupWidth - 8}
                        height="180"
                        rx="10"
                        className={`transition-colors ${isHovered ? 'fill-purple-100/40' : 'fill-transparent'}`}
                      />

                      {/* Auto Cleared Stack (bottom) */}
                      <rect
                        x={startX + 10}
                        y={200 - approvedH}
                        width={barWidth}
                        height={approvedH}
                        rx="5"
                        fill="url(#purpleBarGradient)"
                        className="transition-all duration-300"
                      />

                      {/* Moderated Stack (top) */}
                      <rect
                        x={startX + 10}
                        y={totalY}
                        width={barWidth}
                        height={flaggedH}
                        rx="5"
                        fill="url(#roseBarGradient)"
                        className="transition-all duration-300"
                      />

                      {/* Top Metric */}
                      <text
                        x={startX + 10 + barWidth / 2}
                        y={totalY - 6}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-purple-900/60"
                      >
                        {item.volume}
                      </text>

                      {/* X-Axis Label */}
                      <text
                        x={startX + 10 + barWidth / 2}
                        y="222"
                        textAnchor="middle"
                        className="text-[12px] font-bold fill-purple-950"
                      >
                        {item.day}
                      </text>
                    </g>
                  );
                }
              })}
            </svg>
          </div>
        </div>

        {/* Bottom Insight Footer Strip */}
        <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between text-xs text-purple-900/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Peak intake volume on <strong>Friday (85 evaluations)</strong> with <strong>95.3%</strong> auto-clear efficiency</span>
          </div>
          <div className="text-[11px] text-purple-500 font-medium">
            Hover over any day to inspect exact values
          </div>
        </div>
      </div>

      {/* SECONDARY SECTION: Footwear Model Performance Bar Graph & Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT (7 cols): Footwear Silhouette Comparative Bar Graph */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-purple-200/90 shadow-[0_4px_24px_rgba(81,34,254,0.06)] space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#5122fe]">footwear</span>
                <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">
                  Footwear Silhouette Performance
                </h3>
              </div>
              <p className="text-xs text-purple-900/50 mt-0.5">
                Comparative rating benchmarks and evaluation intake across all 6 models
              </p>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center bg-purple-50 p-0.5 rounded-xl border border-purple-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveSilhouetteTab('rating')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeSilhouetteTab === 'rating' ? 'bg-white text-[#5122fe] shadow-2xs' : 'text-purple-600'
                }`}
              >
                Avg Rating
              </button>
              <button
                type="button"
                onClick={() => setActiveSilhouetteTab('volume')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeSilhouetteTab === 'volume' ? 'bg-white text-[#5122fe] shadow-2xs' : 'text-purple-600'
                }`}
              >
                Volume
              </button>
            </div>
          </div>

          {/* Model Horizontal Bar Graphs */}
          <div className="space-y-3.5 pt-1">
            {SHOE_MODELS.map((shoe) => {
              const ratingPct = (shoe.baseRating / 5.0) * 100;
              const volumePct = (shoe.baseVolume / 45) * 100;
              const activePct = activeSilhouetteTab === 'rating' ? ratingPct : volumePct;

              return (
                <div key={shoe.sku} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-950 group-hover:text-[#5122fe] transition-colors">
                        {shoe.name}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.2 rounded-full border border-purple-200">
                        {shoe.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {activeSilhouetteTab === 'rating' ? (
                        <span className="font-bold text-purple-950 flex items-center gap-1">
                          <span>{shoe.baseRating}</span>
                          <span className="material-symbols-outlined text-[13px] material-symbols-filled text-amber-400">star</span>
                        </span>
                      ) : (
                        <span className="font-bold text-[#5122fe]">{shoe.baseVolume} reviews</span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar with Gradient and Value Fill */}
                  <div className="h-3 w-full bg-purple-100/70 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5122fe] via-[#6f3eff] to-violet-500 rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{ width: `${activePct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT (5 cols): Rating Distribution & Sentiment Polarity */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Rating Distribution Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-200/90 shadow-[0_4px_24px_rgba(81,34,254,0.06)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">
                  Rating Distribution
                </h3>
                <p className="text-xs text-purple-900/50">Proportion across 1-star to 5-star tiers</p>
              </div>
              <span className="material-symbols-outlined text-[#5122fe] text-[18px]">equalizer</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {[5, 4, 3, 2, 1].map((s) => {
                const item = data.rating_distribution?.[`${s}_star`] || { count: 0, percentage: 0 };
                const barColor = s >= 4 
                  ? 'bg-gradient-to-r from-[#5122fe] to-[#7b4eff]' 
                  : s === 3 
                  ? 'bg-gradient-to-r from-purple-400 to-indigo-400' 
                  : 'bg-gradient-to-r from-rose-400 to-rose-500';
                return (
                  <div key={s} className="space-y-1 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-950 flex items-center gap-1">
                        <span>{s}</span>
                        <span className="material-symbols-outlined text-[13px] material-symbols-filled text-amber-400">star</span>
                      </span>
                      <span className="text-[11px] text-purple-900/70 font-mono">
                        <strong>{item.count}</strong> reviews ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-purple-100/70 overflow-hidden">
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
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-200/90 shadow-[0_4px_24px_rgba(81,34,254,0.06)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <h3 className="font-headline font-bold text-sm sm:text-base text-purple-950">
                  Sentiment & Channel Yield
                </h3>
                <p className="text-xs text-purple-900/50">Attributed polarity and retail intake share</p>
              </div>
              <span className="material-symbols-outlined text-[#5122fe] text-[18px]">donut_small</span>
            </div>

            {/* Segmented Sentiment Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-950">
                <span>Polarity Ratio</span>
                <span className="text-emerald-600 font-bold">{positivePct}% Positive</span>
              </div>
              <div className="h-3 w-full bg-purple-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${positivePct}%` }}
                  title={`Positive: ${positivePct}%`}
                ></div>
                <div 
                  className="bg-[#5122fe] h-full transition-all duration-500" 
                  style={{ width: `${neutralPct}%` }}
                  title={`Neutral: ${neutralPct}%`}
                ></div>
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${negativePct}%` }}
                  title={`Risk/Low: ${negativePct}%`}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-purple-900/60 pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive ({positivePct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5122fe]"></span> Neutral ({neutralPct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Risk ({negativePct}%)
                </span>
              </div>
            </div>

            {/* Channel Bars */}
            <div className="space-y-2 pt-2 border-t border-purple-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Channel Distribution
              </div>
              {Object.entries(data.channel_breakdown || {}).map(([ch, cnt]) => {
                const total = Math.max(data.total_reviews, 1);
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={ch} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-purple-950">{ch}</span>
                      <span className="font-mono text-purple-700 text-[11px]">
                        <strong>{cnt}</strong> reviews ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-100/70 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#5122fe] to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDayFullName(day) {
  switch (day) {
    case 'Mon': return 'Monday';
    case 'Tue': return 'Tuesday';
    case 'Wed': return 'Wednesday';
    case 'Thu': return 'Thursday';
    case 'Fri': return 'Friday';
    case 'Sat': return 'Saturday';
    case 'Sun': return 'Sunday';
    default: return day;
  }
}
