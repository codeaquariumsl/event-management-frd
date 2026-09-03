'use client';

import React, { useState } from 'react';
import { PaymentType, PaymentMethod, Staff } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface StaffPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff;
  eventId?: string;
  eventName?: string;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export function StaffPaymentModal({
  isOpen,
  onClose,
  staff,
  eventId,
  eventName,
  defaultAmount,
  onSuccess,
}: StaffPaymentModalProps) {
  const { showToast } = useToast();
  const staffList = mockStore.getStaff();
  const events = mockStore.getEvents();

  const [selectedStaffId, setSelectedStaffId] = useState(staff?.id || staffList[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [paymentType, setPaymentType] = useState<PaymentType>(eventId ? 'Event Payment' : 'Salary');
  const [amount, setAmount] = useState<number>(defaultAmount || 25000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const currentStaff = staffList.find((s) => s.id === selectedStaffId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const targetEvent = events.find((ev) => ev.id === selectedEventId);

    mockStore.saveStaffPayment({
      staffId: selectedStaffId,
      staffName: currentStaff?.name || 'Staff Member',
      eventId: selectedEventId || undefined,
      eventName: targetEvent?.name || eventName || undefined,
      paymentType,
      date,
      amount: Number(amount),
      paidAmount: Number(amount),
      balance: 0,
      status: 'Paid',
      paymentMethod,
      referenceNumber,
      notes,
    });

    showToast(`✓ Payment of ${formatCurrency(Number(amount))} to ${currentStaff?.name} recorded`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Staff Payment / Payout"
      subtitle="Issue event compensation, monthly salary, or travel advance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Staff Member */}
        <div>
          <label className="block font-medium text-slate-300 mb-1">Staff Member *</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            disabled={!!staff}
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none disabled:opacity-75"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role} • {s.employmentType})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Type & Method */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Event Payment">Event Payout</option>
              <option value="Salary">Monthly Base Salary</option>
              <option value="Advance">Travel / Salary Advance</option>
              <option value="Bonus">Performance Bonus</option>
              <option value="Deduction">Deduction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer (Online Wire)</option>
              <option value="Cash">Cash Handover</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Link to Event if applicable */}
        {paymentType === 'Event Payment' && (
          <div>
            <label className="block font-medium text-slate-300 mb-1">Linked Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="">-- Select Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.eventDate})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Amount (LKR) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-semibold focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Reference & Notes */}
        <div>
          <label className="block font-medium text-slate-300 mb-1">Bank Reference / Notes</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. REF-COMBANK-09182 / Cash voucher signed"
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Bank info display */}
        {currentStaff?.bankDetails && (
          <div className="rounded-lg bg-[#0c141f] border border-[#1e2e41] p-3 text-slate-400 text-[11px]">
            <span className="text-white font-semibold block mb-0.5">Direct Bank Information:</span>
            {currentStaff.bankDetails.bankName} • Account: <strong className="text-white font-mono">{currentStaff.bankDetails.accountNumber}</strong> ({currentStaff.bankDetails.branch})
          </div>
        )}

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
            Record Payout
          </button>
        </div>
      </form>
    </Modal>
  );
}
