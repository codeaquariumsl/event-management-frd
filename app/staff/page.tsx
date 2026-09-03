'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Eye,
  Trash2,
  DollarSign,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StaffModal } from '@/features/staff/StaffModal';
import { StaffPaymentModal } from '@/features/staff/StaffPaymentModal';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Staff, StaffRole } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function StaffPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [paymentTargetStaff, setPaymentTargetStaff] = useState<Staff | null>(null);

  const loadData = () => {
    setStaffList(mockStore.getStaff());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (typeFilter !== 'ALL' && s.employmentType !== typeFilter) return false;
      return true;
    });
  }, [staffList, roleFilter, typeFilter]);

  const columns: Column<Staff>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'w-20 font-mono text-[11px] text-slate-400',
    },
    {
      key: 'name',
      header: 'Staff Member & Contact',
      sortable: true,
      className: 'max-w-[260px]',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#7c5cff] to-[#00e5c9] text-xs font-bold text-white">
            {s.avatar || s.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="font-semibold text-white block truncate hover:text-[#00e5c9]">
              {s.name}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {s.phone} • {s.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      className: 'w-36',
      render: (s) => (
        <span className="rounded bg-[#172332] px-2.5 py-0.5 text-xs font-semibold text-[#00e5c9] border border-[#00e5c9]/30">
          {s.role}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Key Skills & Specializations',
      className: 'max-w-[220px]',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.skills.slice(0, 2).map((sk) => (
            <span key={sk} className="rounded bg-[#111a24] px-1.5 py-0.5 text-[10px] text-slate-300">
              {sk}
            </span>
          ))}
          {s.skills.length > 2 && (
            <span className="text-[10px] text-slate-500">+{s.skills.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'employmentType',
      header: 'Type',
      sortable: true,
      className: 'w-24',
      render: (s) => (
        <span className="text-slate-300 font-medium text-xs">
          {s.employmentType}
        </span>
      ),
    },
    {
      key: 'totalEventsAssigned',
      header: 'Events',
      sortable: true,
      className: 'text-center w-20',
      render: (s) => (
        <span className="font-mono text-white font-bold text-xs">{s.totalEventsAssigned}</span>
      ),
    },
    {
      key: 'pendingPayments',
      header: 'Pending Pay',
      sortable: true,
      className: 'text-right font-mono font-bold text-amber-300 w-28',
      render: (s) => formatCurrency(s.pendingPayments),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (s) => <StatusBadge status={s.status} size="sm" />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Staff & Technical Crew Management"
          subtitle="Roster of resident DJs, sound engineers, lighting technicians, stage directors, and logistics staff"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Staff' }]}
          actions={
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Crew / Staff</span>
            </button>
          }
        />

        <DataTable
          data={filteredStaff}
          columns={columns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search staff by name, role, or specializations..."
          searchFilter={(s, q) =>
            s.name.toLowerCase().includes(q) ||
            s.role.toLowerCase().includes(q) ||
            s.skills.some((sk) => sk.toLowerCase().includes(q))
          }
          onRowClick={(s) => router.push(`/staff/${s.id}`)}
          exportFileName="seekers_staff_roster"
          extraFilters={
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-[#233549] bg-[#111c29] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="DJ">DJ & MC</option>
                <option value="Sound Engineer">Sound Engineer</option>
                <option value="Lighting Technician">Lighting Technician</option>
                <option value="LED Technician">LED Technician</option>
                <option value="Event Manager">Event Manager</option>
                <option value="Driver">Driver</option>
                <option value="Assistant">Assistant</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-[#233549] bg-[#111c29] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="ALL">All Employment Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Freelance">Freelance</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          }
          actions={(s) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/staff/${s.id}`);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-white"
                title="View Profile"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentTargetStaff(s);
                }}
                className="rounded p-1 text-slate-400 hover:bg-[#182637] hover:text-[#00e5c9]"
                title="Record Staff Payment"
              >
                <DollarSign className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Staff Payment Modal */}
      {paymentTargetStaff && (
        <StaffPaymentModal
          isOpen={!!paymentTargetStaff}
          onClose={() => setPaymentTargetStaff(null)}
          staff={paymentTargetStaff}
          onSuccess={loadData}
        />
      )}
    </AppShell>
  );
}
