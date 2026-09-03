'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { StaffAssignment, StaffRole, EventItem, Staff } from '@/lib/types';
import { staffService } from '@/lib/api/staffService';
import { eventService } from '@/lib/api/eventService';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface StaffAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventDate: string;
  startTime: string;
  endTime: string;
  currentEventId?: string;
  onAssign: (assignment: StaffAssignment) => void;
  existingAssignments?: StaffAssignment[];
}

export function StaffAssignmentModal({
  isOpen,
  onClose,
  eventDate,
  startTime,
  endTime,
  currentEventId,
  onAssign,
  existingAssignments = [],
}: StaffAssignmentModalProps) {
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [role, setRole] = useState<StaffRole>('DJ');
  const [paymentAmount, setPaymentAmount] = useState<number>(20000);
  const [conflictWarning, setConflictWarning] = useState<{
    hasConflict: boolean;
    conflictingEvent?: EventItem;
    staffName?: string;
  } | null>(null);

  useEffect(() => {
    staffService.getStaff().then((s) => {
      if (Array.isArray(s)) {
        const active = s.filter((item) => item.status === 'Active');
        setStaffList(active);
        if (active.length > 0 && !selectedStaffId) {
          setSelectedStaffId(active[0].id);
          setRole(active[0].role);
          setPaymentAmount(active[0].defaultRatePerEvent || 20000);
        }
      }
    });
  }, []);

  // When staff changes, update default role and rate
  const handleStaffChange = async (staffId: string) => {
    setSelectedStaffId(staffId);
    const staff = staffList.find((s) => s.id === staffId);
    if (staff) {
      setRole(staff.role);
      setPaymentAmount(staff.defaultRatePerEvent || 20000);
    }

    // Proactively check conflict
    const conflict = await eventService.checkStaffConflict(
      staffId,
      eventDate,
      startTime,
      endTime,
      currentEventId
    );
    setConflictWarning(conflict.hasConflict ? conflict : null);
  };

  const handleValidateAndAssign = async (forceAssign: boolean = false) => {
    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    // Prevent duplicate assignment in same event
    const alreadyAssigned = existingAssignments.some((as) => as.staffId === selectedStaffId);
    if (alreadyAssigned) {
      showToast(`${staff.name} is already assigned to this event!`, 'error');
      return;
    }

    // Check conflict
    const conflict = await eventService.checkStaffConflict(
      selectedStaffId,
      eventDate,
      startTime,
      endTime,
      currentEventId
    );

    if (conflict.hasConflict && !forceAssign) {
      setConflictWarning(conflict);
      return;
    }

    // Success assignment
    const newAssignment: StaffAssignment = {
      id: `as-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      role,
      assignedDate: eventDate,
      startTime,
      endTime,
      paymentAmount: Number(paymentAmount),
      paidAmount: 0,
      status: 'Confirmed',
    };

    onAssign(newAssignment);
    showToast(`✓ ${staff.name} assigned as ${role} successfully`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Production Staff"
      subtitle={`Schedule crew for ${eventDate} (${startTime} - ${endTime})`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Conflict Warning Box */}
        {conflictWarning?.hasConflict && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-300 text-sm">⚠ Schedule Conflict Detected</h4>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-white">{conflictWarning.staffName}</strong> is already booked on{' '}
                  <span className="underline font-semibold">{conflictWarning.conflictingEvent?.name}</span>:
                </p>
                <div className="rounded bg-[#0c141f] border border-amber-500/20 p-2 text-[11px] text-amber-100 font-mono">
                  Time: {conflictWarning.conflictingEvent?.startTime} - {conflictWarning.conflictingEvent?.endTime}
                  <br />
                  Venue: {conflictWarning.conflictingEvent?.location}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setConflictWarning(null)}
                className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-900/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleValidateAndAssign(true)}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
              >
                Assign Anyway
              </button>
            </div>
          </div>
        )}

        {/* Staff Member Selection */}
        <div>
          <label className="block font-medium text-slate-300 mb-1">Select Staff Member</label>
          <select
            value={selectedStaffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role} • {s.employmentType})
              </option>
            ))}
          </select>
        </div>

        {/* Role & Payment */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              <option value="DJ">DJ</option>
              <option value="Sound Engineer">Sound Engineer</option>
              <option value="Lighting Technician">Lighting Technician</option>
              <option value="LED Technician">LED Technician</option>
              <option value="Event Manager">Event Manager</option>
              <option value="Driver">Driver</option>
              <option value="Assistant">Assistant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Agreed Payment (LKR)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg bg-[#111a24] border border-[#1d2b3b] p-3 text-slate-400 text-[11px] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00e5c9] shrink-0" />
          <span>Automatic conflict checking is active for this timeslot.</span>
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
            type="button"
            onClick={() => handleValidateAndAssign(false)}
            className="rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-[#041816] hover:bg-[#1affda]"
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </Modal>
  );
}
