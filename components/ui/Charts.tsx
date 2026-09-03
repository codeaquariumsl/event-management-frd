'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

// MONTHLY REVENUE BAR / AREA CHART
interface MonthlyRevenueChartProps {
  data?: { month: string; revenue: number; expenses: number }[];
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const defaultData = [
    { month: 'Oct', revenue: 1850000, expenses: 950000 },
    { month: 'Nov', revenue: 2400000, expenses: 1200000 },
    { month: 'Dec', revenue: 3800000, expenses: 1650000 },
    { month: 'Jan', revenue: 2100000, expenses: 1100000 },
    { month: 'Feb', revenue: 2600000, expenses: 1350000 },
    { month: 'Mar', revenue: 3100000, expenses: 1500000 },
    { month: 'Apr', revenue: 2900000, expenses: 1400000 },
    { month: 'May', revenue: 3400000, expenses: 1600000 },
    { month: 'Jun', revenue: 2800000, expenses: 1300000 },
    { month: 'Jul', revenue: 3600000, expenses: 1700000 },
    { month: 'Aug', revenue: 3950000, expenses: 1850000 },
    { month: 'Sep', revenue: 4280000, expenses: 1950000 },
  ];

  const chartData = data || defaultData;
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.revenue, d.expenses))) * 1.15;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00e5c9]" />
            <span className="text-slate-300 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4a5f78]" />
            <span className="text-slate-400 font-medium">Expenses</span>
          </div>
        </div>
        {hoveredIdx !== null ? (
          <div className="text-right">
            <span className="font-semibold text-white">
              {chartData[hoveredIdx].month}: {formatCurrency(chartData[hoveredIdx].revenue)}
            </span>
            <span className="text-slate-400 text-[11px] ml-2">
              (Profit: {formatCurrency(chartData[hoveredIdx].revenue - chartData[hoveredIdx].expenses)})
            </span>
          </div>
        ) : (
          <div className="text-right text-slate-400 text-[11px]">
            Hover bars for monthly breakdown
          </div>
        )}
      </div>

      {/* SVG / Flex Bar Chart */}
      <div className="relative h-48 w-full flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-6 border-b border-[#1c2a3a]">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-500 w-full" />
          <div className="border-b border-dashed border-slate-500 w-full" />
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
              className="group relative flex-1 h-full flex items-end justify-center gap-1 cursor-pointer transition-transform duration-150"
            >
              {/* Revenue bar */}
              <div
                style={{ height: `${revHeight}%` }}
                className={`w-2.5 sm:w-3.5 rounded-t transition-all duration-200 ${
                  isHovered ? 'bg-[#1affda] shadow-lg shadow-[#00e5c9]/30' : 'bg-[#00e5c9]'
                }`}
              />
              {/* Expense bar */}
              <div
                style={{ height: `${expHeight}%` }}
                className={`w-2.5 sm:w-3.5 rounded-t transition-all duration-200 ${
                  isHovered ? 'bg-[#647c9c]' : 'bg-[#3b4c60]'
                }`}
              />
              {/* Month label */}
              <span
                className={`absolute -bottom-6 text-[10px] transition-colors ${
                  isHovered ? 'text-[#00e5c9] font-bold' : 'text-slate-400'
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
    confirmed: 14,
    pending: 6,
    completed: 28,
    inProgress: 4,
    cancelled: 2,
  };

  const total =
    data.confirmed + data.pending + data.completed + data.inProgress + data.cancelled || 1;

  const pctConfirmed = Math.round((data.confirmed / total) * 100);
  const pctPending = Math.round((data.pending / total) * 100);
  const pctCompleted = Math.round((data.completed / total) * 100);
  const pctInProgress = Math.round((data.inProgress / total) * 100);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Visual Conic Gradient Donut */}
      <div className="relative flex items-center justify-center">
        <div
          className="h-36 w-36 rounded-full shadow-inner"
          style={{
            background: `conic-gradient(
              #00e5c9 0% ${pctConfirmed}%,
              #ffb703 ${pctConfirmed}% ${pctConfirmed + pctPending}%,
              #7c5cff ${pctConfirmed + pctPending}% ${pctConfirmed + pctPending + pctInProgress}%,
              #10b981 ${pctConfirmed + pctPending + pctInProgress}% ${pctConfirmed + pctPending + pctInProgress + pctCompleted}%,
              #ff4d6d ${pctConfirmed + pctPending + pctInProgress + pctCompleted}% 100%
            )`,
          }}
        />
        <div className="absolute h-24 w-24 rounded-full bg-[#0e1622] flex flex-col items-center justify-center border border-[#1d2b3c] shadow-lg">
          <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend List */}
      <div className="w-full space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00e5c9]" />
            <span>Confirmed</span>
          </div>
          <span className="font-semibold text-white">
            {data.confirmed} <span className="text-slate-500 font-normal">({pctConfirmed}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ffb703]" />
            <span>Pending</span>
          </div>
          <span className="font-semibold text-white">
            {data.pending} <span className="text-slate-500 font-normal">({pctPending}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#7c5cff]" />
            <span>In Progress</span>
          </div>
          <span className="font-semibold text-white">
            {data.inProgress} <span className="text-slate-500 font-normal">({pctInProgress}%)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span>Completed</span>
          </div>
          <span className="font-semibold text-white">
            {data.completed} <span className="text-slate-500 font-normal">({pctCompleted}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// SERVICE DISTRIBUTION BARS
export function ServiceDistributionChart() {
  const services = [
    { name: 'Sound Systems (L-Acoustics)', percentage: 38, count: 42, color: 'bg-[#00e5c9]' },
    { name: 'Lighting & Intelligent Moving Heads', percentage: 26, count: 29, color: 'bg-[#7c5cff]' },
    { name: 'DJ & MC Performance Packages', percentage: 20, count: 22, color: 'bg-[#ffb703]' },
    { name: 'HD LED Screen Walls (P2.6)', percentage: 12, count: 14, color: 'bg-[#3b82f6]' },
    { name: 'Pyrotechnics & Low Fog FX', percentage: 4, count: 5, color: 'bg-[#ec4899]' },
  ];

  return (
    <div className="space-y-4 text-xs">
      {services.map((srv) => (
        <div key={srv.name} className="space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span className="font-medium text-white">{srv.name}</span>
            <span>
              <strong className="text-white">{srv.count}</strong> bookings ({srv.percentage}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#162130] overflow-hidden">
            <div
              className={`h-full rounded-full ${srv.color} transition-all duration-500`}
              style={{ width: `${srv.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
