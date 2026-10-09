'use client';

import React, { useState, useEffect } from 'react';
import { StaffPayment, PaymentMethod, PaymentType } from '@/lib/types';
import { paymentService } from '@/lib/api/paymentService';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface EditStaffPaymentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: StaffPayment | null;
  onSuccess?: () => void;
}

export function EditStaffPaymentTransactionModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: EditStaffPaymentTransactionModalProps) {
  const { showToast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>('Salary');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [date, setDate] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setPaymentType(payment.paymentType || 'Salary');
      setAmount(payment.amount || 0);
      setPaymentMethod(payment.paymentMethod || 'Bank Transfer');
      setDate(payment.date || '');
      setMonthYear(payment.monthYear || (payment.date ? payment.date.slice(0, 7) : ''));
      setReferenceNumber(payment.referenceNumber || '');
      setNotes(payment.notes || '');
    }
  }, [payment]);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.updateStaffPayment(payment.id, {
        paymentType,
        amount: Number(amount),
        paidAmount: Number(amount),
        balance: 0,
        monthYear: monthYear || date.slice(0, 7),
        date,
        paymentMethod,
        referenceNumber,
        notes,
      });

      showToast(`✓ Payment ${payment.id} for ${payment.staffName} updated successfully`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Staff Payment Record"
      subtitle={`Modify payment details and payroll attribution for ${payment.staffName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Staff & ID Info Card */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-slate-50 dark:bg-[#0c1420] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Staff Member
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {payment.staffName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Payment ID
            </span>
            <span className="text-xs font-mono font-bold text-[#00897b] dark:text-[#00e5c9]">
              {payment.id}
            </span>
          </div>
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

        {/* Payroll Month & Payment Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payroll Month *
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                (Month credited for salary)
              </span>
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-medium focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Date *
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                (Transaction date)
              </span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Amount */}
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

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Internal Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional context or remarks..."
            className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#00897b] dark:focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

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
            disabled={isSubmitting}
            className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
