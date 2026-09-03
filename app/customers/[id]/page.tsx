'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Plus,
  Receipt,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomerModal } from '@/features/customers/CustomerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { customerService } from '@/lib/api/customerService';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer, EventItem, CustomerPayment } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      const found = await customerService.getCustomerById(resolvedParams.id);
      if (found) {
        setCustomer({ ...found });
        const clientEvents = mockStore.getEvents().filter((e) => e.customerId === found.id);
        setEvents(clientEvents);

        const clientPayments = mockStore.getCustomerPayments().filter((p) => p.customerId === found.id);
        setPayments(clientPayments);
        return;
      }
    } catch {
      // Fallback
    }

    const fallback = mockStore.getCustomerById(resolvedParams.id);
    if (fallback) {
      setCustomer({ ...fallback });
      const clientEvents = mockStore.getEvents().filter((e) => e.customerId === fallback.id);
      setEvents(clientEvents);

      const clientPayments = mockStore.getCustomerPayments().filter((p) => p.customerId === fallback.id);
      setPayments(clientPayments);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('seekers_store_updated', handleUpdate);
    return () => window.removeEventListener('seekers_store_updated', handleUpdate);
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!customer) return;
    try {
      await customerService.deleteCustomer(customer.id);
      showToast(`Customer ${customer.name} deleted`, 'success');
      router.push('/customers');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  if (!customer) {
    return (
      <AppShell>
        <div className="py-20 text-center text-xs text-slate-400">
          <p className="text-base font-semibold text-white">Customer Not Found</p>
          <Link href="/customers" className="mt-4 inline-block text-[#00e5c9] hover:underline">
            ← Back to Customers
          </Link>
        </div>
      </AppShell>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Customers</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#14202e] border border-[#233549] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#1a2b3d] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Client</span>
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Customer Header Card */}
        <div className="rounded-2xl border border-[#1f2f42] bg-gradient-to-r from-[#0b1420] to-[#121c2b] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#00e5c9] font-bold">{customer.id}</span>
                <StatusBadge status={customer.status} size="sm" />
                <span className="rounded bg-[#172332] px-2.5 py-0.5 text-xs text-slate-300">
                  {customer.customerType}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {customer.name}
              </h1>
              {customer.company && (
                <p className="text-sm text-slate-300 font-medium">{customer.company}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <Phone className="h-3.5 w-3.5 text-[#00e5c9]" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="inline-flex items-center gap-1 text-slate-200">
                    <Mail className="h-3.5 w-3.5 text-[#00e5c9]" />
                    {customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="inline-flex items-center gap-1 text-slate-200">
                    <MapPin className="h-3.5 w-3.5 text-[#00e5c9]" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/events/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-md shadow-[#00e5c9]/20"
            >
              <Plus className="h-4 w-4" />
              <span>Book Event for Client</span>
            </Link>
          </div>
        </div>

        {/* 4 Financial & Booking Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Total Events Booked</span>
            <strong className="text-2xl font-extrabold text-white block mt-1">
              {events.length}
            </strong>
            <span className="text-slate-500 mt-1 block">Production contracts</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Total Invoiced Revenue</span>
            <strong className="text-2xl font-extrabold text-white font-mono block mt-1">
              {formatCurrency(customer.totalRevenue)}
            </strong>
            <span className="text-slate-500 mt-1 block">Contract value</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Paid Collections</span>
            <strong className="text-2xl font-extrabold text-emerald-400 font-mono block mt-1">
              {formatCurrency(totalPaid)}
            </strong>
            <span className="text-slate-500 mt-1 block">{payments.length} payments recorded</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Outstanding Balance</span>
            <strong
              className={`text-2xl font-extrabold font-mono block mt-1 ${
                customer.outstandingBalance > 0 ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              {formatCurrency(customer.outstandingBalance)}
            </strong>
            <span className="text-slate-500 mt-1 block">Receivable balance</span>
          </div>
        </div>

        {/* Event History */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#182535]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#00e5c9]" />
              <h2 className="text-sm font-bold text-white">Event Bookings History</h2>
            </div>
            <span className="text-slate-400">{events.length} Events Total</span>
          </div>

          {events.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No events booked for this client yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right">Contract Value</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {events.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => router.push(`/events/${e.id}`)}
                      className="cursor-pointer hover:bg-[#101824] transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-white hover:text-[#00e5c9]">{e.name}</td>
                      <td className="py-3 px-3 text-slate-300">{formatDate(e.eventDate)}</td>
                      <td className="py-3 px-3 text-slate-400">{e.eventType}</td>
                      <td className="py-3 px-3 text-slate-400">{e.location}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                        {formatCurrency(e.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-300">
                        {formatCurrency(e.balance)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={e.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#182535]">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#00e5c9]" />
              <h2 className="text-sm font-bold text-white">Payments & Receipts</h2>
            </div>
            <span className="text-slate-400">{payments.length} Payments Total</span>
          </div>

          {payments.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No payment records found for this client.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#101824]">
                      <td className="py-3 px-3 font-mono font-semibold text-white">{p.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-300">{formatDate(p.date)}</td>
                      <td className="py-3 px-3 text-slate-400">{p.eventName}</td>
                      <td className="py-3 px-3 text-slate-300">{p.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        + {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={customer}
        onSuccess={() => {
          loadData();
          setIsEditModalOpen(false);
        }}
      />

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        isDestructive={true}
      />
    </AppShell>
  );
}
