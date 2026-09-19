'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency, cn } from '@/lib/utils';
import { TrendingUp, DollarSign, Wallet, ArrowUpRight, BarChart3, LineChart } from 'lucide-react';

export interface RevenueDataPoint {
  label: string; // e.g., 'Jan', 'Mon', 'Wk 1', '19 Sep'
  revenue: number;
  expenses: number;
  date?: string;
}

interface ModernRevenueChartProps {
  data?: RevenueDataPoint[];
  periodLabel?: string;
  className?: string;
}

export function ModernRevenueChart({
  data = [],
  periodLabel = 'Selected Period',
  className,
}: ModernRevenueChartProps) {
  const [viewMode, setViewMode] = useState<'area' | 'bar'>('area');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData: RevenueDataPoint[] = useMemo(() => {
    if (data && data.length > 0) return data;
    return [
      { label: 'Jan', revenue: 0, expenses: 0 },
      { label: 'Feb', revenue: 0, expenses: 0 },
      { label: 'Mar', revenue: 0, expenses: 0 },
      { label: 'Apr', revenue: 0, expenses: 0 },
      { label: 'May', revenue: 0, expenses: 0 },
      { label: 'Jun', revenue: 0, expenses: 0 },
    ];
  }, [data]);

  const totalRevenue = useMemo(() => chartData.reduce((sum, d) => sum + (d.revenue || 0), 0), [chartData]);
  const totalExpenses = useMemo(() => chartData.reduce((sum, d) => sum + (d.expenses || 0), 0), [chartData]);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const highestVal = useMemo(() => {
    const maxDataVal = Math.max(0, ...chartData.map((d) => Math.max(d.revenue || 0, d.expenses || 0)));
    return maxDataVal > 0 ? maxDataVal * 1.2 : 100000;
  }, [chartData]);

  // SVG Area coordinates calculation
  const width = 680;
  const height = 210;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = useMemo(() => {
    const len = chartData.length;
    if (len === 0) return [];
    return chartData.map((d, i) => {
      const x = len === 1 ? width / 2 : paddingX + (i / (len - 1)) * graphWidth;
      const revY = paddingY + graphHeight - ((d.revenue || 0) / highestVal) * graphHeight;
      const expY = paddingY + graphHeight - ((d.expenses || 0) / highestVal) * graphHeight;
      return { x, revY, expY, ...d };
    });
  }, [chartData, highestVal, graphWidth, graphHeight, width, paddingX, paddingY]);

  // Generates smooth Catmull-Rom or cubic bezier spline for SVG
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const revLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.revY })));
  }, [points]);

  const revAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = paddingY + graphHeight;
    const line = generateSmoothPath(points.map((p) => ({ x: p.x, y: p.revY })));
    return `${line} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [points, graphHeight, paddingY]);

  const expLinePath = useMemo(() => {
    return generateSmoothPath(points.map((p) => ({ x: p.x, y: p.expY })));
  }, [points]);

  const expAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = paddingY + graphHeight;
    const line = generateSmoothPath(points.map((p) => ({ x: p.x, y: p.expY })));
    return `${line} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [points, graphHeight, paddingY]);

  // Y-axis grid ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = highestVal * ratio;
    const y = paddingY + graphHeight - ratio * graphHeight;
    return { val, y };
  });

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#0a111a]/80 border border-slate-200/80 dark:border-[#1a2738] shadow-inner">
        <div className="flex flex-col px-2 py-1">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00a894] dark:bg-[#00e5c9]" />
            Gross Inflow
          </span>
          <span className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate">
            {formatCurrency(totalRevenue)}
          </span>
        </div>

        <div className="flex flex-col px-2 py-1">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-[#7c5cff]" />
            Direct Outflow
          </span>
          <span className="text-xs sm:text-sm font-black font-mono text-slate-700 dark:text-slate-300 mt-0.5 truncate">
            {formatCurrency(totalExpenses)}
          </span>
        </div>

        <div className="flex flex-col px-2 py-1">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Net Production Profit
          </span>
          <span
            className={cn(
              'text-xs sm:text-sm font-black font-mono mt-0.5 truncate',
              netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
            )}
          >
            {formatCurrency(netProfit)}
          </span>
        </div>

        <div className="flex flex-col px-2 py-1 justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Operating Margin
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.2 rounded-full border',
                profitMargin >= 50
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : profitMargin > 0
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
              )}
            >
              {profitMargin}%
            </span>
          </div>

          <div className="flex items-center justify-end gap-1 mt-1">
            <button
              onClick={() => setViewMode('area')}
              title="Area Curve View"
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'area'
                  ? 'bg-white text-[#00897b] shadow-sm dark:bg-[#142334] dark:text-[#00e5c9]'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <LineChart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('bar')}
              title="Column View"
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'bar'
                  ? 'bg-white text-[#00897b] shadow-sm dark:bg-[#142334] dark:text-[#00e5c9]'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative z-20 w-full overflow-visible rounded-xl border border-slate-200/80 dark:border-[#192738] bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30 dark:from-[#09111c] dark:via-[#0c1522] dark:to-[#0f1926] p-2 sm:p-3 select-none">
        {/* Dynamic Tooltip */}
        {activePoint && (
          (() => {
            const xPercent = (activePoint.x / width) * 100;
            const isNearLeft = xPercent < 18;
            const isNearRight = xPercent > 82;
            const isNearTop = Math.min(activePoint.revY, activePoint.expY) < 65;

            // X-Transform calculation
            const translateX = isNearLeft ? '0%' : isNearRight ? '-100%' : '-50%';
            // Y-Transform calculation
            const translateY = isNearTop ? '12px' : 'calc(-100% - 12px)';

            return (
              <div
                className="absolute z-50 pointer-events-none transition-all duration-75"
                style={{
                  left: isNearLeft ? '12px' : isNearRight ? 'auto' : `${xPercent}%`,
                  right: isNearRight ? '12px' : 'auto',
                  top: `${Math.min(activePoint.revY, activePoint.expY)}px`,
                  transform: `translate(${translateX}, ${translateY})`,
                }}
              >
                <div className="rounded-xl border border-slate-200/90 dark:border-[#2f4866] bg-white/95 dark:bg-[#0c1624]/95 backdrop-blur-md p-2.5 shadow-2xl shadow-slate-900/20 dark:shadow-black/80 text-[11px] min-w-[160px] ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-[#1a2b3d] mb-1.5 font-bold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#00a894] dark:bg-[#00e5c9]" />
                      {activePoint.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">{periodLabel}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00e5c9]" />
                        Revenue:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(activePoint.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7c5cff]" />
                        Expenses:
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-400">
                        {formatCurrency(activePoint.expenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-[#1a2b3d] text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Net Profit:</span>
                      <span className="font-mono">
                        {formatCurrency(activePoint.revenue - activePoint.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}


        {viewMode === 'area' ? (
          <div className="relative w-full h-44 sm:h-52">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="modernRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5c9" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#00a894" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#00a894" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="modernExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.30" />
                  <stop offset="70%" stopColor="#7c5cff" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowRevenue" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines & Y-Ticks */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={tick.y}
                    x2={width - paddingX}
                    y2={tick.y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-slate-200 dark:text-[#182637]"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 6}
                    y={tick.y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono font-medium select-none"
                  >
                    {formatCurrency(tick.val, true)}
                  </text>
                </g>
              ))}

              {/* Area Fills */}
              <path d={expAreaPath} fill="url(#modernExpenseGrad)" />
              <path d={revAreaPath} fill="url(#modernRevenueGrad)" />

              {/* Stroke Lines */}
              <path
                d={expLinePath}
                fill="none"
                stroke="#7c5cff"
                strokeWidth="2.2"
                strokeDasharray="4 3"
                className="opacity-70 dark:opacity-85"
              />
              <path
                d={revLinePath}
                fill="none"
                stroke="#00e5c9"
                strokeWidth="3"
                filter="url(#glowRevenue)"
                className="drop-shadow-[0_2px_8px_rgba(0,229,201,0.4)]"
              />

              {/* Hover Crosshair Guide */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={paddingY}
                  x2={activePoint.x}
                  y2={paddingY + graphHeight}
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  className="text-slate-400 dark:text-[#00e5c9] opacity-70"
                  strokeWidth="1.5"
                />
              )}

              {/* Data Nodes & Hit Areas */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={idx}>
                    {/* Expense point */}
                    <circle
                      cx={pt.x}
                      cy={pt.expY}
                      r={isHovered ? 4.5 : 2.5}
                      fill="#7c5cff"
                      stroke="white"
                      strokeWidth="1.5"
                      className="transition-all duration-150"
                    />

                    {/* Revenue point */}
                    <circle
                      cx={pt.x}
                      cy={pt.revY}
                      r={isHovered ? 6 : 3.5}
                      fill={isHovered ? '#1affda' : '#00e5c9'}
                      stroke="white"
                      strokeWidth={isHovered ? 2 : 1.5}
                      className={cn(
                        'transition-all duration-150 cursor-pointer',
                        isHovered && 'drop-shadow-[0_0_8px_#00e5c9]'
                      )}
                    />

                    {/* X-axis label */}
                    <text
                      x={pt.x}
                      y={paddingY + graphHeight + 16}
                      textAnchor="middle"
                      className={cn(
                        'text-[10px] font-sans font-medium transition-colors select-none',
                        isHovered
                          ? 'fill-[#00897b] dark:fill-[#00e5c9] font-bold text-[11px]'
                          : 'fill-slate-400 dark:fill-slate-500'
                      )}
                    >
                      {pt.label}
                    </text>

                    {/* Transparent hover column trigger */}
                    <rect
                      x={pt.x - graphWidth / (points.length * 2 || 1)}
                      y={paddingY}
                      width={graphWidth / (points.length || 1)}
                      height={graphHeight + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          /* Column Mode */
          <div className="relative h-44 sm:h-52 w-full flex items-end justify-between gap-1 sm:gap-2.5 pt-4 pb-6 px-4">
            {/* Horizontal Guide lines */}
            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
              <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
              <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
              <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
            </div>

            {chartData.map((item, idx) => {
              const revHeight = Math.max(4, Math.round(((item.revenue || 0) / highestVal) * 100));
              const expHeight = Math.max(4, Math.round(((item.expenses || 0) / highestVal) * 100));
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group relative flex-1 h-full flex items-end justify-center gap-1 cursor-pointer transition-transform duration-150"
                >
                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${revHeight}%` }}
                    className={cn(
                      'w-2.5 sm:w-4 rounded-t-md transition-all duration-200 bg-gradient-to-t from-[#00897b] to-[#00e5c9]',
                      isHovered && 'brightness-125 shadow-lg shadow-[#00e5c9]/40 scale-x-110'
                    )}
                  />

                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expHeight}%` }}
                    className={cn(
                      'w-2.5 sm:w-4 rounded-t-md transition-all duration-200 bg-gradient-to-t from-[#4f46e5] to-[#7c5cff] opacity-80',
                      isHovered && 'opacity-100 scale-x-110'
                    )}
                  />

                  {/* Label */}
                  <span
                    className={cn(
                      'absolute -bottom-5 text-[10px] truncate max-w-full text-center transition-colors',
                      isHovered
                        ? 'text-[#00897b] dark:text-[#00e5c9] font-bold'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00a894] dark:bg-[#00e5c9] shadow-sm shadow-[#00e5c9]/50" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Revenue Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7c5cff]" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Crew & Production Outflow</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          Hover data points for instant breakdown
        </span>
      </div>
    </div>
  );
}

// BACKWARD-COMPATIBLE WRAPPER
export function MonthlyRevenueChart({
  data,
}: {
  data?: { month: string; revenue: number; expenses: number }[];
}) {
  const transformedData: RevenueDataPoint[] = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      label: d.month,
      revenue: d.revenue,
      expenses: d.expenses,
    }));
  }, [data]);

  return <ModernRevenueChart data={transformedData} periodLabel="Monthly View" />;
}

// EVENT STATUS DONUT & PIPELINE HEALTH CHART
interface EventStatusChartProps {
  stats?: {
    confirmed: number;
    pending: number;
    completed: number;
    inProgress: number;
    cancelled: number;
  };
}

export function EventStatusChart({ stats }: EventStatusChartProps) {
  const data = stats || {
    confirmed: 0,
    pending: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0,
  };

  const total =
    data.confirmed + data.pending + data.completed + data.inProgress + data.cancelled;

  const pctConfirmed = total > 0 ? Math.round((data.confirmed / total) * 100) : 0;
  const pctPending = total > 0 ? Math.round((data.pending / total) * 100) : 0;
  const pctInProgress = total > 0 ? Math.round((data.inProgress / total) * 100) : 0;
  const pctCompleted = total > 0 ? Math.round((data.completed / total) * 100) : 0;
  const pctCancelled = total > 0 ? Math.round((data.cancelled / total) * 100) : 0;

  const activePipelineCount = data.confirmed + data.inProgress;
  const activePipelinePct = total > 0 ? Math.round((activePipelineCount / total) * 100) : 0;

  const statusItems = [
    {
      label: 'Confirmed',
      count: data.confirmed,
      pct: pctConfirmed,
      color: 'bg-[#0b96f3]',
      textClass: 'text-[#0b96f3]',
      borderClass: 'border-[#0b96f3]/25',
      bgClass: 'bg-[#0b96f3]/10',
    },
    {
      label: 'In Progress',
      count: data.inProgress,
      pct: pctInProgress,
      color: 'bg-[#7c5cff]',
      textClass: 'text-[#7c5cff]',
      borderClass: 'border-[#7c5cff]/25',
      bgClass: 'bg-[#7c5cff]/10',
    },
    {
      label: 'Pending',
      count: data.pending,
      pct: pctPending,
      color: 'bg-[#ffb703]',
      textClass: 'text-[#ffb703]',
      borderClass: 'border-[#ffb703]/25',
      bgClass: 'bg-[#ffb703]/10',
    },
    {
      label: 'Completed',
      count: data.completed,
      pct: pctCompleted,
      color: 'bg-[#10b981]',
      textClass: 'text-[#10b981]',
      borderClass: 'border-[#10b981]/25',
      bgClass: 'bg-[#10b981]/10',
    },
    {
      label: 'Cancelled',
      count: data.cancelled,
      pct: pctCancelled,
      color: 'bg-[#ff4d6d]',
      textClass: 'text-[#ff4d6d]',
      borderClass: 'border-[#ff4d6d]/25',
      bgClass: 'bg-[#ff4d6d]/10',
    },
  ];

  return (
    <div className="flex flex-col h-full justify-between gap-3.5 py-0.5">
      {/* Donut Chart Visual */}
      <div className="flex items-center justify-center gap-4 py-1">
        <div className="relative flex items-center justify-center shrink-0">
          <div
            className="h-28 w-28 rounded-full shadow-inner transition-all duration-500"
            style={{
              background: total === 0
                ? '#cbd5e1'
                : `conic-gradient(
                    #0b96f3 0% ${pctConfirmed}%,
                    #7c5cff ${pctConfirmed}% ${pctConfirmed + pctInProgress}%,
                    #ffb703 ${pctConfirmed + pctInProgress}% ${pctConfirmed + pctInProgress + pctPending}%,
                    #10b981 ${pctConfirmed + pctInProgress + pctPending}% ${pctConfirmed + pctInProgress + pctPending + pctCompleted}%,
                    #ff4d6d ${pctConfirmed + pctInProgress + pctPending + pctCompleted}% 100%
                  )`,
            }}
          />
          <div className="absolute h-18 w-18 rounded-full bg-white dark:bg-[#0c1420] flex flex-col items-center justify-center border border-slate-200 dark:border-[#1d2b3c] shadow-md">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {total}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5 font-bold">
              Events
            </span>
          </div>
        </div>
      </div>

      {/* Structured Progress Bars & Status List */}
      <div className="space-y-2 text-xs">
        {statusItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full shrink-0', item.color)} />
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({item.pct}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Health Indicator Banner */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1a2738]">
        {data.pending > 0 ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <span>⚡</span> {data.pending} Pending Action
            </span>
            <span className="text-[10px] underline font-medium cursor-pointer">Review Pipeline</span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <span>✓</span> Pipeline Healthy
            </span>
            <span className="text-[10px] font-mono font-bold">{activePipelinePct}% Active</span>
          </div>
        )}
      </div>
    </div>
  );
}

// SERVICE DISTRIBUTION BARS
export interface ServiceDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

interface ServiceDistributionChartProps {
  data?: ServiceDistributionItem[];
}

export function ServiceDistributionChart({ data }: ServiceDistributionChartProps) {
  const defaultColors = ['bg-[#00e5c9]', 'bg-[#7c5cff]', 'bg-[#ffb703]', 'bg-[#3b82f6]', 'bg-[#ec4899]', 'bg-[#10b981]'];

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#233549] p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1624]">
        No service bookings recorded for this period.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-xs">
      {data.map((srv, idx) => (
        <div key={srv.name} className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">{srv.name}</span>
            <span>
              <strong className="text-slate-900 dark:text-white">{srv.count}</strong> ({srv.percentage}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#162130] overflow-hidden">
            <div
              className={`h-full rounded-full ${srv.color || defaultColors[idx % defaultColors.length]} transition-all duration-500`}
              style={{ width: `${srv.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

