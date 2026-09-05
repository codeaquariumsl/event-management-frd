'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Printer,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { InvoiceModal } from '@/components/ui/InvoiceModal';
import { RecordPaymentModal } from '@/features/events/RecordPaymentModal';
import { paymentService } from '@/lib/api/paymentService';
import { eventService } from '@/lib/api/eventService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerPayment, EventItem } from '@/lib/types';

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedInvoiceEvent, setSelectedInvoiceEvent] = useState<EventItem | null>(null);
  const [selectedPaymentEvent, setSelectedPaymentEvent] = useState<EventItem | null>(null);

  const loadData = async () => {
    try {
      const [pays, evts] = await Promise.all([
        paymentService.getCustomerPayments(),
        eventService.getEvents(),
      ]);
      if (Array.isArray(pays)) setPayments(pays);
      if (Array.isArray(evts)) setEvents(evts);
    } catch {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = events.reduce((sum, e) => sum + e.balance, 0);
  const collectionRate =
    totalCollected + totalOutstanding > 0
      ? Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100)
      : 100;

  const columns: Column<CustomerPayment>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      className: 'w-32 font-mono font-bold text-slate-900 dark:text-white',
    },
    {
      key: 'eventName',
      header: 'Event & Customer',
      sortable: true,
      className: 'max-w-[260px]',
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white block truncate">{p.eventName}</span>
          <span className="text-[11px] text-slate-400 block truncate">{p.customerName}</span>
        </div>
      ),
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
      sortable: true,
      className: 'w-32 text-slate-300',
    },
    {
      key: 'referenceNumber',
      header: 'Reference #',
      className: 'w-36 font-mono text-[11px] text-slate-400',
      render: (p) => p.referenceNumber || '—',
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      sortable: true,
      className: 'text-right font-mono font-bold text-emerald-400 w-32',
      render: (p) => `+ ${formatCurrency(p.amount)}`,
    },
    {
      key: 'eventBalance',
      header: 'Remaining Balance',
      sortable: true,
      className: 'text-right font-mono text-amber-300 w-32',
      render: (p) => formatCurrency(p.eventBalance),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Customer Invoices & Payments"
          subtitle="Record client payments, track outstanding invoice balances, and generate tax receipts"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Customer Payments' }]}
          actions={
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const ev = events.find((item) => item.id === e.target.value);
                  if (ev) setSelectedPaymentEvent(ev);
                }}
                defaultValue=""
                className="rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="" disabled>
                  + Select Event to Pay...
                </option>
                {events
                  .filter((e) => e.balance > 0)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (Due: {formatCurrency(e.balance)})
                    </option>
                  ))}
              </select>
            </div>
          }
        />

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <StatCard
            compact
            title="Revenue Collected"
            value={formatCurrency(totalCollected, true)}
            change={`${payments.length} transactions`}
            trend="up"
            icon={DollarSign}
            accentColor="emerald"
          />
          <StatCard
            compact
            title="Outstanding Receivables"
            value={formatCurrency(totalOutstanding, true)}
            change={`${events.filter((e) => e.balance > 0).length} events with due`}
            trend="down"
            icon={CreditCard}
            accentColor="amber"
          />
          <StatCard
            compact
            title="Collection Rate"
            value={`${collectionRate}%`}
            change="Settled"
            trend="up"
            icon={TrendingUp}
            accentColor="teal"
          />
        </div>

        <DataTable
          data={payments}
          columns={columns}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Search invoices by number, client, or event name..."
          exportFileName="seekers_customer_payments"
          actions={(p) => {
            const ev = events.find((e) => e.id === p.eventId);
            return (
              <div className="flex items-center justify-end gap-1">
                {ev && (
                  <button
                    onClick={() => setSelectedInvoiceEvent(ev)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Print Tax Invoice"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceEvent && (
        <InvoiceModal
          isOpen={!!selectedInvoiceEvent}
          onClose={() => setSelectedInvoiceEvent(null)}
          event={selectedInvoiceEvent}
          onAddPayment={() => {
            setSelectedPaymentEvent(selectedInvoiceEvent);
            setSelectedInvoiceEvent(null);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {selectedPaymentEvent && (
        <RecordPaymentModal
          isOpen={!!selectedPaymentEvent}
          onClose={() => setSelectedPaymentEvent(null)}
          event={selectedPaymentEvent}
          onPaymentRecorded={loadData}
        />
      )}
    </AppShell>
  );
}
