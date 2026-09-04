'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

// MONTHLY REVENUE BAR / AREA CHART
interface MonthlyRevenueChartProps {
  data?: { month: string; revenue: number; expenses: number }[];
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const chartData = data && data.length > 0 ? data : [
    { month: 'Jan', revenue: 0, expenses: 0 },
    { month: 'Feb', revenue: 0, expenses: 0 },
    { month: 'Mar', revenue: 0, expenses: 0 },
    { month: 'Apr', revenue: 0, expenses: 0 },
    { month: 'May', revenue: 0, expenses: 0 },
    { month: 'Jun', revenue: 0, expenses: 0 },
    { month: 'Jul', revenue: 0, expenses: 0 },
    { month: 'Aug', revenue: 0, expenses: 0 },
    { month: 'Sep', revenue: 0, expenses: 0 },
    { month: 'Oct', revenue: 0, expenses: 0 },
    { month: 'Nov', revenue: 0, expenses: 0 },
    { month: 'Dec', revenue: 0, expenses: 0 },
  ];

  const highestVal = Math.max(0, ...chartData.map((d) => Math.max(d.revenue, d.expenses)));
  const maxVal = highestVal > 0 ? highestVal * 1.15 : 100000;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Legend & Hover Breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00e5c9]" />
            <span className="text-slate-300 text-[11px] font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#4a5f78]" />
            <span className="text-slate-400 text-[11px] font-medium">Expenses</span>
          </div>
        </div>
        {hoveredIdx !== null ? (
          <div className="text-right text-[11px]">
            <span className="font-bold text-white">
              {chartData[hoveredIdx].month}: {formatCurrency(chartData[hoveredIdx].revenue)}
            </span>
            <span className="text-emerald-400 font-semibold ml-2">
              (Net: {formatCurrency(chartData[hoveredIdx].revenue - chartData[hoveredIdx].expenses)})
            </span>
          </div>
        ) : (
          <div className="text-right text-slate-500 text-[11px]">
            Hover monthly bars for breakdown
          </div>
        )}
      </div>

      {/* SVG / Flex Bar Chart */}
      <div className="relative h-36 sm:h-40 w-full flex items-end justify-between gap-1.5 sm:gap-2.5 pt-4 pb-5 border-b border-slate-200 dark:border-[#1c2a3a]">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full" />
        </div>

        {chartData.map((item, idx) => {
          const revHeight = Math.round((item.revenue / maxVal) * 100);
          const expHeight = Math.round((item.expenses / maxVal) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.month}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative flex-1 h-full flex items-end justify-center gap-0.5 sm:gap-1 cursor-pointer transition-transform duration-150"
            >
              {/* Revenue bar */}
              <div
                style={{ height: `${revHeight}%` }}
                className={`w-2 sm:w-3 rounded-t-sm transition-all duration-200 ${
                  isHovered ? 'bg-[#00897b] dark:bg-[#1affda] shadow-lg shadow-[#00e5c9]/40' : 'bg-[#00a894] dark:bg-[#00e5c9]'
                }`}
              />
              {/* Expense bar */}
              <div
                style={{ height: `${expHeight}%` }}
                className={`w-2 sm:w-3 rounded-t-sm transition-all duration-200 ${
                  isHovered ? 'bg-slate-500 dark:bg-[#647c9c]' : 'bg-slate-300 dark:bg-[#3b4c60]'
                }`}
              />
              {/* Month label */}
              <span
                className={`absolute -bottom-5 text-[10px] transition-colors ${
                  isHovered ? 'text-[#00897b] dark:text-[#00e5c9] font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// EVENT STATUS DONUT CHART
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
  const pctCompleted = total > 0 ? Math.round((data.completed / total) * 100) : 0;
  const pctInProgress = total > 0 ? Math.round((data.inProgress / total) * 100) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
      {/* Compact Conic Gradient Donut */}
      <div className="relative flex items-center justify-center shrink-0">
        <div
          className="h-28 w-28 rounded-full shadow-inner"
          style={{
            background: total === 0
              ? '#cbd5e1'
              : `conic-gradient(
                  #00e5c9 0% ${pctConfirmed}%,
                  #ffb703 ${pctConfirmed}% ${pctConfirmed + pctPending}%,
                  #7c5cff ${pctConfirmed + pctPending}% ${pctConfirmed + pctPending + pctInProgress}%,
                  #10b981 ${pctConfirmed + pctPending + pctInProgress}% ${pctConfirmed + pctPending + pctInProgress + pctCompleted}%,
                  #ff4d6d ${pctConfirmed + pctPending + pctInProgress + pctCompleted}% 100%
                )`,
          }}
        />
        <div className="absolute h-18 w-18 rounded-full bg-white dark:bg-[#0e1622] flex flex-col items-center justify-center border border-slate-200 dark:border-[#1d2b3c] shadow-md">
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{total}</span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Events</span>
        </div>
      </div>

      {/* Compact Legend List */}
      <div className="w-full sm:flex-1 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00e5c9] shrink-0" />
            <span>Confirmed</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            {data.confirmed} <span className="text-slate-400 dark:text-slate-500 font-normal">({pctConfirmed}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ffb703] shrink-0" />
            <span>Pending</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            {data.pending} <span className="text-slate-400 dark:text-slate-500 font-normal">({pctPending}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7c5cff] shrink-0" />
            <span>In Progress</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            {data.inProgress} <span className="text-slate-400 dark:text-slate-500 font-normal">({pctInProgress}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981] shrink-0" />
            <span>Completed</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            {data.completed} <span className="text-slate-400 dark:text-slate-500 font-normal">({pctCompleted}%)</span>
          </span>
        </div>
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
        No service bookings recorded yet.
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
