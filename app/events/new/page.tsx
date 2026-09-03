'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EventForm } from '@/features/events/EventForm';

export default function CreateEventPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Create New Event"
          subtitle="Configure event details, customer, equipment packages, crew roster, and contract financials"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Events', href: '/events' },
            { label: 'New Event' },
          ]}
        />

        <EventForm />
      </div>
    </AppShell>
  );
}
