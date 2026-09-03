import React from 'react';
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  comparisonText?: string;
  icon: LucideIcon;
  accentColor?: 'teal' | 'purple' | 'amber' | 'emerald' | 'blue';
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'up',
  comparisonText = 'vs last month',
  icon: Icon,
  accentColor = 'teal',
  className,
}: StatCardProps) {
  const accentStyles = {
    teal: 'text-[#00e5c9] bg-[#00e5c9]/10 border-[#00e5c9]/25',
    purple: 'text-[#a78bfa] bg-[#7c5cff]/10 border-[#7c5cff]/25',
    amber: 'text-[#fbbf24] bg-[#ffb703]/10 border-[#ffb703]/25',
    emerald: 'text-[#34d399] bg-[#10b981]/10 border-[#10b981]/25',
    blue: 'text-[#60a5fa] bg-[#3b82f6]/10 border-[#3b82f6]/25',
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl bg-[#0e1622] border border-[#1d2b3c] p-5 transition-all duration-200 hover:border-[#2d4057] hover:bg-[#121c2b] shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105',
            accentStyles[accentColor]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      </div>

      {change && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center font-medium',
              trend === 'up' && 'text-emerald-400',
              trend === 'down' && 'text-rose-400',
              trend === 'neutral' && 'text-slate-400'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
            {trend === 'down' && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            {change}
          </span>
          <span className="text-slate-500">{comparisonText}</span>
        </div>
      )}
    </div>
  );
}
