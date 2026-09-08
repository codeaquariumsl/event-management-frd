'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, Download, CreditCard, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [hideItemPrices, setHideItemPrices] = useState(false);

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

    // 2. Enforce explicit Light Theme root styles matching A4 format
    clone.style.width = '794px'; // 210mm standard A4 width at 96 DPI
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.padding = '20px 24px';
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

    // Intelligently insert page-break spacers for multi-page documents to prevent splitting rows
    const A4_HEIGHT_PX = 1123; // Standard 297mm height at 96 DPI
    const cloneRect = clone.getBoundingClientRect();
    const breakables = Array.from(clone.querySelectorAll('tr, .avoid-break')) as HTMLElement[];

    breakables.forEach((el) => {
      const elRect = el.getBoundingClientRect();
      const relTop = elRect.top - cloneRect.top;
      const relBottom = elRect.bottom - cloneRect.top;
      const pageIndex = Math.floor(relTop / A4_HEIGHT_PX);
      const pageBottomLimit = (pageIndex + 1) * A4_HEIGHT_PX - 28;

      if (relTop < pageBottomLimit && relBottom > pageBottomLimit) {
        const spacerHeight = ((pageIndex + 1) * A4_HEIGHT_PX) - relTop;
        if (el.tagName.toLowerCase() === 'tr') {
          const spacerTr = document.createElement('tr');
          spacerTr.className = 'pdf-page-spacer';
          const spacerTd = document.createElement('td');
          spacerTd.colSpan = 10;
          spacerTd.style.height = `${spacerHeight}px`;
          spacerTd.style.border = 'none';
          spacerTd.style.padding = '0';
          spacerTd.style.background = 'transparent';
          spacerTr.appendChild(spacerTd);
          el.parentNode?.insertBefore(spacerTr, el);
        } else {
          const spacerDiv = document.createElement('div');
          spacerDiv.className = 'pdf-page-spacer';
          spacerDiv.style.height = `${spacerHeight}px`;
          spacerDiv.style.width = '100%';
          spacerDiv.style.background = 'transparent';
          el.parentNode?.insertBefore(spacerDiv, el);
        }
      }
    });

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

    const totalPages = Math.max(1, Math.ceil(imgHeight / pdfHeight));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      const yOffset = -(page * pdfHeight);
      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, '', 'FAST');

      // Add clean professional footer pagination on every page
      pdf.setFontSize(7.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        `Page ${page + 1} of ${totalPages} • Invoice ${invoiceNumber}`,
        pdfWidth - 12,
        pdfHeight - 5,
        { align: 'right' }
      );
      pdf.text(
        `${company.name || 'Seekers Entertainment (Pvt) Ltd'} • ${company.email || 'ops@seekersentertainment.lk'}`,
        12,
        pdfHeight - 5
      );
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
      {/* Print CSS for native A4 pagination */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm 8mm 10mm;
              }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print, nav, header, aside, .modal-backdrop, button {
                display: none !important;
              }
              #event-invoice-view {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                background: #ffffff !important;
                color: #0f172a !important;
              }
              tr, .avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              thead {
                display: table-header-group !important;
              }
            }
          `,
        }}
      />

      <div className="flex flex-col gap-4">
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

            {/* Toggle Hide/Show Individual Rates & Totals */}
            <button
              onClick={() => setHideItemPrices((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${hideItemPrices
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-[#00e5c9] hover:bg-emerald-500/20'
                : 'border-slate-300 dark:border-[#24374b] bg-slate-100 dark:bg-[#142130] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1b2b3d]'
                }`}
              title={
                hideItemPrices
                  ? 'Show individual item rates & totals in table'
                  : 'Hide individual item rates & totals (show only category totals)'
              }
            >
              {hideItemPrices ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show Item Rates</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide Item Rates</span>
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isPrintingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-3 py-1.5 text-xs font-bold text-white dark:text-black hover:brightness-110 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Invoice as clean Light Theme A4 PDF file"
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
              title="Print clean A4 document"
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

        {/* Printable Invoice Card (Compact A4 Layout) */}
        <div
          ref={invoiceRef}
          id="event-invoice-view"
          className="printable-invoice rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c131d] p-5 sm:p-7 shadow-xl space-y-3.5 print:border-none print:p-0 print:bg-white print:text-black"
        >
          {/* Header Row: Company Brand + Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-3.5 border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 avoid-break">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-auto items-center justify-center rounded-lg overflow-hidden shrink-0">
                  <img src="/whitelogo.jpg" alt="Seekers Entertainment" className="h-12 w-auto object-contain rounded-md" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                    {company?.name || 'SEEKERS ENTERTAINMENT'}
                  </h2>
                  <p className="text-[11px] text-[#00897b] dark:text-[#00e5c9] print:text-slate-600 font-semibold">
                    {company?.tagline || 'Premier Audio-Visual Production, DJ & Event Technology'}
                  </p>
                </div>
              </div>

              <div className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-300 print:text-slate-700 leading-tight space-y-0.5">
                <div>{company?.address}</div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">Tel:</span> +94 71 035 8723 / +94 76 468 0000 / +971 54 544 6609
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">Email:</span> {company?.email || 'ops@seekersentertainment.lk'}
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-xl font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono tracking-wider">
                INVOICE
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white print:text-black font-mono">
                {invoiceNumber}
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                Invoice Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{formatDate(event.createdAt || new Date().toISOString())}</strong>
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                Event Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{event.eventDate}</strong>
              </div>
            </div>
          </div>

          {/* Client & Event Scope Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-3 rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-200 avoid-break text-xs">
            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-slate-700 block mb-1">
                Invoice Prepared For
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                {event.customerName}
              </div>
              {event.customerCompany && (
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 print:text-slate-700">
                  {event.customerCompany}
                </div>
              )}
              {event.customerPhone && (
                <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                  Phone: {event.customerPhone}
                </div>
              )}
              {event.customerEmail && (
                <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                  Email: {event.customerEmail}
                </div>
              )}
              {event.address && (
                <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600 truncate">
                  Address: {event.address}
                </div>
              )}
            </div>

            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-slate-700 block mb-1">
                Event Specifications
              </span>
              <div className="text-[10.5px] space-y-0.5 text-slate-600 dark:text-slate-300 print:text-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Title:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Category:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-black">{event.eventType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Date:</span>{' '}
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
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#121d2b] print:bg-slate-100 uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 print:text-slate-700">
                <tr className="border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
                  <th className="px-3 py-1 w-10 text-center text-[10.5px]">#</th>
                  <th className="px-3 py-1 text-[10.5px]">Service / Item Description</th>
                  <th className={`px-3 py-1 text-center text-[10.5px] ${hideItemPrices ? 'w-24' : 'w-16'}`}>Qty</th>
                  {!hideItemPrices && (
                    <>
                      <th className="px-3 py-1 text-right w-28 text-[10.5px]">Rate (LKR)</th>
                      <th className="px-3 py-1 text-right w-28 text-[10.5px]">Total (LKR)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300 print:text-slate-800">
                {(() => {
                  let globalIdx = 0;
                  return categoryGroups.map((group, gIdx) => (
                    <React.Fragment key={group.category || gIdx}>
                      {/* Category Header Row */}
                      <tr className={`bg-slate-50/90 dark:bg-[#131e2b] print:bg-slate-100/90 font-bold ${gIdx > 0 ? 'border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300' : ''} avoid-break`}>
                        <td colSpan={hideItemPrices ? 3 : 5} className="px-3 py-0.5 text-[10.5px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-black flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00897b] dark:bg-[#00e5c9] print:bg-slate-700 inline-block" />
                              {group.category}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Items under Category (No border, compact line spacing) */}
                      {group.items.map((srv, itemIdx) => {
                        globalIdx++;
                        return (
                          <tr
                            key={srv.id || `${group.category}-${itemIdx}`}
                            className="hover:bg-slate-50/50 dark:hover:bg-[#121c29]/50 transition-colors avoid-break"
                          >
                            <td className="px-3 py-0.5 text-center font-mono text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-500 leading-tight">{globalIdx}</td>
                            <td className="px-3 py-0.5 leading-tight">
                              <div className="font-medium text-slate-900 dark:text-white print:text-black text-xs leading-tight">{srv.name}</div>
                            </td>
                            <td className="px-3 py-0.5 text-center font-mono font-medium text-slate-800 dark:text-slate-200 print:text-black text-xs leading-tight">{srv.quantity}</td>
                            {!hideItemPrices && (
                              <>
                                <td className="px-3 py-0.5 text-right font-mono text-slate-800 dark:text-slate-200 print:text-black text-xs leading-tight">{formatCurrency(srv.unitPrice)}</td>
                                <td className="px-3 py-0.5 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black text-xs leading-tight">
                                  {formatCurrency(srv.totalPrice)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}

                      {/* Category Subtotal Row */}
                      {hideItemPrices ? (
                        <tr className="bg-slate-50/70 dark:bg-[#0e1622]/70 print:bg-slate-100/80 text-xs border-b border-slate-200 dark:border-[#172332] print:border-slate-300 avoid-break font-bold">
                          <td colSpan={3} className="px-3 py-0.5 text-right">
                            <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 print:text-slate-700 mr-2">
                              {group.category} Total:
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black text-xs">
                              {formatCurrency(group.subtotal)}
                            </span>
                          </td>
                        </tr>
                      ) : (
                        categoryGroups.length > 1 && (
                          <tr className="bg-slate-50/40 dark:bg-[#0e1622]/40 print:bg-slate-50 text-[10px] border-b border-slate-200 dark:border-[#172332] print:border-slate-200 avoid-break">
                            <td colSpan={4} className="px-3 py-0.5 text-right font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                              Subtotal ({group.category}):
                            </td>
                            <td className="px-3 py-0.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                              {formatCurrency(group.subtotal)}
                            </td>
                          </tr>
                        )
                      )}
                    </React.Fragment>
                  ));
                })()}

                {(!event.services || event.services.length === 0) && (
                  <tr>
                    <td colSpan={hideItemPrices ? 3 : 5} className="px-3 py-6 text-center text-slate-400">
                      No line items recorded for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Bank Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5 avoid-break">
            <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 space-y-2">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-[#1d2b3c] bg-slate-50/60 dark:bg-[#0f1824]/60 print:bg-slate-50/60 space-y-0.5 text-[10px]">
                <span className="font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider text-[9.5px] block mb-0.5">
                  Bank Settlement Details:
                </span>
                <div className="font-mono text-slate-700 dark:text-slate-300 print:text-black">
                  <div><strong>Beneficiary:</strong> {company.name || 'Seekers’s Entertainment (pvt) Ltd'}</div>
                  <div><strong>Account:</strong> {company.bankAccount || '94630427'} • <strong>Bank:</strong> {company.bankName || 'BOC bank'} ({company.bankBranch || 'Walgama'})</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider text-[9.5px] block mb-0.5">
                  Terms & Payment Conditions:
                </span>
                <p className="text-[9.5px] leading-snug whitespace-pre-line text-slate-500 dark:text-slate-400 print:text-slate-700">
                  {company.invoiceTerms || `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`}
                </p>
              </div>

              {event.notes && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider text-[9.5px] block mb-0.5">
                    Special Notes:
                  </span>
                  <p className="text-[9.5px] leading-snug text-slate-500 dark:text-slate-400 print:text-slate-700">{event.notes}</p>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-3.5 rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 space-y-1.5 text-xs self-start">
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
                  <span>Logistics & Transport:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    +{formatCurrency(event.additionalCharges)}
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                  Total Contract Amount:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                  {formatCurrency(event.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
                <span>Total Paid / Advance:</span>
                <span className="font-mono font-bold">{formatCurrency(event.paidAmount)}</span>
              </div>

              <div className="pt-1.5 border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                  Balance Due:
                </span>
                <span className="text-lg font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono">
                  {formatCurrency(event.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature Row */}
          <div className="pt-5 grid grid-cols-2 gap-8 text-center text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600 avoid-break">
            <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1.5 text-slate-600 dark:text-slate-400">
              Authorized Signature (Seekers Entertainment)
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1.5 text-slate-600 dark:text-slate-400">
              Client Acceptance & Confirmation Stamp
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-3 pt-1.5 border-t border-slate-200 dark:border-[#1a2636] text-center text-[9.5px] text-slate-400 dark:text-slate-500 avoid-break">
            Thank you for choosing Seekers Entertainment. For inquiries regarding this invoice, contact {company.email}.
          </div>
        </div>
      </div>
    </Modal>
  );
}
