'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Download, CreditCard } from 'lucide-react';
import { EventItem, CompanyProfile } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import { settingsService } from '@/lib/api/reportService';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onAddPayment?: () => void;
}

export function InvoiceModal({ isOpen, onClose, event, onAddPayment }: InvoiceModalProps) {
  const [company, setCompany] = useState<CompanyProfile>({
    name: 'Seekers Entertainment (Pvt) Ltd',
    tagline: 'Premier Audio-Visual Production, DJ & Event Technology',
    email: 'ops@seekersentertainment.lk',
    phone: '+94 11 258 4930',
    address: 'No. 42, Independence Avenue, Colombo 07, Sri Lanka',
    taxNumber: 'TIN-109482710-8000',
    businessRegistration: 'PV-0028941',
    currency: 'LKR',
    bankName: 'Commercial Bank of Ceylon',
    bankAccount: '1000 4829 5501',
    bankBranch: 'Colombo 07 Premier Branch',
    logoUrl: '/seekers-logo.svg',
    invoiceTerms: '50% advance upon confirmation. Remaining balance due within 24 hours of event completion.',
  });

  useEffect(() => {
    settingsService.getCompanyProfile().then((p) => {
      if (p) setCompany(p);
    });
  }, []);

  const invoiceNumber = `INV-${event.id.replace('EVT-', '')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice & Billing" maxWidth="2xl">
      <div className="flex flex-col gap-6">
        {/* Actions Bar */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-[#1c2a3a]">
          <span className="text-xs text-slate-400">
            Official tax-compliant tax invoice for {event.name}
          </span>
          <div className="flex items-center gap-2">
            {onAddPayment && event.balance > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onAddPayment();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5c9] px-3 py-1.5 text-xs font-semibold text-[#041816] hover:bg-[#1affda] transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Add Payment</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#24374b] bg-[#142130] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1b2b3d] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div className="printable-invoice rounded-xl border border-[#233549] bg-[#0b121b] p-8 text-white shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-[#1f2e3f] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#00e5c9]/30 bg-black p-0.5">
                  <img
                    src="/seekers_logo.jpg"
                    alt="Seekers Entertainment"
                    className="h-full w-full object-cover rounded"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-wider text-white">
                    SEEKERS ENTERTAINMENT
                  </h2>
                  <p className="text-[11px] text-[#00e5c9] font-semibold">{company.tagline}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400 leading-relaxed">
                <p>{company.address}</p>
                <p>{company.email} • {company.phone}</p>
                <p className="font-mono text-[11px] text-slate-500">Reg: {company.businessRegistration} | TIN: {company.taxNumber}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded bg-[#00e5c9]/10 px-2.5 py-1 text-xs font-bold text-[#00e5c9] uppercase tracking-wider mb-2">
                TAX INVOICE
              </span>
              <p className="text-base font-bold font-mono text-white">{invoiceNumber}</p>
              <p className="text-xs text-slate-400 mt-1">Invoice Date: {formatDate(event.createdAt)}</p>
              <p className="text-xs text-slate-400">Event Date: {formatDate(event.eventDate)}</p>
            </div>
          </div>

          {/* Customer & Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#1f2e3f] text-xs">
            <div>
              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Billed To:</h4>
              <p className="mt-1 font-bold text-sm text-white">{event.customerName}</p>
              {event.customerCompany && <p className="text-slate-300">{event.customerCompany}</p>}
              {event.customerPhone && <p className="text-slate-400">{event.customerPhone}</p>}
              {event.customerEmail && <p className="text-slate-400">{event.customerEmail}</p>}
            </div>
            <div>
              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Event Information:</h4>
              <p className="mt-1 font-semibold text-white">{event.name}</p>
              <p className="text-slate-300">Venue: {event.location}</p>
              <p className="text-slate-400">Time: {event.startTime} - {event.endTime}</p>
              <p className="text-slate-400">Type: {event.eventType}</p>
            </div>
          </div>

          {/* Itemized Services Table */}
          <div className="py-6">
            <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mb-3">Itemized Production & Entertainment Services</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#243549] text-slate-400 text-[11px]">
                    <th className="py-2.5">Service Description</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182433]">
                  {event.services.map((srv) => (
                    <tr key={srv.id}>
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-white">{srv.name}</p>
                        {srv.description && <p className="text-[11px] text-slate-400 mt-0.5">{srv.description}</p>}
                      </td>
                      <td className="py-3 text-center text-slate-300">{srv.quantity}</td>
                      <td className="py-3 text-right text-slate-300">{formatCurrency(srv.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold text-white">{formatCurrency(srv.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-[#1f2e3f]">
            <div className="text-xs text-slate-400 max-w-xs space-y-2">
              <h5 className="font-semibold text-slate-300">Remittance Bank Details:</h5>
              <p className="font-mono text-[11px] leading-relaxed">
                Bank: {company.bankName}<br />
                Account Name: {company.name}<br />
                Account No: <strong className="text-white">{company.bankAccount}</strong><br />
                Branch: {company.bankBranch}
              </p>
              <p className="text-[10px] text-slate-500 italic mt-2">{company.invoiceTerms}</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(event.subtotal)}</span>
              </div>
              {event.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Special Discount:</span>
                  <span>- {formatCurrency(event.discount)}</span>
                </div>
              )}
              {event.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Logistics / Extra:</span>
                  <span>+ {formatCurrency(event.additionalCharges)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#233549]">
                <span>Total Amount:</span>
                <span>{formatCurrency(event.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Total Paid:</span>
                <span className="font-semibold">{formatCurrency(event.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#00e5c9] pt-2 border-t border-[#233549]">
                <span>Balance Due:</span>
                <span>{formatCurrency(event.balance)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-[#1a2636] text-center text-[11px] text-slate-500">
            Thank you for choosing Seekers Entertainment. For inquiries regarding this invoice, contact {company.email}.
          </div>
        </div>
      </div>
    </Modal>
  );
}
