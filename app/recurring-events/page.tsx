'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock3,
  Plus,
  Play,
  CalendarDays,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RecurringEventModal } from '@/features/recurring-events/RecurringEventModal';
import { Modal } from '@/components/ui/Modal';
import { recurringService } from '@/lib/api/recurringService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RecurringEvent } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function RecurringEventsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [recurringList, setRecurringList] = useState<RecurringEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<RecurringEvent | null>(null);
  const [selectedSeriesForGeneration, setSelectedSeriesForGeneration] = useState<RecurringEvent | null>(null);
  const [generateCount, setGenerateCount] = useState<number>(4);

  const loadData = async () => {
    try {
      const data = await recurringService.getRecurringEvents();
      if (Array.isArray(data)) setRecurringList(data);
    } catch {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_recurring_updated', loadData);
    return () => window.removeEventListener('seekers_recurring_updated', loadData);
  }, []);

  const handleExecuteGeneration = async () => {
    if (!selectedSeriesForGeneration) return;

    const created = await recurringService.generateEvents(
      selectedSeriesForGeneration.id,
      Number(generateCount)
    );

    showToast(`✓ Successfully generated ${created.length} new events in the calendar!`);
    setSelectedSeriesForGeneration(null);
    loadData();
  };

  const handleDeleteSeries = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring series?')) {
      await recurringService.deleteRecurringEvent(id);
      showToast('✓ Recurring series deleted');
      loadData();
    }
  };

  const columns: Column<RecurringEvent>[] = [
    {
      key: 'seriesName',
      header: 'Series & Customer',
      sortable: true,
      className: 'max-w-[280px]',
      render: (r) => (
        <div>
          <span className="font-semibold text-white block truncate">{r.seriesName}</span>
          <span className="text-[11px] text-slate-400 block truncate">{r.customerName}</span>
        </div>
      ),
    },
    {
      key: 'frequency',
      header: 'Frequency',
      sortable: true,
      className: 'w-28',
      render: (r) => (
        <span className="rounded bg-[#00e5c9]/10 border border-[#00e5c9]/30 px-2 py-0.5 text-[11px] font-semibold text-[#00e5c9]">
          {r.frequency}
        </span>
      ),
    },
    {
      key: 'eventDay',
      header: 'Schedule & Time',
      sortable: true,
      className: 'w-36',
      render: (r) => (
        <div>
          <span className="text-white font-medium block">{r.eventDay || 'Regular'}</span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {r.startTime} - {r.endTime}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Venue',
      sortable: true,
      className: 'max-w-[180px] truncate',
    },
    {
      key: 'defaultPrice',
      header: 'Rate / Session',
      sortable: true,
      className: 'text-right font-mono font-bold text-white w-28',
      render: (r) => formatCurrency(r.defaultPrice),
    },
    {
      key: 'generatedCount',
      header: 'Generated',
      sortable: true,
      className: 'text-center w-24',
      render: (r) => (
        <span className="rounded bg-[#15202e] px-2 py-0.5 text-xs font-mono font-semibold text-slate-200">
          {r.generatedCount} events
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Recurring Events & Residencies"
          subtitle="Manage recurring DJ residencies, weekly hotel acoustic sessions, and automated event generation"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Recurring Events' }]}
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ New Recurring Series</span>
            </button>
          }
        />

        {/* Informational Banner */}
        <div className="rounded-xl border border-[#1e2f42] bg-[#0c1420] p-4 text-xs text-slate-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#00e5c9] shrink-0" />
            <div>
              <strong className="text-white block font-semibold">One-Click Event Generation Engine</strong>
              <span className="text-slate-400">
                Generate upcoming batches of events for any residency. Generated events automatically link crew, services, rates, and sync to the production calendar.
              </span>
            </div>
          </div>
        </div>

        <DataTable
          data={recurringList}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search recurring series by name, client, or venue..."
          exportFileName="seekers_recurring_events"
          actions={(r) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setSelectedSeriesForGeneration(r)}
                className="inline-flex items-center gap-1 rounded bg-[#00e5c9] px-2.5 py-1 text-[11px] font-bold text-black hover:bg-[#1affda]"
                title="Generate Events"
              >
                <Play className="h-3 w-3" />
                <span>Generate</span>
              </button>
              <button
                onClick={() => setEditingSeries(r)}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-[#00e5c9]"
                title="Edit Series"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDeleteSeries(r.id)}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-rose-400"
                title="Delete Series"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* New Series Modal */}
      <RecurringEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Edit Series Modal */}
      {editingSeries && (
        <RecurringEventModal
          isOpen={!!editingSeries}
          initialData={editingSeries}
          onClose={() => setEditingSeries(null)}
          onSuccess={loadData}
        />
      )}

      {/* Generate Events Confirmation Modal */}
      {selectedSeriesForGeneration && (
        <Modal
          isOpen={!!selectedSeriesForGeneration}
          onClose={() => setSelectedSeriesForGeneration(null)}
          title="Generate Future Events"
          subtitle={`Automated scheduling for ${selectedSeriesForGeneration.seriesName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#21354a] bg-[#0d1624] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Client:</span>
                <span className="font-semibold text-white">{selectedSeriesForGeneration.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frequency:</span>
                <span className="text-[#00e5c9] font-medium">{selectedSeriesForGeneration.frequency} ({selectedSeriesForGeneration.eventDay})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate per session:</span>
                <span className="font-mono font-bold text-white">{formatCurrency(selectedSeriesForGeneration.defaultPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already generated:</span>
                <span className="font-mono text-slate-300">{selectedSeriesForGeneration.generatedCount} sessions</span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                How many upcoming sessions to generate into Calendar?
              </label>
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-semibold focus:outline-none"
              >
                <option value={2}>Generate Next 2 Events</option>
                <option value={4}>Generate Next 4 Events (1 Month)</option>
                <option value={8}>Generate Next 8 Events (2 Months)</option>
                <option value={12}>Generate Next 12 Events (1 Quarter)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1c2a3a]">
              <button
                onClick={() => setSelectedSeriesForGeneration(null)}
                className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 text-slate-300 hover:bg-[#1b2b3d]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteGeneration}
                className="rounded-lg bg-[#00e5c9] px-4 py-2 font-bold text-[#041816] hover:bg-[#1affda]"
              >
                Generate {generateCount} Events Now
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
