'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerType } from '@/lib/types';
import { customerService } from '@/lib/api/customerService';
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
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Individual');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Lead'>('Active');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setCompany(initialData?.company || '');
      setPhone(initialData?.phone || '');
      setEmail(initialData?.email || '');
      setAddress(initialData?.address || '');
      setCustomerType(initialData?.customerType || 'Individual');
      setStatus(initialData?.status || 'Active');
      setNotes(initialData?.notes || '');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Customer name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let saved: Customer;
      if (initialData?.id) {
        saved = await customerService.updateCustomer(initialData.id, {
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          customerType,
          status,
          notes: notes.trim(),
        });
        showToast('✓ Customer updated successfully', 'success');
      } else {
        saved = await customerService.createCustomer({
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          customerType,
          status,
          notes: notes.trim(),
        });
        showToast('✓ Customer created successfully in database', 'success');
      }

      if (onSuccess) onSuccess(saved);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Customer' : 'Create New Customer'}
      subtitle="Register client details for booking, quotations, and invoicing"
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
              placeholder="e.g. Cinnamon Grand / MAS Holdings"
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
              placeholder="e.g. 077 123 4567"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
            {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. nadeesha@gmail.com"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white placeholder-slate-500 focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Customer Classification</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Individual">Individual (Weddings, Private)</option>
              <option value="Corporate">Corporate / Enterprise</option>
              <option value="Hotel">Hotel / Resort Partner</option>
              <option value="Club">Nightclub / Lounge</option>
              <option value="Restaurant">Restaurant / Bar</option>
              <option value="Other">Other Category</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive' | 'Lead')}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Active">Active Client</option>
              <option value="Inactive">Inactive / Suspended</option>
              <option value="Lead">Sales Lead / Inquiring</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Billing City / Area</label>
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
          <label className="block font-medium text-slate-300 mb-1">Notes / Special Preferences</label>
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
            disabled={isSubmitting}
            className="rounded-lg border border-[#233549] bg-[#14202e] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1b2b3d] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-[#041816] hover:bg-[#1affda] transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting && <div className="h-3 w-3 animate-spin rounded-full border border-black border-t-transparent" />}
            <span>{initialData ? 'Save Changes' : 'Create Customer'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
