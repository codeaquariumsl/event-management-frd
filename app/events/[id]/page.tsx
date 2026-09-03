'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Printer,
  Trash2,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
  Receipt,
  FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InvoiceModal } from '@/components/ui/InvoiceModal';
import { RecordPaymentModal } from '@/features/events/RecordPaymentModal';
import { StaffAssignmentModal } from '@/features/events/StaffAssignmentModal';
import { StaffPaymentModal } from '@/features/staff/StaffPaymentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { paymentService } from '@/lib/api/paymentService';
import { staffService } from '@/lib/api/staffService';
import { formatCurrency, formatDate, calculateProfit } from '@/lib/utils';
import { EventItem, EventExpense, StaffAssignment, Customer, CustomerPayment, Staff } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'customer' | 'services' | 'staff' | 'payments' | 'expenses' | 'timeline'>('overview');

  // Modals
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffPaymentTarget, setStaffPaymentTarget] = useState<StaffAssignment | null>(null);
  const [staffTargetProfile, setStaffTargetProfile] = useState<Staff | undefined>(undefined);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Expense form inline modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<any>('Transport');
  const [expenseAmount, setExpenseAmount] = useState<number>(10000);

  const loadData = async () => {
    try {
      const found = await eventService.getEventById(resolvedParams.id);
      if (found) {
        setEvent(found);
        if (found.customerId) {
          customerService.getCustomerById(found.customerId).then((c) => {
            if (c) setCustomer(c);
          });
        }
      }
      paymentService.getCustomerPayments().then((allPays) => {
        if (Array.isArray(allPays)) {
          setPayments(allPays.filter((p) => p.eventId === resolvedParams.id));
        }
      });
    } catch (err) {
      console.warn('Error loading event data:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_events_updated', loadData);
    return () => window.removeEventListener('seekers_events_updated', loadData);
  }, [resolvedParams.id]);

  if (!event) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-slate-400">
          <p className="text-base font-semibold text-white">Event Not Found</p>
          <p className="mt-1">The requested event {resolvedParams.id} does not exist in the database.</p>
          <Link
            href="/events"
            className="mt-4 rounded-lg bg-[#00e5c9] px-4 py-2 font-bold text-black hover:bg-[#1affda]"
          >
            Back to Events
          </Link>
        </div>
      </AppShell>
    );
  }

  // Financial calculations
  const totalStaffCost = event.assignedStaff.reduce((sum, a) => sum + a.paymentAmount, 0);
  const totalExpenses = event.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const { profit: estimatedProfit, margin: profitMargin } = calculateProfit(
    event.totalAmount,
    totalStaffCost,
    totalExpenses
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    const newExpense: EventExpense = {
      id: `exp-${Date.now()}`,
      title: expenseTitle,
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: new Date().toISOString().split('T')[0],
    };

    const updatedExpenses = [...event.expenses, newExpense];
    await eventService.updateEvent(event.id, {
      expenses: updatedExpenses,
    });

    showToast('✓ Expense added to event');
    setIsExpenseModalOpen(false);
    setExpenseTitle('');
    setExpenseAmount(10000);
    loadData();
  };

  const handleCancelEvent = async () => {
    await eventService.updateEvent(event.id, {
      status: 'Cancelled',
    });
    showToast('✓ Event status changed to Cancelled');
    loadData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Back Nav & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#233549] bg-[#121c29] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-[#1b2b3d] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#233549] bg-[#121c29] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-[#1b2b3d] transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-[#00e5c9]" />
              <span>Assign Staff</span>
            </button>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-bold text-[#041816] hover:bg-[#1affda] transition-all shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </button>

            {event.status !== 'Cancelled' && (
              <button
                onClick={() => setIsCancelConfirmOpen(true)}
                className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/50 transition-colors"
              >
                Cancel Event
              </button>
            )}
          </div>
        </div>

        {/* Event Header Banner */}
        <div className="rounded-2xl border border-[#1f2f42] bg-gradient-to-r from-[#0b1420] to-[#111c2a] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#00e5c9] font-semibold">{event.id}</span>
                <StatusBadge status={event.status} size="md" />
                <span className="rounded bg-[#172332] px-2.5 py-0.5 text-xs text-slate-300">
                  {event.eventType}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <CalendarDays className="h-3.5 w-3.5 text-[#00e5c9]" />
                  {formatDate(event.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <Clock className="h-3.5 w-3.5 text-[#00e5c9]" />
                  {event.startTime} - {event.endTime}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <MapPin className="h-3.5 w-3.5 text-[#00e5c9]" />
                  {event.location}
                </span>
              </div>
            </div>

            {/* Financial Overview Cards in Header */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-[#203144] bg-[#091019] p-3.5 text-right min-w-[120px]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Contract Total
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {formatCurrency(event.totalAmount)}
                </span>
              </div>

              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5 text-right min-w-[120px]">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">
                  Paid to Date
                </span>
                <span className="text-base font-bold font-mono text-emerald-300">
                  {formatCurrency(event.paidAmount)}
                </span>
              </div>

              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 text-right min-w-[120px]">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block">
                  Balance Due
                </span>
                <span className="text-base font-bold font-mono text-amber-300">
                  {formatCurrency(event.balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Profitability Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-[#1b2a3a] bg-[#0c1420] p-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Event Revenue</span>
            <strong className="text-white font-mono text-sm">{formatCurrency(event.totalAmount)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Crew Staff Costs ({event.assignedStaff.length})</span>
            <strong className="text-slate-200 font-mono text-sm">{formatCurrency(totalStaffCost)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Production Expenses ({event.expenses.length})</span>
            <strong className="text-slate-200 font-mono text-sm">{formatCurrency(totalExpenses)}</strong>
          </div>
          <div className="text-right sm:text-left">
            <span className="text-[#00e5c9] block text-[11px] font-semibold">Estimated Net Profit</span>
            <strong className="text-[#00e5c9] font-mono text-sm">
              {formatCurrency(estimatedProfit)}{' '}
              <span className="text-xs text-slate-400 font-normal">({profitMargin}%)</span>
            </strong>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-[#1c2a3b] flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'customer', label: 'Customer Details' },
            { id: 'services', label: `Services & Gear (${event.services.length})` },
            { id: 'staff', label: `Production Crew (${event.assignedStaff.length})` },
            { id: 'payments', label: `Client Payments (${payments.length})` },
            { id: 'expenses', label: `Expenses (${event.expenses.length})` },
            { id: 'timeline', label: 'Timeline & History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#00e5c9] text-[#00e5c9]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            <div className="lg:col-span-2 space-y-6">
              {/* Event Scope */}
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5 space-y-3">
                <h3 className="font-bold text-sm text-white">Event Scope & Venue Access</h3>
                <p className="text-slate-300 leading-relaxed">
                  {event.description || 'No detailed scope provided.'}
                </p>
                {event.notes && (
                  <div className="rounded-lg bg-[#121c29] border border-[#203042] p-3 text-slate-300">
                    <strong className="text-[#00e5c9] block mb-1">Production Notes:</strong>
                    {event.notes}
                  </div>
                )}
              </div>

              {/* Services Snapshot */}
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-white">Booked Services Snapshot</h3>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="text-xs text-[#00e5c9] hover:underline"
                  >
                    View All Services →
                  </button>
                </div>
                <div className="space-y-2">
                  {event.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center p-2.5 rounded-lg bg-[#0f1723] border border-[#1b2837]"
                    >
                      <div>
                        <span className="font-semibold text-white block">{s.name}</span>
                        <span className="text-[11px] text-slate-400">Qty: {s.quantity}</span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        {formatCurrency(s.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Customer & Crew Sidebar */}
            <div className="space-y-6">
              {/* Client Card */}
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5 space-y-3">
                <h3 className="font-bold text-sm text-white">Client Information</h3>
                <div>
                  <span className="font-bold text-white text-sm block">{event.customerName}</span>
                  {event.customerCompany && (
                    <span className="text-slate-400 block">{event.customerCompany}</span>
                  )}
                  {event.customerPhone && (
                    <span className="text-slate-300 block mt-1">{event.customerPhone}</span>
                  )}
                  {event.customerEmail && (
                    <span className="text-slate-400 block">{event.customerEmail}</span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('customer')}
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] py-1.5 text-center text-slate-300 hover:text-white"
                >
                  View Client Profile
                </button>
              </div>

              {/* Crew Snapshot */}
              <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Assigned Crew</h3>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className="text-xs text-[#00e5c9] hover:underline"
                  >
                    Manage →
                  </button>
                </div>
                <div className="space-y-2">
                  {event.assignedStaff.map((as) => (
                    <div
                      key={as.id}
                      className="flex justify-between items-center p-2 rounded-lg bg-[#0e1622]"
                    >
                      <div>
                        <span className="font-semibold text-white block">{as.staffName}</span>
                        <span className="text-[10px] text-slate-400">{as.role}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-300">
                        {formatCurrency(as.paymentAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER */}
        {activeTab === 'customer' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client Profile & Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Contact</span>
                  <span className="text-white font-bold text-sm">{event.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Company</span>
                  <span className="text-slate-200">{event.customerCompany || 'Individual / Private Client'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <span className="text-slate-200">{event.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="text-slate-200">{event.customerEmail || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Client Type</span>
                  <span className="text-slate-200">{customer?.customerType || 'Individual'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Lifetime Revenue</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatCurrency(customer?.totalRevenue || event.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Account Outstanding Balance</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {formatCurrency(customer?.outstandingBalance || event.balance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1c2a3a]">
              <Link
                href={`/customers/${event.customerId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-4 py-2 font-semibold text-black hover:bg-[#1affda]"
              >
                Open Full Customer CRM Page →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES */}
        {activeTab === 'services' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Itemized Services & Production Equipment</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (LKR)</th>
                    <th className="py-2.5 px-3 text-right">Total (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {event.services.map((s) => (
                    <tr key={s.id} className="hover:bg-[#101824]">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{s.name}</span>
                        {s.description && (
                          <span className="text-[11px] text-slate-400">{s.description}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="rounded bg-[#172332] px-2 py-0.5 text-[11px] font-medium text-[#00e5c9]">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">{s.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatCurrency(s.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(s.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1c2a3a]">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(event.subtotal)}</span>
                </div>
                {event.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrency(event.discount)}</span>
                  </div>
                )}
                {event.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Additional Charges:</span>
                    <span className="font-mono">+ {formatCurrency(event.additionalCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#233549]">
                  <span>Total Amount:</span>
                  <span className="font-mono">{formatCurrency(event.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STAFF */}
        {activeTab === 'staff' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Assigned Production Crew</h3>
                <p className="text-slate-400">Manage rates and record staff payouts upon event wrap</p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-1.5 font-semibold text-black hover:bg-[#1affda]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign Staff Member</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Crew Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Timeslot</th>
                    <th className="py-2.5 px-3 text-right">Agreed Pay</th>
                    <th className="py-2.5 px-3 text-right">Paid to Date</th>
                    <th className="py-2.5 px-3 text-right">Staff Balance</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {event.assignedStaff.map((as) => {
                    const balanceDue = Math.max(0, as.paymentAmount - as.paidAmount);
                    return (
                      <tr key={as.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-white">{as.staffName}</td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-[#172332] px-2 py-0.5 text-[11px] font-medium text-[#00e5c9]">
                            {as.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {as.startTime} - {as.endTime}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          {formatCurrency(as.paymentAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">
                          {formatCurrency(as.paidAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {formatCurrency(balanceDue)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setStaffPaymentTarget(as)}
                            className="rounded bg-[#162232] border border-[#233549] px-2.5 py-1 text-[11px] font-medium text-[#00e5c9] hover:bg-[#1f3044]"
                          >
                            Pay Staff
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customer Invoices & Payments</h3>
                <p className="text-slate-400">Recorded receipts and payment ledger for {event.name}</p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-1.5 font-semibold text-black hover:bg-[#1affda]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Record Payment</span>
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#233549] p-8 text-center text-slate-400">
                No payments recorded yet for this event.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-mono font-semibold text-white">{p.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-300">{formatDate(p.date)}</td>
                        <td className="py-3 px-3 text-slate-300">{p.paymentMethod}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
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
        )}

        {/* TAB 6: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Direct Event Expenses</h3>
                <p className="text-slate-400">Log transport, fuel, dry ice, sub-rentals, and catering</p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-1.5 font-semibold text-black hover:bg-[#1affda]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Expense</span>
              </button>
            </div>

            {event.expenses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#233549] p-8 text-center text-slate-400">
                No direct expenses logged for this event.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Expense Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182535]">
                    {event.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-white">{exp.title}</td>
                        <td className="py-3 px-3 text-slate-300">{exp.category}</td>
                        <td className="py-3 px-3 text-slate-400">{formatDate(exp.date)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                          - {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Production Lifecycle Timeline</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#203042]">
              {event.timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div
                    className={`absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                      item.completed
                        ? 'bg-[#00e5c9] border-[#00e5c9] text-black'
                        : 'bg-[#0b1420] border-slate-600 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">{item.title}</span>
                    <p className="text-slate-300 mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        event={event}
        onAddPayment={() => setIsPaymentOpen(true)}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        event={event}
        onPaymentRecorded={loadData}
      />

      {/* Assign Staff Modal with Conflict Check */}
      <StaffAssignmentModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        eventDate={event.eventDate}
        startTime={event.startTime}
        endTime={event.endTime}
        currentEventId={event.id}
        existingAssignments={event.assignedStaff}
        onAssign={async (as) => {
          const updatedStaff = [...event.assignedStaff, as];
          await eventService.updateEvent(event.id, {
            assignedStaff: updatedStaff,
          });
          loadData();
        }}
      />

      {/* Staff Payment Modal */}
      {staffPaymentTarget && (
        <StaffPaymentModal
          isOpen={!!staffPaymentTarget}
          onClose={() => setStaffPaymentTarget(null)}
          staff={{ id: staffPaymentTarget.staffId, name: staffPaymentTarget.staffName, role: staffPaymentTarget.role } as any}
          eventId={event.id}
          eventName={event.name}
          defaultAmount={Math.max(0, staffPaymentTarget.paymentAmount - staffPaymentTarget.paidAmount)}
          onSuccess={loadData}
        />
      )}

      {/* Cancel Event Confirmation */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelEvent}
        title="Cancel This Event?"
        message="Are you sure you want to cancel this event? This will mark the status as Cancelled and notify staff."
        confirmLabel="Cancel Event"
        isDestructive={true}
      />

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#233549] bg-[#0c1420] p-6 shadow-2xl text-xs space-y-4">
            <h3 className="text-base font-bold text-white">Add Direct Event Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. 20ft Truck Transport to Bentota"
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                  >
                    <option value="Transport">Transport & Fuel</option>
                    <option value="Equipment Rental">Sub-Rental Equipment</option>
                    <option value="Catering">Crew Meals & Refreshments</option>
                    <option value="Miscellaneous">Consumables / Dry Ice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00e5c9] px-4 py-2 font-bold text-black"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
