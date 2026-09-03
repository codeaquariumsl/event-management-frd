'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  User,
  ArrowRight,
  Printer,
  Trash2,
  Edit2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { Quotation, QuotationStatus } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency } from '@/lib/utils';

export default function QuotationsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  const loadData = () => {
    setQuotations(mockStore.getQuotations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  // KPIs
  const totalPipelineValue = useMemo(() => {
    return quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  }, [quotations]);

  const acceptedCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'Accepted').length;
  }, [quotations]);

  const pendingCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;
  }, [quotations]);

  const acceptedValue = useMemo(() => {
    return quotations
      .filter((q) => q.status === 'Accepted')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  }, [quotations]);

  // Filtered List
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.customerCompany && q.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && q.status !== statusFilter) return false;
      return true;
    });
  }, [quotations, searchQuery, statusFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    mockStore.deleteQuotation(deleteTarget.id);
    showToast(`Quotation ${deleteTarget.quotationNumber} deleted`, 'success');
    setDeleteTarget(null);
  };

  const handleConvertToEvent = (quotation: Quotation) => {
    const newEvent = mockStore.convertQuotationToEvent(quotation.id);
    if (newEvent) {
      showToast(`Quotation converted to Event "${newEvent.name}"!`, 'success');
      router.push(`/events/${newEvent.id}`);
    } else {
      showToast('Could not convert quotation to event', 'error');
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'Sent':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'Draft':
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/25';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
      case 'Expired':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      default:
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/25';
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
        title="Quotation Management"
        subtitle="Create professional event proposals, manage rate estimates, and convert accepted quotes into live events"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Quotations' },
        ]}
        actions={
          <Link
            href="/quotations/new"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 shadow-lg shadow-[#00e5c9]/20"
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Quotations"
          value={quotations.length}
          icon={FileSpreadsheet}
          accentColor="teal"
        />
        <StatCard
          title="Total Quoted Pipeline"
          value={formatCurrency(totalPipelineValue)}
          icon={DollarSign}
          accentColor="blue"
        />
        <StatCard
          title="Accepted & Converted"
          value={`${acceptedCount} (${formatCurrency(acceptedValue)})`}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Pending / Active Quotes"
          value={pendingCount}
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-xl bg-[#0e1622] border border-[#1d2b3c] p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation #, client, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5c9]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-[#00e5c9] text-black shadow-sm'
                  : 'bg-[#131d2a] text-slate-400 hover:text-white border border-[#1f2f42]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="overflow-hidden rounded-xl border border-[#1d2b3c] bg-[#0e1622] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2b] text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-[#1d2b3c]">
              <tr>
                <th className="px-5 py-3.5">Quotation</th>
                <th className="px-5 py-3.5">Customer / Company</th>
                <th className="px-5 py-3.5">Event Type & Date</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5 text-right">Total Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2737]">
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-[#131d2b] transition-colors">
                  {/* Quote Number & Title */}
                  <td className="px-5 py-4">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="font-bold text-white hover:text-[#00e5c9] transition-colors flex items-center gap-1.5"
                    >
                      <span>{q.quotationNumber}</span>
                    </Link>
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{q.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Valid until: {q.validUntil}</div>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">{q.customerName}</div>
                    {q.customerCompany && (
                      <div className="text-xs text-slate-400">{q.customerCompany}</div>
                    )}
                    {q.customerPhone && (
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{q.customerPhone}</div>
                    )}
                  </td>

                  {/* Event Type & Date */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-[#162232] text-slate-300 border border-[#223348]">
                      {q.eventType}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Calendar className="h-3 w-3 text-[#00e5c9]" />
                      <span>{q.eventDate}</span>
                    </div>
                  </td>

                  {/* Items Count */}
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold text-slate-300">
                      {q.items?.length || 0} line items
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="px-5 py-4 text-right">
                    <div className="font-bold text-white text-base">
                      {formatCurrency(q.totalAmount)}
                    </div>
                    {q.discount > 0 && (
                      <div className="text-[11px] text-amber-400">
                        Discount: {formatCurrency(q.discount)}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(q.status)}`}>
                      {q.status}
                    </span>
                    {q.convertedEventId && (
                      <div className="mt-1">
                        <Link
                          href={`/events/${q.convertedEventId}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00e5c9] hover:underline"
                        >
                          <span>Event Linked</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Convert to Event Button */}
                      {!q.convertedEventId && q.status !== 'Rejected' && (
                        <button
                          onClick={() => handleConvertToEvent(q)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00e5c9]/10 text-[#00e5c9] hover:bg-[#00e5c9]/20 border border-[#00e5c9]/30 text-xs font-semibold transition-colors"
                          title="Convert this quotation into an active Event"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Convert</span>
                        </button>
                      )}

                      {/* View / Print */}
                      <Link
                        href={`/quotations/${q.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182535] transition-colors"
                        title="View or Print Quotation"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/quotations/${q.id}?edit=true`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182535] transition-colors"
                        title="Edit Quotation"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete Quotation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQuotations.length === 0 && (
            <div className="text-center py-16">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Quotations Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'All'
                  ? 'No quotations match the selected search criteria or filter.'
                  : 'Start by creating your first quotation proposal for a client.'}
              </p>
              <Link
                href="/quotations/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Quotation
              </Link>
            </div>
          )}
        </div>
      </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Quotation"
          message={`Are you sure you want to delete quotation ${deleteTarget?.quotationNumber} for ${deleteTarget?.customerName}? This action cannot be undone.`}
          confirmLabel="Delete Quotation"
          isDestructive={true}
        />
      </div>
    </AppShell>
  );
}
