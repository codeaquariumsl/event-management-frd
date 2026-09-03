'use client';

import React, { useState } from 'react';
import { Customer, CustomerType } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdCustomer: Customer) => void;
  initialData?: Customer;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CustomerModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [customerType, setCustomerType] = useState<CustomerType>(initialData?.customerType || 'Individual');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Customer name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const saved = mockStore.saveCustomer({
      id: initialData?.id,
      name,
      company,
      phone,
      email,
      address,
      customerType,
      notes,
    });

    showToast(initialData ? '✓ Customer updated successfully' : '✓ Customer created successfully');
    if (onSuccess) onSuccess(saved);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Customer' : 'Create New Customer'}
      subtitle="Register client details for booking and invoicing"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Customer / Contact Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Nadeesha Perera"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Dialog Axiata / Private Family"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="e.g. +94 77 123 4567"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
            {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. client@example.com"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Customer Type</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Individual">Individual (Wedding / Private)</option>
              <option value="Corporate">Corporate</option>
              <option value="Hotel">Hotel / Resort</option>
              <option value="Club">Nightclub / Lounge</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Company">Company</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Colombo 07"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">Notes / Preferences</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Special AV requirements, preferred genres, VIP notes..."
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-[#041816] hover:bg-[#1affda] transition-colors"
          >
            {initialData ? 'Save Changes' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
