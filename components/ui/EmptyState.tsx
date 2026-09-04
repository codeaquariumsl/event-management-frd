import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-[#1d2b3c] bg-slate-50/70 dark:bg-[#0c131c]/50 p-10 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-[#162130] text-[#00897b] dark:text-[#00e5c9] ring-8 ring-slate-50 dark:ring-[#101926]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
