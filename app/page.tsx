'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MonthlyRevenueChart,
  EventStatusChart,
  ServiceDistributionChart,
} from '@/components/ui/Charts';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { paymentService } from '@/lib/api/paymentService';
import { staffService } from '@/lib/api/staffService';
import { reportService } from '@/lib/api/reportService';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EventItem, CustomerPayment, Staff } from '@/lib/types';
import { ServiceDistributionItem } from '@/components/ui/Charts';
import { useAuth } from '@/lib/auth/AuthContext';

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

  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => e.status === 'Confirmed' || e.status === 'Pending' || e.status === 'In Progress'
  );
  const displayedUpcomingEvents = React.useMemo(() => {
    if (tableFilter === 'All') return upcomingEvents;
    return upcomingEvents.filter((e) => e.status === tableFilter);
  }, [upcomingEvents, tableFilter]);
  const completedEvents = events.filter((e) => e.status === 'Completed').length;
  const activeStaff = staffList.filter((s) => s.status === 'Active').length;
  const totalCustomers = customersCount;

  const pendingCustomerPayments = events.reduce((sum, e) => sum + (e.balance || 0), 0);
  const staffPaymentsDue = staffList.reduce((sum, s) => sum + (s.pendingPayments || 0), 0);
  const monthlyRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Status breakdown for donut from real events
  const statusStats = {
    confirmed: events.filter((e) => e.status === 'Confirmed').length,
    pending: events.filter((e) => e.status === 'Pending').length,
    completed: events.filter((e) => e.status === 'Completed').length,
    inProgress: events.filter((e) => e.status === 'In Progress').length,
    cancelled: events.filter((e) => e.status === 'Cancelled').length,
  };

  // Real Monthly Revenue & Expense data computed from database events/payments
  const monthlyRevenueChartData = React.useMemo(() => {
    if (dashboardSummary?.monthlyRevenueChart && dashboardSummary.monthlyRevenueChart.length > 0) {
      return dashboardSummary.monthlyRevenueChart;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const map: Record<number, { month: string; revenue: number; expenses: number }> = {};
    monthNames.forEach((m, idx) => {
      map[idx] = { month: m, revenue: 0, expenses: 0 };
    });

    payments.forEach((p) => {
      if (p.date) {
        const d = new Date(p.date);
        if (d.getFullYear() === currentYear && map[d.getMonth()]) {
          map[d.getMonth()].revenue += (p.amount || 0);
        }
      }
    });

    events.forEach((e) => {
      if (e.eventDate) {
        const d = new Date(e.eventDate);
        if (d.getFullYear() === currentYear && map[d.getMonth()]) {
          if (payments.length === 0) {
            map[d.getMonth()].revenue += (e.totalAmount || 0);
          }
          const exp = (e.expenses || []).reduce((s, x) => s + (x.amount || 0), 0);
          const stf = (e.assignedStaff || []).reduce((s, x) => s + (x.paymentAmount || 0), 0);
          map[d.getMonth()].expenses += (exp + stf);
        }
      }
    });

    return monthNames.map((_, i) => map[i]);
  }, [dashboardSummary, payments, events]);

  // Real Service Distribution computed from database events
  const serviceDistributionData = React.useMemo<ServiceDistributionItem[]>(() => {
    if (dashboardSummary?.serviceDistribution && dashboardSummary.serviceDistribution.length > 0) {
      return dashboardSummary.serviceDistribution;
    }

    const counts: Record<string, number> = {};
    events.forEach((evt) => {
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
  }, [dashboardSummary, events]);

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        {/* Compact Executive Command Bar */}
        <div className="relative overflow-hidden rounded-xl border border-[#1f3144] bg-gradient-to-r from-[#0b1522] via-[#0f1d2d] to-[#121824] p-4 sm:p-5 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00e5c9]/30 bg-[#00e5c9]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#00e5c9]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00e5c9] animate-pulse" />
                  Live Operations Command
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {(new Date().getHours() < 12) ? 'Good Morning' : (new Date().getHours() < 18) ? 'Good Afternoon' : 'Good Evening'}, {user?.name || 'User'}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audiovisual setups, DJ bookings, technical crew assignments, client receivables, and monthly financial performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                href="/recurring-events"
                className="rounded-lg border border-[#263b50] bg-[#142232] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#1c2e42] hover:border-[#354f6b] transition-colors"
              >
                Recurring Schedules
              </Link>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-1.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-md shadow-[#00e5c9]/25 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Create Event</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 8 KPI Cards Grid - High Density Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            compact
            title="Total Events"
            value={totalEvents}
            change={`${totalEvents} total`}
            trend="up"
            icon={CalendarDays}
            accentColor="teal"
          />
          <StatCard
            compact
            title="Upcoming Productions"
            value={upcomingEvents.length}
            change={`${upcomingEvents.length} active`}
            trend="up"
            icon={Clock}
            accentColor="purple"
          />
          <StatCard
            compact
            title="Completed Events"
            value={completedEvents}
            change={`${completedEvents} finished`}
            trend="up"
            icon={TrendingUp}
            accentColor="emerald"
          />
          <StatCard
            compact
            title="Active Crew"
            value={activeStaff}
            change={`${activeStaff} members`}
            trend="neutral"
            icon={Users}
            accentColor="blue"
          />
          <StatCard
            compact
            title="Client Base"
            value={totalCustomers}
            change={`${totalCustomers} clients`}
            trend="up"
            icon={Users}
            accentColor="purple"
          />
          <StatCard
            compact
            title="Pending Receivables"
            value={formatCurrency(pendingCustomerPayments, true)}
            change={`${events.filter((e) => (e.balance || 0) > 0).length} balance due`}
            trend="down"
            icon={CreditCard}
            accentColor="amber"
          />
          <StatCard
            compact
            title="Staff Payments Due"
            value={formatCurrency(staffPaymentsDue, true)}
            change={staffPaymentsDue > 0 ? 'Pending payout' : 'Settled'}
            trend="neutral"
            icon={WalletCards}
            accentColor="blue"
          />
          <StatCard
            compact
            title="Monthly Revenue"
            value={formatCurrency(monthlyRevenue, true)}
            change={`${payments.length} collections`}
            trend="up"
            icon={CircleDollarSign}
            accentColor="teal"
          />
        </div>

        {/* Middle Row: Revenue Performance & Event Pipeline Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Revenue Chart (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2738] mb-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Monthly Revenue & Profitability
                </h2>
                <p className="text-[11px] text-slate-400">
                  Gross customer collections vs equipment & crew expenses (LKR)
                </p>
              </div>
              <span className="rounded bg-[#00e5c9]/10 px-2 py-0.5 text-xs font-bold text-[#00e5c9] border border-[#00e5c9]/20">
                FY {new Date().getFullYear()}
              </span>
            </div>
            <MonthlyRevenueChart data={monthlyRevenueChartData} />
          </div>

          {/* Event Status Donut (1 col) */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div className="pb-3 border-b border-[#1a2738] mb-2">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Event Pipeline Status
              </h2>
              <p className="text-[11px] text-slate-400">Distribution across active booking stages</p>
            </div>
            <EventStatusChart stats={statusStats} />
          </div>
        </div>

        {/* Lower Row: Upcoming Events Table & Interactive Activity Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Upcoming Events (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1a2738]">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      Upcoming Productions
                    </h2>
                    <p className="text-[11px] text-slate-400">Scheduled execution calendar</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status quick-filter tabs */}
                  <div className="flex items-center gap-1 bg-[#0b131e] p-0.5 rounded-lg border border-[#1a283a]">
                    {(['All', 'Confirmed', 'Pending'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTableFilter(filter)}
                        className={cn(
                          "px-2 py-0.5 text-[11px] font-medium rounded transition-colors",
                          tableFilter === filter
                            ? "bg-[#142334] text-[#00e5c9] font-semibold"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00e5c9] hover:underline ml-1"
                  >
                    <span>View All ({events.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1c2a3b] text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-2">Event</th>
                      <th className="py-2 px-2">Customer</th>
                      <th className="py-2 px-2">Date & Time</th>
                      <th className="py-2 px-2">Location</th>
                      <th className="py-2 px-2 text-right">Value</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {displayedUpcomingEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No {tableFilter !== 'All' ? tableFilter.toLowerCase() : ''} productions found.
                        </td>
                      </tr>
                    ) : (
                      displayedUpcomingEvents.slice(0, 5).map((evt) => (
                        <tr
                          key={evt.id}
                          onClick={() => router.push(`/events/${evt.id}`)}
                          className="hover:bg-[#111c29] cursor-pointer transition-colors group"
                        >
                          <td className="py-2 px-2 font-semibold text-white group-hover:text-[#00e5c9] truncate max-w-[180px]">
                            {evt.name}
                          </td>
                          <td className="py-2 px-2 text-slate-300 truncate max-w-[130px]">
                            {evt.customerName}
                          </td>
                          <td className="py-2 px-2 text-slate-400 whitespace-nowrap">
                            <span>{formatDate(evt.eventDate)}</span>
                            {evt.startTime && (
                              <span className="block text-[10px] text-slate-500">{evt.startTime}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-400 truncate max-w-[140px]">
                            {evt.location}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-white whitespace-nowrap">
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

            <div className="mt-3 pt-2.5 border-t border-[#1a2738] flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Need historical archives?</span>
              <Link href="/events" className="text-[11px] text-[#00e5c9] hover:underline font-medium">
                Browse Full Events Archive →
              </Link>
            </div>
          </div>

          {/* Activity Hub: Tabbed Recent Payments & Service Distribution (1 col) */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2738] mb-3">
                <div className="flex items-center gap-1 bg-[#0b131e] p-0.5 rounded-lg border border-[#1a283a]">
                  <button
                    onClick={() => setActivityTab('payments')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                      activityTab === 'payments'
                        ? "bg-[#142334] text-[#00e5c9] shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Recent Payments
                  </button>
                  <button
                    onClick={() => setActivityTab('services')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                      activityTab === 'services'
                        ? "bg-[#142334] text-[#00e5c9] shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Top Services
                  </button>
                </div>

                {activityTab === 'payments' ? (
                  <Link
                    href="/customer-payments"
                    className="text-[11px] text-[#00e5c9] hover:underline font-semibold"
                  >
                    Ledger →
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {serviceDistributionData.length} Packages
                  </span>
                )}
              </div>

              {activityTab === 'payments' ? (
                <div className="space-y-2">
                  {payments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#233549] p-4 text-center text-xs text-slate-400 bg-[#0d1624]">
                      No payment receipts recorded yet.
                    </div>
                  ) : (
                    payments.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-[#0e1724] border border-[#1b293a] hover:border-[#273a50] transition-colors"
                      >
                        <div className="truncate">
                          <span className="block font-semibold text-xs text-white truncate">
                            {p.customerName}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {p.invoiceNumber} • {p.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block font-mono font-bold text-xs text-emerald-400">
                            +{formatCurrency(p.amount)}
                          </span>
                          <span className="block text-[10px] text-slate-500">{formatDate(p.date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-slate-400 mb-2.5">Equipment & talent distribution</p>
                  <ServiceDistributionChart data={serviceDistributionData} />
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1a2738] flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                {activityTab === 'payments' ? 'Total collected this month' : 'Based on booked contracts'}
              </span>
              <span className="text-[11px] font-mono text-white font-bold">
                {activityTab === 'payments' ? formatCurrency(monthlyRevenue, true) : `${events.length} Events`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
