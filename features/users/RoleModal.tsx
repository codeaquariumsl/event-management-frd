'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RoleDefinition } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/lib/api/userService';
import {
  SYSTEM_MODULES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS_MATRIX,
  SystemModule,
  PermissionActionType,
} from '@/lib/auth/permissions';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  RotateCcw,
  Search,
  X,
  KeyRound,
  Layers,
  Lock,
} from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleDefinition | null;
  onSuccess: () => void;
}

export function RoleModal({ isOpen, onClose, role, onSuccess }: RoleModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!role;
  const isSystem = role?.isSystem ?? false;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setPermissions(role.permissions || []);
    } else {
      setName('');
      setDescription('');
      setPermissions([]);
    }
    setSearchTerm('');
    setSelectedCategory('ALL');
  }, [role, isOpen]);

  const handleTogglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSelectModuleActions = (module: SystemModule, selectAll: boolean) => {
    const moduleActionKeys = module.actions.map((a) => a.key);
    setPermissions((prev) => {
      if (selectAll) {
        const set = new Set([...prev, ...moduleActionKeys]);
        return Array.from(set);
      } else {
        return prev.filter((k) => !moduleActionKeys.includes(k));
      }
    });
  };

  const handleGrantAll = () => {
    setPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const handleRevokeAll = () => {
    setPermissions([]);
  };

  const handleResetToStandardTemplate = () => {
    if (name && ROLE_PERMISSIONS_MATRIX[name as any]) {
      setPermissions(ROLE_PERMISSIONS_MATRIX[name as any]);
      showToast(`✓ Reset permissions to default "${name}" template`);
    } else {
      setPermissions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a role name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await userService.updateRole(role.name, {
          description,
          permissions,
        });
        showToast(`✓ Role "${role.name}" permissions updated`);
      } else {
        await userService.createRole({
          name: name.trim(),
          description,
          permissions,
        });
        showToast(`✓ New role "${name.trim()}" created successfully`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['ALL', 'Core Operations', 'Financials', 'Catalog & Resources', 'Administration'];

  const filteredModules = useMemo(() => {
    return SYSTEM_MODULES.filter((mod) => {
      if (selectedCategory !== 'ALL' && mod.category !== selectedCategory) {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const matchModule = mod.name.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q);
      const matchActions = mod.actions.some(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );

      return matchModule || matchActions;
    });
  }, [selectedCategory, searchTerm]);

  const getActionBadgeStyle = (actionType: PermissionActionType) => {
    switch (actionType) {
      case 'view':
        return 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/70 text-sky-700 dark:text-sky-300';
      case 'create':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300';
      case 'edit':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300';
      case 'delete':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300';
      case 'export':
        return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300';
      case 'manage':
        return 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/70 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const totalCount = ALL_PERMISSIONS.length;
  const grantedCount = permissions.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Role Access: ${role.name}` : 'Provision New System Role'}
      subtitle="Configure role authorization policies and granular module actions inherited by all assigned operators"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Role Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role Name * {isSystem && <span className="text-slate-400 font-normal">(System Protected)</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stage Manager, Logistics Lead..."
              disabled={isSystem}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9] disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Role Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of department responsibilities..."
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            />
          </div>
        </div>

        {/* Granular Module & Action Permissions Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-[#203246] bg-slate-50/70 dark:bg-[#0c1420] p-4 space-y-4">
          {/* Header & Quick Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1b2a3a] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Assigned Module & Action Privileges
                  </span>
                  <span className="rounded-full bg-[#00e5c9]/10 border border-[#00e5c9]/30 px-2 py-0.5 text-[10px] font-bold text-[#00897b] dark:text-[#00e5c9]">
                    {grantedCount} / {totalCount} Granted
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Changes made here instantly apply to all operators assigned to this role
                </span>
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleGrantAll}
                className="rounded px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/60 transition-colors"
              >
                Grant All
              </button>
              <button
                type="button"
                onClick={handleRevokeAll}
                className="rounded px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300/60 dark:border-rose-700/60 transition-colors"
              >
                Revoke All
              </button>
              {isSystem && (
                <button
                  type="button"
                  onClick={handleResetToStandardTemplate}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[#00897b] dark:text-[#00e5c9] hover:bg-teal-50 dark:hover:bg-[#00e5c9]/10 border border-[#00e5c9]/30 transition-colors"
                  title="Reset to standard defaults"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Template</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter actions or modules (e.g., 'create', 'delete', 'invoices', 'gear')..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#223348] bg-white dark:bg-[#101824] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#00e5c9]/15 text-[#00897b] dark:text-[#00e5c9] border border-[#00e5c9]/30 font-semibold'
                      : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-[#152130] dark:text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {filteredModules.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No modules or actions matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredModules.map((mod) => {
                const moduleActionKeys = mod.actions.map((a) => a.key);
                const activeCount = mod.actions.filter((a) => permissions.includes(a.key)).length;
                const isAllSelected = activeCount === mod.actions.length;

                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200 dark:border-[#1d2c3e] bg-white dark:bg-[#0f1723] p-3.5 space-y-2.5 transition-all shadow-sm"
                  >
                    {/* Module Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#192534] pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {mod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({mod.route})</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              isAllSelected
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60'
                                : activeCount > 0
                                ? 'bg-teal-50 text-[#00897b] dark:bg-teal-950/70 dark:text-[#00e5c9] border border-teal-300 dark:border-teal-700/60'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {activeCount}/{mod.actions.length} Active
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mod.description}
                        </p>
                      </div>

                      {/* Module Actions: Select All / Clear */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectModuleActions(mod, !isAllSelected)}
                          className="rounded px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182637] border border-slate-200 dark:border-[#223348] transition-colors"
                        >
                          {isAllSelected ? 'Clear Module' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    {/* Module Action Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {mod.actions.map((action) => {
                        const isChecked = permissions.includes(action.key);
                        return (
                          <label
                            key={action.key}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer group select-none ${
                              isChecked
                                ? 'bg-teal-50/70 dark:bg-[#00e5c9]/10 border-teal-300 dark:border-[#00e5c9]/35 text-slate-900 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-[#121c2a]/60 border-slate-200 dark:border-[#1a2738] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-[#25374c]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(action.key)}
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 dark:border-[#243549] bg-white dark:bg-[#111b27] text-[#00897b] dark:text-[#00e5c9] accent-[#00897b] dark:accent-[#00e5c9]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold block truncate">
                                  {action.label}
                                </span>
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] uppercase font-bold border ${getActionBadgeStyle(
                                    action.actionType
                                  )}`}
                                >
                                  {action.actionType}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight mt-0.5">
                                {action.description}
                              </p>
                              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5">
                                {action.key}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1c2a3a]">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {grantedCount} privileges configured for this role.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Role...' : isEditing ? 'Save Role Changes' : 'Create System Role'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
