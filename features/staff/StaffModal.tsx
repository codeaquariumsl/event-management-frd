'use client';

import React, { useState } from 'react';
import { Staff, StaffRole, EmploymentType, StaffStatus } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (saved: Staff) => void;
  initialData?: Staff;
}

export function StaffModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: StaffModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState<StaffRole>(initialData?.role || 'DJ');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(initialData?.employmentType || 'Freelance');
  const [status, setStatus] = useState<StaffStatus>(initialData?.status || 'Active');
  const [skills, setSkills] = useState(initialData?.skills.join(', ') || '');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary || 0);
  const [defaultRate, setDefaultRate] = useState(initialData?.defaultRatePerEvent || 20000);
  const [bankName, setBankName] = useState(initialData?.bankDetails?.bankName || 'Commercial Bank');
  const [accountNumber, setAccountNumber] = useState(initialData?.bankDetails?.accountNumber || '');
  const [branch, setBranch] = useState(initialData?.bankDetails?.branch || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please fill in required fields');
      return;
    }

    const saved = mockStore.saveStaff({
      id: initialData?.id,
      name,
      phone,
      email,
      role,
      employmentType,
      status,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      basicSalary: Number(basicSalary),
      defaultRatePerEvent: Number(defaultRate),
      bankDetails: {
        bankName,
        accountNumber,
        branch,
      },
    });

    showToast(initialData ? '✓ Staff profile updated' : '✓ Staff member added successfully');
    if (onSuccess) onSuccess(saved);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Staff Member' : 'Add New Production Crew / Staff'}
      subtitle="Manage team members, performance roles, and compensation"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasun Perera"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="DJ">DJ & MC</option>
              <option value="Sound Engineer">Sound Engineer</option>
              <option value="Lighting Technician">Lighting Technician</option>
              <option value="LED Technician">LED Technician</option>
              <option value="Event Manager">Event Manager</option>
              <option value="Driver">Driver & Logistics</option>
              <option value="Assistant">Assistant / Crew</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@seekers.lk"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Freelance">Freelance</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StaffStatus)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">Skills & Specializations (comma separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Rekordbox Pro, GrandMA3, Allen & Heath, Line Array"
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
          />
        </div>

        {/* Compensation */}
        <div className="p-3.5 rounded-xl border border-[#203144] bg-[#0c141f] space-y-3">
          <span className="font-semibold text-white block">Compensation & Bank Details</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Monthly Basic Salary (LKR)</label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2 text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Default Rate Per Event (LKR)</label>
              <input
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2 text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#182332]">
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded border border-[#233549] bg-[#111c29] p-1.5 text-[11px] text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Account No</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded border border-[#233549] bg-[#111c29] p-1.5 text-[11px] text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded border border-[#233549] bg-[#111c29] p-1.5 text-[11px] text-white"
              />
            </div>
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
            {initialData ? 'Save Changes' : 'Add Staff Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
