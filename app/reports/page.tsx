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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { eventService } from '@/lib/api/eventService';
import { staffService } from '@/lib/api/staffService';
import { customerService } from '@/lib/api/customerService';
import { paymentService } from '@/lib/api/paymentService';
import { formatCurrency } from '@/lib/utils';
import { EventItem, Staff, Customer, CustomerPayment, StaffPayment } from '@/lib/types';

export default function ReportsPage() {
  const [reportCategory, setReportCategory] = useState<'financial' | 'events' | 'staff' | 'customers'>('financial');
  const [dateRange, setDateRange] = useState('This Quarter');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>([]);

  useEffect(() => {
    Promise.all([
      eventService.getEvents(),
      staffService.getStaff(),
      customerService.getCustomers(),
      paymentService.getCustomerPayments(),
      paymentService.getStaffPayments(),
    ]).then(([evts, stf, custs, cpays, spays]) => {
      if (Array.isArray(evts)) setEvents(evts);
      if (Array.isArray(stf)) setStaff(stf);
      if (Array.isArray(custs)) setCustomers(custs);
      if (Array.isArray(cpays)) setCustomerPayments(cpays);
      if (Array.isArray(spays)) setStaffPayments(spays);
    }).catch((err) => {
      console.warn('Error loading reports data:', err);
    });
  }, []);

  const totalRevenue = events.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalCollections = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalStaffPaid = staffPayments.reduce((sum, sp) => sum + sp.amount, 0);
  const totalOutstandingClients = events.reduce((sum, e) => sum + e.balance, 0);
  const estimatedGrossProfit = totalRevenue - totalStaffPaid;

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
        ...events.map((e) => [e.id, e.name, e.customerName, e.eventDate, e.eventType, e.totalAmount.toString(), e.status]),
      ];
    } else if (reportCategory === 'staff') {
      rows = [
        ['Staff ID', 'Name', 'Role', 'Employment Type', 'Events Assigned', 'Total Earnings', 'Pending Pay'],
        ...staff.map((s) => [s.id, s.name, s.role, s.employmentType, s.totalEventsAssigned.toString(), s.totalEarnings.toString(), s.pendingPayments.toString()]),
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
      <div className="space-y-6">
        <PageHeader
          title="Executive Business Reports & Analytics"
          subtitle="Financial statements, production utilization, staff performance, and revenue trends"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]}
          actions={
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-[#233549] bg-[#111c29] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="This Month">This Month (Sep 2026)</option>
                <option value="Last Month">Last Month (Aug 2026)</option>
                <option value="This Quarter">This Quarter (Q3 2026)</option>
                <option value="Year to Date">Year to Date (2026)</option>
              </select>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#233549] bg-[#14202e] px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#1affda]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          }
        />

        {/* Report Category Switcher */}
        <div className="border-b border-[#1c2a3b] flex items-center gap-2 text-xs font-semibold">
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
                  ? 'border-[#00e5c9] text-[#00e5c9]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* REPORT 1: FINANCIAL & PROFITABILITY */}
        {reportCategory === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Gross Invoiced Revenue"
                value={formatCurrency(totalRevenue)}
                change={dateRange}
                trend="up"
                icon={DollarSign}
                accentColor="teal"
              />
              <StatCard
                title="Cash Collected"
                value={formatCurrency(totalCollections)}
                change="Cleared bank receipts"
                trend="up"
                icon={TrendingUp}
                accentColor="emerald"
              />
              <StatCard
                title="Crew & Gear Disbursements"
                value={formatCurrency(totalStaffPaid)}
                change="Staff payroll"
                trend="neutral"
                icon={Users}
                accentColor="blue"
              />
              <StatCard
                title="Outstanding Receivables"
                value={formatCurrency(totalOutstandingClients)}
                change="Pending collections"
                trend="down"
                icon={PieChart}
                accentColor="amber"
              />
            </div>

            {/* Income Statement Breakdown */}
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Production Operating Income Summary ({dateRange})
              </h2>
              <div className="divide-y divide-[#182535]">
                <div className="py-3 flex justify-between text-slate-200">
                  <span className="font-semibold text-white">Event Production Gross Revenue</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="py-3 flex justify-between text-slate-400 pl-4">
                  <span>- DJ & MC Performance Allocations</span>
                  <span className="font-mono">LKR 480,000</span>
                </div>
                <div className="py-3 flex justify-between text-slate-400 pl-4">
                  <span>- Concert Sound System Rentals</span>
                  <span className="font-mono">LKR 840,000</span>
                </div>
                <div className="py-3 flex justify-between text-slate-400 pl-4">
                  <span>- Intelligent Lighting Rigs</span>
                  <span className="font-mono">LKR 595,000</span>
                </div>
                <div className="py-3 flex justify-between text-slate-400 pl-4">
                  <span>- P2.6 High Definition LED Walls</span>
                  <span className="font-mono">LKR 560,000</span>
                </div>
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
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4">
                <span className="text-slate-400 block text-[11px]">Total Events</span>
                <strong className="text-2xl font-bold text-white block mt-1">{events.length}</strong>
              </div>
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4">
                <span className="text-slate-400 block text-[11px]">Average Contract Value</span>
                <strong className="text-2xl font-bold text-[#00e5c9] font-mono block mt-1">
                  {formatCurrency(Math.round(totalRevenue / (events.length || 1)))}
                </strong>
              </div>
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4">
                <span className="text-slate-400 block text-[11px]">Completion Rate</span>
                <strong className="text-2xl font-bold text-emerald-400 block mt-1">92.8%</strong>
              </div>
            </div>

            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Events Breakdown by Category</h2>
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
                    {['Wedding', 'Corporate', 'Club / Concert', 'Festival'].map((type) => {
                      const typeEvts = events.filter((e) => e.eventType === type);
                      const typeRev = typeEvts.reduce((sum, e) => sum + e.totalAmount, 0);
                      const share = totalRevenue > 0 ? Math.round((typeRev / totalRevenue) * 100) : 0;
                      return (
                        <tr key={type} className="hover:bg-[#101824]">
                          <td className="py-3 px-3 font-semibold text-white">{type}</td>
                          <td className="py-3 px-3 text-center text-slate-300">{typeEvts.length}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
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
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Staff Utilization & Payout Audit</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Staff Member</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-center">Assigned Events</th>
                      <th className="py-2.5 px-3 text-right">Total Earnings</th>
                      <th className="py-2.5 px-3 text-right">Pending Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-white">{s.name}</td>
                        <td className="py-3 px-3 text-slate-300">{s.role}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white">
                          {s.totalEventsAssigned}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(s.totalEarnings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {formatCurrency(s.pendingPayments)}
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
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Clients by Revenue</h2>
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
                      <tr key={c.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-white">
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{c.customerType}</td>
                        <td className="py-3 px-3 text-center font-mono text-white">{c.totalEvents}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
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
