'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Printer,
  Users,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceModal } from '@/components/ui/InvoiceModal';
import { RecordPaymentModal } from '@/features/events/RecordPaymentModal';
import { StaffAssignmentModal } from '@/features/events/StaffAssignmentModal';
import { eventService } from '@/lib/api/eventService';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EventItem, EventStatus, EventType, EventTypeItem } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function EventsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Active modal targets
  const [invoiceEvent, setInvoiceEvent] = useState<EventItem | null>(null);
  const [paymentEvent, setPaymentEvent] = useState<EventItem | null>(null);
  const [assignStaffEvent, setAssignStaffEvent] = useState<EventItem | null>(null);

  const loadData = async () => {
    try {
      const [data, types] = await Promise.all([
        eventService.getEvents(),
        eventTypeService.getEventTypes(),
      ]);
      if (Array.isArray(data)) setEvents(data);
      if (Array.isArray(types)) setEventTypes(types);
    } catch {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_events_updated', loadData);
    return () => window.removeEventListener('seekers_events_updated', loadData);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (statusFilter !== 'ALL' && evt.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && evt.eventType !== typeFilter) return false;
      return true;
    });
  }, [events, statusFilter, typeFilter]);

  const handleDelete = async () => {
    if (!deleteCandidateId) return;
    await eventService.deleteEvent(deleteCandidateId);
    showToast('✓ Event deleted successfully');
    setDeleteCandidateId(null);
    loadData();
  };

  const columns: Column<EventItem>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'w-24 font-mono text-[11px] text-slate-400',
    },
    {
      key: 'name',
      header: 'Event Name & Customer',
      sortable: true,
      className: 'max-w-[260px]',
      render: (evt) => (
        <div>
          <span className="font-semibold text-white block truncate hover:text-[#00e5c9]">
            {evt.name}
          </span>
          <span className="text-[11px] text-slate-400 block truncate">
            {evt.customerName} {evt.customerCompany ? `(${evt.customerCompany})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'eventDate',
      header: 'Date & Time',
      sortable: true,
      className: 'w-32',
      render: (evt) => (
        <div>
          <span className="text-white block">{formatDate(evt.eventDate)}</span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {evt.startTime} - {evt.endTime}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location / Venue',
      sortable: true,
      className: 'max-w-[180px] truncate',
    },
    {
      key: 'eventType',
      header: 'Event Type',
      sortable: true,
      className: 'w-28',
      render: (evt) => (
        <span className="rounded bg-[#162130] px-2 py-0.5 text-[11px] text-slate-300">
          {evt.eventType}
        </span>
      ),
    },
    {
      key: 'assignedStaff',
      header: 'Crew',
      className: 'w-20 text-center',
      render: (evt) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-[#141f2d] border border-[#233346] px-2 py-0.5 rounded">
          <Users className="h-3 w-3 text-[#00e5c9]" />
          {evt.assignedStaff.length}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      sortable: true,
      className: 'text-right font-mono font-semibold text-white w-28',
      render: (evt) => formatCurrency(evt.totalAmount),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      sortable: true,
      className: 'text-right font-mono text-emerald-400 w-28',
      render: (evt) => formatCurrency(evt.paidAmount),
    },
    {
      key: 'balance',
      header: 'Balance Due',
      sortable: true,
      className: 'text-right font-mono font-bold text-amber-300 w-28',
      render: (evt) => formatCurrency(evt.balance),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-28',
      render: (evt) => <StatusBadge status={evt.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Event Management"
          subtitle="Manage audio-visual productions, customer bookings, crew assignments, and invoicing"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Events' }]}
          actions={
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create New Event</span>
            </Link>
          }
        />

        <DataTable
          data={filteredEvents}
          columns={columns}
          keyExtractor={(evt) => evt.id}
          searchPlaceholder="Search events by name, client, or venue..."
          searchFilter={(evt, q) =>
            evt.name.toLowerCase().includes(q) ||
            evt.customerName.toLowerCase().includes(q) ||
            evt.location.toLowerCase().includes(q) ||
            evt.id.toLowerCase().includes(q)
          }
          onRowClick={(evt) => router.push(`/events/${evt.id}`)}
          exportFileName="seekers_events"
          emptyTitle="No events found"
          emptyDescription="No events match your current filter selections. Try adjusting the filters or create a new event."
          emptyAction={
            <Link
              href="/events/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-black hover:bg-[#1affda]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Event</span>
            </Link>
          }
          extraFilters={
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#233549] bg-[#111c29] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-[#233549] bg-[#111c29] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          }
          actions={(evt) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/events/${evt.id}`);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-white"
                title="View Event Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignStaffEvent(evt);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-[#00e5c9]"
                title="Assign Staff"
              >
                <Users className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentEvent(evt);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-emerald-400"
                title="Record Payment"
              >
                <CreditCard className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInvoiceEvent(evt);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-white"
                title="View & Print Invoice"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteCandidateId(evt.id);
                }}
                className="rounded p-1 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                title="Delete Event"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCandidateId}
        onClose={() => setDeleteCandidateId(null)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message="Are you sure you want to delete this event? This action will remove the event, its crew assignments, and invoice data."
        confirmLabel="Delete Event"
        isDestructive={true}
      />

      {/* Printable Invoice Modal */}
      {invoiceEvent && (
        <InvoiceModal
          isOpen={!!invoiceEvent}
          onClose={() => setInvoiceEvent(null)}
          event={invoiceEvent}
          onAddPayment={() => setPaymentEvent(invoiceEvent)}
        />
      )}

      {/* Record Payment Modal */}
      {paymentEvent && (
        <RecordPaymentModal
          isOpen={!!paymentEvent}
          onClose={() => setPaymentEvent(null)}
          event={paymentEvent}
          onPaymentRecorded={loadData}
        />
      )}

      {/* Staff Assignment Modal */}
      {assignStaffEvent && (
        <StaffAssignmentModal
          isOpen={!!assignStaffEvent}
          onClose={() => setAssignStaffEvent(null)}
          eventDate={assignStaffEvent.eventDate}
          startTime={assignStaffEvent.startTime}
          endTime={assignStaffEvent.endTime}
          currentEventId={assignStaffEvent.id}
          existingAssignments={assignStaffEvent.assignedStaff}
          onAssign={async (as) => {
            const updatedStaff = [...assignStaffEvent.assignedStaff, as];
            await eventService.updateEvent(assignStaffEvent.id, {
              assignedStaff: updatedStaff,
            });
            loadData();
          }}
        />
      )}
    </AppShell>
  );
}
