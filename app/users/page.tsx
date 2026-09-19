'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Filter,
  Shield,
  Layers,
  Settings2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { UserModal } from '@/features/users/UserModal';
import { RoleModal } from '@/features/users/RoleModal';
import { ChangePasswordModal } from '@/features/users/ChangePasswordModal';
import { userService } from '@/lib/api/userService';
import {
  SYSTEM_MODULES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS_MATRIX,
  checkUserPermission,
} from '@/lib/auth/permissions';
import { UserAccount, UserRole, RoleDefinition } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/AuthContext';

export default function UsersPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState('');

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
      ]);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(rolesData) && rolesData.length > 0) setRoles(rolesData);
    } catch { }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    window.addEventListener('seekers_users_updated', loadData);
    window.addEventListener('seekers_roles_updated', loadData);
    return () => {
      window.removeEventListener('seekers_store_updated', loadData);
      window.removeEventListener('seekers_users_updated', loadData);
      window.removeEventListener('seekers_roles_updated', loadData);
    };
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke access and delete account for "${name}"?`)) {
      await userService.deleteUser(id);
      showToast(`✓ User ${name} removed`);
      loadData();
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (confirm(`Are you sure you want to delete custom role "${roleName}"?`)) {
      try {
        await userService.deleteRole(roleName);
        showToast(`✓ Role "${roleName}" deleted`);
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Error deleting role', 'error');
      }
    }
  };

  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const adminCount = users.filter(
    (u) => u.role === 'Super Admin' || u.role === 'Event Director'
  ).length;

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
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
      header: 'Assigned Role',
      sortable: true,
      className: 'w-44',
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
      header: 'Effective Role Rights',
      className: 'w-44',
      render: (u) => {
        const roleDoc = roles.find((r) => r.name === u.role);
        const perms = roleDoc ? roleDoc.permissions : u.permissions || [];
        const isSuper = u.role === 'Super Admin' || perms.includes('*');
        const count = isSuper ? ALL_PERMISSIONS.length : perms.length;
        return (
          <span className="rounded bg-slate-100 dark:bg-[#162130] px-2 py-0.5 text-xs font-mono text-slate-700 dark:text-slate-300">
            {count} / {ALL_PERMISSIONS.length} actions
          </span>
        );
      },
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

  const filteredMatrixModules = useMemo(() => {
    if (!matrixSearch.trim()) return SYSTEM_MODULES;
    const q = matrixSearch.toLowerCase();
    return SYSTEM_MODULES.filter(
      (mod) =>
        mod.name.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q) ||
        mod.actions.some((a) => a.label.toLowerCase().includes(q) || a.key.toLowerCase().includes(q))
    );
  }, [matrixSearch]);

  const canCreateUser = hasPermission('users.create');
  const canEditUser = hasPermission('users.edit');
  const canDeleteUser = hasPermission('users.delete');

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="User Accounts, Roles & Permissions"
          subtitle="Role-Based Access Control (RBAC): Manage operator accounts and configure role authorization policies"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'User & Access' }]}
          actions={
            <div className="flex items-center gap-2">
              {canCreateUser && (
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setIsRoleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#182637] transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
                  <span>+ New Custom Role</span>
                </button>
              )}
              {canCreateUser && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/25 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Provision New User</span>
                </button>
              )}
            </div>
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
            change="Executive clearance level"
            trend="neutral"
            icon={ShieldCheck}
            accentColor="purple"
          />
          <StatCard
            title="Active RBAC Roles"
            value={`${roles.length} Roles`}
            change={`${ALL_PERMISSIONS.length} Granular module actions`}
            trend="neutral"
            icon={KeyRound}
            accentColor="blue"
          />
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-slate-200 dark:border-[#1c2a3b] flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-[#00897b] dark:border-[#00e5c9] text-[#00897b] dark:text-[#00e5c9]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Operator Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-[#00897b] dark:border-[#00e5c9] text-[#00897b] dark:text-[#00e5c9]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Role Management & Access Matrix ({roles.length} Roles)
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
                {canEditUser && (
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
                )}
                {canEditUser && (
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setIsUserModalOpen(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182637] hover:text-[#00897b] dark:hover:text-[#00e5c9] transition-colors"
                    title="Edit Operator Role"
                    aria-label={`Edit ${u.name}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {canDeleteUser && u.id !== 'USR-001' && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
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
            {/* Roles Grid Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Configured Organization Roles ({roles.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click &quot;Edit Role Access&quot; on any role to customize its authorized module actions
                  </p>
                </div>

                {canCreateUser && (
                  <button
                    onClick={() => {
                      setSelectedRole(null);
                      setIsRoleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9]/10 border border-[#00e5c9]/30 px-3 py-1.5 text-xs font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-[#00e5c9]/20 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Custom Role</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {roles.map((r) => {
                  const isSuper = r.name === 'Super Admin' || r.permissions?.includes('*');
                  const count = isSuper ? ALL_PERMISSIONS.length : r.permissions?.length || 0;
                  const usersCount = users.filter((u) => u.role === r.name).length;

                  return (
                    <div
                      key={r.name}
                      className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-[#00e5c9]/40 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold border ${getRoleBadgeStyle(r.name)}`}>
                            {r.name}
                          </span>
                          <span className="rounded-full bg-slate-100 dark:bg-[#152332] px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                            {usersCount} {usersCount === 1 ? 'operator' : 'operators'}
                          </span>
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                          {r.description || 'No description configured.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-[#172332] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#00897b] dark:text-[#00e5c9] font-semibold">
                          {count} / {ALL_PERMISSIONS.length} Actions
                        </span>

                        <div className="flex items-center gap-1.5">
                          {canEditUser && (
                            <button
                              onClick={() => {
                                setSelectedRole(r);
                                setIsRoleModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162334] border border-slate-200 dark:border-[#23354b] transition-colors"
                            >
                              <Edit2 className="h-3 w-3 text-[#00897b] dark:text-[#00e5c9]" />
                              <span>Edit Access</span>
                            </button>
                          )}
                          {canDeleteUser && !r.isSystem && (
                            <button
                              onClick={() => handleDeleteRole(r.name)}
                              className="p-1 rounded text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors"
                              title="Delete custom role"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RBAC Matrix Table */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1a2738]">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Authorized module operations across {roles.length} system roles ({ALL_PERMISSIONS.length} granular actions)
                  </p>
                </div>

                {/* Matrix Search Filter */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Filter matrix by module..."
                    className="w-full rounded-lg border border-slate-200 dark:border-[#223348] bg-slate-50 dark:bg-[#101824] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#233549] text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-3 min-w-[280px]">System Module & Action</th>
                      {roles.map((r) => (
                        <th key={r.name} className="py-3 px-2 text-center min-w-[120px]">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${getRoleBadgeStyle(
                              r.name
                            )}`}
                          >
                            {r.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#172332]">
                    {filteredMatrixModules.map((mod) => (
                      <React.Fragment key={mod.id}>
                        {/* Module Category Row */}
                        <tr className="bg-slate-50 dark:bg-[#09101a] font-bold">
                          <td colSpan={roles.length + 1} className="py-2 px-3 text-[11px] text-[#00897b] dark:text-[#00e5c9] tracking-wider uppercase">
                            {mod.name} <span className="text-slate-400 font-normal">({mod.actions.length} actions)</span>
                          </td>
                        </tr>

                        {/* Module Actions Rows */}
                        {mod.actions.map((act) => (
                          <tr key={act.key} className="hover:bg-slate-50 dark:hover:bg-[#101824] transition-colors">
                            <td className="py-2.5 px-3 pl-6">
                              <span className="font-semibold text-slate-900 dark:text-white block">{act.label}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400">{act.key}</span>
                                <span className="text-[10px] text-slate-500 truncate hidden md:inline">
                                  — {act.description}
                                </span>
                              </div>
                            </td>
                            {roles.map((r) => {
                              const isSuper = r.name === 'Super Admin' || r.permissions?.includes('*');
                              const hasPerm = isSuper || checkUserPermission(r.permissions, r.name as any, act.key);
                              return (
                                <td key={r.name} className="py-2.5 px-2 text-center">
                                  {hasPerm ? (
                                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center h-5 w-5 text-slate-300 dark:text-slate-600">
                                      <Minus className="h-3 w-3" />
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {isUserModalOpen && (
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          roles={roles}
          onSuccess={loadData}
        />
      )}

      {/* Role Create/Edit Modal */}
      {isRoleModalOpen && (
        <RoleModal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
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
