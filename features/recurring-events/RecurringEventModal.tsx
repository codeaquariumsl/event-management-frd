'use client';

import React, { useState } from 'react';
import { RecurringEvent, RecurringFrequency, EventType } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface RecurringEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: RecurringEvent;
}

export function RecurringEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: RecurringEventModalProps) {
  const { showToast } = useToast();
  const customers = mockStore.getCustomers();
  const staffList = mockStore.getStaff();
  const servicesCatalog = mockStore.getServicesCatalog();

  const [seriesName, setSeriesName] = useState(initialData?.seriesName || '');
  const [customerId, setCustomerId] = useState(initialData?.customerId || customers[0]?.id || '');
  const [eventType, setEventType] = useState<EventType>(initialData?.eventType || 'Club / Concert');
  const [frequency, setFrequency] = useState<RecurringFrequency>(initialData?.frequency || 'Weekly');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '2026-12-31');
  const [eventDay, setEventDay] = useState(initialData?.eventDay || 'Friday');
  const [startTime, setStartTime] = useState(initialData?.startTime || '21:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '03:00');
  const [location, setLocation] = useState(initialData?.location || 'Colombo');
  const [defaultPrice, setDefaultPrice] = useState(initialData?.defaultPrice || 140000);
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || 'Weekly settlement');
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(initialData?.assignedStaffIds || []);

  const handleToggleStaff = (staffId: string) => {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim() || !customerId) {
      alert('Please fill in required fields');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);

    mockStore.saveRecurringEvent({
      id: initialData?.id,
      seriesName,
      customerId,
      customerName: customer?.name || 'Customer',
      eventType,
      frequency,
      startDate,
      endDate,
      eventDay,
      startTime,
      endTime,
      location,
      defaultPrice: Number(defaultPrice),
      paymentTerms,
      assignedStaffIds,
      services: [
        {
          id: 's-def-1',
          name: 'DJ & MC Performance Package',
          category: 'DJ',
          quantity: 1,
          unitPrice: 65000,
          totalPrice: 65000,
        },
      ],
    });

    showToast(initialData ? '✓ Recurring series updated' : '✓ Recurring series created successfully');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Event Series' : 'New Recurring Event Series'}
      subtitle="Define repeating club nights, hotel entertainment, or corporate townhalls"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-300 mb-1">Series Name *</label>
          <input
            type="text"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="e.g. Friday Night Club Resonance — Kama Colombo"
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Customer / Venue *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Club / Concert">Club / Concert</option>
              <option value="Hotel Event">Hotel Event</option>
              <option value="Corporate">Corporate</option>
              <option value="Wedding">Wedding</option>
              <option value="Festival">Festival</option>
              <option value="Private Party">Private Party</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Biweekly">Biweekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Daily">Daily</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Day of Week</label>
            <input
              type="text"
              value={eventDay}
              onChange={(e) => setEventDay(e.target.value)}
              placeholder="e.g. Every Friday"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Location / Venue</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kama Club Colombo 07"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Default Price Per Session (LKR)</label>
            <input
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-semibold focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        {/* Assigned Staff Checkboxes */}
        <div>
          <label className="block font-medium text-slate-300 mb-2">Default Production Staff Crew</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-[#233549] rounded-lg bg-[#0c141f]">
            {staffList.map((s) => {
              const checked = assignedStaffIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-[11px] ${
                    checked ? 'bg-[#00e5c9]/15 text-[#00e5c9]' : 'text-slate-400 hover:bg-[#15212f]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleStaff(s.id)}
                    className="rounded border-[#2b3c4f] bg-[#101925] text-[#00e5c9] focus:ring-0"
                  />
                  <span className="truncate">{s.name} ({s.role})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1b2b3d]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-[#041816] hover:bg-[#1affda]"
          >
            {initialData ? 'Save Changes' : 'Create Series'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
