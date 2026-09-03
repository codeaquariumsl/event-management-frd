'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileSpreadsheet,
  ArrowLeft,
  Printer,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  DollarSign,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  Save,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { quotationService } from '@/lib/api/quotationService';
import { settingsService } from '@/lib/api/reportService';
import { Quotation, QuotationLineItem, QuotationStatus, CompanyProfile } from '@/lib/types';
import { mockStore } from '@/lib/mock/store';
import { formatCurrency } from '@/lib/utils';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const id = params.id as string;
  const initialEdit = searchParams.get('edit') === 'true';

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isEditing, setIsEditing] = useState(initialEdit);

  // Edit form state
  const [editData, setEditData] = useState<Partial<Quotation>>({});

  const loadData = async () => {
    try {
      const q = await quotationService.getById(id);
      if (q) {
        setQuotation(q);
        setEditData({ ...q });
      }
    } catch {
      const q = mockStore.getQuotationById(id);
      if (q) {
        setQuotation(q);
        setEditData({ ...q });
      }
    }
    settingsService.getCompanyProfile().then((p) => {
      if (p) setProfile(p);
    }).catch(() => {
      setProfile(mockStore.getCompanyProfile());
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_store_updated', loadData);
    return () => window.removeEventListener('seekers_store_updated', loadData);
  }, [id]);

  // Edit handlers
  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    if (!editData.items) return;
    const updated = [...editData.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const qty = Number(field === 'quantity' ? value : item.quantity || 1);
      const price = Number(field === 'unitPrice' ? value : item.unitPrice || 0);
      const disc = Number(field === 'discount' ? value : item.discount || 0);
      item.totalPrice = Math.max(0, qty * price - disc);
    }

    updated[index] = item;
    const subtotal = updated.reduce((sum, it) => sum + it.totalPrice, 0);
    const discount = Number(editData.discount || 0);
    const taxRate = Number(editData.taxRate || 0);
    const taxAmount = Math.round((Math.max(0, subtotal - discount) * taxRate) / 100);
    const additional = Number(editData.additionalCharges || 0);
    const totalAmount = Math.max(0, subtotal - discount + taxAmount + additional);

    setEditData({
      ...editData,
      items: updated,
      subtotal,
      taxAmount,
      totalAmount,
    });
  };

  const handleSaveEdit = async () => {
    if (!quotation) return;
    const saved = await quotationService.update(quotation.id, {
      ...editData,
      id: quotation.id,
      customerName: editData.customerName || quotation.customerName,
      title: editData.title || quotation.title,
    });
    setQuotation(saved);
    setIsEditing(false);
    showToast('Quotation updated successfully!', 'success');
  };

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return;
    const updated = await quotationService.update(quotation.id, {
      ...quotation,
      status: newStatus,
    });
    setQuotation(updated);
    showToast(`Quotation status updated to ${newStatus}`, 'info');
  };

  const handleConvertToEvent = async () => {
    if (!quotation) return;
    const newEvent = await quotationService.convertToEvent(quotation.id);
    if (newEvent) {
      showToast(`Quotation converted to Event "${newEvent.name}"!`, 'success');
      router.push(`/events/${newEvent.id}`);
    } else {
      showToast('Could not convert quotation to event', 'error');
    }
  };

  if (!quotation) {
    return (
      <AppShell>
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Quotation Not Found</h2>
          <p className="text-sm text-slate-400">The requested quotation does not exist.</p>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-[#1d2b3c] pb-5">
        <div>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00e5c9] transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Quotations
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              {quotation.quotationNumber}
            </h1>
            <select
              value={quotation.status}
              onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#121c29] border border-[#22354c] text-slate-200 focus:outline-none focus:border-[#00e5c9]"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <p className="text-sm text-slate-400 mt-1">{quotation.title}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {quotation.convertedEventId ? (
            <Link
              href={`/events/${quotation.convertedEventId}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00e5c9]/10 text-[#00e5c9] border border-[#00e5c9]/30 text-xs font-semibold hover:bg-[#00e5c9]/20 transition-colors"
            >
              <span>View Converted Event</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={handleConvertToEvent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] text-black text-xs font-bold hover:brightness-110 shadow-md shadow-[#00e5c9]/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Convert to Live Event
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141e2b] border border-[#23354b] text-slate-200 text-xs font-semibold hover:text-white hover:bg-[#1c2c40] transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {isEditing ? 'Cancel Edit' : 'Edit Quotation'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141e2b] border border-[#23354b] text-slate-200 text-xs font-semibold hover:text-white hover:bg-[#1c2c40] transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* EDIT VIEW */}
      {isEditing ? (
        <div className="rounded-xl border border-[#1d2b3c] bg-[#0e1622] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1d2b3c] pb-4">
            <h2 className="text-base font-bold text-white">Edit Proposal Details</h2>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00e5c9] text-black text-xs font-bold hover:brightness-110"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Proposal Title</label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Venue</label>
              <input
                type="text"
                value={editData.venue || ''}
                onChange={(e) => setEditData({ ...editData, venue: e.target.value })}
                className="w-full px-3 py-2 bg-[#131d2a] border border-[#1f2f42] rounded-lg text-white text-xs focus:outline-none focus:border-[#00e5c9]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00e5c9]">Line Items</h3>
            {editData.items?.map((item, index) => (
              <div
                key={item.id || index}
                className="grid grid-cols-1 sm:grid-cols-6 gap-2 bg-[#121c29] p-3 rounded-lg border border-[#1d2b3c] items-center text-xs"
              >
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-[#162232] border border-[#213247] rounded text-amber-400 text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <div className="text-right font-bold text-[#00e5c9] font-mono">
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1d2b3c]">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg bg-[#141e2b] border border-[#23354b] text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-lg bg-[#00e5c9] text-black text-xs font-bold hover:brightness-110"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* PRINTABLE PROPOSAL VIEW */
        <div className="rounded-2xl border border-[#1d2b3c] bg-[#0c131d] p-8 sm:p-12 shadow-2xl space-y-8 print:border-none print:p-0 print:bg-white print:text-black">
          {/* Header Row: Company Brand + Quote Meta */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-[#1d2b3c] print:border-slate-300">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-[#00e5c9]/40 p-1">
                  <img src="/seekers_logo.jpg" alt="Logo" className="h-full w-full object-cover rounded-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white print:text-black">
                    {profile?.name || 'SEEKERS ENTERTAINMENT'}
                  </h2>
                  <p className="text-xs text-[#00e5c9] print:text-slate-600 font-medium">
                    {profile?.tagline || 'Audio-Visual Production, DJ & Event Technology'}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400 print:text-slate-600 space-y-1">
                <div>{profile?.address}</div>
                <div>Phone: {profile?.phone} | Email: {profile?.email}</div>
                <div>TIN / Tax #: {profile?.taxNumber} | BR: {profile?.businessRegistration}</div>
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="text-2xl font-black text-[#00e5c9] print:text-slate-900 font-mono">
                QUOTATION
              </div>
              <div className="text-sm font-bold text-white print:text-black font-mono">
                {quotation.quotationNumber}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">
                Date: <strong className="text-slate-200 print:text-black">{quotation.createdAt}</strong>
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">
                Valid Until: <strong className="text-slate-200 print:text-black">{quotation.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Client & Event Scope Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#0f1824] print:bg-slate-50 p-5 rounded-xl border border-[#1d2b3c] print:border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00e5c9] print:text-slate-700 block mb-2">
                Quotation Prepared For
              </span>
              <div className="text-base font-bold text-white print:text-black">
                {quotation.customerName}
              </div>
              {quotation.customerCompany && (
                <div className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {quotation.customerCompany}
                </div>
              )}
              {quotation.customerPhone && (
                <div className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  Phone: {quotation.customerPhone}
                </div>
              )}
              {quotation.customerEmail && (
                <div className="text-xs text-slate-400 print:text-slate-600">
                  Email: {quotation.customerEmail}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00e5c9] print:text-slate-700 block mb-2">
                Event Specifications
              </span>
              <div className="text-xs space-y-1 text-slate-300 print:text-slate-700">
                <div>
                  <span className="text-slate-400 print:text-slate-500">Event Title:</span>{' '}
                  <strong className="text-white print:text-black">{quotation.title}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Event Category:</span>{' '}
                  <strong className="text-white print:text-black">{quotation.eventType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Scheduled Date:</span>{' '}
                  <strong className="text-white print:text-black">{quotation.eventDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Venue / Location:</span>{' '}
                  <strong className="text-white print:text-black">{quotation.venue || 'TBD'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-xl border border-[#1d2b3c] print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121d2b] print:bg-slate-100 uppercase tracking-wider font-bold text-slate-400 print:text-slate-700 border-b border-[#1d2b3c] print:border-slate-300">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Item / Service Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Rate (LKR)</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172332] print:divide-slate-200 text-slate-300 print:text-slate-800">
                {quotation.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white print:text-black">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-400 print:text-amber-700">
                      {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white print:text-black">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="text-xs text-slate-400 print:text-slate-600 space-y-3">
              <div>
                <span className="font-bold text-white print:text-black block mb-1">
                  Bank Transfer Details:
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div>Bank: {profile?.bankName || 'Commercial Bank of Ceylon'}</div>
                  <div>Account: {profile?.bankAccount || '1000 4829 5501'}</div>
                  <div>Branch: {profile?.bankBranch || 'Colombo 07 Premier'}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-white print:text-black block mb-1">
                  Terms & Payment Schedule:
                </span>
                <p className="text-[11px] leading-relaxed">
                  {quotation.termsAndConditions || profile?.invoiceTerms}
                </p>
              </div>

              {quotation.notes && (
                <div>
                  <span className="font-bold text-white print:text-black block mb-1">
                    Special Instructions / Notes:
                  </span>
                  <p className="text-[11px] leading-relaxed">{quotation.notes}</p>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="bg-[#0f1824] print:bg-slate-50 p-5 rounded-xl border border-[#1d2b3c] print:border-slate-300 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-white print:text-black">
                  {formatCurrency(quotation.subtotal)}
                </span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between text-amber-400 print:text-amber-700">
                  <span>Proposal Discount:</span>
                  <span className="font-mono font-bold">-{formatCurrency(quotation.discount)}</span>
                </div>
              )}

              {quotation.taxAmount > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Tax ({quotation.taxRate}%):</span>
                  <span className="font-mono font-bold text-white print:text-black">
                    +{formatCurrency(quotation.taxAmount)}
                  </span>
                </div>
              )}

              {quotation.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Logistics & Crew Transport:</span>
                  <span className="font-mono font-bold text-white print:text-black">
                    +{formatCurrency(quotation.additionalCharges)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                <span className="text-sm font-bold uppercase tracking-wider text-white print:text-black">
                  Grand Total
                </span>
                <span className="text-2xl font-black text-[#00e5c9] print:text-slate-900 font-mono">
                  {formatCurrency(quotation.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature Row */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-slate-600">
            <div className="border-t border-slate-700 print:border-slate-400 pt-2">
              Authorized Signature (Seekers Entertainment)
            </div>
            <div className="border-t border-slate-700 print:border-slate-400 pt-2">
              Client Acceptance & Confirmation Stamp
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
