'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { serviceService } from '@/lib/api/serviceService';
import { formatCurrency } from '@/lib/utils';
import {
  Customer,
  EventItem,
  EventType,
  EventTypeItem,
  ServiceItem,
  StaffAssignment,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { CustomerModal } from '../customers/CustomerModal';
import { StaffAssignmentModal } from './StaffAssignmentModal';

interface EventFormProps {
  initialData?: EventItem;
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dynamicEventTypes, setDynamicEventTypes] = useState<EventTypeItem[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);

  useEffect(() => {
    customerService.getCustomers().then((c) => {
      if (Array.isArray(c)) setCustomers(c);
    });

    eventTypeService.getEventTypes().then((t) => {
      if (Array.isArray(t)) setDynamicEventTypes(t);
    });

    serviceService.getServices().then((s) => {
      if (Array.isArray(s)) setServicesCatalog(s);
    });
  }, []);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // 1. Event Information
  const [name, setName] = useState(initialData?.name || '');
  const [eventType, setEventType] = useState<any>(initialData?.eventType || 'Wedding');
  const [eventDate, setEventDate] = useState(initialData?.eventDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '18:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '23:30');
  const [location, setLocation] = useState(initialData?.location || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState<any>(initialData?.status || 'Confirmed');

  // 2. Customer
  const [customerId, setCustomerId] = useState(initialData?.customerId || customers[0]?.id || '');

  // 3. Services
  const [services, setServices] = useState<ServiceItem[]>(
    initialData?.services || [
      {
        id: `es-${Date.now()}-1`,
        name: servicesCatalog[0]?.name || 'DJ & MC Performance Package',
        category: 'DJ',
        quantity: 1,
        unitPrice: servicesCatalog[0]?.unitPrice || 65000,
        totalPrice: servicesCatalog[0]?.unitPrice || 65000,
        description: 'Standard 4-hour performance',
      },
    ]
  );

  // 4. Staff Assignment
  const [assignedStaff, setAssignedStaff] = useState<StaffAssignment[]>(initialData?.assignedStaff || []);

  // 5. Financial Section
  const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(initialData?.additionalCharges || 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialData?.paidAmount || 0);

  // Computed Financials
  const subtotal = useMemo(() => {
    return services.reduce((sum, s) => sum + s.totalPrice, 0);
  }, [services]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0) + Number(additionalCharges || 0));
  }, [subtotal, discount, additionalCharges]);

  const balance = useMemo(() => {
    return Math.max(0, totalAmount - Number(paidAmount || 0));
  }, [totalAmount, paidAmount]);

  // Service Management Handlers
  const handleAddService = (templateService: any) => {
    const newService: ServiceItem = {
      id: `es-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: templateService.name,
      category: templateService.category,
      quantity: 1,
      unitPrice: templateService.unitPrice,
      totalPrice: templateService.unitPrice,
      description: templateService.description || '',
    };
    setServices((prev) => [...prev, newService]);
  };

  const handleUpdateServiceQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, quantity: validQty, totalPrice: validQty * s.unitPrice } : s
      )
    );
  };

  const handleUpdateServicePrice = (id: string, unitPrice: number) => {
    const validPrice = Math.max(0, unitPrice);
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, unitPrice: validPrice, totalPrice: s.quantity * validPrice } : s
      )
    );
  };

  const handleRemoveService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Staff Assignment Handlers
  const handleAddStaffAssignment = (assignment: StaffAssignment) => {
    setAssignedStaff((prev) => [...prev, assignment]);
  };

  const handleRemoveStaffAssignment = (id: string) => {
    setAssignedStaff((prev) => prev.filter((a) => a.id !== id));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Event Name is required');
      return;
    }
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    if (services.length === 0) {
      alert('Please add at least one service');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);

    const eventPayload = {
      id: initialData?.id,
      name,
      customerId,
      customerName: selectedCustomer?.name || 'Customer',
      customerCompany: selectedCustomer?.company,
      customerPhone: selectedCustomer?.phone,
      customerEmail: selectedCustomer?.email,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      address,
      description,
      notes,
      status,
      services,
      assignedStaff,
      expenses: initialData?.expenses || [],
      subtotal,
      discount: Number(discount || 0),
      additionalCharges: Number(additionalCharges || 0),
      totalAmount,
      paidAmount: Number(paidAmount || 0),
      balance,
    };

    let savedEvent: EventItem;
    if (initialData?.id) {
      savedEvent = await eventService.updateEvent(initialData.id, eventPayload);
    } else {
      savedEvent = await eventService.createEvent(eventPayload);
    }

    showToast(initialData ? '✓ Event updated successfully' : '✓ Event created successfully');
    router.push(`/events/${savedEvent.id}`);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Event Information */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1a2738]">
            <CalendarDays className="h-5 w-5 text-[#00e5c9]" />
            <div>
              <h2 className="text-base font-bold text-white">1. Event Details & Timing</h2>
              <p className="text-xs text-slate-400">Core booking information, event category, and venue coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">Event Title / Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Colombo Wedding Reception — Perera & Fernando"
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-medium focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              >
                {dynamicEventTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
                <option value="Club / Concert">Club / Concert</option>
                <option value="Private Party">Private Party</option>
                <option value="Festival">Festival</option>
                <option value="Hotel Event">Hotel Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Event Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Venue / Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Cinnamon Grand Main Ballroom, Colombo"
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] py-2.5 pl-9 pr-3 text-white focus:border-[#00e5c9] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 77 Galle Road, Colombo 03"
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Event Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Scope of work, theme, audience count, special cues..."
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Internal Operations Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Power breaker requirements, load-in elevator access..."
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Customer Selection */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2738]">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-white">2. Customer Assignment</h2>
                <p className="text-xs text-slate-400">Select an existing client or quickly register a new customer</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#00e5c9]/40 bg-[#00e5c9]/10 px-3 py-1.5 text-xs font-semibold text-[#00e5c9] hover:bg-[#00e5c9]/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Create New Customer</span>
            </button>
          </div>

          <div className="text-xs">
            <label className="block font-medium text-slate-300 mb-1">Select Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:border-[#00e5c9] focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''} • {c.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 3: Services & Equipment Packages */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2738]">
            <div>
              <h2 className="text-base font-bold text-white">3. Services & Production Equipment</h2>
              <p className="text-xs text-slate-400">Itemize DJ, sound, intelligent lighting, and LED screen systems</p>
            </div>

            {/* Quick Add Buttons from Catalog */}
            <div className="flex flex-wrap gap-1.5">
              {servicesCatalog.map((catItem) => (
                <button
                  key={catItem.id}
                  type="button"
                  onClick={() => handleAddService(catItem)}
                  className="rounded-lg border border-[#233549] bg-[#121c2a] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[#00e5c9] hover:text-white transition-colors"
                >
                  + {catItem.name.split(' ')[0]} {catItem.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Services Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f2e41] text-slate-400 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Service Name & Scope</th>
                  <th className="py-2.5 px-3 text-center w-24">Qty</th>
                  <th className="py-2.5 px-3 text-right w-36">Unit Price (LKR)</th>
                  <th className="py-2.5 px-3 text-right w-36">Total (LKR)</th>
                  <th className="py-2.5 px-3 text-right w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182535]">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-[#101824]">
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setServices((prev) =>
                            prev.map((s) => (s.id === service.id ? { ...s, name: val } : s))
                          );
                        }}
                        className="w-full rounded bg-transparent font-medium text-white focus:bg-[#131d2b] focus:outline-none p-1"
                      />
                      <input
                        type="text"
                        value={service.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setServices((prev) =>
                            prev.map((s) => (s.id === service.id ? { ...s, description: val } : s))
                          );
                        }}
                        placeholder="Add notes / specs..."
                        className="w-full rounded bg-transparent text-[11px] text-slate-400 focus:bg-[#131d2b] focus:outline-none p-1 mt-0.5"
                      />
                    </td>

                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        value={service.quantity}
                        onChange={(e) => handleUpdateServiceQuantity(service.id, Number(e.target.value))}
                        className="w-16 rounded border border-[#233549] bg-[#111c29] p-1.5 text-center text-white focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={service.unitPrice}
                        onChange={(e) => handleUpdateServicePrice(service.id, Number(e.target.value))}
                        className="w-28 rounded border border-[#233549] bg-[#111c29] p-1.5 text-right text-white focus:outline-none font-mono"
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-white font-mono">
                      {formatCurrency(service.totalPrice)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove Service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Staff Assignment & Scheduling Conflict Detection */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2738]">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-white">4. Production Crew & Talent</h2>
                <p className="text-xs text-slate-400">Assign resident DJs, sound/lighting engineers, and managers</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#24374b] bg-[#14202e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1c2c3e] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#00e5c9]" />
              <span>+ Assign Staff</span>
            </button>
          </div>

          {assignedStaff.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1f2d3d] p-6 text-center text-xs text-slate-400">
              No staff members assigned yet. Click <strong>+ Assign Staff</strong> to schedule crew.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2e41] text-slate-400 text-[11px] uppercase">
                    <th className="py-2 px-3">Staff Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Timeslot</th>
                    <th className="py-2 px-3 text-right">Agreed Payment</th>
                    <th className="py-2 px-3 text-right w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182535]">
                  {assignedStaff.map((as) => (
                    <tr key={as.id} className="hover:bg-[#101824]">
                      <td className="py-2.5 px-3 font-medium text-white">{as.staffName}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="rounded bg-[#172332] px-2 py-0.5 text-[11px] font-medium text-[#00e5c9]">
                          {as.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {as.startTime} - {as.endTime}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white font-mono">
                        {formatCurrency(as.paymentAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveStaffAssignment(as.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 5: Financial Breakdown */}
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white pb-3 border-b border-[#1a2738]">
            5. Financial Breakdown & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4 sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Special Discount (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Additional Charges (Transport / Generator)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Advance / Paid Amount Collected (LKR)
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="rounded-xl border border-[#223347] bg-[#091019] p-4 space-y-2.5 self-start">
              <div className="flex justify-between text-slate-300">
                <span>Services Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatCurrency(discount)}</span>
                </div>
              )}
              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Additional Charges:</span>
                  <span className="font-mono">+ {formatCurrency(additionalCharges)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#1e2e40]">
                <span>Total Amount:</span>
                <span className="font-mono">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Paid Amount:</span>
                <span className="font-mono">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#00e5c9] pt-2 border-t border-[#1e2e40]">
                <span>Outstanding Balance:</span>
                <span className="font-mono">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[#233549] bg-[#14202e] px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#00e5c9] px-6 py-2.5 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/20 transition-all duration-150"
          >
            {initialData ? 'Save Changes' : 'Create & Confirm Event'}
          </button>
        </div>
      </form>

      {/* Customer Quick Creation Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(created) => setCustomerId(created.id)}
      />

      {/* Staff Assignment Modal with Conflict Check */}
      <StaffAssignmentModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        eventDate={eventDate}
        startTime={startTime}
        endTime={endTime}
        currentEventId={initialData?.id}
        existingAssignments={assignedStaff}
        onAssign={handleAddStaffAssignment}
      />
    </>
  );
}
