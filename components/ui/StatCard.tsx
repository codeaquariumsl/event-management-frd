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
  compact?: boolean;
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
  compact = false,
}: StatCardProps) {
  const accentStyles = {
    teal: 'text-[#00e5c9] bg-[#00e5c9]/10 border-[#00e5c9]/25 group-hover:border-[#00e5c9]/50',
    purple: 'text-[#a78bfa] bg-[#7c5cff]/10 border-[#7c5cff]/25 group-hover:border-[#7c5cff]/50',
    amber: 'text-[#fbbf24] bg-[#ffb703]/10 border-[#ffb703]/25 group-hover:border-[#ffb703]/50',
    emerald: 'text-[#34d399] bg-[#10b981]/10 border-[#10b981]/25 group-hover:border-[#10b981]/50',
    blue: 'text-[#60a5fa] bg-[#3b82f6]/10 border-[#3b82f6]/25 group-hover:border-[#3b82f6]/50',
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl bg-white dark:bg-[#0e1622] border border-slate-200 dark:border-[#1d2b3c] transition-all duration-200 hover:border-slate-300 dark:hover:border-[#2d4057] hover:bg-slate-50 dark:hover:bg-[#121c2b] shadow-sm',
        compact ? 'p-3.5' : 'p-5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate",
          compact ? "text-[11px]" : "text-xs"
        )}>
          {title}
        </span>
        <div
          className={cn(
            'flex items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 shrink-0',
            compact ? 'h-7 w-7' : 'h-9 w-9',
            accentStyles[accentColor]
          )}
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </div>
      </div>

      <div className={compact ? "mt-2" : "mt-3"}>
        <div className={cn(
          "font-black tracking-tight text-slate-900 dark:text-white truncate",
          compact ? "text-xl sm:text-[22px]" : "text-2xl"
        )}>
          {value}
        </div>
      </div>

      {change && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs truncate",
          compact ? "mt-1.5 text-[11px]" : "mt-2.5"
        )}>
          <span
            className={cn(
              'inline-flex items-center font-medium truncate',
              trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'text-rose-600 dark:text-rose-400',
              trend === 'neutral' && 'text-slate-500 dark:text-slate-400'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="mr-0.5 h-3 w-3 shrink-0" />}
            {trend === 'down' && <ArrowDownRight className="mr-0.5 h-3 w-3 shrink-0" />}
            {change}
          </span>
          {comparisonText && !compact && (
            <span className="text-slate-400 dark:text-slate-500 truncate">{comparisonText}</span>
          )}
        </div>
      )}
    </div>
  );
}
