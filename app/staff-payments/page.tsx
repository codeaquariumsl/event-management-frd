'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  WalletCards,
  Plus,
  Filter,
  DollarSign,
  Calendar,
  Building,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { StaffPaymentModal } from '@/features/staff/StaffPaymentModal';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StaffPayment, StaffPayrollSummary, PaymentType } from '@/lib/types';

export default function StaffPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payroll'>('payroll');
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<StaffPayrollSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = () => {
    setPayments(mockStore.getStaffPayments());
    setPayrollSummary(mockStore.getPayrollSummary(selectedMonth));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, [selectedMonth]);

  // Aggregate stats
  const totalBaseSalary = payrollSummary.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalEventPay = payrollSummary.reduce((sum, p) => sum + p.eventPayments, 0);
  const totalNetPay = payrollSummary.reduce((sum, p) => sum + p.netPay, 0);
  const totalPaid = payrollSummary.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalOutstanding = payrollSummary.reduce((sum, p) => sum + p.balance, 0);

  // Transactions columns
  const transactionColumns: Column<StaffPayment>[] = [
    {
      key: 'id',
      header: 'Payment ID',
      sortable: true,
      className: 'w-24 font-mono text-[11px] text-slate-400',
    },
    {
      key: 'staffName',
      header: 'Staff Member',
      sortable: true,
      className: 'font-semibold text-white',
    },
    {
      key: 'paymentType',
      header: 'Payment Type',
      sortable: true,
      className: 'w-32',
      render: (p) => (
        <span className="rounded bg-[#172332] px-2 py-0.5 text-xs text-slate-300 font-medium">
          {p.paymentType}
        </span>
      ),
    },
    {
      key: 'eventName',
      header: 'Linked Event / Purpose',
      className: 'max-w-[220px] truncate text-slate-400',
      render: (p) => p.eventName || p.notes || '—',
    },
    {
      key: 'date',
      header: 'Payment Date',
      sortable: true,
      className: 'w-28 text-slate-300',
      render: (p) => formatDate(p.date),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      className: 'w-28 text-slate-400',
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      sortable: true,
      className: 'text-right font-mono font-bold text-emerald-400 w-28',
      render: (p) => formatCurrency(p.amount),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
  ];

  // Payroll columns
  const payrollColumns: Column<StaffPayrollSummary>[] = [
    {
      key: 'staffName',
      header: 'Staff Name & Role',
      sortable: true,
      className: 'font-semibold text-white',
      render: (p) => (
        <div>
          <span className="text-white font-bold block">{p.staffName}</span>
          <span className="text-[11px] text-[#00e5c9]">{p.role} • {p.employmentType}</span>
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      sortable: true,
      className: 'text-right font-mono text-slate-300',
      render: (p) => formatCurrency(p.basicSalary),
    },
    {
      key: 'eventPayments',
      header: 'Event Payouts',
      sortable: true,
      className: 'text-right font-mono text-slate-300',
      render: (p) => formatCurrency(p.eventPayments),
    },
    {
      key: 'overtime',
      header: 'Overtime',
      className: 'text-right font-mono text-slate-400',
      render: (p) => (p.overtime > 0 ? formatCurrency(p.overtime) : '—'),
    },
    {
      key: 'bonus',
      header: 'Bonus',
      className: 'text-right font-mono text-emerald-400',
      render: (p) => (p.bonus > 0 ? `+ ${formatCurrency(p.bonus)}` : '—'),
    },
    {
      key: 'netPay',
      header: 'Net Payable',
      sortable: true,
      className: 'text-right font-mono font-bold text-white',
      render: (p) => formatCurrency(p.netPay),
    },
    {
      key: 'paidAmount',
      header: 'Paid to Date',
      sortable: true,
      className: 'text-right font-mono text-emerald-400 font-semibold',
      render: (p) => formatCurrency(p.paidAmount),
    },
    {
      key: 'balance',
      header: 'Outstanding Balance',
      sortable: true,
      className: 'text-right font-mono font-bold text-amber-300',
      render: (p) => formatCurrency(p.balance),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center w-24',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Staff Payments & Monthly Payroll"
          subtitle="Manage talent compensation, event-based payouts, monthly base salaries, and payroll deductions"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Staff Payments' }]}
          actions={
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Record Payout</span>
            </button>
          }
        />

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Monthly Net Pay"
            value={formatCurrency(totalNetPay)}
            change={`${selectedMonth} payroll`}
            trend="neutral"
            icon={DollarSign}
            accentColor="teal"
          />
          <StatCard
            title="Base Salaries"
            value={formatCurrency(totalBaseSalary)}
            change="Full-time roster"
            trend="neutral"
            icon={Building}
            accentColor="purple"
          />
          <StatCard
            title="Event Gig Payouts"
            value={formatCurrency(totalEventPay)}
            change="Per-show bookings"
            trend="neutral"
            icon={WalletCards}
            accentColor="blue"
          />
          <StatCard
            title="Outstanding Payroll Balance"
            value={formatCurrency(totalOutstanding)}
            change="Due to staff"
            trend={totalOutstanding > 0 ? 'down' : 'up'}
            icon={Calendar}
            accentColor="amber"
          />
        </div>

        {/* View Switcher Tabs & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2a3b] pb-3">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'payroll'
                  ? 'border-[#00e5c9] text-[#00e5c9]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Monthly Salary & Payroll Summary
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-[#00e5c9] text-[#00e5c9]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Payment Transactions ({payments.length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Payroll Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-[#233549] bg-[#111c29] px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Tab 1: Payroll Summary */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <strong className="text-white">Payroll Calculation Formula:</strong>{' '}
                <span className="font-mono text-[#00e5c9]">
                  Basic Salary + Event Payments + Overtime + Bonus - Deductions - Advance = Net Pay
                </span>
              </div>
            </div>

            <DataTable
              data={payrollSummary}
              columns={payrollColumns}
              keyExtractor={(p) => p.staffId}
              searchPlaceholder="Search by staff name or role..."
              exportFileName={`seekers_payroll_${selectedMonth}`}
            />
          </div>
        )}

        {/* Tab 2: Transactions Log */}
        {activeTab === 'transactions' && (
          <DataTable
            data={payments}
            columns={transactionColumns}
            keyExtractor={(p) => p.id}
            searchPlaceholder="Search transactions by staff name, event, or reference..."
            exportFileName="seekers_staff_payments"
          />
        )}
      </div>

      {/* Record Payment Modal */}
      <StaffPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={loadData}
      />
    </AppShell>
  );
}
