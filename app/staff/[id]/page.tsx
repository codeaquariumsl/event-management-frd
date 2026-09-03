'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Phone,
  Mail,
  WalletCards,
  Award,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StaffPaymentModal } from '@/features/staff/StaffPaymentModal';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Staff, StaffPayment, EventItem } from '@/lib/types';

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [assignedEvents, setAssignedEvents] = useState<EventItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<StaffPayment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = () => {
    const foundStaff = mockStore.getStaffById(resolvedParams.id);
    if (foundStaff) {
      setStaff({ ...foundStaff });
      const events = mockStore.getEvents().filter((e) =>
        e.assignedStaff.some((as) => as.staffId === foundStaff.id)
      );
      setAssignedEvents(events);

      const payments = mockStore.getStaffPayments().filter((p) => p.staffId === foundStaff.id);
      setPaymentHistory(payments);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, [resolvedParams.id]);

  if (!staff) {
    return (
      <AppShell>
        <div className="py-20 text-center text-xs text-slate-400">
          <p className="text-base font-semibold text-white">Staff Member Not Found</p>
          <Link href="/staff" className="mt-4 inline-block text-[#00e5c9] hover:underline">
            ← Back to Staff Directory
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Staff Roster</span>
        </Link>

        {/* Staff Profile Header Card */}
        <div className="rounded-2xl border border-[#1f2f42] bg-gradient-to-r from-[#0b1420] to-[#121c2b] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7c5cff] to-[#00e5c9] font-black text-2xl text-white shadow-lg">
                {staff.avatar || staff.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-white">{staff.name}</h1>
                  <StatusBadge status={staff.status} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="rounded bg-[#172332] px-2 py-0.5 font-semibold text-[#00e5c9]">
                    {staff.role}
                  </span>
                  <span>{staff.employmentType}</span>
                  <span>•</span>
                  <span>Joined: {formatDate(staff.joiningDate)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {staff.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {staff.email}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-md shadow-[#00e5c9]/20"
            >
              + Record Payout / Salary
            </button>
          </div>

          {/* Skills & Bank details */}
          <div className="mt-6 pt-6 border-t border-[#1a2738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-1.5">Specialized Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {staff.skills.map((sk) => (
                  <span key={sk} className="rounded bg-[#131e2b] border border-[#203042] px-2.5 py-1 text-slate-200">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {staff.bankDetails && (
              <div className="text-right sm:text-right text-[11px] text-slate-400">
                <span className="text-white font-semibold block">{staff.bankDetails.bankName}</span>
                <span className="font-mono text-slate-300">{staff.bankDetails.accountNumber}</span> • {staff.bankDetails.branch}
              </div>
            )}
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Events Assigned</span>
            <strong className="text-2xl font-extrabold text-white block mt-1">
              {staff.totalEventsAssigned}
            </strong>
            <span className="text-slate-500 mt-1 block">Active on {assignedEvents.length} productions</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Default Rate / Event</span>
            <strong className="text-2xl font-extrabold text-[#00e5c9] font-mono block mt-1">
              {formatCurrency(staff.defaultRatePerEvent)}
            </strong>
            <span className="text-slate-500 mt-1 block">Basic: {formatCurrency(staff.basicSalary)}</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Total Lifetime Earnings</span>
            <strong className="text-2xl font-extrabold text-emerald-400 font-mono block mt-1">
              {formatCurrency(staff.totalEarnings)}
            </strong>
            <span className="text-emerald-500/80 mt-1 block">Cleared via bank</span>
          </div>

          <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-4 text-xs">
            <span className="text-slate-400 block text-[11px]">Pending Compensation</span>
            <strong className="text-2xl font-extrabold text-amber-300 font-mono block mt-1">
              {formatCurrency(staff.pendingPayments)}
            </strong>
            <span className="text-amber-500/80 mt-1 block">Due upon event wraps</span>
          </div>
        </div>

        {/* Event History Table */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Assigned Event Productions ({assignedEvents.length})
          </h2>
          {assignedEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-[#1f2f42] rounded-lg">
              No productions assigned to this staff member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Venue</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Agreed Rate</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {assignedEvents.map((evt) => {
                    const as = evt.assignedStaff.find((a) => a.staffId === staff.id);
                    return (
                      <tr key={evt.id} className="hover:bg-[#101824]">
                        <td className="py-3 px-3 font-semibold text-white">
                          <Link href={`/events/${evt.id}`} className="hover:text-[#00e5c9]">
                            {evt.name}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {formatDate(evt.eventDate)} ({evt.startTime} - {evt.endTime})
                        </td>
                        <td className="py-3 px-3 text-slate-400">{evt.location}</td>
                        <td className="py-3 px-3 text-[#00e5c9] font-medium">{as?.role}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatCurrency(as?.paymentAmount || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={evt.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History Table */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 text-xs space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Payment & Salary History ({paymentHistory.length})
          </h2>
          {paymentHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-[#1f2f42] rounded-lg">
              No payments logged for this staff member yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Event / Context</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {paymentHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-[#101824]">
                      <td className="py-3 px-3 text-slate-300">{formatDate(p.date)}</td>
                      <td className="py-3 px-3 font-semibold text-white">{p.paymentType}</td>
                      <td className="py-3 px-3 text-slate-400">{p.eventName || p.notes || '—'}</td>
                      <td className="py-3 px-3 text-slate-300">{p.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{p.referenceNumber || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
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

      {/* Staff Payment Modal */}
      {isPaymentModalOpen && (
        <StaffPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          staff={staff}
          onSuccess={loadData}
        />
      )}
    </AppShell>
  );
}
