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
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EventItem, CustomerPayment } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [pendingStaffPay, setPendingStaffPay] = useState(0);

  useEffect(() => {
    setMounted(true);
    const load = () => {
      setEvents(mockStore.getEvents());
      setPayments(mockStore.getCustomerPayments());
      setActiveStaffCount(mockStore.getStaff().filter((s) => s.status === 'Active').length);
      setCustomersCount(mockStore.getCustomers().length);
      setPendingStaffPay(
        mockStore
          .getStaffPayments()
          .filter((sp) => sp.status === 'Pending')
          .reduce((sum, sp) => sum + sp.balance, 0)
      );
    };
    load();

    window.addEventListener('seekers_store_updated', load);
    return () => window.removeEventListener('seekers_store_updated', load);
  }, []);

  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => e.status === 'Confirmed' || e.status === 'Pending' || e.status === 'In Progress'
  );
  const completedEvents = events.filter((e) => e.status === 'Completed').length;
  const activeStaff = activeStaffCount;
  const totalCustomers = customersCount;

  const pendingCustomerPayments = events.reduce((sum, e) => sum + e.balance, 0);
  const staffPaymentsDue = pendingStaffPay;

  const monthlyRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Status breakdown for donut
  const statusStats = {
    confirmed: events.filter((e) => e.status === 'Confirmed').length,
    pending: events.filter((e) => e.status === 'Pending').length,
    completed: events.filter((e) => e.status === 'Completed').length,
    inProgress: events.filter((e) => e.status === 'In Progress').length,
    cancelled: events.filter((e) => e.status === 'Cancelled').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Executive Welcome & Action Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1f3144] bg-gradient-to-r from-[#0b1522] via-[#0f1d2d] to-[#121824] p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5c9]/30 bg-[#00e5c9]/10 px-3 py-1 text-xs font-semibold text-[#00e5c9]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Production Operations Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Seekers Entertainment Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Live monitoring for audiovisual setups, DJ bookings, technical crew assignments, client receivables, and monthly financial performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/recurring-events"
                className="rounded-lg border border-[#263b50] bg-[#142232] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-[#1c2e42] transition-colors"
              >
                Recurring Schedules
              </Link>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create Event</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 8 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={totalEvents}
            change="+14%"
            trend="up"
            icon={CalendarDays}
            accentColor="teal"
          />
          <StatCard
            title="Upcoming Productions"
            value={upcomingEvents.length}
            change="+12% from last month"
            trend="up"
            icon={Clock}
            accentColor="purple"
          />
          <StatCard
            title="Completed Events"
            value={completedEvents}
            change="+8%"
            trend="up"
            icon={TrendingUp}
            accentColor="emerald"
          />
          <StatCard
            title="Active Production Staff"
            value={activeStaff}
            change="100% operational"
            trend="neutral"
            icon={Users}
            accentColor="blue"
          />
          <StatCard
            title="Total Client Base"
            value={totalCustomers}
            change="+4 new this month"
            trend="up"
            icon={Users}
            accentColor="purple"
          />
          <StatCard
            title="Pending Client Payments"
            value={formatCurrency(pendingCustomerPayments, true)}
            change="Needs collection"
            trend="down"
            icon={CreditCard}
            accentColor="amber"
          />
          <StatCard
            title="Staff Payments Due"
            value={formatCurrency(staffPaymentsDue, true)}
            change="Payroll current"
            trend="neutral"
            icon={WalletCards}
            accentColor="blue"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(monthlyRevenue, true)}
            change="+18.4% vs target"
            trend="up"
            icon={CircleDollarSign}
            accentColor="teal"
          />
        </div>

        {/* Middle Row: Revenue Performance & Event Pipeline Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1a2738] mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Monthly Revenue & Profitability
                </h2>
                <p className="text-xs text-slate-400">
                  Gross customer collections vs equipment and production expenses (LKR)
                </p>
              </div>
              <span className="rounded bg-[#00e5c9]/10 px-2.5 py-1 text-xs font-bold text-[#00e5c9]">
                FY 2026
              </span>
            </div>
            <MonthlyRevenueChart />
          </div>

          {/* Event Status Donut (1 col) */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm">
            <div className="pb-4 border-b border-[#1a2738] mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Event Pipeline Status
              </h2>
              <p className="text-xs text-slate-400">Distribution across current booking stages</p>
            </div>
            <EventStatusChart stats={statusStats} />
          </div>
        </div>

        {/* Lower Row: Upcoming Events Table & Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1a2738]">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Upcoming Production Schedule
                  </h2>
                  <p className="text-xs text-slate-400">Next scheduled events requiring technical execution</p>
                </div>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00e5c9] hover:underline"
                >
                  <span>View All ({events.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1c2a3b] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-2">Event</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Date & Time</th>
                      <th className="py-2.5 px-2">Location</th>
                      <th className="py-2.5 px-2 text-right">Value</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {upcomingEvents.slice(0, 5).map((evt) => (
                      <tr
                        key={evt.id}
                        onClick={() => router.push(`/events/${evt.id}`)}
                        className="hover:bg-[#111c29] cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-2 font-semibold text-white group-hover:text-[#00e5c9] truncate max-w-[200px]">
                          {evt.name}
                        </td>
                        <td className="py-3 px-2 text-slate-300 truncate max-w-[140px]">
                          {evt.customerName}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {formatDate(evt.eventDate)}
                          <span className="block text-[10px] text-slate-500">{evt.startTime}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 truncate max-w-[150px]">
                          {evt.location}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-semibold text-white">
                          {formatCurrency(evt.totalAmount)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <StatusBadge status={evt.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1a2738] flex items-center justify-between text-xs text-slate-400">
              <span>Looking for past productions?</span>
              <Link href="/events" className="text-[#00e5c9] hover:underline font-medium">
                Browse Full Events Archive →
              </Link>
            </div>
          </div>

          {/* Recent Payments & Service Distribution (1 col) */}
          <div className="space-y-6">
            {/* Recent Payments Card */}
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2738] mb-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Payments
                </h2>
                <Link
                  href="/customer-payments"
                  className="text-xs text-[#00e5c9] hover:underline font-semibold"
                >
                  Ledger →
                </Link>
              </div>

              <div className="space-y-3">
                {payments.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0e1724] border border-[#1b293a]"
                  >
                    <div className="truncate">
                      <span className="block font-semibold text-xs text-white truncate">
                        {p.customerName}
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate">
                        {p.invoiceNumber} • {p.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono font-bold text-xs text-emerald-400">
                        + {formatCurrency(p.amount)}
                      </span>
                      <span className="block text-[10px] text-slate-500">{formatDate(p.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Popularity Breakdown */}
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Service Distribution
              </h2>
              <p className="text-xs text-slate-400 mb-4">Most requested equipment & talent packages</p>
              <ServiceDistributionChart />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
