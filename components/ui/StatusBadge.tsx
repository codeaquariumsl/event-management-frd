import React from 'react';
import { cn } from '@/lib/utils';
import { EventStatus, PaymentStatus, StaffStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: EventStatus | PaymentStatus | StaffStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80';
  let dotClass = 'bg-slate-400';

  switch (status) {
    case 'Confirmed':
    case 'Paid':
    case 'Active':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60';
      dotClass = 'bg-emerald-500 dark:bg-emerald-400';
      break;

    case 'In Progress':
    case 'Partially Paid':
      colorClass = 'bg-teal-50 text-[#00897b] border-teal-200 dark:bg-teal-950/60 dark:text-[#00e5c9] dark:border-[#00e5c9]/40';
      dotClass = 'bg-[#00897b] dark:bg-[#00e5c9] animate-pulse';
      break;

    case 'Pending':
    case 'On Leave':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60';
      dotClass = 'bg-amber-500 dark:bg-amber-400';
      break;

    case 'Completed':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60';
      dotClass = 'bg-indigo-500 dark:bg-indigo-400';
      break;

    case 'Draft':
    case 'Inactive':
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/80';
      dotClass = 'bg-slate-400 dark:bg-slate-500';
      break;

    case 'Cancelled':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60';
      dotClass = 'bg-rose-500 dark:bg-rose-400';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        colorClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
      {status}
    </span>
  );
}
