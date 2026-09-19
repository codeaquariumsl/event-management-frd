'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Users,
  WalletCards,
  CircleDollarSign,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  CreditCard,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Filter,
  Check,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ModernRevenueChart,
  EventStatusChart,
  ServiceDistributionChart,
  RevenueDataPoint,
  ServiceDistributionItem,
} from '@/components/ui/Charts';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { paymentService } from '@/lib/api/paymentService';
import { staffService } from '@/lib/api/staffService';
import { reportService } from '@/lib/api/reportService';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EventItem, CustomerPayment, Staff } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';

export type DatePeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'all_time'
  | 'custom';

// Robust Date Parser
function parseToDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Computes Start & End timestamps and human-readable label for selected period
function getDatePeriodBounds(
  period: DatePeriod,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date; label: string; periodTitle: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  switch (period) {
    case 'today': {
      const start = new Date(year, month, date, 0, 0, 0, 0);
      const end = new Date(year, month, date, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'Today',
        label: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    }
    case 'this_week': {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const start = new Date(year, month, date + diffToMonday, 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'This Week',
        label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      };
    }
    case 'this_month': {
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'This Month',
        label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      const lastMonthDate = new Date(year, month - 1, 1);
      return {
        start,
        end,
        periodTitle: 'Last Month',
        label: lastMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }
    case 'this_quarter': {
      const q = Math.floor(month / 3);
      const start = new Date(year, q * 3, 1, 0, 0, 0, 0);
      const end = new Date(year, (q + 1) * 3, 0, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: `Quarter ${q + 1}`,
        label: `Q${q + 1} ${year} (${start.toLocaleString('default', { month: 'short' })} – ${end.toLocaleString('default', { month: 'short' })})`,
      };
    }
    case 'this_year': {
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'Year to Date',
        label: `FY ${year}`,
      };
    }
    case 'custom': {
      const s = parseToDate(customStart) || new Date(year, month, 1, 0, 0, 0, 0);
      const e = parseToDate(customEnd) || new Date(year, month, date, 23, 59, 59, 999);
      const start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
      const end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'Custom Range',
        label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      };
    }
    case 'all_time':
    default: {
      const start = new Date(2000, 0, 1, 0, 0, 0, 0);
      const end = new Date(2100, 11, 31, 23, 59, 59, 999);
      return {
        start,
        end,
        periodTitle: 'All Time',
        label: 'Overall Lifetime Records',
      };
    }
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [tableFilter, setTableFilter] = useState<'All' | 'Confirmed' | 'Pending'>('All');
  const [activityTab, setActivityTab] = useState<'payments' | 'services'>('payments');

  // Date Period Selection State
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showCustomRangeInputs, setShowCustomRangeInputs] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const [evts, custs, pays, staff, summary] = await Promise.all([
          eventService.getEvents(),
          customerService.getCustomers(),
          paymentService.getCustomerPayments(),
          staffService.getStaff(),
          reportService.getDashboardMetrics(),
        ]);
        if (Array.isArray(evts)) setEvents(evts);
        if (Array.isArray(pays)) setPayments(pays);
        if (Array.isArray(custs)) setCustomersCount(custs.length);
        if (Array.isArray(staff)) setStaffList(staff);
        if (summary) setDashboardSummary(summary);
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      }
    };
    load();

    window.addEventListener('seekers_store_updated', load);
    return () => window.removeEventListener('seekers_store_updated', load);
  }, []);

  // Compute Active Period Boundaries
  const periodBounds = useMemo(() => {
    return getDatePeriodBounds(datePeriod, customStartDate, customEndDate);
  }, [datePeriod, customStartDate, customEndDate]);

  // Synchronized Filtered Events for the Selected Period
  const filteredEvents = useMemo(() => {
    if (datePeriod === 'all_time') return events;
    return events.filter((e) => {
      const d = parseToDate(e.eventDate || e.createdAt);
      if (!d) return false;
      return d >= periodBounds.start && d <= periodBounds.end;
    });
  }, [events, datePeriod, periodBounds]);

  // Synchronized Filtered Customer Payments for the Selected Period
  const filteredPayments = useMemo(() => {
    if (datePeriod === 'all_time') return payments;
    return payments.filter((p) => {
      const d = parseToDate(p.date);
      if (!d) return false;
      return d >= periodBounds.start && d <= periodBounds.end;
    });
  }, [payments, datePeriod, periodBounds]);

  // 8 Dynamic KPI Metrics Synchronized with Date Period
  const totalEventsCount = filteredEvents.length;
  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(
      (e) => e.status === 'Confirmed' || e.status === 'Pending' || e.status === 'In Progress'
    );
  }, [filteredEvents]);

  const displayedUpcomingEvents = useMemo(() => {
    if (tableFilter === 'All') return upcomingEvents;
    return upcomingEvents.filter((e) => e.status === tableFilter);
  }, [upcomingEvents, tableFilter]);

  const completedEventsCount = filteredEvents.filter((e) => e.status === 'Completed').length;

  // Active Crew assigned during this period
  const activeStaffInPeriod = useMemo(() => {
    if (datePeriod === 'all_time') return staffList.filter((s) => s.status === 'Active').length;
    const assignedIds = new Set<string>();
    filteredEvents.forEach((evt) => {
      (evt.assignedStaff || []).forEach((as) => {
        if (as.staffId) assignedIds.add(as.staffId);
      });
    });
    return assignedIds.size > 0 ? assignedIds.size : staffList.filter((s) => s.status === 'Active').length;
  }, [datePeriod, staffList, filteredEvents]);

  // Unique clients in selected period
  const clientsInPeriod = useMemo(() => {
    if (datePeriod === 'all_time') return customersCount;
    const clientIds = new Set<string>();
    filteredEvents.forEach((e) => {
      if (e.customerId || e.customerName) clientIds.add(e.customerId || e.customerName);
    });
    return clientIds.size > 0 ? clientIds.size : customersCount;
  }, [datePeriod, customersCount, filteredEvents]);

  // Financial Metrics for the period
  const pendingReceivablesInPeriod = useMemo(() => {
    return filteredEvents.reduce((sum, e) => sum + (Number(e.balance) || 0), 0);
  }, [filteredEvents]);

  const staffPaymentsDueInPeriod = useMemo(() => {
    if (datePeriod === 'all_time') {
      return staffList.reduce((sum, s) => sum + (s.pendingPayments || 0), 0);
    }
    return filteredEvents.reduce((sum, e) => {
      const stf = (e.assignedStaff || []).reduce(
        (s, as) => s + Math.max(0, (Number(as.paymentAmount) || 0) - (Number(as.paidAmount) || 0)),
        0
      );
      return sum + stf;
    }, 0);
  }, [datePeriod, staffList, filteredEvents]);

  const revenueInPeriod = useMemo(() => {
    if (filteredPayments.length > 0) {
      return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }
    return filteredEvents.reduce((sum, e) => sum + (Number(e.paidAmount) || Number(e.totalAmount) || 0), 0);
  }, [filteredPayments, filteredEvents]);

  // Event Pipeline Status Breakdown for Donut Chart
  const statusStats = useMemo(() => {
    return {
      confirmed: filteredEvents.filter((e) => e.status === 'Confirmed').length,
      pending: filteredEvents.filter((e) => e.status === 'Pending').length,
      completed: filteredEvents.filter((e) => e.status === 'Completed').length,
      inProgress: filteredEvents.filter((e) => e.status === 'In Progress').length,
      cancelled: filteredEvents.filter((e) => e.status === 'Cancelled').length,
    };
  }, [filteredEvents]);

  // Modern Revenue Chart Data Dynamic Aggregator
  const dynamicRevenueChartData = useMemo<RevenueDataPoint[]>(() => {
    if (datePeriod === 'today') {
      const hours = ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
      const totalRev = revenueInPeriod;
      const totalExp = filteredEvents.reduce((sum, e) => {
        const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
        const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
        return sum + exp + stf;
      }, 0);

      return hours.map((h, i) => ({
        label: h,
        revenue: i === 3 ? totalRev : 0,
        expenses: i === 3 ? totalExp : 0,
      }));
    }

    if (datePeriod === 'this_week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap: Record<number, { revenue: number; expenses: number }> = {};
      days.forEach((_, idx) => {
        dayMap[idx] = { revenue: 0, expenses: 0 };
      });

      filteredPayments.forEach((p) => {
        const d = parseToDate(p.date);
        if (d) {
          const dayIndex = (d.getDay() + 6) % 7; // Monday = 0
          if (dayMap[dayIndex]) dayMap[dayIndex].revenue += Number(p.amount) || 0;
        }
      });

      filteredEvents.forEach((e) => {
        const d = parseToDate(e.eventDate);
        if (d) {
          const dayIndex = (d.getDay() + 6) % 7;
          if (dayMap[dayIndex]) {
            if (filteredPayments.length === 0) dayMap[dayIndex].revenue += Number(e.totalAmount) || 0;
            const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
            const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
            dayMap[dayIndex].expenses += exp + stf;
          }
        }
      });

      return days.map((day, idx) => ({
        label: day,
        revenue: dayMap[idx].revenue,
        expenses: dayMap[idx].expenses,
      }));
    }

    if (datePeriod === 'this_month' || datePeriod === 'last_month') {
      const buckets = [
        { label: 'Wk 1 (1-7)', start: 1, end: 7, rev: 0, exp: 0 },
        { label: 'Wk 2 (8-14)', start: 8, end: 14, rev: 0, exp: 0 },
        { label: 'Wk 3 (15-21)', start: 15, end: 21, rev: 0, exp: 0 },
        { label: 'Wk 4 (22-28)', start: 22, end: 28, rev: 0, exp: 0 },
        { label: 'Wk 5 (29+)', start: 29, end: 31, rev: 0, exp: 0 },
      ];

      filteredPayments.forEach((p) => {
        const d = parseToDate(p.date);
        if (d) {
          const day = d.getDate();
          const bucket = buckets.find((b) => day >= b.start && day <= b.end);
          if (bucket) bucket.rev += Number(p.amount) || 0;
        }
      });

      filteredEvents.forEach((e) => {
        const d = parseToDate(e.eventDate);
        if (d) {
          const day = d.getDate();
          const bucket = buckets.find((b) => day >= b.start && day <= b.end);
          if (bucket) {
            if (filteredPayments.length === 0) bucket.rev += Number(e.totalAmount) || 0;
            const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
            const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
            bucket.exp += exp + stf;
          }
        }
      });

      return buckets.map((b) => ({
        label: b.label,
        revenue: b.rev,
        expenses: b.exp,
      }));
    }

    if (datePeriod === 'this_quarter') {
      const quarterMonth = periodBounds.start.getMonth();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const qMonths = [quarterMonth, quarterMonth + 1, quarterMonth + 2];
      const qMap: Record<number, { label: string; revenue: number; expenses: number }> = {};

      qMonths.forEach((m) => {
        qMap[m] = { label: monthNames[m], revenue: 0, expenses: 0 };
      });

      filteredPayments.forEach((p) => {
        const d = parseToDate(p.date);
        if (d && qMap[d.getMonth()]) {
          qMap[d.getMonth()].revenue += Number(p.amount) || 0;
        }
      });

      filteredEvents.forEach((e) => {
        const d = parseToDate(e.eventDate);
        if (d && qMap[d.getMonth()]) {
          if (filteredPayments.length === 0) qMap[d.getMonth()].revenue += Number(e.totalAmount) || 0;
          const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
          const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
          qMap[d.getMonth()].expenses += exp + stf;
        }
      });

      return qMonths.map((m) => ({
        label: qMap[m].label,
        revenue: qMap[m].revenue,
        expenses: qMap[m].expenses,
      }));
    }

    // Default 12 Monthly breakdown for 'this_year', 'all_time', or custom ranges
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map: Record<number, { label: string; revenue: number; expenses: number }> = {};
    monthNames.forEach((m, idx) => {
      map[idx] = { label: m, revenue: 0, expenses: 0 };
    });

    filteredPayments.forEach((p) => {
      const d = parseToDate(p.date);
      if (d && map[d.getMonth()]) {
        map[d.getMonth()].revenue += Number(p.amount) || 0;
      }
    });

    filteredEvents.forEach((e) => {
      const d = parseToDate(e.eventDate);
      if (d && map[d.getMonth()]) {
        if (filteredPayments.length === 0) {
          map[d.getMonth()].revenue += Number(e.totalAmount) || 0;
        }
        const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
        const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
        map[d.getMonth()].expenses += exp + stf;
      }
    });

    return monthNames.map((_, i) => map[i]);
  }, [datePeriod, filteredPayments, filteredEvents, revenueInPeriod, periodBounds]);

  // Service Distribution for Selected Period
  const serviceDistributionData = useMemo<ServiceDistributionItem[]>(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach((evt) => {
      (evt.services || []).forEach((srv) => {
        const cat = srv.category || srv.name || 'General Production';
        counts[cat] = (counts[cat] || 0) + (srv.quantity || 1);
      });
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalCount = entries.reduce((sum, [, c]) => sum + c, 0) || 1;
    const colors = ['bg-[#00e5c9]', 'bg-[#7c5cff]', 'bg-[#ffb703]', 'bg-[#3b82f6]', 'bg-[#ec4899]', 'bg-[#10b981]'];

    return entries.slice(0, 5).map(([name, count], idx) => ({
      name,
      count,
      percentage: Math.round((count / totalCount) * 100),
      color: colors[idx % colors.length],
    }));
  }, [filteredEvents]);

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        {/* Compact Executive Command Bar & Date Period Switcher */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-[#1f3144] bg-gradient-to-r from-teal-50/80 via-slate-50 to-white dark:from-[#0b1522] dark:via-[#0f1d2d] dark:to-[#121824] p-4 sm:p-5 shadow-sm dark:shadow-lg transition-colors duration-200">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {new Date().getHours() < 12
                    ? 'Good Morning'
                    : new Date().getHours() < 18
                      ? 'Good Afternoon'
                      : 'Good Evening'}
                  , {user?.name || 'User'}
                </h1>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Audiovisual setups, DJ bookings, technical crew assignments, client receivables, and financial performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                href="/recurring-events"
                className="rounded-lg border border-slate-200 dark:border-[#233549] bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c2e42] hover:border-slate-300 dark:hover:border-[#354f6b] transition-colors"
              >
                Recurring Schedules
              </Link>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-3.5 py-1.5 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00e5c9]/25 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Event</span>
              </Link>
            </div>
          </div>

          {/* Integrated Date Period Control Panel */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-[#1a293d] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
                Period:
              </span>

              {[
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'this_quarter', label: 'This Quarter' },
                { id: 'this_year', label: 'Year to Date' },
                { id: 'all_time', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => {
                const isActive = datePeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setDatePeriod(p.id as DatePeriod);
                      if (p.id === 'custom') {
                        setShowCustomRangeInputs(true);
                      } else {
                        setShowCustomRangeInputs(false);
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all',
                      isActive
                        ? 'bg-[#00a894] dark:bg-[#00e5c9] text-white dark:text-[#041816] shadow-sm shadow-[#00e5c9]/30 ring-1 ring-[#00a894] dark:ring-[#00e5c9]'
                        : 'bg-white/80 dark:bg-[#0d1724]/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1f3044] hover:border-slate-300 dark:hover:border-[#2f4662] hover:bg-white dark:hover:bg-[#121f30]'
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Active Range Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#0e1927] border border-slate-200 dark:border-[#1f3044] text-[11px]">
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {periodBounds.label}
                </span>
                <span className="text-[10px] text-[#00897b] dark:text-[#00e5c9] font-bold">
                  ({filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'})
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Custom Date Range Picker */}
          {showCustomRangeInputs && datePeriod === 'custom' && (
            <div className="mt-3 p-3 rounded-lg bg-white dark:bg-[#0a121e] border border-slate-200 dark:border-[#1e3046] flex flex-wrap items-center gap-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Start Date:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded border border-slate-300 dark:border-[#263c56] bg-slate-50 dark:bg-[#0e1826] px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00e5c9]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">End Date:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded border border-slate-300 dark:border-[#263c56] bg-slate-50 dark:bg-[#0e1826] px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00e5c9]"
                />
              </div>

              <button
                onClick={() => setShowCustomRangeInputs(false)}
                className="px-3 py-1 rounded bg-[#00a894] dark:bg-[#00e5c9] text-white dark:text-[#041816] text-xs font-bold hover:opacity-90"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>

        {/* 8 KPI Cards Grid - Filtered by Selected Period */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard
            compact
            title="Total Events"
            value={totalEventsCount}
            change={`${totalEventsCount} in ${periodBounds.periodTitle}`}
            trend="up"
            icon={CalendarDays}
            accentColor="teal"
            onClick={() => router.push('/events')}
          />
          <StatCard
            compact
            title="Active Productions"
            value={upcomingEvents.length}
            change={`${upcomingEvents.length} active in period`}
            trend="up"
            icon={Clock}
            accentColor="purple"
            onClick={() => router.push('/events')}
          />
          <StatCard
            compact
            title="Completed Events"
            value={completedEventsCount}
            change={`${completedEventsCount} finished`}
            trend="up"
            icon={TrendingUp}
            accentColor="emerald"
            onClick={() => router.push('/events')}
          />
          <StatCard
            compact
            title="Active Crew"
            value={activeStaffInPeriod}
            change={datePeriod === 'all_time' ? `${activeStaffInPeriod} members` : `${activeStaffInPeriod} assigned`}
            trend="neutral"
            icon={Users}
            accentColor="blue"
            onClick={() => router.push('/staff')}
          />
          <StatCard
            compact
            title="Client Base"
            value={clientsInPeriod}
            change={datePeriod === 'all_time' ? `${clientsInPeriod} clients` : `${clientsInPeriod} active clients`}
            trend="up"
            icon={Users}
            accentColor="purple"
            onClick={() => router.push('/customers')}
          />
          <StatCard
            compact
            title="Pending Receivables"
            value={formatCurrency(pendingReceivablesInPeriod, false)}
            change={`${filteredEvents.filter((e) => (e.balance || 0) > 0).length} balance due`}
            trend="down"
            icon={CreditCard}
            accentColor="amber"
            onClick={() => router.push('/customer-payments')}
          />
          <StatCard
            compact
            title="Staff Payments Due"
            value={formatCurrency(staffPaymentsDueInPeriod, false)}
            change={staffPaymentsDueInPeriod > 0 ? 'Pending payout' : 'Settled'}
            trend="neutral"
            icon={WalletCards}
            accentColor="blue"
            onClick={() => router.push('/staff-payments')}
          />
          <StatCard
            compact
            title="Period Inflow"
            value={formatCurrency(revenueInPeriod, false)}
            change={`${filteredPayments.length} collections`}
            trend="up"
            icon={CircleDollarSign}
            accentColor="teal"
            onClick={() => router.push('/reports')}
          />
        </div>

        {/* Middle Row: Modern Revenue Chart & Event Pipeline Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Modern Revenue & Profitability Chart (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2738] mb-2 gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Revenue & Profitability Performance</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gross client inflows vs operational crew & equipment costs (LKR)
                </p>
              </div>
              <span className="rounded bg-[#00e5c9]/10 px-2.5 py-0.5 text-xs font-bold text-[#00897b] dark:text-[#00e5c9] border border-[#00e5c9]/20 font-mono">
                {periodBounds.label}
              </span>
            </div>
            <ModernRevenueChart data={dynamicRevenueChartData} periodLabel={periodBounds.periodTitle} />
          </div>

          {/* Event Status Donut (1 col) */}
          <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100 dark:border-[#1a2738] mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Event Pipeline Status
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution for {periodBounds.periodTitle}</p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {filteredEvents.length} Total
              </span>
            </div>
            <EventStatusChart stats={statusStats} />
          </div>
        </div>

        {/* Lower Row: Upcoming Events Table & Interactive Activity Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Upcoming Productions for the selected period (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1a2738]">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Scheduled Productions ({periodBounds.periodTitle})
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Events scheduled in selected period</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status quick-filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0b131e] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a283a]">
                    {(['All', 'Confirmed', 'Pending'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTableFilter(filter)}
                        className={cn(
                          'px-2 py-0.5 text-[11px] font-medium rounded transition-colors',
                          tableFilter === filter
                            ? 'bg-white text-[#00897b] font-semibold shadow-sm dark:bg-[#142334] dark:text-[#00e5c9]'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00897b] dark:text-[#00e5c9] hover:underline ml-1"
                  >
                    <span>View All ({events.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#1c2a3b] text-slate-500 dark:text-slate-400 text-[10px] uppercase bg-slate-50/50 dark:bg-transparent">
                      <th className="py-2 px-2">Event</th>
                      <th className="py-2 px-2">Customer</th>
                      <th className="py-2 px-2">Date & Time</th>
                      <th className="py-2 px-2">Location</th>
                      <th className="py-2 px-2 text-right">Value</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#182535]">
                    {displayedUpcomingEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                          No {tableFilter !== 'All' ? tableFilter.toLowerCase() : ''} productions found in {periodBounds.periodTitle.toLowerCase()}.
                        </td>
                      </tr>
                    ) : (
                      displayedUpcomingEvents.slice(0, 5).map((evt) => (
                        <tr
                          key={evt.id}
                          onClick={() => router.push(`/events/${evt.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-[#111c29] cursor-pointer transition-colors group"
                        >
                          <td className="py-2 px-2 font-semibold text-slate-900 dark:text-white group-hover:text-[#00897b] dark:group-hover:text-[#00e5c9] truncate max-w-[180px]">
                            {evt.name}
                          </td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                            {evt.customerName}
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <span>{formatDate(evt.eventDate)}</span>
                            {evt.startTime && (
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500">{evt.startTime}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {evt.location}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(evt.totalAmount)}
                          </td>
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <StatusBadge status={evt.status} size="sm" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1a2738] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">Period: {periodBounds.label}</span>
              <Link href="/events" className="text-[11px] text-[#00897b] dark:text-[#00e5c9] hover:underline font-medium">
                Browse Full Events Archive →
              </Link>
            </div>
          </div>

          {/* Activity Hub: Tabbed Recent Payments & Service Distribution in Selected Period (1 col) */}
          <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2738] mb-3">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0b131e] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a283a]">
                  <button
                    onClick={() => setActivityTab('payments')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition-all',
                      activityTab === 'payments'
                        ? 'bg-white text-[#00897b] shadow-sm dark:bg-[#142334] dark:text-[#00e5c9]'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    Payments ({filteredPayments.length})
                  </button>
                  <button
                    onClick={() => setActivityTab('services')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition-all',
                      activityTab === 'services'
                        ? 'bg-white text-[#00897b] shadow-sm dark:bg-[#142334] dark:text-[#00e5c9]'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    Top Services
                  </button>
                </div>

                {activityTab === 'payments' ? (
                  <Link
                    href="/customer-payments"
                    className="text-[11px] text-[#00897b] dark:text-[#00e5c9] hover:underline font-semibold"
                  >
                    Ledger →
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {serviceDistributionData.length} Categories
                  </span>
                )}
              </div>

              {activityTab === 'payments' ? (
                <div className="space-y-2">
                  {filteredPayments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#233549] p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1624]">
                      No payment receipts in {periodBounds.periodTitle.toLowerCase()}.
                    </div>
                  ) : (
                    filteredPayments.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-[#0e1724] border border-slate-200 dark:border-[#1b293a] hover:border-slate-300 dark:hover:border-[#273a50] transition-colors"
                      >
                        <div className="truncate">
                          <span className="block font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {p.customerName}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {p.invoiceNumber} • {p.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(p.amount)}
                          </span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500">{formatDate(p.date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                    Equipment & talent distribution for {periodBounds.periodTitle}
                  </p>
                  <ServiceDistributionChart data={serviceDistributionData} />
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1a2738] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">
                {activityTab === 'payments' ? 'Total collected in period' : 'Based on period contracts'}
              </span>
              <span className="text-[11px] font-mono text-slate-900 dark:text-white font-bold">
                {activityTab === 'payments' ? formatCurrency(revenueInPeriod, true) : `${filteredEvents.length} Events`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
