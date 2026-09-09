'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Package,
  Sparkles,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { serviceService } from '@/lib/api/serviceService';
import { inventoryService } from '@/lib/api/inventoryService';
import { formatCurrency } from '@/lib/utils';
import {
  Customer,
  EventItem,
  EventStatus,
  EventType,
  EventTypeItem,
  ServiceItem,
  StaffAssignment,
  InventoryItem,
  ServiceCatalogItem,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { CustomerModal } from '../customers/CustomerModal';
import { StaffAssignmentModal } from './StaffAssignmentModal';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

// Helper functions for DD/MM/YYYY date formatting
const getTodayDDMMYYYY = (): string => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

const toDDMMYYYY = (dateStr?: string): string => {
  if (!dateStr) return getTodayDDMMYYYY();
  const trimmed = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const [y, m, d] = trimmed.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
};

const toYYYYMMDD = (dateStr?: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const trimmed = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    return trimmed.split('T')[0];
  }
  return trimmed;
};

interface EventFormProps {
  initialData?: EventItem;
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dynamicEventTypes, setDynamicEventTypes] = useState<EventTypeItem[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);
  const [inventoryGear, setInventoryGear] = useState<InventoryItem[]>([]);

  useEffect(() => {
    customerService.getCustomers().then((c) => {
      if (Array.isArray(c)) {
        setCustomers(c);
        if (initialData?.customerId) {
          setCustomerId(initialData.customerId);
        }
      }
    });

    eventTypeService.getEventTypes().then((t) => {
      if (Array.isArray(t) && t.length > 0) {
        setDynamicEventTypes(t);
        if (!initialData?.eventType) {
          setEventType(t[0].name);
        }
      }
    });

    serviceService.getServices().then((s) => {
      if (Array.isArray(s)) setServicesCatalog(s);
    });

    inventoryService.getItems().then((items) => {
      if (Array.isArray(items)) setInventoryGear(items);
    });
  }, [initialData]);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // 1. Customer Selection (Selected first)
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');

  // 2. Event Information
  const [name, setName] = useState(initialData?.name || '');
  const [eventType, setEventType] = useState<string>(initialData?.eventType || '');
  const [eventDate, setEventDate] = useState(
    initialData?.eventDate ? toDDMMYYYY(initialData.eventDate) : getTodayDDMMYYYY()
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || '18:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '23:30');
  const [location, setLocation] = useState(initialData?.location || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState<any>(initialData?.status || 'Confirmed');

  // Selected customer memo
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Handle customer selection and auto-load address into Venue / Location
  const handleCustomerChange = (newCustomerId: string, customerObj?: Customer) => {
    setCustomerId(newCustomerId);
    if (!newCustomerId) return;
    const selected = customerObj || customers.find((c) => c.id === newCustomerId);
    if (selected) {
      // Auto-load customer address to Venue / Location and Street Address
      const venueStr = selected.address || '';

      setLocation(venueStr);
      if (selected.address) {
        setAddress(selected.address);
      }
      showToast(`✓ Loaded venue address from ${selected.name}`);
    }
  };

  // Searchable Options for Customer, Gear, and Catalog Packages
  const customerOptions = useMemo<SearchableOption[]>(() => {
    return customers.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: [c.company, c.phone, c.address].filter(Boolean).join(' • '),
      badge: c.company || c.customerType,
      category: c.customerType,
      extraInfo: c.phone,
      raw: c,
    }));
  }, [customers]);

  const gearOptions = useMemo<SearchableOption[]>(() => {
    return inventoryGear.map((gear) => ({
      value: gear.id,
      label: gear.name,
      sublabel: `SKU: ${gear.sku} • In Stock: ${gear.availableQuantity ?? gear.totalStock ?? 0} ${gear.unit || 'units'}`,
      badge: gear.category,
      category: gear.category,
      extraInfo: `Rs. ${(gear.rentalRate || gear.unitPrice || 0).toLocaleString()}/day`,
      raw: gear,
    }));
  }, [inventoryGear]);

  const catalogOptions = useMemo<SearchableOption[]>(() => {
    return servicesCatalog.map((pkg) => ({
      value: pkg.id,
      label: pkg.name,
      sublabel: pkg.description || `Category: ${pkg.category}`,
      badge: pkg.category,
      category: pkg.category,
      extraInfo: `Rs. ${pkg.unitPrice.toLocaleString()}`,
      raw: pkg,
    }));
  }, [servicesCatalog]);

  // 3. Services & Production Equipment
  const [services, setServices] = useState<ServiceItem[]>(initialData?.services || []);

  // 4. Staff Assignment
  const [assignedStaff, setAssignedStaff] = useState<StaffAssignment[]>(initialData?.assignedStaff || []);

  // 5. Financial Section
  const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(initialData?.additionalCharges || 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialData?.paidAmount || 0);

  // Sync initialData if loaded or updated
  useEffect(() => {
    if (initialData) {
      if (initialData.customerId) setCustomerId(initialData.customerId);
      if (initialData.name) setName(initialData.name);
      if (initialData.eventType) setEventType(initialData.eventType);
      if (initialData.eventDate) setEventDate(toDDMMYYYY(initialData.eventDate));
      if (initialData.startTime) setStartTime(initialData.startTime);
      if (initialData.endTime) setEndTime(initialData.endTime);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.address !== undefined) setAddress(initialData.address);
      if (initialData.description !== undefined) setDescription(initialData.description);
      if (initialData.notes !== undefined) setNotes(initialData.notes);
      if (initialData.status) setStatus(initialData.status);
      if (initialData.services) setServices(initialData.services);
      if (initialData.assignedStaff) setAssignedStaff(initialData.assignedStaff);
      if (initialData.discount !== undefined) setDiscount(initialData.discount);
      if (initialData.additionalCharges !== undefined) setAdditionalCharges(initialData.additionalCharges);
      if (initialData.paidAmount !== undefined) setPaidAmount(initialData.paidAmount);
    }
  }, [initialData]);

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
      size: '',
      quantity: 1,
      unitPrice: templateService.unitPrice,
      totalPrice: templateService.unitPrice,
      description: templateService.description || '',
    };
    setServices((prev) => [...prev, newService]);
    showToast(`✓ Added "${templateService.name}"`);
  };

  const handleAddInventoryGear = (item: InventoryItem) => {
    const rate = item.rentalRate || item.unitPrice || 0;
    const newService: ServiceItem = {
      id: `es-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      category: item.category || 'Production',
      size: item.specifications || '',
      quantity: 1,
      unitPrice: rate,
      totalPrice: rate,
      description: `Gear Item (SKU: ${item.sku})`,
    };
    setServices((prev) => [...prev, newService]);
    showToast(`✓ Added gear "${item.name}"`);
  };

  const handleAddCustomLine = () => {
    const newService: ServiceItem = {
      id: `es-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      category: 'Production',
      size: '',
      quantity: null,
      unitPrice: 0,
      totalPrice: 0,
      description: '',
    };
    setServices((prev) => [...prev, newService]);
  };

  const handleUpdateServiceSize = (id: string, size: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, size } : s))
    );
  };

  const handleUpdateServiceQuantity = (id: string, val: string) => {
    const parsedQty = val.trim() === '' ? null : Number(val);
    const validQty = parsedQty !== null && !isNaN(parsedQty) ? Math.max(0, parsedQty) : null;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const multiplier = validQty !== null && validQty > 0 ? validQty : 1;
        return {
          ...s,
          quantity: validQty,
          totalPrice: multiplier * s.unitPrice,
        };
      })
    );
  };

  const handleUpdateServicePrice = (id: string, unitPrice: number) => {
    const validPrice = Math.max(0, unitPrice);
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const multiplier = s.quantity !== null && s.quantity !== undefined && s.quantity > 0 ? s.quantity : 1;
        return {
          ...s,
          unitPrice: validPrice,
          totalPrice: multiplier * validPrice,
        };
      })
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
  const handleSubmit = async (e?: React.FormEvent, overrideStatus?: EventStatus) => {
    if (e) e.preventDefault();
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
    const finalStatus: EventStatus = overrideStatus || (status as EventStatus) || (initialData ? initialData.status : 'Confirmed');

    const isoEventDate = toYYYYMMDD(eventDate);
    if (!isoEventDate || isNaN(new Date(isoEventDate).getTime())) {
      alert('Please enter a valid Event Date in DD/MM/YYYY format');
      return;
    }

    const eventPayload = {
      id: initialData?.id,
      name,
      customerId,
      customerName: selectedCustomer?.name || initialData?.customerName || 'Customer',
      customerCompany: selectedCustomer?.company || initialData?.customerCompany,
      customerPhone: selectedCustomer?.phone || initialData?.customerPhone,
      customerEmail: selectedCustomer?.email || initialData?.customerEmail,
      eventType,
      eventDate: isoEventDate,
      startTime,
      endTime,
      location,
      address,
      description,
      notes,
      status: finalStatus,
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

    const toastMsg = initialData
      ? (overrideStatus === 'Completed' ? '✓ Event updated and marked Completed' : '✓ Event updated successfully')
      : (overrideStatus === 'Completed' ? '✓ Event created and marked Completed' : '✓ Event created successfully');

    showToast(toastMsg);
    router.push(`/events/${savedEvent.id}`);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Customer Selection (Firstly Select Customer) */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2738]">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#00897b] dark:text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Select Customer *</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">First select the client to automatically load their address into the venue location</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#00a894]/40 dark:border-[#00e5c9]/40 bg-[#00a894]/10 dark:bg-[#00e5c9]/10 px-3 py-1.5 text-xs font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-[#00a894]/20 dark:hover:bg-[#00e5c9]/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Customer</span>
            </button>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Customer / Client *</label>
              <SearchableSelect
                options={customerOptions}
                value={customerId}
                onChange={(val, opt) => handleCustomerChange(val, opt?.raw)}
                placeholder={`-- Choose a Customer (${customers.length} available) * --`}
                searchPlaceholder="Search client by name, company, phone, address..."
                clearable={true}
                required={true}
                emptyMessage="No matching customers found"
              />
            </div>

            {selectedCustomer && (
              <div className="rounded-lg border border-slate-200 dark:border-[#1e2f42] bg-slate-50 dark:bg-[#101926] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#00a894]/15 dark:bg-[#00e5c9]/15 border border-[#00a894]/30 dark:border-[#00e5c9]/30 flex items-center justify-center text-[#00897b] dark:text-[#00e5c9] font-bold text-sm">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {selectedCustomer.name} {selectedCustomer.company ? `(${selectedCustomer.company})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Phone: {selectedCustomer.phone} • Email: {selectedCustomer.email || 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedCustomer.address && (
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#00897b] dark:text-[#00e5c9] uppercase tracking-wider block font-semibold">
                      Venue Location
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-medium block">
                      {selectedCustomer.address}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Event Details & Timing */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#1a2738]">
            <CalendarDays className="h-5 w-5 text-[#00897b] dark:text-[#00e5c9]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Event Details & Timing</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Core booking information, event category, and venue coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title / Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Colombo Wedding Reception — Perera & Fernando"
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-medium focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-700 dark:text-slate-300">Event Type *</label>
                <button
                  type="button"
                  onClick={() => router.push('/event-types')}
                  className="text-[10px] text-[#00897b] dark:text-[#00e5c9] hover:underline"
                >
                  Manage
                </button>
              </div>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                required
              >
                {dynamicEventTypes.length === 0 ? (
                  <option value="">No event types in database</option>
                ) : (
                  dynamicEventTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Event Date (DD/MM/YYYY) *
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  onBlur={() => {
                    if (eventDate) {
                      setEventDate(toDDMMYYYY(eventDate));
                    }
                  }}
                  placeholder="DD/MM/YYYY"
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 pr-10 text-slate-900 dark:text-white font-medium focus:border-[#00e5c9] focus:outline-none"
                  required
                />
                <input
                  type="date"
                  ref={datePickerRef}
                  value={toYYYYMMDD(eventDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setEventDate(toDDMMYYYY(e.target.value));
                    }
                  }}
                  className="sr-only pointer-events-none absolute opacity-0"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (datePickerRef.current) {
                      if (typeof datePickerRef.current.showPicker === 'function') {
                        datePickerRef.current.showPicker();
                      } else {
                        datePickerRef.current.click();
                      }
                    }
                  }}
                  className="absolute right-2 p-1.5 text-slate-400 hover:text-[#00897b] dark:hover:text-[#00e5c9] transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-[#162232]"
                  title="Choose from calendar"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-700 dark:text-slate-300">Venue / Location *</label>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Cinnamon Grand Main Ballroom, Colombo"
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] py-2.5 pl-9 pr-3 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 77 Galle Road, Colombo 03"
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Event Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Scope of work, theme, audience count, special cues..."
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Internal Operations Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Power breaker requirements, load-in elevator access..."
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Services & Equipment Packages */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1a2738]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Services & Production Equipment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Load real packages from service catalog or gear from inventory</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddCustomLine}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#142030] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c2c3e] hover:text-[#00897b] dark:hover:text-[#00e5c9] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Custom Item</span>
              </button>
            </div>
          </div>

          {/* Real Backend Data Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1b2a3d] bg-slate-50 dark:bg-[#0f1826]">
            {/* Standard Service Catalog */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" /> Add Pre-configured Package ({servicesCatalog.length} packages)
              </label>
              <SearchableSelect
                options={catalogOptions}
                value=""
                resetOnSelect={true}
                onChange={(val, opt) => {
                  if (opt?.raw) {
                    handleAddService(opt.raw);
                  }
                }}
                placeholder={`-- Search & select package to add to event (${servicesCatalog.length} packages) --`}
                searchPlaceholder="Search packages by title or category..."
                emptyMessage="No packages match your search"
              />
            </div>

            {/* Inventory Gear Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Add From Inventory Gear ({inventoryGear.length} units)
              </label>
              <SearchableSelect
                options={gearOptions}
                value=""
                resetOnSelect={true}
                onChange={(val, opt) => {
                  if (opt?.raw) {
                    handleAddInventoryGear(opt.raw);
                  }
                }}
                placeholder={`-- Search & select gear to add to event (${inventoryGear.length} items) --`}
                searchPlaceholder="Search gear by name, SKU, or category..."
                emptyMessage="No inventory gear matches your search"
              />
            </div>
          </div>

          {/* Services Table or Empty State */}
          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#233549] p-8 text-center bg-slate-50 dark:bg-[#0d1622]">
              <Package className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-900 dark:text-white text-xs">No services or equipment added yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Use the dropdowns above to select real packages from your service catalog, hardware from your inventory gear, or add a custom line item.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1f2e41] text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Service / Gear Name & Specs</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 w-40">Size / Dimension</th>
                    <th className="py-2.5 px-3 text-center w-20">Qty</th>
                    <th className="py-2.5 px-3 text-right w-36">Unit Price (LKR)</th>
                    <th className="py-2.5 px-3 text-right w-36">Total (LKR)</th>
                    <th className="py-2.5 px-3 text-right w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#182535]">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-[#101824] transition-colors">
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Line Array System / Moving Heads"
                          value={service.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServices((prev) =>
                              prev.map((s) => (s.id === service.id ? { ...s, name: val } : s))
                            );
                          }}
                          className="w-full rounded bg-transparent font-medium text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-[#131d2b] focus:outline-none p-1"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <span className="rounded bg-slate-100 dark:bg-[#162232] border border-slate-200 dark:border-[#233549] px-2 py-0.5 text-[10px] font-semibold text-[#00897b] dark:text-[#00e5c9]">
                          {service.category || 'Production'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="e.g. 12*7 ft, 20 ft"
                          value={service.size || ''}
                          onChange={(e) => handleUpdateServiceSize(service.id, e.target.value)}
                          className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                          title="Custom size or dimensions (e.g. 12*7 ft, 20 ft, 20*40 ft)"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          placeholder="—"
                          value={service.quantity !== null && service.quantity !== undefined ? service.quantity : ''}
                          onChange={(e) => handleUpdateServiceQuantity(service.id, e.target.value)}
                          className="w-16 rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-1.5 text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                          title="Optional. Leave blank for flat-rate / set pricing"
                        />
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={service.unitPrice}
                          onChange={(e) => handleUpdateServicePrice(service.id, Number(e.target.value))}
                          className="w-28 rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-1.5 text-right text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9] font-mono"
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(service.totalPrice)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.id)}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                          title="Remove Service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 px-1">
                <Sparkles className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9] shrink-0" />
                <span>
                  <strong>Tip for custom sizes:</strong> For items like LED screens, truss stands, or platforms, enter the size in <em>Size / Dimension</em> (e.g. <code>12*7 ft</code>, <code>20 ft</code>) and leave <em>Qty</em> empty for flat package pricing.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Staff Assignment & Scheduling Conflict Detection */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2738]">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#00897b] dark:text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Production Crew & Talent</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Assign resident DJs, sound/lighting engineers, and managers</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#24374b] bg-slate-100 dark:bg-[#14202e] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c3e] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
              <span>Assign Staff</span>
            </button>
          </div>

          {assignedStaff.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#1f2d3d] p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No staff members assigned yet. Click <strong>+ Assign Staff</strong> to schedule crew.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1f2e41] text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                    <th className="py-2 px-3">Staff Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Timeslot</th>
                    <th className="py-2 px-3 text-right">Agreed Payment</th>
                    <th className="py-2 px-3 text-right w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#182535]">
                  {assignedStaff.map((as) => (
                    <tr key={as.id} className="hover:bg-slate-50 dark:hover:bg-[#101824] transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{as.staffName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <span className="rounded bg-slate-100 dark:bg-[#172332] px-2 py-0.5 text-[11px] font-medium text-[#00897b] dark:text-[#00e5c9]">
                          {as.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {as.startTime} - {as.endTime}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(as.paymentAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveStaffAssignment(as.id)}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
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
        <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-[#1a2738]">
            5. Financial Breakdown & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4 sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Special Discount (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Additional Charges (Transport / Generator)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Advance / Paid Amount Collected (LKR)
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:border-[#00e5c9] focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#223347] bg-slate-50 dark:bg-[#091019] p-4 space-y-2.5 self-start">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Services Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatCurrency(discount)}</span>
                </div>
              )}
              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Additional Charges:</span>
                  <span className="font-mono">+ {formatCurrency(additionalCharges)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-[#1e2e40]">
                <span>Total Amount:</span>
                <span className="font-mono">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Paid Amount:</span>
                <span className="font-mono">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#00897b] dark:text-[#00e5c9] pt-2 border-t border-slate-200 dark:border-[#1e2e40]">
                <span>Outstanding Balance:</span>
                <span className="font-mono">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors"
          >
            Cancel
          </button>

          {initialData ? (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Completed')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-150"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save & Mark Completed</span>
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-6 py-2.5 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/20 transition-all duration-150"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Completed')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-150"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Create & Completed Event</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Confirmed')}
                className="rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-6 py-2.5 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/20 transition-all duration-150"
              >
                Create & Confirm Event
              </button>
            </>
          )}
        </div>
      </form>

      {/* Customer Quick Creation Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(created) => {
          setCustomers((prev) => [created, ...prev]);
          handleCustomerChange(created.id, created);
        }}
      />

      {/* Staff Assignment Modal with Conflict Check */}
      <StaffAssignmentModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        eventDate={toYYYYMMDD(eventDate)}
        startTime={startTime}
        endTime={endTime}
        currentEventId={initialData?.id}
        existingAssignments={assignedStaff}
        onAssign={handleAddStaffAssignment}
      />
    </>
  );
}
