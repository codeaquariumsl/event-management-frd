'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  RecurringEvent,
  RecurringFrequency,
  EventItem,
  ServiceItem,
} from '@/lib/types';
import { eventService } from '@/lib/api/eventService';
import { recurringService } from '@/lib/api/recurringService';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecurringEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: RecurringEvent;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurringEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: RecurringEventModalProps) {
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Editable Event & Recurring Details
  const [seriesName, setSeriesName] = useState(initialData?.seriesName || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(initialData?.frequency || 'Weekly');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [eventDay, setEventDay] = useState(initialData?.eventDay || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '21:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '03:00');
  const [location, setLocation] = useState(initialData?.location || '');
  const [defaultPrice, setDefaultPrice] = useState<number>(initialData?.defaultPrice || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real events from database
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingEvents(true);
    eventService
      .getEvents()
      .then((evtList) => {
        if (Array.isArray(evtList)) {
          setEvents(evtList);

          if (initialData) {
            // Edit mode: find existing event if any or initialize from initialData
            const matched = evtList.find(
              (e) => e.customerId === initialData.customerId && e.name === initialData.seriesName
            );
            if (matched) {
              setSelectedEventId(matched.id);
              setSelectedEvent(matched);
            }
          }
        }
      })
      .finally(() => {
        setIsLoadingEvents(false);
      });
  }, [isOpen, initialData]);

  // Set default End Date (6 months later) if empty
  useEffect(() => {
    if (!endDate && startDate) {
      try {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + 6);
        setEndDate(d.toISOString().split('T')[0]);
      } catch { }
    }
  }, [startDate, endDate]);

  // Handle Event Selection
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const evt = events.find((e) => e.id === eventId);
    if (!evt) {
      setSelectedEvent(null);
      return;
    }

    setSelectedEvent(evt);

    // Calculate Day of Week from event date
    let dayName = 'Every Friday';
    try {
      const parsedDate = new Date(evt.eventDate);
      if (!isNaN(parsedDate.getTime())) {
        dayName = `Every ${DAYS_OF_WEEK[parsedDate.getDay()]}`;
      }
    } catch { }

    // Prefill all editable event & fields from selected event
    setSeriesName(evt.name);
    setStartDate(evt.eventDate || new Date().toISOString().split('T')[0]);
    setEventDay(dayName);
    setStartTime(evt.startTime || '21:00');
    setEndTime(evt.endTime || '03:00');
    setLocation(evt.location || '');
    setDefaultPrice(evt.totalAmount || evt.subtotal || 0);

    // Calculate default 6-month end date
    try {
      const endD = new Date(evt.eventDate || Date.now());
      endD.setMonth(endD.getMonth() + 6);
      setEndDate(endD.toISOString().split('T')[0]);
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && !selectedEvent) {
      showToast('Please select a base event first', 'error');
      return;
    }

    if (!seriesName.trim()) {
      showToast('Please enter a series name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerId = selectedEvent?.customerId || initialData?.customerId || '';
      const customerName = selectedEvent?.customerName || initialData?.customerName || 'Customer';
      const eventType = selectedEvent?.eventType || initialData?.eventType || 'Club / Concert';
      const services = selectedEvent?.services || initialData?.services || [];
      const assignedStaffIds =
        selectedEvent?.assignedStaff?.map((s) => s.staffId) || initialData?.assignedStaffIds || [];

      const payload = {
        seriesName: seriesName.trim(),
        customerId,
        customerName,
        eventType,
        frequency,
        startDate,
        endDate,
        eventDay,
        startTime,
        endTime,
        location,
        defaultPrice: Number(defaultPrice) || 0,
        services,
        assignedStaffIds,
        status: initialData?.status || 'Active',
      };

      if (initialData?.id) {
        await recurringService.updateRecurringEvent(initialData.id, payload);
        showToast('✓ Recurring event series updated successfully');
      } else {
        await recurringService.createRecurringEvent(payload);
        showToast('✓ Recurring event series created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save recurring series', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Event Series' : 'Create Recurring Event Series'}
      subtitle="Select a base event to automatically pull details, then edit recurring residency specs"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* STEP 1: Select Event (Only required when creating new) */}
        {!initialData && (
          <div className="rounded-xl border border-slate-200 dark:border-[#1f2f42] bg-slate-50/70 dark:bg-[#0c1420] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
                <span>1. Select Base Event *</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {events.length} event{events.length !== 1 ? 's' : ''} found in database
              </span>
            </div>

            {isLoadingEvents ? (
              <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                Loading events from database...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#233549] p-4 text-center space-y-2">
                <p className="text-slate-700 dark:text-slate-300 font-medium">No events available in database</p>
                <p className="text-slate-500 text-[11px]">
                  Recurring series require a base event blueprint with services and timing.
                </p>
                <Link
                  href="/events/new"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-[#00897b] dark:text-[#00e5c9] hover:underline font-semibold text-xs"
                >
                  <span>+ Create an Event First</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-medium focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                required
              >
                <option value="">-- Choose an event to make recurring --</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} • {evt.customerName} • {evt.eventDate} ({formatCurrency(evt.totalAmount)})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* STEP 2: Selected Event Details Display */}
        {(selectedEvent || initialData) && (
          <div className="rounded-xl border border-teal-200 dark:border-[#00e5c9]/30 bg-teal-50/60 dark:bg-[#00e5c9]/5 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-teal-200/60 dark:border-[#00e5c9]/15">
              <span className="text-[11px] font-bold text-[#00897b] dark:text-[#00e5c9] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Selected Event Blueprint
              </span>
              <span className="rounded bg-teal-100 dark:bg-[#00e5c9]/15 border border-teal-300 dark:border-[#00e5c9]/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#00897b] dark:text-[#00e5c9]">
                {selectedEvent?.id || initialData?.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Customer</span>
                <span className="text-slate-900 dark:text-white font-semibold block truncate">
                  {selectedEvent?.customerName || initialData?.customerName}
                </span>
                {selectedEvent?.customerCompany && (
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block truncate">
                    {selectedEvent.customerCompany}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Event Type</span>
                <span className="text-[#00897b] dark:text-[#00e5c9] font-medium block truncate">
                  {selectedEvent?.eventType || initialData?.eventType}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Original Date</span>
                <span className="text-slate-900 dark:text-white font-medium block">
                  {selectedEvent?.eventDate || initialData?.startDate}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Base Price</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold block">
                  {formatCurrency(selectedEvent?.totalAmount || initialData?.defaultPrice || 0)}
                </span>
              </div>
            </div>

            {/* Included Services & Crew Badges */}
            {selectedEvent && selectedEvent.services && selectedEvent.services.length > 0 && (
              <div className="pt-2 border-t border-teal-200/60 dark:border-[#00e5c9]/15 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Included Services:</span>
                {selectedEvent.services.map((s, idx) => (
                  <span
                    key={s.id || idx}
                    className="rounded bg-white dark:bg-[#121f2d] border border-slate-200 dark:border-[#233549] px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300"
                  >
                    {s.name} {s.size ? `(${s.size})` : (s.quantity && s.quantity > 1 ? `(x${s.quantity})` : '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Edit Event Details for the Recurring Series */}
        {(selectedEvent || initialData) && (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Recurring Series Name *
              </label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g. Friday Night Residency — Colombo"
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-semibold focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Recurrence Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Biweekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule Day</label>
                <input
                  type="text"
                  value={eventDay}
                  onChange={(e) => setEventDay(e.target.value)}
                  placeholder="e.g. Every Friday"
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Session Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Session End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Venue / Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kama Club, Colombo"
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] py-2.5 pl-9 pr-3 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rate Per Session (LKR)
              </label>
              <input
                type="number"
                min={0}
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(Number(e.target.value))}
                placeholder="Rate per recurring session"
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 font-mono text-sm text-slate-900 dark:text-white font-bold focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!initialData && !selectedEvent)}
            className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 disabled:opacity-40 transition-all"
          >
            {isSubmitting
              ? 'Saving...'
              : initialData
                ? 'Save Changes'
                : 'Create Recurring Series'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
