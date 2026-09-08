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
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomerModal } from '@/features/customers/CustomerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { customerService } from '@/lib/api/customerService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer, CustomerType } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function CustomersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getCustomers();
      if (Array.isArray(data)) setCustomers(data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_customers_updated', loadData);
    return () => window.removeEventListener('seekers_customers_updated', loadData);
  }, []);

  // Top KPIs
  const totalRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  }, [customers]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  }, [customers]);

  const activeCount = useMemo(() => {
    return customers.filter((c) => c.status === 'Active').length;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'ALL' && c.customerType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [customers, typeFilter, statusFilter]);

  const handleEdit = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCustomer(undefined);
    setIsCustomerModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await customerService.deleteCustomer(deleteTarget.id);
      showToast(`Customer ${deleteTarget.name} deleted successfully`, 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'w-24 font-mono text-xs text-[#00e5c9] font-bold',
    },
    {
      key: 'name',
      header: 'Customer Name & Company',
      sortable: true,
      className: 'max-w-[260px]',
      render: (c) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white block truncate hover:text-[#00897b] dark:hover:text-[#00e5c9] transition-colors">
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
      header: 'Contact Info',
      className: 'w-48',
      render: (c) => (
        <div>
          <span className="text-slate-800 dark:text-white block font-mono text-[11px]">{c.phone}</span>
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
        <span className="rounded bg-slate-100 dark:bg-[#162130] border border-slate-200 dark:border-[#223347] px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          {c.customerType}
        </span>
      ),
    },
    {
      key: 'totalEvents',
      header: 'Events',
      sortable: true,
      className: 'text-center w-20 font-mono text-slate-900 dark:text-white font-semibold',
      render: (c) => c.totalEvents || 0,
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      sortable: true,
      className: 'text-right font-mono font-bold text-slate-900 dark:text-white w-32',
      render: (c) => formatCurrency(c.totalRevenue || 0),
    },
    {
      key: 'outstandingBalance',
      header: 'Balance Due',
      sortable: true,
      className: 'text-right font-mono font-bold text-amber-600 dark:text-amber-300 w-32',
      render: (c) => formatCurrency(c.outstandingBalance || 0),
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
        {/* Page Header */}
        <PageHeader
          title="Customer Management & CRM"
          subtitle="Directory of corporate clients, luxury hotel partners, wedding couples, and venues synced with backend database"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Customers' }]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Refresh from backend"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#00e5c9]' : ''}`} />
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] px-4 py-2.5 text-xs font-bold text-black hover:brightness-110 shadow-lg shadow-[#00e5c9]/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Customer</span>
              </button>
            </div>
          }
        />

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard
            compact
            title="Total Clients"
            value={customers.length}
            change={`${customers.length} registered`}
            trend="neutral"
            icon={Users}
            accentColor="teal"
            onClick={() => setStatusFilter('ALL')}
            className={statusFilter === 'ALL' ? 'ring-2 ring-[#00a894] dark:ring-[#00e5c9]' : ''}
          />
          <StatCard
            compact
            title="Active Accounts"
            value={activeCount}
            change="In good standing"
            trend="up"
            icon={CheckCircle2}
            accentColor="emerald"
            onClick={() => setStatusFilter('Active')}
            className={statusFilter === 'Active' ? 'ring-2 ring-[#10b981]' : ''}
          />
          <StatCard
            compact
            title="Lifetime Revenue"
            value={formatCurrency(totalRevenue, true)}
            change="Total booked"
            trend="up"
            icon={DollarSign}
            accentColor="blue"
          />
          <StatCard
            compact
            title="Balance Due"
            value={formatCurrency(totalOutstanding, true)}
            change={`${customers.filter((c) => (c.outstandingBalance || 0) > 0).length} accounts due`}
            trend="down"
            icon={AlertCircle}
            accentColor="amber"
          />
        </div>

        {/* Customers Table */}
        <DataTable
          data={filteredCustomers}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search customers by name, company, phone, or email..."
          searchFilter={(c, q) =>
            c.name.toLowerCase().includes(q) ||
            (c.company && c.company.toLowerCase().includes(q)) ||
            c.phone.includes(q) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            c.id.toLowerCase().includes(q)
          }
          onRowClick={(c) => router.push(`/customers/${c.id}`)}
          exportFileName="seekers_customers"
          extraFilters={
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="ALL">All Client Types</option>
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
                <option value="Hotel">Hotel / Resort</option>
                <option value="Club">Nightclub / Lounge</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Other">Other Category</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lead">Sales Lead</option>
              </select>
            </div>
          }
          actions={(c) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/customers/${c.id}`);
                }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-slate-900 dark:hover:text-white transition-colors"
                title="View Profile"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => handleEdit(c, e)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Edit Customer"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(c);
                }}
                className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                title="Delete Customer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Customer Create / Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(undefined);
        }}
        initialData={editingCustomer}
        onSuccess={() => {
          loadData();
          setIsCustomerModalOpen(false);
          setEditingCustomer(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleteTarget?.name}" (${deleteTarget?.company || 'Individual'})? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        isDestructive={true}
      />
    </AppShell>
  );
}
