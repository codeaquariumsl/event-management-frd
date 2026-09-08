'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EventForm } from '@/features/events/EventForm';
import { eventService } from '@/lib/api/eventService';
import { EventItem } from '@/lib/types';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    eventService.getEventById(resolvedParams.id).then((data) => {
      if (isMounted) {
        if (data) setEvent(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={event ? `Edit Event: ${event.name}` : 'Edit Event'}
          subtitle={
            event
              ? `ID: ${event.id} • Customer: ${event.customerName} • Date: ${event.eventDate}`
              : 'Modify production requirements, equipment packages, crew roster, and financials'
          }
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Events', href: '/events' },
            ...(event ? [{ label: event.name, href: `/events/${event.id}` }] : []),
            { label: 'Edit' },
          ]}
          actions={
            <Link
              href={event ? `/events/${event.id}` : '/events'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#121c29] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1b2b3d] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Event</span>
            </Link>
          }
        />

        {loading ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-[#00897b] dark:text-[#00e5c9] animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading event data...</p>
            <p className="text-xs text-slate-400">Fetching booking specifications and crew roster</p>
          </div>
        ) : event ? (
          <EventForm initialData={event} />
        ) : (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Event Not Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The event with ID <span className="font-mono">{resolvedParams.id}</span> could not be found or has been deleted.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-bold text-black hover:bg-[#1affda]"
            >
              Return to Events
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
