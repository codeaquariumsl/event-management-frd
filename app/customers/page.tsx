'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Phone,
  Mail,
  Eye,
  Building,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomerModal } from '@/features/customers/CustomerModal';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer, CustomerType } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function CustomersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const loadData = () => {
    setCustomers(mockStore.getCustomers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'ALL' && c.customerType !== typeFilter) return false;
      return true;
    });
  }, [customers, typeFilter]);

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'w-20 font-mono text-[11px] text-slate-400',
    },
    {
      key: 'name',
      header: 'Customer Name & Company',
      sortable: true,
      className: 'max-w-[260px]',
      render: (c) => (
        <div>
          <span className="font-semibold text-white block truncate hover:text-[#00e5c9]">
            {c.name}
          </span>
          <span className="text-[11px] text-slate-400 block truncate">
            {c.company || 'Private Client'}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Details',
      className: 'w-48',
      render: (c) => (
        <div>
          <span className="text-white block font-mono text-[11px]">{c.phone}</span>
          <span className="text-[11px] text-slate-400 block truncate">{c.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'customerType',
      header: 'Type',
      sortable: true,
      className: 'w-28',
      render: (c) => (
        <span className="rounded bg-[#162130] px-2.5 py-0.5 text-xs text-slate-300 font-medium">
          {c.customerType}
        </span>
      ),
    },
    {
      key: 'totalEvents',
      header: 'Events',
      sortable: true,
      className: 'text-center w-20 font-mono text-white font-semibold',
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      sortable: true,
      className: 'text-right font-mono font-bold text-white w-28',
      render: (c) => formatCurrency(c.totalRevenue),
    },
    {
      key: 'outstandingBalance',
      header: 'Balance Due',
      sortable: true,
      className: 'text-right font-mono font-bold text-amber-300 w-28',
      render: (c) => formatCurrency(c.outstandingBalance),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (c) => <StatusBadge status={c.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Customer Management & CRM"
          subtitle="Directory of corporate clients, luxury hotel partners, wedding couples, and club venues"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Customers' }]}
          actions={
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create New Customer</span>
            </button>
          }
        />

        <DataTable
          data={filteredCustomers}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search customers by name, company, or phone..."
          searchFilter={(c, q) =>
            c.name.toLowerCase().includes(q) ||
            (c.company && c.company.toLowerCase().includes(q)) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q)
          }
          onRowClick={(c) => router.push(`/customers/${c.id}`)}
          exportFileName="seekers_customers"
          extraFilters={
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[#233549] bg-[#111c29] px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Client Types</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
              <option value="Hotel">Hotel / Resort</option>
              <option value="Club">Nightclub / Lounge</option>
              <option value="Restaurant">Restaurant</option>
            </select>
          }
          actions={(c) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/customers/${c.id}`);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-white"
                title="View Customer Profile"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Customer Create Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={loadData}
      />
    </AppShell>
  );
}
