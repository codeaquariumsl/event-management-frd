'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { eventService } from '@/lib/api/eventService';
import { formatDate } from '@/lib/utils';
import { EventItem } from '@/lib/types';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState('September 2026');
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

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const targetDate = `2026-09-${dayStr}`;
    return events.filter((e) => e.eventDate === targetDate);
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
          {/* Calendar Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1a2738]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{currentMonth}</h2>
              <span className="rounded bg-[#172332] px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                {events.length} Booked Events
              </span>
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 text-xs">
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

          {/* Month Grid */}
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

              {/* Days Grid */}
              <div className="grid grid-cols-7 border-l border-t border-[#1a2636]">
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day === 6;

                  return (
                    <div
                      key={day}
                      className={`min-h-[110px] p-2 border-r border-b border-[#1a2636] flex flex-col justify-between transition-colors ${
                        isToday ? 'bg-[#0f212c]/60 ring-1 ring-inset ring-[#00e5c9]/40' : 'hover:bg-[#0f1722]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-bold ${isToday ? 'text-[#00e5c9]' : 'text-slate-400'}`}>
                          {day}
                        </span>
                        {isToday && (
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
            </div>

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
