'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
  Users,
  Package,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { eventService } from '@/lib/api/eventService';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EventItem } from '@/lib/types';

interface CalendarCell {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const load = () => {
      eventService.getEvents().then((evts) => {
        if (Array.isArray(evts)) setEvents(evts);
      });
    };
    load();

    window.addEventListener('seekers_events_updated', load);
    return () => window.removeEventListener('seekers_events_updated', load);
  }, []);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Year and Month of current viewed date
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 to 11

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      } else if (viewMode === 'week') {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      } else {
        const next = new Date(prev);
        next.setDate(next.getDate() - 1);
        return next;
      }
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      } else if (viewMode === 'week') {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      } else {
        const next = new Date(prev);
        next.setDate(next.getDate() + 1);
        return next;
      }
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title
  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [currentDate, viewMode]);

  // Calendar cells calculation for Month view
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    // 1. Previous month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. Next month trailing padding days to complete grid (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month, todayStr]);

  // Week days calculation for Week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        dateStr,
        isToday: dateStr === todayStr,
      };
    });
  }, [currentDate, todayStr]);

  // Current day string for Day view
  const currentDayDateStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  }, [currentDate]);

  // Active period events count
  const activeEventsCount = useMemo(() => {
    if (viewMode === 'month') {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      return events.filter((e) => e.eventDate && e.eventDate.startsWith(prefix)).length;
    } else if (viewMode === 'week') {
      const weekDateStrs = new Set(weekDays.map((w) => w.dateStr));
      return events.filter((e) => weekDateStrs.has(e.eventDate)).length;
    } else {
      return events.filter((e) => e.eventDate === currentDayDateStr).length;
    }
  }, [events, viewMode, year, month, weekDays, currentDayDateStr]);

  // Helper to fetch events for a date string
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.eventDate === dateStr);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Production Schedule Calendar"
          subtitle="Visualize upcoming live gigs, DJ setups, venue bump-in times, and crew schedules"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-[#233549] bg-[#111c29] p-1 text-xs">
                {(['month', 'week', 'day'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`rounded px-3 py-1 font-semibold uppercase tracking-wider transition-colors ${
                      viewMode === m ? 'bg-[#00e5c9] text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#1affda]"
              >
                <Plus className="h-4 w-4" />
                <span>+ Book Event</span>
              </Link>
            </div>
          }
        />

        {/* Calendar Card */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-4">
          {/* Calendar Header Bar with Dynamic Month Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1a2738]">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Previous / Next Month Navigation Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-[#233549] bg-[#111c29] text-slate-300 hover:text-white hover:border-[#00e5c9] transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-[#233549] bg-[#111c29] text-slate-300 hover:text-white hover:border-[#00e5c9] transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-white min-w-[170px] text-left">
                {headerTitle}
              </h2>

              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#233549] bg-[#14202e] text-slate-300 hover:text-[#00e5c9] hover:border-[#00e5c9] transition-colors"
              >
                Today
              </button>

              <span className="rounded bg-[#172332] border border-[#233549] px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                {activeEventsCount} {activeEventsCount === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00e5c9]" />
                <span className="text-slate-300">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">Pending</span>
              </div>
            </div>
          </div>

          {/* VIEW: MONTH */}
          {viewMode === 'month' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Weekdays */}
                <div className="grid grid-cols-7 border-b border-[#1c2a3a] text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-2.5">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Month Days Grid */}
                <div className="grid grid-cols-7 border-l border-t border-[#1a2636]">
                  {calendarCells.map((cell) => {
                    const dayEvents = getEventsForDate(cell.dateStr);

                    return (
                      <div
                        key={cell.dateStr}
                        className={`min-h-[110px] p-2 border-r border-b border-[#1a2636] flex flex-col justify-between transition-colors ${
                          cell.isToday
                            ? 'bg-[#0f212c]/80 ring-1 ring-inset ring-[#00e5c9]/60'
                            : !cell.isCurrentMonth
                            ? 'bg-[#080d15]/50 opacity-40 hover:opacity-80'
                            : 'hover:bg-[#0f1722]'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span
                            className={`font-bold ${
                              cell.isToday
                                ? 'text-[#00e5c9]'
                                : cell.isCurrentMonth
                                ? 'text-slate-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                          {cell.isToday && (
                            <span className="rounded bg-[#00e5c9] px-1.5 py-0.2 text-[9px] font-bold text-black uppercase">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Event chips */}
                        <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                          {dayEvents.map((evt) => {
                            const isConfirmed = evt.status === 'Confirmed';
                            const isPending = evt.status === 'Pending';
                            return (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                className={`p-1.5 rounded text-[11px] font-medium truncate cursor-pointer transition-all border ${
                                  isConfirmed
                                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                                    : isPending
                                    ? 'bg-amber-950/60 border-amber-800/60 text-amber-300 hover:bg-amber-900/60'
                                    : 'bg-[#00e5c9]/10 border-[#00e5c9]/30 text-[#00e5c9] hover:bg-[#00e5c9]/20'
                                }`}
                                title={`${evt.name} (${evt.startTime} - ${evt.endTime})`}
                              >
                                <span className="block font-semibold truncate">{evt.name}</span>
                                <span className="block text-[10px] opacity-75 font-mono">{evt.startTime}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WEEK */}
          {viewMode === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] grid grid-cols-7 gap-3">
                {weekDays.map((w) => {
                  const dayEvents = getEventsForDate(w.dateStr);

                  return (
                    <div
                      key={w.dateStr}
                      className={`rounded-xl border p-3 min-h-[280px] flex flex-col justify-between ${
                        w.isToday
                          ? 'border-[#00e5c9]/40 bg-[#0f212c]/50'
                          : 'border-[#1b2a3b] bg-[#0c1420]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#1b2a3b]">
                          <span className="text-xs font-bold uppercase text-slate-400">
                            {w.dayName}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              w.isToday ? 'text-[#00e5c9]' : 'text-white'
                            }`}
                          >
                            {w.dayNumber}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {dayEvents.length === 0 ? (
                            <span className="text-[11px] text-slate-600 block italic py-2">
                              No events
                            </span>
                          ) : (
                            dayEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                className="p-2 rounded-lg border border-[#233549] bg-[#111c29] cursor-pointer hover:border-[#00e5c9] transition-all space-y-1"
                              >
                                <span className="text-xs font-semibold text-white block truncate">
                                  {evt.name}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock className="h-3 w-3 text-[#00e5c9]" />
                                  <span>{evt.startTime} - {evt.endTime}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#1b2a3b]">
                                  <span className="text-slate-400 truncate max-w-[90px]">{evt.location}</span>
                                  <span className="font-mono text-[#00e5c9]">{formatCurrency(evt.totalAmount)}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2 text-right">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: DAY */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              {(() => {
                const dayEvents = getEventsForDate(currentDayDateStr);

                if (dayEvents.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-[#233549] p-12 text-center bg-[#0d1622] space-y-3">
                      <CalendarDays className="h-10 w-10 text-slate-500 mx-auto" />
                      <h4 className="font-bold text-white text-sm">No Events Scheduled for This Day</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        There are currently no events or gigs scheduled for {headerTitle}.
                      </p>
                      <Link
                        href="/events/new"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-bold text-black hover:bg-[#1affda]"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ Book Event for this Date</span>
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="rounded-xl border border-[#233549] bg-[#101824] p-4 hover:border-[#00e5c9] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#00e5c9] font-bold">{evt.id}</span>
                            <StatusBadge status={evt.status} size="sm" />
                          </div>
                          <h3 className="text-sm font-bold text-white">{evt.name}</h3>
                          <p className="text-xs text-slate-400">{evt.customerName} {evt.customerCompany ? `(${evt.customerCompany})` : ''}</p>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Clock className="h-4 w-4 text-[#00e5c9]" />
                            <span>{evt.startTime} - {evt.endTime}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="h-4 w-4 text-[#00e5c9]" />
                            <span className="max-w-[150px] truncate">{evt.location}</span>
                          </div>

                          <div className="font-mono font-bold text-white">
                            {formatCurrency(evt.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Quick Event Inspection Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#233549] bg-[#0c1420] p-6 shadow-2xl text-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-[#00e5c9] font-mono">{selectedEvent.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedEvent.name}</h3>
                <p className="text-slate-400 text-xs">{selectedEvent.customerName}</p>
              </div>
              <StatusBadge status={selectedEvent.status} size="sm" />
            </div>

            <div className="space-y-2 rounded-lg bg-[#111c29] p-3 border border-[#1e2e41]">
              <div className="flex items-center gap-2 text-slate-300">
                <CalendarDays className="h-4 w-4 text-[#00e5c9]" />
                <span>{formatDate(selectedEvent.eventDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-[#00e5c9]" />
                <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-[#00e5c9]" />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-[#1b2a3b]">
                <span>Contract Total:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedEvent.totalAmount)}</span>
              </div>
            </div>

            {selectedEvent.services && selectedEvent.services.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Equipment & Services ({selectedEvent.services.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedEvent.services.map((s, idx) => (
                    <span
                      key={s.id || idx}
                      className="rounded bg-[#121f2d] border border-[#233549] px-2 py-0.5 text-[10px] text-slate-300"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 text-slate-300 hover:bg-[#1b2b3d]"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/events/${selectedEvent.id}`)}
                className="rounded-lg bg-[#00e5c9] px-4 py-2 font-bold text-black hover:bg-[#1affda]"
              >
                Open Event Page →
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

