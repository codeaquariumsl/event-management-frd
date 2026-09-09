'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  KeyRound,
  Lock,
  UserCheck,
  CheckCircle2,
  Minus,
  Edit2,
  Trash2,
  Building,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { UserModal } from '@/features/users/UserModal';
import { ChangePasswordModal } from '@/features/users/ChangePasswordModal';
import { userService } from '@/lib/api/userService';
import { ROLE_PERMISSIONS_MATRIX } from '@/lib/auth/permissions';
import { UserAccount, UserRole } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function UsersPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await userService.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch { }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke access and delete account for "${name}"?`)) {
      await userService.deleteUser(id);
      showToast(`✓ User ${name} removed`);
      loadData();
    }
  };

  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const adminCount = users.filter(
    (u) => u.role === 'Super Admin' || u.role === 'Event Director'
  ).length;

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300';
      case 'Event Director':
        return 'bg-teal-50 dark:bg-[#00e5c9]/10 border border-teal-200 dark:border-[#00e5c9]/30 text-teal-700 dark:text-[#00e5c9]';
      case 'Production Manager':
        return 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300';
      case 'Finance Officer':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300';
      case 'Crew Coordinator':
        return 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300';
    }
  };

  const columns: Column<UserAccount>[] = [
    {
      key: 'id',
      header: 'User ID',
      sortable: true,
      className: 'w-24 font-mono text-[11px] text-slate-400',
    },
    {
      key: 'name',
      header: 'Operator Name & Email',
      sortable: true,
      className: 'max-w-[280px]',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00e5c9] to-[#7c5cff] text-xs font-bold text-black shadow-sm">
            {u.avatar || u.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-900 dark:text-white block truncate">{u.name}</span>
            <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role Assignment',
      sortable: true,
      className: 'w-40',
      render: (u) => (
        <span
          className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold border ${getRoleBadgeStyle(
            u.role
          )}`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'permissions',
      header: 'Granted Privileges',
      className: 'w-36',
      render: (u) => (
        <span className="rounded bg-slate-100 dark:bg-[#162130] px-2 py-0.5 text-xs font-mono text-slate-700 dark:text-slate-300">
          {u.permissions?.length || 0} permissions
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Session',
      sortable: true,
      className: 'w-36 text-slate-400 font-mono text-[11px]',
      render: (u) => u.lastLogin || 'Never',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center w-24',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
    },
  ];

  const PERMISSION_ROWS = [
    { key: 'events:view', label: 'View Events & Operations', category: 'Events' },
    { key: 'events:create', label: 'Create New Events & Budgets', category: 'Events' },
    { key: 'events:edit', label: 'Modify Production Specifications', category: 'Events' },
    { key: 'events:delete', label: 'Delete or Cancel Events', category: 'Events' },
    { key: 'calendar:view', label: 'View Production Calendar', category: 'Calendar' },
    { key: 'recurring:manage', label: 'Generate Recurring Residencies', category: 'Calendar' },
    { key: 'staff:view', label: 'View Crew Roster & Contacts', category: 'Staff' },
    { key: 'staff:manage', label: 'Add & Assign Crew Members', category: 'Staff' },
    { key: 'payroll:view', label: 'View Monthly Payroll Reports', category: 'Payroll' },
    { key: 'payroll:manage', label: 'Execute Salary & Gig Payouts', category: 'Payroll' },
    { key: 'customers:view', label: 'View Client CRM Directory', category: 'Clients' },
    { key: 'customers:manage', label: 'Create & Update Client Accounts', category: 'Clients' },
    { key: 'billing:manage', label: 'Issue Invoices & Record Receipts', category: 'Billing' },
    { key: 'reports:view', label: 'Executive Financial Analytics', category: 'Reports' },
    { key: 'users:manage', label: 'Manage Team & Access Roles', category: 'Admin' },
    { key: 'settings:manage', label: 'Modify Company Profile & Rates', category: 'Admin' },
  ];

  const ROLES: UserRole[] = [
    'Super Admin',
    'Event Director',
    'Production Manager',
    'Finance Officer',
    'Crew Coordinator',
    'Read Only',
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="User Accounts, Roles & Permissions"
          subtitle="Manage administrative operators, role-based access control (RBAC), and security privileges"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'User & Access' }]}
          actions={
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Provision New User</span>
            </button>
          }
        />

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Operators"
            value={users.length.toString()}
            change="Across all departments"
            trend="neutral"
            icon={Users}
            accentColor="teal"
          />
          <StatCard
            title="Active Operational Accounts"
            value={activeUsersCount.toString()}
            change="Authorized for console access"
            trend="up"
            icon={UserCheck}
            accentColor="emerald"
          />
          <StatCard
            title="Director & Admin Roles"
            value={adminCount.toString()}
            change="Executive approval level"
            trend="neutral"
            icon={ShieldCheck}
            accentColor="purple"
          />
          <StatCard
            title="RBAC Security Clearance Levels"
            value="6 Roles"
            change="16 Granular permissions"
            trend="neutral"
            icon={KeyRound}
            accentColor="blue"
          />
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-slate-200 dark:border-[#1c2a3b] flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 border-b-2 transition-colors ${activeTab === 'users'
                ? 'border-[#00897b] dark:border-[#00e5c9] text-[#00897b] dark:text-[#00e5c9]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Operator Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-2 border-b-2 transition-colors ${activeTab === 'matrix'
                ? 'border-[#00897b] dark:border-[#00e5c9] text-[#00897b] dark:text-[#00e5c9]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Roles & Permissions Matrix (RBAC)
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <DataTable
            data={users}
            columns={columns}
            keyExtractor={(u) => u.id}
            searchPlaceholder="Search operators by name, email, or role..."
            searchFilter={(u, q) =>
              u.name.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              u.role.toLowerCase().includes(q)
            }
            exportFileName="seekers_operators_roster"
            actions={(u) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setPasswordTargetUser(u);
                    setIsPasswordModalOpen(true);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                  title="Change Password"
                  aria-label={`Change password for ${u.name}`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(u);
                    setIsModalOpen(true);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-[#00897b] dark:hover:text-[#00e5c9] transition-colors"
                  title="Edit User & Permissions"
                  aria-label={`Edit ${u.name}`}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {u.id !== 'USR-001' && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-rose-400 transition-colors"
                    title="Delete Account"
                    aria-label={`Delete ${u.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          />
        )}

        {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1a2738]">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Authorized module operations across system roles
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsModalOpen(true);
                  }}
                  className="rounded-lg bg-slate-100 dark:bg-[#152332] border border-slate-300 dark:border-[#233549] px-3 py-1.5 font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-slate-200 dark:hover:bg-[#1b2c3f]"
                >
                  + Create Operator with Custom Role
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#233549] text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 min-w-[240px]">Permission / Module Action</th>
                      {ROLES.map((role) => (
                        <th key={role} className="py-3 px-2 text-center min-w-[120px]">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${getRoleBadgeStyle(
                              role
                            )}`}
                          >
                            {role}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#172332]">
                    {PERMISSION_ROWS.map((perm) => (
                      <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-[#101824]">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">{perm.label}</span>
                          <span className="font-mono text-[10px] text-slate-500">{perm.key}</span>
                        </td>
                        {ROLES.map((role) => {
                          const hasPerm = ROLE_PERMISSIONS_MATRIX[role]?.includes(perm.key);
                          return (
                            <td key={role} className="py-2.5 px-2 text-center">
                              {hasPerm ? (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center h-5 w-5 text-slate-400 dark:text-slate-600">
                                  <Minus className="h-3 w-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Descriptions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">Super Admin</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Full unrestricted rights across all production management, accounting, company remittance settings, and operator provisioning.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 space-y-2">
                <span className="font-bold text-[#00897b] dark:text-[#00e5c9] block">Event Director</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Authoring, client agreements, staff allocation, quotation approval, and calendar coordination.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 space-y-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Finance Officer</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Managing client invoice collections, issuing tax receipts, reconciling staff gig payouts, and monthly payroll.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={loadData}
        />
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordTargetUser(null);
          }}
          user={passwordTargetUser}
          onSuccess={loadData}
        />
      )}
    </AppShell>
  );
}
