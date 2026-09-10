'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Trash2,
  Boxes,
  User,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle2,
  FileText,
  Building,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CalendarDays,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { Quotation, QuotationLineItem, QuotationStatus, Customer, InventoryItem, EventTypeItem, EventItem, ServiceCatalogItem } from '@/lib/types';
import { quotationService } from '@/lib/api/quotationService';
import { customerService } from '@/lib/api/customerService';
import { eventTypeService } from '@/lib/api/eventTypeService';
import { inventoryService } from '@/lib/api/inventoryService';
import { serviceService } from '@/lib/api/serviceService';
import { eventService } from '@/lib/api/eventService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerModal } from '@/features/customers/CustomerModal';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

export default function NewQuotationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [clientEvents, setClientEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Form State: quotationNumber in YYMM-4-digit sequence format (e.g. 2609-0001)
  const getInitialQuotationNumber = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}-0001`;
  };
  const [quotationNumber, setQuotationNumber] = useState(getInitialQuotationNumber());
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('Draft');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState('');

  // Customer
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Items
  const [items, setItems] = useState<QuotationLineItem[]>([]);

  // Financials
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);

  // Notes & Terms
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`
  );

  useEffect(() => {
    Promise.all([
      customerService.getCustomers(),
      eventTypeService.getEventTypes(),
      inventoryService.getItems(),
      eventService.getEvents(),
      quotationService.getAll(),
      serviceService.getServices(),
    ]).then(([custs, types, inv, evts, quotes, svcs]) => {
      // Auto-generate YYMM-4-digit sequence based on existing quotations for the current month
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${yy}${mm}-`;

      let nextSeq = 1;
      if (Array.isArray(quotes)) {
        const matching = quotes
          .map((q) => q.quotationNumber)
          .filter((qn): qn is string => typeof qn === 'string' && qn.startsWith(prefix));

        if (matching.length > 0) {
          const maxSeq = matching.reduce((max, numStr) => {
            const seqPart = numStr.slice(prefix.length);
            const parsed = parseInt(seqPart, 10);
            return !isNaN(parsed) && parsed > max ? parsed : max;
          }, 0);
          nextSeq = maxSeq + 1;
        }
      }
      setQuotationNumber(`${prefix}${String(nextSeq).padStart(4, '0')}`);
      if (Array.isArray(types)) {
        setEventTypes(types);
        if (types.length > 0) setEventType(types[0].name);
      }

      if (Array.isArray(inv)) setInventoryItems(inv);
      if (Array.isArray(svcs)) setServicesCatalog(svcs);

      const eventsList = Array.isArray(evts) ? evts : [];
      setAllEvents(eventsList);

      if (Array.isArray(custs)) {
        setCustomers(custs);
        if (custs.length > 0) {
          const first = custs[0];
          setCustomerId(first.id);
          setCustomerName(first.name);
          setCustomerEmail(first.email);
          setCustomerPhone(first.phone);
          setCustomerCompany(first.company || '');
          setCustomerAddress(first.address || '');
          setClientEvents(eventsList.filter((e) => e.customerId === first.id));
        }
      }
    });
  }, []);

  const handleCustomerSelect = (id: string, customerObj?: Customer) => {
    setCustomerId(id);
    setSelectedEventId('');
    if (!id) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerCompany('');
      setCustomerAddress('');
      setClientEvents([]);
      return;
    }
    const selected = customerObj || customers.find((c) => c.id === id);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerEmail(selected.email);
      setCustomerPhone(selected.phone);
      setCustomerCompany(selected.company || '');
      setCustomerAddress(selected.address || '');
    }
    const filteredEvents = allEvents.filter((e) => e.customerId === id);
    setClientEvents(filteredEvents);
    if (filteredEvents.length > 0) {
      showToast(`Loaded ${filteredEvents.length} past event(s) for ${selected?.name || 'client'}`);
    }
  };

  const handleLoadItemsFromEvent = (eventId: string) => {
    const targetEvent = allEvents.find((e) => e.id === eventId);
    if (!targetEvent) return;

    if (!targetEvent.services || targetEvent.services.length === 0) {
      showToast(`Event "${targetEvent.name}" has no services/items recorded`, 'error');
      return;
    }

    const newQuotationItems: QuotationLineItem[] = targetEvent.services.map((s, idx) => ({
      id: `qli-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: s.id,
      name: s.name,
      category: s.category || 'General',
      description: s.description || '',
      size: s.size || '',
      quantity: s.quantity !== null && s.quantity !== undefined ? Number(s.quantity) : null,
      unitPrice: Number(s.unitPrice) || 0,
      discount: 0,
      totalPrice: Number(s.totalPrice) || (Number(s.quantity || 1) * Number(s.unitPrice || 0)),
    }));

    setItems(newQuotationItems);

    if (targetEvent.location || targetEvent.address) {
      setVenue(targetEvent.location || targetEvent.address || '');
    }
    if (targetEvent.eventType) {
      setEventType(targetEvent.eventType);
    }
    if (!title || title.startsWith('Quotation -')) {
      setTitle(`Quotation - ${targetEvent.name}`);
    }

    showToast(`✓ Loaded ${newQuotationItems.length} items from "${targetEvent.name}"`);
  };

  const handleSelectPastEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId) {
      handleLoadItemsFromEvent(eventId);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    if (!taxRate) return 0;
    return Math.round((Math.max(0, subtotal - discount) * taxRate) / 100);
  }, [subtotal, discount, taxRate]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0) + taxAmount + Number(additionalCharges || 0));
  }, [subtotal, discount, taxAmount, additionalCharges]);

  // Item Handlers
  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        const rawQty = field === 'quantity' ? value : item.quantity;
        const qty = rawQty !== null && rawQty !== undefined && rawQty !== '' && Number(rawQty) > 0 ? Number(rawQty) : 1;
        const price = Number(field === 'unitPrice' ? value : item.unitPrice || 0);
        const disc = Number(field === 'discount' ? value : item.discount || 0);
        item.totalPrice = Math.max(0, qty * price - disc);
      }

      updated[index] = item;
      return updated;
    });
  };

  const addItemFromInventory = (invItem: InventoryItem) => {
    const rate = invItem.rentalRate || invItem.unitPrice || 0;
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: invItem.id,
      name: invItem.name,
      category: invItem.category || 'Production',
      size: invItem.specifications || '',
      description: `Gear Item (SKU: ${invItem.sku})`,
      quantity: 1,
      unitPrice: rate,
      discount: 0,
      totalPrice: rate,
    };
    setItems((prev) => [...prev, newItem]);
    showToast(`✓ Added gear "${invItem.name}"`, 'success');
  };

  const handleAddService = (templateService: ServiceCatalogItem) => {
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: templateService.name,
      category: templateService.category || 'Production',
      size: '',
      description: templateService.description || '',
      quantity: 1,
      unitPrice: templateService.unitPrice,
      discount: 0,
      totalPrice: templateService.unitPrice,
    };
    setItems((prev) => [...prev, newItem]);
    showToast(`✓ Added package "${templateService.name}"`, 'success');
  };

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
    return inventoryItems.map((gear) => ({
      value: gear.id,
      label: gear.name,
      sublabel: `SKU: ${gear.sku} • In Stock: ${gear.availableQuantity ?? gear.totalStock ?? 0} ${gear.unit || 'units'}`,
      badge: gear.category,
      category: gear.category,
      extraInfo: `Rs. ${(gear.rentalRate || gear.unitPrice || 0).toLocaleString()}/day`,
      raw: gear,
    }));
  }, [inventoryItems]);

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

  const addCustomItem = () => {
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      category: 'General',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (targetStatus?: QuotationStatus) => {
    if (!customerName.trim()) {
      showToast('Please select or specify a customer name', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a quotation title', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one line item', 'error');
      return;
    }

    const finalStatus = targetStatus || status;

    const newQuote = await quotationService.create({
      quotationNumber: quotationNumber.trim(),
      title: title.trim(),
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerCompany: customerCompany.trim(),
      customerAddress: customerAddress.trim(),
      eventType: eventType || 'Wedding & Reception',
      eventDate,
      validUntil,
      venue: venue.trim(),
      items,
      subtotal,
      discount: Number(discount || 0),
      taxRate: Number(taxRate || 0),
      taxAmount,
      additionalCharges: Number(additionalCharges || 0),
      totalAmount,
      status: finalStatus,
      notes: notes.trim(),
      termsAndConditions: termsAndConditions.trim(),
    });

    showToast(`Quotation ${newQuote.quotationNumber} saved as ${finalStatus}!`, 'success');
    router.push(`/quotations/${newQuote.id}`);
  };



  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1d2b3c] pb-5">
          <div>
            <Link
              href="/quotations"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00e5c9] transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Quotations
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-3xl">
              Create Quotation Proposal
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Build and calculate live rate estimates for audiovisual gear and production services.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleSave('Draft')}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1b293a] transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('Sent')}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00a894] to-[#00897b] dark:from-[#00e5c9] dark:to-[#00b8a2] px-4 py-2 text-xs font-semibold text-white dark:text-black hover:brightness-110 shadow-md shadow-[#00e5c9]/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save & Publish Proposal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Area: Details & Line Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Proposal Info & Customer */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                1. Proposal Details & Client
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quotation Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proposal Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxury Beachfront Wedding Sound & Intelligent Lighting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              {/* Customer Picker */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#1a2636]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
                    Client Selection
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="text-xs text-[#00897b] dark:text-[#00e5c9] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3 w-3" />
                    New Client
                  </button>
                </div>

                <SearchableSelect
                  options={customerOptions}
                  value={customerId}
                  onChange={(val, opt) => handleCustomerSelect(val, opt?.raw)}
                  placeholder={`-- Search & Select a Customer (${customers.length} available) * --`}
                  searchPlaceholder="Search client by name, company, phone, address..."
                  clearable={true}
                  required={true}
                  emptyMessage="No matching clients found"
                />
              </div>

              {/* Auto-filled client info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#121c29] p-3 rounded-lg border border-slate-200 dark:border-[#1b2a3a] text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Contact Person:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{customerName || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Phone:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{customerPhone || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Email:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{customerEmail || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Client Address:</span>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Client address..."
                    className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              {/* Past Events & Import Items */}
              {customerId && (
                <div id="past-events-selector" className="rounded-xl border border-teal-200/80 dark:border-[#1f374d] bg-teal-50/50 dark:bg-[#0c1825] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Client Past Events & Previous Bookings
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {clientEvents.length > 0
                            ? `Select any past event from ${customerName} to auto-load its equipment and services into this quotation`
                            : `No previous events found in database for ${customerName || 'this client'}`}
                        </p>
                      </div>
                    </div>
                    {clientEvents.length > 0 && (
                      <span className="rounded-full bg-[#00a894]/15 dark:bg-[#00e5c9]/15 border border-[#00a894]/30 dark:border-[#00e5c9]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#00897b] dark:text-[#00e5c9]">
                        {clientEvents.length} Event{clientEvents.length > 1 ? 's' : ''} Available
                      </span>
                    )}
                  </div>

                  {clientEvents.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          value={selectedEventId}
                          onChange={(e) => handleSelectPastEvent(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-[#111c29] border border-slate-300 dark:border-[#233549] rounded-lg text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                        >
                          <option value="">-- Select a Past Event to Load Its Items --</option>
                          {clientEvents.map((evt) => (
                            <option key={evt.id} value={evt.id}>
                              {evt.name} ({formatDate(evt.eventDate)} • {evt.eventType} • {evt.services.length} items)
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={!selectedEventId}
                          onClick={() => handleLoadItemsFromEvent(selectedEventId)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm whitespace-nowrap"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Load Event Items</span>
                        </button>
                      </div>

                      {selectedEventId && (
                        (() => {
                          const selectedEvt = clientEvents.find((e) => e.id === selectedEventId);
                          if (!selectedEvt) return null;
                          return (
                            <div className="rounded-lg bg-white dark:bg-[#101b28] border border-teal-200/50 dark:border-[#1d2f44] p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {selectedEvt.name}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatDate(selectedEvt.eventDate)} • Location: {selectedEvt.location || 'N/A'} • Subtotal: {formatCurrency(selectedEvt.subtotal)}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-[#00897b] dark:text-[#00e5c9] bg-[#00e5c9]/10 px-2.5 py-1 rounded-full">
                                ✓ {selectedEvt.services.length} line item(s) loaded
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Event Scope & Schedule */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                2. Event Scope & Schedule
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  >
                    {eventTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                    <option value="Other">Other Custom Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quote Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Event Location</label>
                <input
                  type="text"
                  placeholder="e.g. Cinnamon Grand Colombo, Grand Ballroom"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                />
              </div>
            </div>

            {/* Section 3: Line Items (Equipment & Services) */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    3. Line Items (Audiovisual Equipment & Services)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pick equipment from your inventory catalog or insert custom packages.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {clientEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('past-events-selector');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-[#0e2130] border border-teal-200 dark:border-[#00e5c9]/30 px-3 py-1.5 text-xs font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-teal-100 dark:hover:bg-[#132c40] transition-colors"
                      title="Load items from client's past events"
                    >
                      <History className="h-3.5 w-3.5" />
                      From Past Event ({clientEvents.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-[#162333] border border-slate-300 dark:border-[#23354c] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c40] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Custom Item
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
                    placeholder={`-- Search & select package to add (${servicesCatalog.length} packages) --`}
                    searchPlaceholder="Search packages by title or category..."
                    emptyMessage="No packages match your search"
                  />
                </div>

                {/* Inventory Gear Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Boxes className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Add From Inventory Gear ({inventoryItems.length} units)
                  </label>
                  <SearchableSelect
                    options={gearOptions}
                    value=""
                    resetOnSelect={true}
                    onChange={(val, opt) => {
                      if (opt?.raw) {
                        addItemFromInventory(opt.raw);
                      }
                    }}
                    placeholder={`-- Search & select gear to add (${inventoryItems.length} items) --`}
                    searchPlaceholder="Search gear by name, SKU, or category..."
                    emptyMessage="No inventory gear matches your search"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#23354b] p-8 text-center space-y-2.5">
                    <Boxes className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      No line items added yet
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Add items from your inventory, create a custom package, or select an event from the past event list above to load all previously booked services.
                    </p>
                    {clientEvents.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('past-events-selector');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00a894]/15 dark:bg-[#00e5c9]/15 border border-[#00a894]/30 dark:border-[#00e5c9]/30 text-xs font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-[#00a894]/25 dark:hover:bg-[#00e5c9]/25 transition-colors"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>Load from Past Events ({clientEvents.length} available)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-lg border border-slate-200 dark:border-[#1e2d3e] bg-slate-50 dark:bg-[#121c29] p-3.5 space-y-3 transition-colors hover:border-slate-300 dark:hover:border-[#2b3e55]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Item name / service description..."
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Category..."
                              value={item.category}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">Size / Spec</label>
                          <input
                            type="text"
                            placeholder="e.g. 12*7 ft"
                            value={item.size || ''}
                            onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="—"
                            value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              handleItemChange(index, 'quantity', val === '' ? null : Number(val));
                            }}
                            className="w-full px-2 py-1 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                            title="Optional. Leave blank for set/flat rate"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">Unit Rate (LKR)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">Item Discount</label>
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-amber-600 dark:text-amber-400 text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">Line Total</label>
                          <div className="px-2 py-1 bg-white dark:bg-[#0b121c] border border-slate-300 dark:border-[#1b2a3a] rounded text-[#00897b] dark:text-[#00e5c9] text-xs font-bold font-mono text-right">
                            {formatCurrency(item.totalPrice)}
                          </div>
                        </div>
                      </div>

                      {/* <div>
                      <input
                        type="text"
                        placeholder="Specifications or scope notes (optional)..."
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#141e2b] border border-slate-300 dark:border-[#1d2a3a] rounded text-slate-600 dark:text-slate-400 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                      />
                    </div> */}
                    </div>
                  )))}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Financials, Terms & Summary */}
          <div className="space-y-6">
            {/* Financial Calculation Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] p-5 space-y-4 shadow-sm sticky top-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Calculation
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-[#1a2636]">
                  <span className="text-slate-400">Items Subtotal:</span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm font-mono">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Proposal Discount (LKR):</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-amber-600 dark:text-amber-400 text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Tax / VAT (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tax Amount:</label>
                    <div className="px-2 py-1.5 bg-slate-50 dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-slate-700 dark:text-slate-300 text-xs font-mono text-right">
                      {formatCurrency(taxAmount)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Logistics / Transport Fee (LKR):</label>
                  <input
                    type="number"
                    min="0"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                {/* Grand Total Highlight */}
                <div className="pt-3 border-t border-slate-200 dark:border-[#1a2636]">
                  <div className="rounded-lg bg-gradient-to-r from-[#00e5c9]/10 to-[#00b8a2]/5 border border-[#00e5c9]/30 p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Grand Total Quoted
                      </span>
                      <span className="text-xl font-black text-[#00897b] dark:text-[#00e5c9] font-mono">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">LKR</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#1a2636] space-y-1.5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bank Details
                </span>
                <div className="rounded-lg bg-slate-50 dark:bg-[#111c29] border border-slate-200 dark:border-[#1b2b3d] p-3 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Seekers’s Entertainment (pvt) Ltd</div>
                  <div>Account: 94630427</div>
                  <div>Bank: BOC bank</div>
                  <div>Branch: Walgama</div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#1a2636] space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Terms & Conditions
                </label>
                <textarea
                  rows={4}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Client requirements, staging notes, power availability..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSave('Sent')}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00a894] to-[#00897b] dark:from-[#00e5c9] dark:to-[#00b8a2] text-white dark:text-black font-bold text-xs hover:brightness-110 shadow-lg shadow-[#00e5c9]/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Mark as Sent
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-[#1b293a] transition-colors"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Quick Add Customer Modal */}
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={(newCust: Customer) => {
            customerService.getCustomers().then((c) => {
              if (Array.isArray(c)) setCustomers(c);
            });
            handleCustomerSelect(newCust.id);
            setCustomerAddress(newCust.address || '');
            setIsCustomerModalOpen(false);
            showToast(`Client ${newCust.name} added!`, 'success');
          }}
        />
      </div>
    </AppShell>
  );
}
