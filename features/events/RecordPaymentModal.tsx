'use client';

import React, { useState } from 'react';
import { EventItem, PaymentMethod } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onPaymentRecorded?: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  event,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<number>(event.balance > 0 ? event.balance : 50000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    mockStore.saveCustomerPayment({
      invoiceNumber: `INV-${event.id.replace('EVT-', '')}`,
      eventId: event.id,
      eventName: event.name,
      customerId: event.customerId,
      customerName: event.customerName,
      date,
      amount: Number(amount),
      paymentMethod,
      referenceNumber,
      notes,
      status: 'Paid',
      eventTotal: event.totalAmount,
      eventPaid: event.paidAmount + Number(amount),
      eventBalance: Math.max(0, event.balance - Number(amount)),
    });

    showToast(`✓ Payment of ${formatCurrency(Number(amount))} recorded successfully`);
    if (onPaymentRecorded) onPaymentRecorded();
    onClose();
  };

  const remainingAfterPayment = Math.max(0, event.balance - Number(amount || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle={`Billing for ${event.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Outstanding Balance Banner */}
        <div className="rounded-xl border border-[#213449] bg-[#0c1522] p-4 flex justify-between items-center">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Current Outstanding Balance
            </span>
            <span className="text-xl font-extrabold text-[#00e5c9] mt-0.5 block">
              {formatCurrency(event.balance)}
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <span>Total: {formatCurrency(event.totalAmount)}</span>
            <br />
            <span>Paid to Date: {formatCurrency(event.paidAmount)}</span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-medium text-slate-300">Payment Amount (LKR) *</label>
            <button
              type="button"
              onClick={() => setAmount(event.balance)}
              className="text-[11px] text-[#00e5c9] hover:underline"
            >
              Pay Full Balance
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            max={event.balance > 0 ? event.balance : undefined}
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-semibold text-sm focus:border-[#00e5c9] focus:outline-none"
            required
          />
        </div>

        {/* Payment Method & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer (Commercial Bank)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Cheque">Cheque</option>
              <option value="Online Gateway">Online Gateway</option>
              <option value="Other">Other</option>
            </select>
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

        {/* Reference Number */}
        <div>
          <label className="block font-medium text-slate-300 mb-1">
            Transaction / Cheque Reference #
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. TXN-COMBANK-89104 / CHQ-10492"
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium text-slate-300 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Advance payment cleared"
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Projected Balance */}
        <div className="rounded-lg bg-[#111c29] p-3 text-slate-400 text-xs flex justify-between">
          <span>Projected Remaining Balance:</span>
          <strong className={remainingAfterPayment === 0 ? 'text-emerald-400' : 'text-white'}>
            {formatCurrency(remainingAfterPayment)}
          </strong>
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
            Record Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
