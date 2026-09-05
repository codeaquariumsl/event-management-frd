'use client';

import React, { useState, useEffect } from 'react';
import { StaffAssignment, StaffRole } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CheckCircle2 } from 'lucide-react';

interface EditStaffPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: StaffAssignment | null;
  onSave: (assignmentId: string, updatedData: Partial<StaffAssignment>) => Promise<void> | void;
}

const ROLES: StaffRole[] = [
  'DJ',
  'VJ',
  'Sound Engineer',
  'Lighting Technician',
  'LED Technician',
  'Event Manager',
  'Driver',
  'Assistant',
  'Other',
];

export function EditStaffPaymentModal({
  isOpen,
  onClose,
  assignment,
  onSave,
}: EditStaffPaymentModalProps) {
  const [role, setRole] = useState<StaffRole>('Assistant');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [status, setStatus] = useState<StaffAssignment['status']>('Assigned');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:30');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assignment) {
      setRole(assignment.role);
      setPaymentAmount(assignment.paymentAmount || 0);
      setPaidAmount(assignment.paidAmount || 0);
      setStatus(assignment.status || 'Assigned');
      setStartTime(assignment.startTime || '18:00');
      setEndTime(assignment.endTime || '23:30');
      setNotes(assignment.notes || '');
    }
  }, [assignment]);

  if (!assignment) return null;

  const balance = Math.max(0, paymentAmount - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(assignment.id, {
        role,
        paymentAmount: Number(paymentAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        status,
        startTime,
        endTime,
        notes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Staff Payment & Crew Details"
      subtitle={`Manage agreed compensation and recorded payouts for ${assignment.staffName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Staff Name & Role Card */}
        <div className="rounded-xl border border-slate-200 dark:border-[#203144] bg-slate-50 dark:bg-[#0c1420] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Crew Member
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {assignment.staffName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Outstanding Due
            </span>
            <span className="text-sm font-bold font-mono text-amber-500 dark:text-amber-400">
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        {/* Role & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assigned Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assignment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Assigned">Assigned</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Financial Inputs: Agreed Payment & Paid to Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Agreed Rate / Payment (LKR) *
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono font-semibold focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Paid Amount (LKR)
              </label>
              <button
                type="button"
                onClick={() => setPaidAmount(paymentAmount)}
                className="text-[10px] text-[#00897b] dark:text-[#00e5c9] hover:underline"
              >
                Mark Full Paid
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={paymentAmount}
                step={500}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono font-semibold text-emerald-600 dark:text-emerald-400 focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Timeslot */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Production Notes / Role Instructions
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. In charge of subwoofers and stage monitors"
            className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00e5c9]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Payment Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
