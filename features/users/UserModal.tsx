'use client';

import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/lib/api/userService';
import { ROLE_PERMISSIONS_MATRIX } from '@/lib/auth/permissions';
import { useToast } from '@/components/ui/Toast';
import { ShieldCheck, Lock, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserAccount | null;
  onSuccess: () => void;
}

const ALL_PERMISSIONS = [
  { key: 'events:view', label: 'View Events & Operations', group: 'Events' },
  { key: 'events:create', label: 'Create New Events', group: 'Events' },
  { key: 'events:edit', label: 'Edit Events & Budgets', group: 'Events' },
  { key: 'events:delete', label: 'Delete / Cancel Events', group: 'Events' },

  { key: 'calendar:view', label: 'View Production Calendar', group: 'Calendar' },
  { key: 'recurring:manage', label: 'Manage Recurring Residencies', group: 'Calendar' },

  { key: 'staff:view', label: 'View Crew & Staff Rosters', group: 'Staff & Payroll' },
  { key: 'staff:manage', label: 'Add & Edit Staff Profiles', group: 'Staff & Payroll' },
  { key: 'payroll:view', label: 'View Monthly Payroll Reports', group: 'Staff & Payroll' },
  { key: 'payroll:manage', label: 'Disburse Talent Payments & Salaries', group: 'Staff & Payroll' },

  { key: 'customers:view', label: 'View Client CRM Directory', group: 'Clients & Billing' },
  { key: 'customers:manage', label: 'Add & Edit Clients', group: 'Clients & Billing' },
  { key: 'billing:manage', label: 'Record Customer Invoices & Receipts', group: 'Clients & Billing' },

  { key: 'reports:view', label: 'Access Executive Financial Analytics', group: 'Analytics' },

  { key: 'users:manage', label: 'Manage Team & Access Roles', group: 'Administration' },
  { key: 'settings:manage', label: 'Modify Company Profile & Rate Cards', group: 'Administration' },
];

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Event Director');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setStatus(user.status);
      setPermissions(user.permissions || []);
      setPassword('');
      setChangePassword(false);
      setNewPassword('');
      setShowNewPassword(false);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('Event Director');
      setStatus('Active');
      setPermissions(ROLE_PERMISSIONS_MATRIX['Event Director']);
      setPassword('seekers2026');
      setChangePassword(false);
      setNewPassword('');
      setShowNewPassword(false);
    }
  }, [user, isOpen]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(ROLE_PERMISSIONS_MATRIX[newRole] || []);
  };

  const handleTogglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user) {
      if (changePassword && newPassword && newPassword.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
      }

      await userService.updateUser(user.id, {
        name,
        email,
        phone,
        role,
        status,
        permissions,
        ...(changePassword && newPassword ? { password: newPassword } : {}),
      });
    } else {
      await userService.createUser({
        name,
        email,
        phone,
        role,
        status,
        permissions,
        password: password || 'seekers2026',
      });
    }

    showToast(user ? '✓ Operator account updated' : '✓ New operator created successfully');
    onSuccess();
    onClose();
  };

  const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? `Edit Operator: ${user.name}` : 'Provision New Operator Account'}
      subtitle="Configure account access credentials, assignment role, and granular authorization rights"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasun Silva"
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@seekersentertainment.lk"
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Access Role *</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Event Director">Event Director</option>
              <option value="Production Manager">Production Manager</option>
              <option value="Finance Officer">Finance Officer</option>
              <option value="Crew Coordinator">Crew Coordinator</option>
              <option value="Read Only">Read Only (Observer)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {user ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#203246] p-3.5 space-y-2.5 bg-slate-50/70 dark:bg-[#0c1420]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Reset Operator Password
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) setNewPassword('');
                  }}
                  className="rounded border-slate-300 dark:border-[#243549] text-[#00897b] dark:text-[#00e5c9] accent-[#00897b] dark:accent-[#00e5c9]"
                />
                <span>Update Password</span>
              </label>
            </div>
            {changePassword && (
              <div className="pt-1.5 space-y-1.5">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new operator password (min 6 chars)"
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 pr-10 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Directly sets a new access credential for this operator account.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">
                Default: seekers2026
              </span>
            </div>
          </div>
        )}

        {/* Granular Permission Matrix Checkboxes */}
        <div className="rounded-xl border border-slate-200 dark:border-[#203246] bg-slate-50/70 dark:bg-[#0c1420] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2a3a] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
              <span className="font-bold text-slate-900 dark:text-white text-xs">Assigned Permissions ({permissions.length})</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Role template applied; individual overrides allowed
            </span>
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {groups.map((group) => {
              const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
              return (
                <div key={group} className="space-y-2">
                  <span className="text-[11px] font-bold text-[#00897b] dark:text-[#00e5c9] uppercase tracking-wider block">
                    {group}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groupPerms.map((p) => {
                      const isChecked = permissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-teal-50 dark:bg-[#00e5c9]/10 border-teal-300 dark:border-[#00e5c9]/30 text-[#00897b] dark:text-white font-semibold'
                              : 'bg-white dark:bg-[#101926] border-slate-200 dark:border-[#1b2838] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.key)}
                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#243549] bg-white dark:bg-[#111b27] text-[#00897b] dark:text-[#00e5c9] accent-[#00897b] dark:accent-[#00e5c9]"
                          />
                          <span className="text-xs">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all"
          >
            {user ? 'Save Operator Changes' : 'Create Operator Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
