'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { eventService } from '@/lib/api/eventService';
import { staffService } from '@/lib/api/staffService';
import { customerService } from '@/lib/api/customerService';
import { paymentService } from '@/lib/api/paymentService';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { formatCurrency } from '@/lib/utils';
import { EventItem, Staff, Customer, CustomerPayment, StaffPayment, EventTypeItem } from '@/lib/types';

export default function ReportsPage() {
  const [reportCategory, setReportCategory] = useState<'financial' | 'events' | 'staff' | 'customers'>('financial');
  const [dateRange, setDateRange] = useState('All Time');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);

  useEffect(() => {
    Promise.all([
      eventService.getEvents(),
      staffService.getStaff(),
      customerService.getCustomers(),
      paymentService.getCustomerPayments(),
      paymentService.getStaffPayments(),
      eventTypeService.getEventTypes(),
    ]).then(([evts, stf, custs, cpays, spays, types]) => {
      if (Array.isArray(evts)) setEvents(evts);
      if (Array.isArray(stf)) setStaff(stf);
      if (Array.isArray(custs)) setCustomers(custs);
      if (Array.isArray(cpays)) setCustomerPayments(cpays);
      if (Array.isArray(spays)) setStaffPayments(spays);
      if (Array.isArray(types)) setEventTypes(types);
    }).catch((err) => {
      console.warn('Error loading reports data:', err);
    });
  }, []);

  // Filter records by selected date range
  const isWithinRange = (dateStr?: string) => {
    if (!dateStr || dateRange === 'All Time') return true;
    const d = new Date(dateStr);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (dateRange === 'This Month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (dateRange === 'Last Month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    }
    if (dateRange === 'This Quarter') {
      const currentQuarter = Math.floor(currentMonth / 3);
      const dateQuarter = Math.floor(d.getMonth() / 3);
      return d.getFullYear() === currentYear && dateQuarter === currentQuarter;
    }
    if (dateRange === 'Year to Date') {
      return d.getFullYear() === currentYear;
    }
    return true;
  };

  const filteredEvents = React.useMemo(() => events.filter((e) => isWithinRange(e.eventDate)), [events, dateRange]);
  const filteredCustomerPayments = React.useMemo(() => customerPayments.filter((p) => isWithinRange(p.date)), [customerPayments, dateRange]);
  const filteredStaffPayments = React.useMemo(() => staffPayments.filter((sp) => isWithinRange(sp.date)), [staffPayments, dateRange]);

  const totalRevenue = filteredEvents.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const totalCollections = filteredCustomerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalStaffPaid = filteredStaffPayments.reduce((sum, sp) => sum + (sp.amount || 0), 0);
  const totalOutstandingClients = filteredEvents.reduce((sum, e) => sum + (e.balance || 0), 0);
  const estimatedGrossProfit = totalRevenue - totalStaffPaid;
  const completedEventsCount = filteredEvents.filter((e) => e.status === 'Completed').length;
  const completionRate = filteredEvents.length > 0 ? Math.round((completedEventsCount / filteredEvents.length) * 100) : 0;

  // Real Service Category Breakdown from actual database events
  const serviceCategoryBreakdown = React.useMemo(() => {
    const categoryMap: Record<string, number> = {};
    filteredEvents.forEach((evt) => {
      (evt.services || []).forEach((srv) => {
        const cat = srv.category || srv.name || 'General Production';
        categoryMap[cat] = (categoryMap[cat] || 0) + (srv.totalPrice || ((srv.unitPrice || 0) * (srv.quantity || 1)) || 0);
      });
    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredEvents]);

  // Real Active Event Types from database
  const activeEventTypes = React.useMemo(() => {
    const typesFromDB = eventTypes.map((t) => t.name);
    const typesFromEvents = events.map((e) => e.eventType).filter(Boolean);
    const unique = Array.from(new Set([...typesFromDB, ...typesFromEvents]));
    return unique.length > 0 ? unique : ['Club / Concert', 'Corporate', 'Wedding & Reception'];
  }, [eventTypes, events]);

  // Dynamic Staff Performance & Payroll Calculation respecting dateRange
  const staffPerformanceData = React.useMemo(() => {
    return staff.map((member) => {
      // Filter events assigned to this member in selected date range
      const memberEvents = filteredEvents.filter((e) =>
        Array.isArray(e.assignedStaff) && e.assignedStaff.some((as) => as.staffId === member.id)
      );

      const assignedCount = memberEvents.length;
      const completedCount = memberEvents.filter((e) => e.status === 'Completed').length;

      // Event earnings for the selected period
      const eventEarnings = memberEvents.reduce((acc, evt) => {
        const as = evt.assignedStaff.find((a) => a.staffId === member.id);
        return acc + (Number(as?.paymentAmount) || 0);
      }, 0);

      // Direct payments recorded on event assignments
      const eventDirectPaid = memberEvents.reduce((acc, evt) => {
        const as = evt.assignedStaff.find((a) => a.staffId === member.id);
        return acc + (Number(as?.paidAmount) || 0);
      }, 0);

      // Disbursements recorded in staff payments within date range
      const memberPayments = filteredStaffPayments.filter((p) => p.staffId === member.id);
      const paymentDisbursements = memberPayments.reduce((acc, p) => acc + (Number(p.paidAmount) || Number(p.amount) || 0), 0);

      const totalPaid = Math.max(paymentDisbursements, eventDirectPaid);
      const totalEarnings = eventEarnings;
      const pendingPay = Math.max(0, totalEarnings - totalPaid);

      const payoutStatus =
        totalEarnings === 0
          ? 'No Assignments'
          : pendingPay === 0
          ? 'Paid'
          : totalPaid > 0
          ? 'Partial'
          : 'Pending';

      return {
        ...member,
        assignedCount,
        completedCount,
        totalEarnings,
        totalPaid,
        pendingPay,
        payoutStatus,
      };
    });
  }, [staff, filteredEvents, filteredStaffPayments]);

  const totalStaffAssignedCount = staffPerformanceData.filter((s) => s.assignedCount > 0).length;
  const totalStaffEarnings = staffPerformanceData.reduce((sum, s) => sum + s.totalEarnings, 0);
  const totalStaffDisbursed = staffPerformanceData.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalStaffPendingPay = staffPerformanceData.reduce((sum, s) => sum + s.pendingPay, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `seekers_report_${reportCategory}`;

    if (reportCategory === 'financial') {
      rows = [
        ['Metric', 'Amount (LKR)'],
        ['Total Booked Revenue', totalRevenue.toString()],
        ['Total Client Collections', totalCollections.toString()],
        ['Total Staff Disbursements', totalStaffPaid.toString()],
        ['Estimated Gross Profit', estimatedGrossProfit.toString()],
        ['Outstanding Client Receivables', totalOutstandingClients.toString()],
      ];
    } else if (reportCategory === 'events') {
      rows = [
        ['Event ID', 'Event Name', 'Customer', 'Date', 'Type', 'Total Amount', 'Status'],
        ...filteredEvents.map((e) => [e.id, e.name, e.customerName, e.eventDate, e.eventType, e.totalAmount.toString(), e.status]),
      ];
    } else if (reportCategory === 'staff') {
      rows = [
        ['Staff ID', 'Name', 'Role', 'Employment Type', 'Assigned Events', 'Completed Events', 'Total Earnings (LKR)', 'Paid Out (LKR)', 'Pending Pay (LKR)', 'Status'],
        ...staffPerformanceData.map((s) => [
          s.id,
          s.name,
          s.role,
          s.employmentType,
          s.assignedCount.toString(),
          s.completedCount.toString(),
          s.totalEarnings.toString(),
          s.totalPaid.toString(),
          s.pendingPay.toString(),
          s.payoutStatus,
        ]),
      ];
    } else {
      rows = [
        ['Customer ID', 'Name', 'Company', 'Type', 'Total Events', 'Total Revenue', 'Outstanding'],
        ...customers.map((c) => [c.id, c.name, c.company || '', c.customerType, c.totalEvents.toString(), c.totalRevenue.toString(), c.outstandingBalance.toString()]),
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Executive Business Reports & Analytics"
          subtitle="Financial statements, production utilization, staff performance, and revenue trends"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]}
          actions={
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="All Time">All Time</option>
                <option value="This Month">This Month ({new Date().toLocaleString('default', { month: 'short', year: 'numeric' })})</option>
                <option value="Last Month">Last Month</option>
                <option value="This Quarter">This Quarter (Q{Math.floor(new Date().getMonth() / 3) + 1})</option>
                <option value="Year to Date">Year to Date ({new Date().getFullYear()})</option>
              </select>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#182637] transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-3.5 py-2 text-xs font-bold text-white dark:text-black hover:bg-[#008f7e] dark:hover:bg-[#1affda]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          }
        />

        {/* Report Category Switcher */}
        <div className="border-b border-slate-200 dark:border-[#1c2a3b] flex items-center gap-2 text-xs font-semibold">
          {[
            { id: 'financial', label: 'Financial & Profitability' },
            { id: 'events', label: 'Event Operations & Types' },
            { id: 'staff', label: 'Staff Performance & Payroll' },
            { id: 'customers', label: 'Client Revenue & Receivables' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportCategory(tab.id as any)}
              className={`pb-3 px-3 border-b-2 transition-colors ${
                reportCategory === tab.id
                  ? 'border-[#00897b] dark:border-[#00e5c9] text-[#00897b] dark:text-[#00e5c9]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* REPORT 1: FINANCIAL & PROFITABILITY */}
        {reportCategory === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <StatCard
                compact
                title="Gross Invoiced"
                value={formatCurrency(totalRevenue, true)}
                change={dateRange}
                trend="up"
                icon={DollarSign}
                accentColor="teal"
              />
              <StatCard
                compact
                title="Cash Collected"
                value={formatCurrency(totalCollections, true)}
                change="Bank receipts"
                trend="up"
                icon={TrendingUp}
                accentColor="emerald"
              />
              <StatCard
                compact
                title="Crew & Gear Payouts"
                value={formatCurrency(totalStaffPaid, true)}
                change="Disbursements"
                trend="neutral"
                icon={Users}
                accentColor="blue"
              />
              <StatCard
                compact
                title="Outstanding Due"
                value={formatCurrency(totalOutstandingClients, true)}
                change="Receivables"
                trend="down"
                icon={PieChart}
                accentColor="amber"
              />
            </div>

            {/* Income Statement Breakdown */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 text-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Production Operating Income Summary ({dateRange})
              </h2>
              <div className="divide-y divide-[#182535]">
                <div className="py-3 flex justify-between text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Event Production Gross Revenue</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</span>
                </div>
                {serviceCategoryBreakdown.length > 0 ? (
                  serviceCategoryBreakdown.map((item) => (
                    <div key={item.category} className="py-3 flex justify-between text-slate-400 pl-4">
                      <span>- {item.category} Production</span>
                      <span className="font-mono font-medium text-slate-200">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-3 flex justify-between text-slate-500 pl-4 italic">
                    <span>- Production Services</span>
                    <span className="font-mono">LKR 0</span>
                  </div>
                )}
                <div className="py-3 flex justify-between text-rose-400">
                  <span className="font-semibold">Cost of Production (Crew & Logistics)</span>
                  <span className="font-mono font-bold">- {formatCurrency(totalStaffPaid)}</span>
                </div>
                <div className="py-4 flex justify-between text-base font-extrabold text-[#00e5c9] pt-4">
                  <span>Estimated Net Production Margin</span>
                  <span className="font-mono">{formatCurrency(estimatedGrossProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 2: EVENT OPERATIONS */}
        {reportCategory === 'events' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <StatCard
                compact
                title="Total Events"
                value={filteredEvents.length}
                change={dateRange}
                trend="neutral"
                icon={CalendarDays}
                accentColor="teal"
              />
              <StatCard
                compact
                title="Avg Contract Value"
                value={formatCurrency(Math.round(totalRevenue / (filteredEvents.length || 1)), true)}
                change="Per production"
                trend="up"
                icon={DollarSign}
                accentColor="purple"
              />
              <StatCard
                compact
                title="Completion Rate"
                value={`${completionRate}%`}
                change={`${completedEventsCount} completed`}
                trend="up"
                icon={TrendingUp}
                accentColor="emerald"
              />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Events Breakdown by Category</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3 text-center">Count</th>
                      <th className="py-2.5 px-3 text-right">Revenue (LKR)</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {activeEventTypes.map((type) => {
                      const typeEvts = filteredEvents.filter((e) => e.eventType === type);
                      const typeRev = typeEvts.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
                      const share = totalRevenue > 0 ? Math.round((typeRev / totalRevenue) * 100) : 0;
                      return (
                        <tr key={type} className="hover:bg-slate-50 dark:hover:bg-[#101824]">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{type}</td>
                          <td className="py-3 px-3 text-center text-slate-300">{typeEvts.length}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(typeRev)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#00e5c9]">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 3: STAFF */}
        {reportCategory === 'staff' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <StatCard
                compact
                title="Active Crew Assigned"
                value={`${totalStaffAssignedCount} of ${staff.length}`}
                change={`${dateRange}`}
                trend="neutral"
                icon={Users}
                accentColor="teal"
              />
              <StatCard
                compact
                title="Crew Payroll Incurred"
                value={formatCurrency(totalStaffEarnings, true)}
                change="Production fees"
                trend="up"
                icon={DollarSign}
                accentColor="purple"
              />
              <StatCard
                compact
                title="Disbursed to Staff"
                value={formatCurrency(totalStaffDisbursed, true)}
                change="Paid out"
                trend="up"
                icon={TrendingUp}
                accentColor="emerald"
              />
              <StatCard
                compact
                title="Pending Payouts"
                value={formatCurrency(totalStaffPendingPay, true)}
                change="Outstanding fee"
                trend={totalStaffPendingPay > 0 ? 'down' : 'neutral'}
                icon={PieChart}
                accentColor="amber"
              />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Staff Utilization & Payout Audit ({dateRange})
                </h2>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Showing {staffPerformanceData.length} crew members
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Staff Member</th>
                      <th className="py-2.5 px-3">Role & Type</th>
                      <th className="py-2.5 px-3 text-center">Assigned Events</th>
                      <th className="py-2.5 px-3 text-right">Total Earnings</th>
                      <th className="py-2.5 px-3 text-right">Paid Out</th>
                      <th className="py-2.5 px-3 text-right">Pending Pay</th>
                      <th className="py-2.5 px-3 text-center">Payout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {staffPerformanceData.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#101824]">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#7c5cff] to-[#00e5c9] text-[11px] font-bold text-white">
                              {s.avatar || s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">{s.name}</span>
                              <span className="text-[10px] text-slate-400 block">{s.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">{s.role}</span>
                          <span className="text-[10px] text-slate-400 block">{s.employmentType}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          <span>{s.assignedCount}</span>
                          {s.assignedCount > 0 && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({s.completedCount} done)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(s.totalEarnings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(s.totalPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {formatCurrency(s.pendingPay)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.payoutStatus === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : s.payoutStatus === 'Partial'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : s.payoutStatus === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {s.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 4: CUSTOMERS */}
        {reportCategory === 'customers' && (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Top Clients by Revenue</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Client / Organization</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-center">Events</th>
                      <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                      <th className="py-2.5 px-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{c.customerType}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-800 dark:text-white">{c.totalEvents}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(c.totalRevenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {formatCurrency(c.outstandingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
