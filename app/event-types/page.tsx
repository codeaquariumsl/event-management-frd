'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Briefcase,
  Music,
  Heart,
  PartyPopper,
  Tent,
  Building2,
  Palette,
  Hash,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { EventTypeItem } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';

const COLOR_PALETTES = [
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#00e5c9', // Teal
  '#ef4444', // Red
  '#6366f1', // Indigo
];

export default function EventTypesPage() {
  const { showToast } = useToast();
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventTypeItem | null>(null);
  const [formData, setFormData] = useState<Partial<EventTypeItem>>({
    name: '',
    code: '',
    description: '',
    color: '#00e5c9',
    isActive: true,
  });

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EventTypeItem | null>(null);

  const loadData = async () => {
    try {
      const data = await eventTypeService.getEventTypes();
      if (Array.isArray(data)) setEventTypes(data);
    } catch {
      setEventTypes(mockStore.getEventTypes());
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, []);

  const events = mockStore.getEvents();

  // Event counts by type
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((ev) => {
      const typeName = ev.eventType;
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    return counts;
  }, [events]);

  const filteredTypes = useMemo(() => {
    return eventTypes.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'Active') return item.isActive;
      if (statusFilter === 'Inactive') return !item.isActive;
      return true;
    });
  }, [eventTypes, searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      color: COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventTypeItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Event type name is required', 'error');
      return;
    }

    const code =
      formData.code?.trim() ||
      formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10);

    const typePayload = {
      ...formData,
      id: editingItem ? editingItem.id : undefined,
      name: formData.name.trim(),
      code,
      color: formData.color || '#00e5c9',
      isActive: formData.isActive ?? true,
    };

    if (editingItem) {
      await eventTypeService.updateEventType(editingItem.id, typePayload);
    } else {
      await eventTypeService.createEventType(typePayload);
    }

    showToast(
      editingItem ? 'Event type updated successfully' : 'New event type created successfully',
      'success'
    );
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await eventTypeService.deleteEventType(itemToDelete.id);
    showToast(`Event type "${itemToDelete.name}" deleted`, 'success');
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    loadData();
  };

  const toggleStatus = async (item: EventTypeItem) => {
    await eventTypeService.updateEventType(item.id, {
      ...item,
      isActive: !item.isActive,
    });
    showToast(`"${item.name}" set to ${!item.isActive ? 'Active' : 'Inactive'}`, 'info');
    loadData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
        title="Event Types"
        subtitle="Manage event categories, color themes, and standard event classifications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Event Types' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 shadow-lg shadow-[#00e5c9]/20"
          >
            <Plus className="h-4 w-4" />
            Add Event Type
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Event Types"
          value={eventTypes.length}
          icon={Layers}
          accentColor="teal"
        />
        <StatCard
          title="Active Categories"
          value={eventTypes.filter((t) => t.isActive).length}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Total Booked Events"
          value={events.length}
          icon={Calendar}
          accentColor="blue"
        />
        <StatCard
          title="Most Popular"
          value={
            eventTypes.length > 0
              ? [...eventTypes].sort(
                  (a, b) =>
                    (eventCounts[b.name] || eventCounts[b.code] || 0) -
                    (eventCounts[a.name] || eventCounts[a.code] || 0)
                )[0]?.name || 'None'
              : 'N/A'
          }
          icon={Sparkles}
          accentColor="purple"
        />
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-xl bg-[#0e1622] border border-[#1d2b3c] p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5c9] focus:ring-1 focus:ring-[#00e5c9]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['All', 'Active', 'Inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === tab
                  ? 'bg-[#00e5c9] text-black shadow-sm'
                  : 'bg-[#131d2a] text-slate-400 hover:text-white border border-[#1f2f42]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Event Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTypes.map((item) => {
          const count = eventCounts[item.name] || eventCounts[item.code] || 0;
          return (
            <div
              key={item.id}
              className="group relative rounded-xl bg-[#0e1622] border border-[#1d2b3c] p-5 hover:border-[#2b3e55] transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-inner"
                      style={{
                        backgroundColor: `${item.color}20`,
                        border: `1px solid ${item.color}50`,
                        color: item.color,
                      }}
                    >
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-[#00e5c9] transition-colors">
                        {item.name}
                      </h3>
                      <span className="inline-flex items-center text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#162232] text-slate-400 border border-[#213348] mt-0.5">
                        <Hash className="h-3 w-3 mr-0.5 text-slate-500" />
                        {item.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(item)}
                    title={item.isActive ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || 'No description provided for this event type.'}
                </p>
              </div>

              {/* Card Bottom Row */}
              <div className="mt-5 pt-3 border-t border-[#1a2636] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-[#00e5c9]" />
                  <span>
                    <strong className="text-white">{count}</strong> booked {count === 1 ? 'event' : 'events'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182535] transition-colors"
                    title="Edit Event Type"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete Event Type"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-16 rounded-xl bg-[#0e1622] border border-[#1d2b3c]">
          <Layers className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No Event Types Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No event types matched "${searchQuery}". Try a different search term.`
              : 'Create your first event type to start categorizing events and quotations.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Event Type
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Event Type' : 'Create Event Type'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Event Type Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wedding & Reception, Corporate Gala"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5c9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Code / Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. WEDDING, GALA"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 font-mono uppercase bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
                className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white focus:outline-none focus:border-[#00e5c9]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Theme Color Accent
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTES.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    formData.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0e1622]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color || '#00e5c9'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer bg-transparent border-none"
                title="Custom color"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the event type, scale, and audiovisual requirements..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5c9]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1d2b3c]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#162232] text-slate-300 hover:bg-[#1d2d42] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] text-black text-xs font-semibold hover:brightness-110 shadow-md shadow-[#00e5c9]/20"
            >
              {editingItem ? 'Save Changes' : 'Create Event Type'}
            </button>
          </div>
        </form>
      </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Event Type"
          message={`Are you sure you want to delete "${itemToDelete?.name}"? Events currently using this type will retain their classification.`}
          confirmLabel="Delete Event Type"
          isDestructive={true}
        />
      </div>
    </AppShell>
  );
}
