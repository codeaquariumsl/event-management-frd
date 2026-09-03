import React from 'react';
import { cn } from '@/lib/utils';
import { EventStatus, PaymentStatus, StaffStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: EventStatus | PaymentStatus | StaffStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  let colorClass = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotClass = 'bg-slate-400';

  switch (status) {
    case 'Confirmed':
    case 'Paid':
    case 'Active':
      colorClass = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      dotClass = 'bg-emerald-400';
      break;

    case 'In Progress':
    case 'Partially Paid':
      colorClass = 'bg-teal-950/60 text-[#00e5c9] border-[#00e5c9]/40';
      dotClass = 'bg-[#00e5c9] animate-pulse';
      break;

    case 'Pending':
    case 'On Leave':
      colorClass = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      dotClass = 'bg-amber-400';
      break;

    case 'Completed':
      colorClass = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60';
      dotClass = 'bg-indigo-400';
      break;

    case 'Draft':
    case 'Inactive':
      colorClass = 'bg-slate-800/80 text-slate-400 border-slate-700/80';
      dotClass = 'bg-slate-500';
      break;

    case 'Cancelled':
      colorClass = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      dotClass = 'bg-rose-400';
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
