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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { Quotation, QuotationLineItem, QuotationStatus, Customer, InventoryItem, EventTypeItem } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency } from '@/lib/utils';
import { CustomerModal } from '@/features/customers/CustomerModal';

export default function NewQuotationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInventoryPickerOpen, setIsInventoryPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Form State
  const year = new Date().getFullYear();
  const [quotationNumber, setQuotationNumber] = useState(`QT-${year}-${String(Date.now()).slice(-3)}`);
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

  // Items
  const [items, setItems] = useState<QuotationLineItem[]>([
    {
      id: `qli-${Date.now()}-1`,
      name: 'DJ & MC Performance Package',
      category: 'DJ Systems & Consoles',
      description: 'Standard 4-hour live DJ performance with pioneer CDJ-3000 console and wireless mics.',
      quantity: 1,
      unitPrice: 65000,
      discount: 0,
      totalPrice: 65000,
    },
  ]);

  // Financials
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);

  // Notes & Terms
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '50% advance payment required upon quotation confirmation. Remaining 50% balance due within 24 hours of event completion.'
  );

  useEffect(() => {
    const custs = mockStore.getCustomers();
    const types = mockStore.getEventTypes();
    const inv = mockStore.getInventoryItems();

    setCustomers(custs);
    setEventTypes(types);
    setInventoryItems(inv);

    if (custs.length > 0) {
      const first = custs[0];
      setCustomerId(first.id);
      setCustomerName(first.name);
      setCustomerEmail(first.email);
      setCustomerPhone(first.phone);
      setCustomerCompany(first.company || '');
    }

    if (types.length > 0) {
      setEventType(types[0].name);
    }
  }, []);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const selected = customers.find((c) => c.id === id);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerEmail(selected.email);
      setCustomerPhone(selected.phone);
      setCustomerCompany(selected.company || '');
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
        const qty = Number(field === 'quantity' ? value : item.quantity || 1);
        const price = Number(field === 'unitPrice' ? value : item.unitPrice || 0);
        const disc = Number(field === 'discount' ? value : item.discount || 0);
        item.totalPrice = Math.max(0, qty * price - disc);
      }

      updated[index] = item;
      return updated;
    });
  };

  const addItemFromInventory = (invItem: InventoryItem) => {
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: invItem.id,
      name: invItem.name,
      category: invItem.category,
      description: invItem.description || invItem.specifications || '',
      quantity: 1,
      unitPrice: invItem.rentalRate || invItem.unitPrice,
      discount: 0,
      totalPrice: invItem.rentalRate || invItem.unitPrice,
    };
    setItems((prev) => [...prev, newItem]);
    showToast(`Added "${invItem.name}" to quotation`, 'info');
    setIsInventoryPickerOpen(false);
  };

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

  const handleSave = (targetStatus?: QuotationStatus) => {
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

    const newQuote = mockStore.saveQuotation({
      quotationNumber: quotationNumber.trim(),
      title: title.trim(),
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerCompany: customerCompany.trim(),
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

  const filteredPickerItems = useMemo(() => {
    return inventoryItems.filter(
      (i) =>
        i.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        i.category.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        i.sku.toLowerCase().includes(pickerSearch.toLowerCase())
    );
  }, [inventoryItems, pickerSearch]);

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
          <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
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
            className="px-4 py-2 rounded-lg bg-[#141e2b] border border-[#23354b] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1b293a] transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('Sent')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 shadow-md shadow-[#00e5c9]/20"
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
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0e1622] p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#00e5c9] flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              1. Proposal Details & Client
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quotation Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="w-full px-3 py-2 font-mono uppercase bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Proposal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Beachfront Wedding Sound & Intelligent Lighting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                />
              </div>
            </div>

            {/* Customer Picker */}
            <div className="pt-2 border-t border-[#1a2636]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#00e5c9]" />
                  Client Selection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs text-[#00e5c9] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="h-3 w-3" />
                  New Client
                </button>
              </div>

              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
              >
                <option value="">-- Choose an Existing Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-filled client info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#121c29] p-3 rounded-lg border border-[#1b2a3a] text-xs">
              <div>
                <span className="text-slate-400 block">Contact Person:</span>
                <span className="text-white font-medium">{customerName || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone:</span>
                <span className="text-white font-medium">{customerPhone || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="text-white font-medium">{customerEmail || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Event Scope & Schedule */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0e1622] p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#00e5c9] flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              2. Event Scope & Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quote Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Venue / Event Location</label>
              <input
                type="text"
                placeholder="e.g. Cinnamon Grand Colombo, Grand Ballroom"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
              />
            </div>
          </div>

          {/* Section 3: Line Items (Equipment & Services) */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0e1622] p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#00e5c9] flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  3. Line Items (Audiovisual Equipment & Services)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick equipment from your inventory catalog or insert custom packages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInventoryPickerOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00e5c9]/15 border border-[#00e5c9]/40 px-3 py-1.5 text-xs font-semibold text-[#00e5c9] hover:bg-[#00e5c9]/25 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Pick from Inventory
                </button>
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="flex items-center gap-1.5 rounded-lg bg-[#162333] border border-[#23354c] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#1c2c40] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Custom Item
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-lg border border-[#1e2d3e] bg-[#121c29] p-3.5 space-y-3 transition-colors hover:border-[#2b3e55]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Item name / service description..."
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#162232] border border-[#213247] rounded text-white text-xs font-medium focus:outline-none focus:border-[#00e5c9]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Category..."
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#162232] border border-[#213247] rounded text-slate-300 text-xs focus:outline-none focus:border-[#00e5c9]"
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Unit Rate (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Item Discount</label>
                      <input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-amber-400 text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Line Total</label>
                      <div className="px-2 py-1 bg-[#0b121c] border border-[#1b2a3a] rounded text-[#00e5c9] text-xs font-bold font-mono text-right">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Specifications or scope notes (optional)..."
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-[11px] bg-[#141e2b] border border-[#1d2a3a] rounded text-slate-400 focus:outline-none focus:border-[#00e5c9]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Financials, Terms & Summary */}
        <div className="space-y-6">
          {/* Financial Calculation Card */}
          <div className="rounded-xl border border-[#1d2b3c] bg-[#0e1622] p-5 space-y-4 shadow-sm sticky top-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#00e5c9] flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Calculation
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#1a2636]">
                <span className="text-slate-400">Items Subtotal:</span>
                <span className="text-white font-bold text-sm font-mono">
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
                  className="w-full px-2.5 py-1.5 bg-[#131d2a] border border-[#1f2f42] rounded text-amber-400 text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
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
                    className="w-full px-2 py-1.5 bg-[#131d2a] border border-[#1f2f42] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tax Amount:</label>
                  <div className="px-2 py-1.5 bg-[#131d2a] border border-[#1f2f42] rounded text-slate-300 text-xs font-mono text-right">
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
                  className="w-full px-2.5 py-1.5 bg-[#131d2a] border border-[#1f2f42] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                />
              </div>

              {/* Grand Total Highlight */}
              <div className="pt-3 border-t border-[#1a2636]">
                <div className="rounded-lg bg-gradient-to-r from-[#00e5c9]/10 to-[#00b8a2]/5 border border-[#00e5c9]/30 p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Grand Total Quoted
                    </span>
                    <span className="text-xl font-black text-[#00e5c9] font-mono">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">LKR</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="pt-3 border-t border-[#1a2636] space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#131d2a] border border-[#1f2f42] rounded text-slate-300 focus:outline-none focus:border-[#00e5c9]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Client requirements, staging notes, power availability..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#131d2a] border border-[#1f2f42] rounded text-slate-300 focus:outline-none focus:border-[#00e5c9]"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSave('Sent')}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] text-black font-bold text-xs hover:brightness-110 shadow-lg shadow-[#00e5c9]/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save & Mark as Sent
              </button>
              <button
                type="button"
                onClick={() => handleSave('Draft')}
                className="w-full py-2.5 rounded-lg bg-[#141e2b] border border-[#23354b] text-slate-300 font-semibold text-xs hover:bg-[#1b293a] transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Picker Modal */}
      <Modal
        isOpen={isInventoryPickerOpen}
        onClose={() => setIsInventoryPickerOpen(false)}
        title="Select Gear from Inventory"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search equipment by name, category, or SKU..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white focus:outline-none focus:border-[#00e5c9]"
          />

          <div className="max-h-80 overflow-y-auto divide-y divide-[#1a2636] border border-[#1f2f42] rounded-lg">
            {filteredPickerItems.map((inv) => (
              <div
                key={inv.id}
                className="p-3 flex items-center justify-between hover:bg-[#141f2d] transition-colors"
              >
                <div>
                  <div className="font-semibold text-xs text-white">{inv.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono">{inv.sku}</span>
                    <span>•</span>
                    <span>{inv.category}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{inv.availableQuantity} available</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#00e5c9]">
                      {formatCurrency(inv.rentalRate || inv.unitPrice)}
                    </div>
                    <div className="text-[10px] text-slate-500">per event</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemFromInventory(inv)}
                    className="px-2.5 py-1 rounded bg-[#00e5c9] text-black text-xs font-bold hover:brightness-110"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}

            {filteredPickerItems.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching inventory items found.
              </div>
            )}
          </div>
        </div>
      </Modal>

        {/* Quick Add Customer Modal */}
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={(newCust: Customer) => {
            setCustomers(mockStore.getCustomers());
            handleCustomerSelect(newCust.id);
            setIsCustomerModalOpen(false);
            showToast(`Client ${newCust.name} added!`, 'success');
          }}
        />
      </div>
    </AppShell>
  );
}
