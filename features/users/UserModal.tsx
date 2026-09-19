'use client';

import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, RoleDefinition } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/lib/api/userService';
import {
  ROLE_PERMISSIONS_MATRIX,
  ALL_PERMISSIONS,
  checkUserPermission,
} from '@/lib/auth/permissions';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserAccount | null;
  roles?: RoleDefinition[];
  onSuccess: () => void;
}

export function UserModal({ isOpen, onClose, user, roles = [], onSuccess }: UserModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Event Director');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>(roles);

  useEffect(() => {
    if (roles.length > 0) {
      setAvailableRoles(roles);
    } else {
      userService.getRoles().then((r) => {
        if (Array.isArray(r) && r.length > 0) setAvailableRoles(r);
      }).catch(() => {});
    }
  }, [roles, isOpen]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setStatus(user.status);
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
      setPassword('');
      setChangePassword(false);
      setNewPassword('');
      setShowNewPassword(false);
    }
  }, [user, isOpen]);

  const selectedRoleDoc = availableRoles.find((r) => r.name === role);
  const selectedRolePerms = selectedRoleDoc
    ? selectedRoleDoc.permissions
    : ROLE_PERMISSIONS_MATRIX[role as any] || [];

  const isSuperAdmin = role === 'Super Admin' || selectedRolePerms.includes('*');
  const grantedCount = isSuperAdmin ? ALL_PERMISSIONS.length : selectedRolePerms.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user) {
      if (changePassword && newPassword && newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      await userService.updateUser(user.id, {
        name,
        email,
        phone,
        role,
        status,
        ...(changePassword && newPassword ? { password: newPassword } : {}),
      });
    } else {
      await userService.createUser({
        name,
        email,
        phone,
        role,
        status,
        password: password,
      });
    }

    showToast(user ? '✓ Operator account updated' : '✓ New operator created successfully');
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? `Edit Operator: ${user.name}` : 'Provision New Operator Account'}
      subtitle="Configure operator credentials and assign an organizational access role"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Basic Information */}
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
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Access Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            >
              {availableRoles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} {r.isSystem ? '(System)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Selected Role Summary Card */}
        <div className="rounded-xl border border-slate-200 dark:border-[#203246] bg-slate-50/80 dark:bg-[#0c1420] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                Role Clearance: {role}
              </span>
            </div>
            <span className="rounded-full bg-[#00e5c9]/10 border border-[#00e5c9]/30 px-2 py-0.5 text-[10px] font-bold text-[#00897b] dark:text-[#00e5c9]">
              {grantedCount} / {ALL_PERMISSIONS.length} Privileges Granted
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {selectedRoleDoc?.description || `Standard RBAC policy for ${role}. Permissions can be configured on the Role Management Matrix.`}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <Info className="h-3 w-3 text-[#00897b] dark:text-[#00e5c9] shrink-0" />
            <span>To customize what this role can access, use the Roles & Permissions Matrix tab.</span>
          </div>
        </div>

        {/* Password Management */}
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
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors font-medium"
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
