'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, Download, CreditCard, Loader2 } from 'lucide-react';
import { EventItem, ServiceItem, CompanyProfile } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import { useToast } from '@/components/ui/Toast';
import { settingsService } from '@/lib/api/reportService';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onAddPayment?: () => void;
}

export function InvoiceModal({ isOpen, onClose, event, onAddPayment }: InvoiceModalProps) {
  const { showToast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  const [company, setCompany] = useState<CompanyProfile>({
    name: 'Seekers’s Entertainment (pvt) Ltd',
    tagline: 'Premier Audio-Visual Production, DJ & Event Technology',
    email: 'ops@seekersentertainment.lk',
    phone: `+94 71 035 87 23 (Voice / WhatsApp)
+94 76 468 00 00
+971 54 544 66 09 (UAE)`,
    address: 'No. 42, Independence Avenue, Colombo 07, Sri Lanka',
    taxNumber: 'TIN-109482710-8000',
    businessRegistration: 'PV-0028941',
    currency: 'LKR',
    bankName: 'BOC bank',
    bankAccount: '94630427',
    bankBranch: 'Walgama',
    logoUrl: '/whitelogo.jpg',
    invoiceTerms: `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`,
  });

  useEffect(() => {
    settingsService.getCompanyProfile().then((p) => {
      if (p) {
        setCompany((prev) => ({
          ...prev,
          ...p,
          name: p.name || prev.name,
          bankName: p.bankName || prev.bankName,
          bankAccount: p.bankAccount || prev.bankAccount,
          bankBranch: p.bankBranch || prev.bankBranch,
          invoiceTerms: p.invoiceTerms || prev.invoiceTerms,
        }));
      }
    });
  }, []);

  const invoiceNumber = `INV-${event.id.replace('EVT-', '')}`;

  // Group line items category-wise exactly like Quotation
  const categoryGroups = useMemo(() => {
    if (!event?.services || event.services.length === 0) return [];

    const map = new Map<string, ServiceItem[]>();
    event.services.forEach((item) => {
      const cat = item.category?.trim() ? item.category.trim() : 'General';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    });

    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
      subtotal: items.reduce((sum, it) => sum + (it.totalPrice || 0), 0),
    }));
  }, [event?.services]);

  // Robust client-side PDF Generation and Print Utilities using html2canvas-pro (with lab/oklch color support) & jsPDF
  const loadPdfLibraries = async (): Promise<{ html2canvas: any; jsPDF: any }> => {
    if (typeof window === 'undefined') throw new Error('Browser only');

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    };

    await Promise.all([
      loadScript('/js/html2canvas-pro.min.js'),
      loadScript('/js/jspdf.umd.min.js'),
    ]);

    let html2canvas = (window as any).html2canvas;
    if (typeof html2canvas !== 'function') {
      if (typeof html2canvas?.default === 'function') {
        html2canvas = html2canvas.default;
      } else if (typeof html2canvas?.html2canvas === 'function') {
        html2canvas = html2canvas.html2canvas;
      }
    }

    const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jspdf?.default || (window as any).jsPDF;
    return { html2canvas, jsPDF };
  };

  // Generates a strictly Light-Themed A4 PDF document matching Quotation print standards
  const generateInvoicePdfDocument = async (sourceElement: HTMLElement) => {
    const { html2canvas, jsPDF } = await loadPdfLibraries();
    if (!html2canvas || !jsPDF) {
      throw new Error('PDF generation libraries failed to load');
    }

    // Clone element to create an isolated Light-Theme A4 document
    const clone = sourceElement.cloneNode(true) as HTMLElement;

    // 1. Completely strip all dark mode classes from the clone and all descendants
    clone.classList.remove('dark');
    clone.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const classesToRemove: string[] = [];
      htmlEl.classList.forEach((cls) => {
        if (cls === 'dark' || cls.startsWith('dark:')) {
          classesToRemove.push(cls);
        }
      });
      classesToRemove.forEach((cls) => htmlEl.classList.remove(cls));
    });

    // 2. Enforce explicit Light Theme root styles
    clone.style.width = '794px'; // 210mm standard A4 width at 96 DPI
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.padding = '36px 32px';
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';

    // 3. Deep Light Theme normalization across all cloned elements
    clone.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.boxShadow = 'none';
      htmlEl.style.textShadow = 'none';

      const tag = htmlEl.tagName.toLowerCase();

      // Normalize table header & category header colors
      if (tag === 'thead' || tag === 'th') {
        htmlEl.style.setProperty('background-color', '#f1f5f9', 'important');
        htmlEl.style.setProperty('color', '#334155', 'important');
        htmlEl.style.setProperty('border-color', '#cbd5e1', 'important');
      }

      // Replace any residual white text with dark slate
      if (htmlEl.classList.contains('text-white')) {
        htmlEl.style.setProperty('color', '#0f172a', 'important');
      }
      if (htmlEl.classList.contains('text-slate-300') || htmlEl.classList.contains('text-slate-400')) {
        htmlEl.style.setProperty('color', '#475569', 'important');
      }

      // Convert neon teal to print-friendly deep teal
      if (htmlEl.classList.contains('text-[#00e5c9]')) {
        htmlEl.style.setProperty('color', '#00897b', 'important');
      }
      if (htmlEl.classList.contains('bg-[#00e5c9]')) {
        htmlEl.style.setProperty('background-color', '#00897b', 'important');
      }

      // Normalize card backgrounds to soft slate-50
      const classList = htmlEl.className || '';
      if (typeof classList === 'string' && (
        classList.includes('bg-[#0c131d]') ||
        classList.includes('bg-[#0f1824]') ||
        classList.includes('bg-[#121d2b]') ||
        classList.includes('bg-[#131e2b]') ||
        classList.includes('bg-[#141e2b]') ||
        classList.includes('bg-[#121c29]') ||
        classList.includes('bg-[#0b121b]')
      )) {
        htmlEl.style.setProperty('background-color', '#f8fafc', 'important');
      }
    });

    // Mount off-screen in a clean light container
    const offscreen = document.createElement('div');
    offscreen.className = 'light';
    offscreen.style.position = 'fixed';
    offscreen.style.top = '0';
    offscreen.style.left = '-9999px';
    offscreen.style.width = '794px';
    offscreen.style.backgroundColor = '#ffffff';
    offscreen.style.color = '#0f172a';
    offscreen.style.zIndex = '-9999';
    offscreen.style.overflow = 'visible';
    offscreen.appendChild(clone);
    document.body.appendChild(offscreen);

    let canvas;
    try {
      canvas = await html2canvas(clone, {
        scale: 2, // High resolution retina clarity (300 DPI equivalent)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        scrollY: 0,
        scrollX: 0,
      });
    } finally {
      if (document.body.contains(offscreen)) {
        document.body.removeChild(offscreen);
      }
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let page = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages (if invoice spans multiple A4 pages)
    while (heightLeft > 0) {
      page++;
      const yOffset = -(page * pdfHeight);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pdfHeight;
    }

    return pdf;
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);
    showToast('Generating Invoice PDF (Light Theme)...', 'info');

    try {
      const pdf = await generateInvoicePdfDocument(invoiceRef.current);
      pdf.save(`Invoice_${invoiceNumber}.pdf`);
      showToast(`Invoice ${invoiceNumber} downloaded!`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast(err?.message || 'Could not download PDF. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!invoiceRef.current) return;
    setIsPrintingPdf(true);
    showToast('Preparing clean Light Theme PDF for print...', 'info');

    try {
      const pdf = await generateInvoicePdfDocument(invoiceRef.current);
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-99999px';
      iframe.style.left = '-99999px';
      iframe.style.width = '100px';
      iframe.style.height = '100px';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.open(blobUrl, '_blank');
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }, 500);
      };

      showToast('PDF print preview opened!', 'success');
    } catch (err: any) {
      console.error('PDF print error:', err);
      showToast(err?.message || 'Could not launch PDF print. Please try again.', 'error');
    } finally {
      setIsPrintingPdf(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice & Billing" maxWidth="4xl">
      <div className="flex flex-col gap-6">
        {/* Actions Bar */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1c2a3a]">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Official tax-compliant tax invoice for <strong className="text-slate-800 dark:text-slate-200">{event.name}</strong>
          </span>
          <div className="flex items-center gap-2">
            {onAddPayment && event.balance > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onAddPayment();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] transition-colors shadow-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Add Payment</span>
              </button>
            )}

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isPrintingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-3 py-1.5 text-xs font-bold text-white dark:text-black hover:brightness-110 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Invoice as clean Light Theme PDF file"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* Print PDF Button */}
            <button
              onClick={handlePrintPdf}
              disabled={isGeneratingPdf || isPrintingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#24374b] bg-slate-100 dark:bg-[#142130] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print only the clean Light Theme PDF document"
            >
              {isPrintingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              <span>{isPrintingPdf ? 'Preparing...' : 'Print PDF'}</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Card (Mirrors Quotation Proposal Format) */}
        <div
          ref={invoiceRef}
          id="event-invoice-view"
          className="printable-invoice rounded-2xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c131d] p-8 sm:p-12 shadow-2xl space-y-8 print:border-none print:p-0 print:bg-white print:text-black"
        >
          {/* Header Row: Company Brand + Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-18 items-center justify-center rounded-xl">
                  <img src="/whitelogo.jpg" alt="Seekers Entertainment" className="h-full w-full object-cover rounded-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                    {company?.name || 'SEEKERS ENTERTAINMENT'}
                  </h2>
                  <p className="text-xs text-[#00897b] dark:text-[#00e5c9] print:text-slate-600 font-medium">
                    {company?.tagline || 'Premier Audio-Visual Production, DJ & Event Technology'}
                  </p>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-300 print:text-black space-y-1">
                <div>{company?.address}</div>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 print:text-black">
                  <div>+94 71 035 87 23 (Voice / WhatsApp)</div>
                  <div>+94 76 468 00 00</div>
                  <div>+971 54 544 66 09 (UAE)</div>
                </div>
                <div>Email: {company?.email || 'ops@seekersentertainment.lk'}</div>
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="text-2xl font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono">
                INVOICE
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black font-mono">
                {invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                Invoice Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{formatDate(event.createdAt || new Date().toISOString())}</strong>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                Event Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{event.eventDate}</strong>
              </div>
            </div>
          </div>

          {/* Client & Event Scope Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-5 rounded-xl border border-slate-200 dark:border-[#1d2b3c] print:border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-slate-700 block mb-2">
                Invoice Prepared For
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                {event.customerName}
              </div>
              {event.customerCompany && (
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 print:text-slate-700">
                  {event.customerCompany}
                </div>
              )}
              {event.customerPhone && (
                <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 mt-1">
                  Phone: {event.customerPhone}
                </div>
              )}
              {event.customerEmail && (
                <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600">
                  Email: {event.customerEmail}
                </div>
              )}
              {event.address && (
                <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600">
                  Address: {event.address}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-slate-700 block mb-2">
                Event Specifications
              </span>
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 print:text-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Title:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Category:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.eventType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Scheduled Date:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.eventDate}</strong>
                </div>
                {(event.startTime || event.endTime) && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Time:</span>{' '}
                    <strong className="text-slate-900 dark:text-white print:text-black">
                      {event.startTime || 'TBD'} - {event.endTime || 'TBD'}
                    </strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Venue / Location:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.location || 'TBD'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table (Category Wise) */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#121d2b] print:bg-slate-100 uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 print:text-slate-700 border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Service / Item Description</th>
                  <th className="px-4 py-3 text-center w-20">Qty</th>
                  <th className="px-4 py-3 text-right w-36">Unit Rate (LKR)</th>
                  <th className="px-4 py-3 text-right w-36">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#172332] print:divide-slate-200 text-slate-700 dark:text-slate-300 print:text-slate-800">
                {(() => {
                  let globalIdx = 0;
                  return categoryGroups.map((group, gIdx) => (
                    <React.Fragment key={group.category || gIdx}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/80 dark:bg-[#131e2b] print:bg-slate-100 font-bold border-t border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
                        <td colSpan={5} className="px-4 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-black flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#00897b] dark:bg-[#00e5c9] print:bg-slate-700 inline-block" />
                              {group.category}
                            </span>
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 print:text-slate-600 font-mono">
                              {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Items under Category */}
                      {group.items.map((srv, itemIdx) => {
                        globalIdx++;
                        return (
                          <tr
                            key={srv.id || `${group.category}-${itemIdx}`}
                            className="hover:bg-slate-50/50 dark:hover:bg-[#121c29]/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 print:text-slate-500">{globalIdx}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white print:text-black">{srv.name}</div>
                              {srv.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                                  {srv.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-slate-800 dark:text-slate-200 print:text-black">{srv.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-slate-200 print:text-black">{formatCurrency(srv.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">
                              {formatCurrency(srv.totalPrice)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Category Subtotal (if multiple categories exist) */}
                      {categoryGroups.length > 1 && (
                        <tr className="bg-slate-50/40 dark:bg-[#0e1622]/40 print:bg-slate-50 text-[11px] border-b border-slate-200 dark:border-[#172332] print:border-slate-200">
                          <td colSpan={4} className="px-4 py-1.5 text-right font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                            Subtotal ({group.category}):
                          </td>
                          <td className="px-4 py-1.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                            {formatCurrency(group.subtotal)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ));
                })()}

                {(!event.services || event.services.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No line items recorded for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Bank Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 space-y-3">
              <div>
                <span className="font-bold text-slate-900 dark:text-white print:text-black block mb-1">
                  Bank Details:
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {company.name || 'Seekers’s Entertainment (pvt) Ltd'}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">Account: {company.bankAccount || '94630427'}</div>
                  <div className="text-slate-700 dark:text-slate-300">Bank: {company.bankName || 'BOC bank'}</div>
                  <div className="text-slate-700 dark:text-slate-300">Branch: {company.bankBranch || 'Walgama'}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 dark:text-white print:text-black block mb-1">
                  Terms & Conditions:
                </span>
                <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {company.invoiceTerms || `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`}
                </p>
              </div>

              {event.notes && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white print:text-black block mb-1">
                    Special Instructions / Notes:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{event.notes}</p>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-5 rounded-xl border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
                <span>Services Subtotal:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                  {formatCurrency(event.subtotal)}
                </span>
              </div>

              {event.discount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 print:text-amber-700">
                  <span>Special Discount:</span>
                  <span className="font-mono font-bold">-{formatCurrency(event.discount)}</span>
                </div>
              )}

              {event.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
                  <span>Logistics & Crew Transport:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    +{formatCurrency(event.additionalCharges)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                  Total Amount:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                  {formatCurrency(event.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
                <span>Total Paid:</span>
                <span className="font-mono font-bold">{formatCurrency(event.paidAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                  Balance Due
                </span>
                <span className="text-2xl font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono">
                  {formatCurrency(event.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature Row */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
            <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-2 text-slate-600 dark:text-slate-400">
              Authorized Signature (Seekers Entertainment)
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-2 text-slate-600 dark:text-slate-400">
              Client Acceptance & Confirmation Stamp
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#1a2636] text-center text-[11px] text-slate-400 dark:text-slate-500">
            Thank you for choosing Seekers Entertainment. For inquiries regarding this invoice, contact {company.email}.
          </div>
        </div>
      </div>
    </Modal>
  );
}
