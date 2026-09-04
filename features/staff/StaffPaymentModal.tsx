'use client';

import React, { useState, useEffect } from 'react';
import { PaymentType, PaymentMethod, Staff, EventItem } from '@/lib/types';
import { staffService } from '@/lib/api/staffService';
import { eventService } from '@/lib/api/eventService';
import { paymentService } from '@/lib/api/paymentService';
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
  const [staffList, setStaffList] = useState<Staff[]>(staff ? [staff] : []);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [selectedStaffId, setSelectedStaffId] = useState(staff?.id || '');
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [paymentType, setPaymentType] = useState<PaymentType>(eventId ? 'Event Payment' : 'Salary');
  const [amount, setAmount] = useState<number>(defaultAmount || 25000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    staffService.getStaff().then((stf) => {
      if (Array.isArray(stf) && stf.length > 0) {
        setStaffList(stf);
        if (!selectedStaffId) setSelectedStaffId(staff?.id || stf[0].id);
      }
    });
    eventService.getEvents().then((evts) => {
      if (Array.isArray(evts)) setEvents(evts);
    });
  }, []);

  const currentStaff = staffList.find((s) => s.id === selectedStaffId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetEvent = events.find((ev) => ev.id === selectedEventId);

      await paymentService.recordStaffPayment({
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
    } catch (err: any) {
      showToast(err.message || 'Failed to record staff payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Staff Member *</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            disabled={!!staff}
            className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none disabled:opacity-75"
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
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
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
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
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
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Linked Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
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
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (LKR) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-semibold focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Reference & Notes */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Reference / Notes</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. REF-COMBANK-09182 / Cash voucher signed"
            className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Bank info display */}
        {currentStaff?.bankDetails && (
          <div className="rounded-lg bg-slate-50/80 dark:bg-[#0c141f] border border-slate-200 dark:border-[#1e2e41] p-3 text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="text-slate-900 dark:text-white font-semibold block mb-0.5">Direct Bank Information:</span>
            {currentStaff.bankDetails.bankName} • Account: <strong className="text-slate-900 dark:text-white font-mono">{currentStaff.bankDetails.accountNumber}</strong> ({currentStaff.bankDetails.branch})
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all"
          >
            Record Payout
          </button>
        </div>
      </form>
    </Modal>
  );
}
