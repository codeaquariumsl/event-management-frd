'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Calendar,
  Users,
  WalletCards,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  X,
  FileSpreadsheet,
  Boxes,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockStore } from '@/lib/mock/store';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [eventsCount, setEventsCount] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    setMounted(true);
    const updateCount = () => {
      const count = mockStore.getEvents().filter((e) => e.status !== 'Completed' && e.status !== 'Cancelled').length;
      setEventsCount(count > 0 ? count : undefined);
    };
    updateCount();
    window.addEventListener('seekers_store_updated', updateCount);
    return () => window.removeEventListener('seekers_store_updated', updateCount);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { label: 'Events', href: '/events', icon: CalendarDays, badge: mounted ? eventsCount : undefined },
    { label: 'Event Types', href: '/event-types', icon: Layers },
    { label: 'Recurring Events', href: '/recurring-events', icon: Clock3 },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Inventory Gear', href: '/inventory', icon: Boxes },
    { label: 'Staff Management', href: '/staff', icon: Users },
    { label: 'Staff Payments', href: '/staff-payments', icon: WalletCards },
    { label: 'Customers', href: '/customers', icon: ClipboardList },
    { label: 'Customer Payments', href: '/customer-payments', icon: CreditCard },
    { label: 'Reports', href: '/reports', icon: FileBarChart },
    { label: 'User & Access', href: '/users', icon: UserCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#192433] bg-[#090e15] transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:max-h-screen',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-[#182332]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#00e5c9]/30 bg-black shadow-md shadow-[#00e5c9]/15 transition-transform group-hover:scale-105">
              <img
                src="/seekers_logo.jpg"
                alt="Seekers Entertainment"
                className="h-full w-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="block text-sm font-black tracking-wider text-white">
                  SEEKERS
                </span>
                <span className="block text-[9px] font-bold tracking-widest text-[#00e5c9] uppercase">
                  ENTERTAINMENT
                </span>
              </div>
            )}
          </Link>

          {/* Close on Mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#162130] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links with Smooth Independent Scroll */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scroll-smooth sidebar-scroll">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150 relative',
                  active
                    ? 'bg-[#00e5c9]/10 text-[#00e5c9] font-semibold border border-[#00e5c9]/30 shadow-sm'
                    : 'text-slate-400 hover:bg-[#121c2a] hover:text-slate-100',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-[#00e5c9]' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!isCollapsed && mounted && item.badge !== undefined && (
                  <span
                    suppressHydrationWarning
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                      active
                        ? 'bg-[#00e5c9] text-[#041816]'
                        : 'bg-[#1b2838] text-slate-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Collapse Toggle & Status */}
        <div className="p-3 shrink-0 mt-auto border-t border-[#182332] space-y-2">
          {!isCollapsed && (
            <div className="rounded-lg border border-[#1d2c3e] bg-[#0c131d] p-2.5 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00e5c9] shrink-0" />
              <div className="truncate">
                <span className="block text-white font-medium text-[11px]">System Ready</span>
                <span className="block text-[10px] text-slate-500">Storage Synced</span>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-lg border border-[#1b2838] bg-[#0d1520] py-2 text-xs text-slate-400 hover:bg-[#162332] hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
