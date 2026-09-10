'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Download,
  Loader2,
  Eye,
  EyeOff,
  Boxes,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { quotationService } from '@/lib/api/quotationService';
import { settingsService } from '@/lib/api/reportService';
import { inventoryService } from '@/lib/api/inventoryService';
import { serviceService } from '@/lib/api/serviceService';
import { Quotation, QuotationLineItem, QuotationStatus, CompanyProfile, InventoryItem, ServiceCatalogItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [hideItemPrices, setHideItemPrices] = useState(false);
  const proposalRef = useRef<HTMLDivElement>(null);

  // Edit form state
  const [editData, setEditData] = useState<Partial<Quotation>>({});
  const [inventoryGear, setInventoryGear] = useState<InventoryItem[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);

  const loadData = async () => {
    try {
      const [q, p, inv, svcs] = await Promise.all([
        quotationService.getById(id),
        settingsService.getCompanyProfile(),
        inventoryService.getItems(),
        serviceService.getServices(),
      ]);
      if (q) {
        setQuotation(q);
        setEditData({
          ...q,
          termsAndConditions: q.termsAndConditions || `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`,
        });
      }
      if (p) setProfile(p);
      if (Array.isArray(inv)) setInventoryGear(inv);
      if (Array.isArray(svcs)) setServicesCatalog(svcs);
    } catch (err) {
      console.warn('Error loading quotation:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_quotations_updated', loadData);
    return () => window.removeEventListener('seekers_quotations_updated', loadData);
  }, [id]);

  // Edit calculations & field handlers
  const recalculateTotals = (
    items: QuotationLineItem[] = editData.items || [],
    discountVal = editData.discount,
    taxRateVal = editData.taxRate,
    additionalVal = editData.additionalCharges
  ) => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const discount = Number(discountVal || 0);
    const taxRate = Number(taxRateVal || 0);
    const taxAmount = Math.round((Math.max(0, subtotal - discount) * taxRate) / 100);
    const additionalCharges = Number(additionalVal || 0);
    const totalAmount = Math.max(0, subtotal - discount + taxAmount + additionalCharges);

    return { subtotal, discount, taxRate, taxAmount, additionalCharges, totalAmount };
  };

  const handleFinancialFieldChange = (field: 'discount' | 'taxRate' | 'additionalCharges', value: number) => {
    const nextDiscount = field === 'discount' ? value : editData.discount;
    const nextTaxRate = field === 'taxRate' ? value : editData.taxRate;
    const nextAdditional = field === 'additionalCharges' ? value : editData.additionalCharges;

    const totals = recalculateTotals(editData.items, nextDiscount, nextTaxRate, nextAdditional);
    setEditData((prev) => ({
      ...prev,
      [field]: value,
      ...totals,
    }));
  };

  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    if (!editData.items) return;
    const updated = [...editData.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const rawQty = field === 'quantity' ? value : item.quantity;
      const qty = rawQty !== null && rawQty !== undefined && rawQty !== '' && Number(rawQty) > 0 ? Number(rawQty) : 1;
      const price = Number(field === 'unitPrice' ? value : item.unitPrice || 0);
      const disc = Number(field === 'discount' ? value : item.discount || 0);
      item.totalPrice = Math.max(0, qty * price - disc);
    }

    updated[index] = item;
    const totals = recalculateTotals(updated);

    setEditData((prev) => ({
      ...prev,
      items: updated,
      ...totals,
    }));
  };

  const handleAddItem = () => {
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      category: 'General',
      size: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalPrice: 0,
    };
    const updated = [...(editData.items || []), newItem];
    const totals = recalculateTotals(updated);
    setEditData((prev) => ({
      ...prev,
      items: updated,
      ...totals,
    }));
  };

  const handleAddInventoryGear = (item: InventoryItem) => {
    const rate = item.rentalRate || item.unitPrice || 0;
    const newItem: QuotationLineItem = {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      name: item.name,
      category: item.category || 'Production',
      size: item.specifications || '',
      description: `Gear Item (SKU: ${item.sku})`,
      quantity: 1,
      unitPrice: rate,
      discount: 0,
      totalPrice: rate,
    };
    const updated = [...(editData.items || []), newItem];
    const totals = recalculateTotals(updated);
    setEditData((prev) => ({
      ...prev,
      items: updated,
      ...totals,
    }));
    showToast(`✓ Added gear "${item.name}"`, 'success');
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
    const updated = [...(editData.items || []), newItem];
    const totals = recalculateTotals(updated);
    setEditData((prev) => ({
      ...prev,
      items: updated,
      ...totals,
    }));
    showToast(`✓ Added package "${templateService.name}"`, 'success');
  };

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

  const handleRemoveItem = (index: number) => {
    if (!editData.items) return;
    const updated = editData.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(updated);
    setEditData((prev) => ({
      ...prev,
      items: updated,
      ...totals,
    }));
  };

  // Group line items category-wise for proposal display
  const categoryGroups = useMemo(() => {
    if (!quotation?.items || quotation.items.length === 0) return [];

    const map = new Map<string, QuotationLineItem[]>();
    quotation.items.forEach((item) => {
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
  }, [quotation?.items]);

  const hasAnyItemDiscount = useMemo(() => {
    return quotation?.items?.some((it) => (it.discount || 0) > 0) ?? false;
  }, [quotation?.items]);

  // PDF Generation and Print Utilities using html2canvas-pro (with lab/oklch support) & jsPDF
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

  // Generates a strictly Light-Themed A4 PDF document matching Invoice print standards
  const generateQuotationPdfDocument = async (sourceElement: HTMLElement) => {
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

    // 2. Enforce explicit Light Theme root styles matching A4 format (210mm x 297mm)
    clone.style.width = '794px'; // 210mm standard A4 width at 96 DPI
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.minHeight = '1060px'; // ensures A4 full-page height so mt-auto pins footer note to bottom
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    clone.style.justifyContent = 'space-between';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.padding = '38px 24px 20px 24px';
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
        classList.includes('bg-[#0b121b]') ||
        classList.includes('bg-[#0e1622]')
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

      // Add clean professional footer pagination on every page matching Invoice standards
      pdf.setFontSize(7.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        `Page ${page + 1} of ${totalPages} • Quotation ${quotation.quotationNumber}`,
        pdfWidth - 12,
        pdfHeight - 5,
        { align: 'right' }
      );
      pdf.text(
        `${profile?.name || 'Seekers Entertainment (Pvt) Ltd'} • ${profile?.email || 'ops@seekersentertainment.lk'}`,
        12,
        pdfHeight - 5
      );
    }

    return pdf;
  };

  const handleDownloadPdf = async () => {
    if (!proposalRef.current || !quotation) return;
    setIsGeneratingPdf(true);
    showToast('Generating Quotation PDF (Light Theme)...', 'info');

    try {
      const pdf = await generateQuotationPdfDocument(proposalRef.current);
      pdf.save(`Quotation_${quotation.quotationNumber}.pdf`);
      showToast(`Quotation ${quotation.quotationNumber} downloaded!`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast(err?.message || 'Could not download PDF. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!proposalRef.current || !quotation) return;
    setIsPrintingPdf(true);
    showToast('Preparing clean Light Theme PDF for print...', 'info');

    try {
      const pdf = await generateQuotationPdfDocument(proposalRef.current);
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

  const handleSaveEdit = async () => {
    if (!quotation) return;
    try {
      const totals = recalculateTotals(
        editData.items,
        editData.discount,
        editData.taxRate,
        editData.additionalCharges
      );

      const payload: Partial<Quotation> = {
        ...editData,
        id: quotation.id,
        quotationNumber: editData.quotationNumber || quotation.quotationNumber,
        title: editData.title || quotation.title,
        customerId: editData.customerId || quotation.customerId,
        customerName: editData.customerName || quotation.customerName,
        customerCompany: editData.customerCompany ?? quotation.customerCompany,
        customerPhone: editData.customerPhone ?? quotation.customerPhone,
        customerEmail: editData.customerEmail ?? quotation.customerEmail,
        eventType: editData.eventType || quotation.eventType,
        eventDate: editData.eventDate || quotation.eventDate,
        validUntil: editData.validUntil || quotation.validUntil,
        venue: editData.venue ?? quotation.venue,
        status: (editData.status as QuotationStatus) || quotation.status,
        items: editData.items || [],
        notes: editData.notes ?? '',
        termsAndConditions: editData.termsAndConditions,
        ...totals,
      };

      const saved = await quotationService.update(quotation.id, payload);
      setQuotation(saved);
      setIsEditing(false);
      showToast('Quotation updated successfully!', 'success');
      window.dispatchEvent(new Event('seekers_quotations_updated'));
    } catch (err: any) {
      console.error('Error updating quotation:', err);
      showToast(err?.message || 'Failed to save changes. Please try again.', 'error');
    }
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quotation Not Found</h2>
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
      {/* Print CSS for native A4 pagination matching Invoice */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 10mm 10mm 10mm;
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
              #quotation-proposal-view {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: 270mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
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

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-slate-200 dark:border-[#1d2b3c] pb-5">
          <div>
            <Link
              href="/quotations"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00e5c9] transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Quotations
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-3xl">
                {quotation.quotationNumber}
              </h1>
              <select
                value={quotation.status}
                onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#121c29] border border-slate-300 dark:border-[#22354c] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
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
            {quotation.convertedEventId && (
              <Link
                href={`/events/${quotation.convertedEventId}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00e5c9]/10 text-[#00e5c9] border border-[#00e5c9]/30 text-xs font-semibold hover:bg-[#00e5c9]/20 transition-colors"
                title="View the latest converted event"
              >
                <span>View Linked Event</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}

            {quotation.status !== 'Rejected' && (
              <button
                onClick={handleConvertToEvent}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] text-black text-xs font-bold hover:brightness-110 shadow-md shadow-[#00e5c9]/20 transition-all"
                title="Convert this quotation to an active Event"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{quotation.convertedEventId ? 'Convert to Another Event' : 'Convert to Live Event'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (!isEditing && quotation) {
                  setEditData({
                    ...quotation,
                    termsAndConditions: quotation.termsAndConditions || `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`,
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c40] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {isEditing ? 'Cancel Edit' : 'Edit Quotation'}
            </button>

            {/* Toggle Hide/Show Individual Rates & Totals (like Invoice) */}
            <button
              onClick={() => setHideItemPrices((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all shadow-sm ${hideItemPrices
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-[#00e5c9] hover:bg-emerald-500/20'
                : 'border-slate-300 dark:border-[#23354b] bg-slate-100 dark:bg-[#141e2b] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c2c40]'
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] text-white dark:text-black text-xs font-bold hover:brightness-110 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Quotation as clean A4 PDF file"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* EDIT VIEW (MANAGE ALL FIELDS) */}
        {isEditing ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] p-6 sm:p-8 space-y-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1d2b3c] pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-[#00a894] dark:text-[#00e5c9]" />
                  Edit Quotation Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update any quotation attributes, event scope, client contact, category line items, and pricing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b293a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] text-white dark:text-black text-xs font-bold hover:bg-[#008f7e] dark:hover:brightness-110 shadow-sm transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Section 1: Quotation & Event Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                1. Quotation & Event Scope
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quotation #
                  </label>
                  <input
                    type="text"
                    value={editData.quotationNumber || ''}
                    onChange={(e) => setEditData({ ...editData, quotationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. 2609-0001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editData.status || 'Draft'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as QuotationStatus })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Event Date
                  </label>
                  <input
                    type="date"
                    value={editData.eventDate || ''}
                    onChange={(e) => setEditData({ ...editData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={editData.validUntil || ''}
                    onChange={(e) => setEditData({ ...editData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. Quotation - Live Concert AV Setup"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Type / Category
                  </label>
                  <input
                    type="text"
                    value={editData.eventType || ''}
                    onChange={(e) => setEditData({ ...editData, eventType: e.target.value })}
                    list="quotation-event-type-list"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. Club / Concert / Live Music"
                  />
                  <datalist id="quotation-event-type-list">
                    <option value="Wedding & Reception" />
                    <option value="Club / Concert / Live Music" />
                    <option value="Corporate Event" />
                    <option value="Birthday & Anniversary" />
                    <option value="Festival" />
                    <option value="Private Party" />
                    <option value="Other" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location Address
                  </label>
                  <input
                    type="text"
                    value={editData.venue || ''}
                    onChange={(e) => setEditData({ ...editData, venue: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. Shangri-La Colombo, Grand Ballroom"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Client / Customer Details */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1d2b3c]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <Building className="h-3.5 w-3.5" />
                2. Client & Customer Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={editData.customerName || ''}
                    onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="Client or contact person name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={editData.customerCompany || ''}
                    onChange={(e) => setEditData({ ...editData, customerCompany: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. Shangri-La Hotels PLC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editData.customerPhone || ''}
                    onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. +94 77 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editData.customerEmail || ''}
                    onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="e.g. events@client.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Line Items (Category Wise) */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1d2b3c]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    3. Items & Services (Category Wise)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Items are automatically grouped by category on the final proposal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-[#162333] border border-slate-300 dark:border-[#23354c] text-slate-700 dark:text-slate-200 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c40] flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Custom Item
                </button>
              </div>

              {/* Real Backend Data Selectors: Pre-configured Packages & Inventory Gear */}
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
                    placeholder={`-- Search & select gear to add (${inventoryGear.length} items) --`}
                    searchPlaceholder="Search gear by name, SKU, or category..."
                    emptyMessage="No inventory gear matches your search"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {editData.items?.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 dark:bg-[#121c29] p-3 rounded-xl border border-slate-200 dark:border-[#1d2b3c] items-center text-xs"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Description / Item Name</label>
                      <input
                        type="text"
                        placeholder="Description (e.g. Pioneer DJM A9)"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Category</label>
                      <input
                        type="text"
                        placeholder="Category (e.g. Sound, Lighting)"
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                        list="quotation-category-list"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Size / Spec</label>
                      <input
                        type="text"
                        placeholder="e.g. 12*7 ft"
                        value={item.size || ''}
                        onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="—"
                        value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          handleItemChange(index, 'quantity', val === '' ? null : Number(val));
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9] text-center"
                        title="Optional. Leave blank for flat-rate / set pricing"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Unit Rate (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#162232] border border-slate-300 dark:border-[#213247] rounded text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9] text-right"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2.5">
                      <div className="text-right">
                        <span className="font-bold text-[#00897b] dark:text-[#00e5c9] font-mono text-xs block">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <datalist id="quotation-category-list">
                <option value="Sound" />
                <option value="Lighting" />
                <option value="DJ Equipment" />
                <option value="LED & Visuals" />
                <option value="Production" />
                <option value="Staff" />
                <option value="Special FX" />
                <option value="Trussing & Staging" />
                <option value="General" />
              </datalist>
            </div>

            {/* Section 4: Financial Adjustments & Totals */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1d2b3c]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" />
                4. Financial Adjustments & Totals
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-[#121c29] p-4 rounded-xl border border-slate-200 dark:border-[#1d2b3c]">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Items Subtotal (LKR)
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-[#162232] border border-slate-200 dark:border-[#213247] rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono font-bold">
                    {formatCurrency(editData.subtotal || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Overall Proposal Discount (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editData.discount ?? 0}
                    onChange={(e) => handleFinancialFieldChange('discount', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tax Rate (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.taxRate ?? 0}
                      onChange={(e) => handleFinancialFieldChange('taxRate', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    />
                    <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                      +{formatCurrency(editData.taxAmount || 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Logistics & Crew Transport (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editData.additionalCharges ?? 0}
                    onChange={(e) => handleFinancialFieldChange('additionalCharges', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              <div className="flex justify-between sm:justify-end items-center gap-4 p-4 bg-slate-100/70 dark:bg-[#141e2b] rounded-xl border border-slate-200 dark:border-[#23354b]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Calculated Grand Total:
                </span>
                <span className="text-xl font-black text-[#00897b] dark:text-[#00e5c9] font-mono">
                  {formatCurrency(editData.totalAmount || 0)}
                </span>
              </div>
            </div>

            {/* Section 5: Terms, Conditions & Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1d2b3c]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                5. Terms, Conditions & Special Notes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={5}
                    value={editData.termsAndConditions ?? ''}
                    onChange={(e) => setEditData({ ...editData, termsAndConditions: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-slate-300 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="Quotation terms and conditions..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Special Instructions / Notes
                  </label>
                  <textarea
                    rows={5}
                    value={editData.notes ?? ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-slate-300 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
                    placeholder="Special instructions or notes for client..."
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#1d2b3c]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#141e2b] border border-slate-300 dark:border-[#23354b] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b293a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] text-white dark:text-black text-xs font-bold hover:bg-[#008f7e] dark:hover:brightness-110 shadow-sm transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* PRINTABLE PROPOSAL VIEW (COMPACT A4 SIZING MATCHING INVOICE) */
          <div
            ref={proposalRef}
            id="quotation-proposal-view"
            className="printable-quotation flex flex-col justify-between min-h-[1050px] rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c131d] p-5 pt-8 sm:p-7 sm:pt-10 shadow-xl space-y-3.5 print:border-none print:p-0 print:bg-white print:text-black"
          >
            {/* Header Row: Company Brand + Quote Meta */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pb-3.5 border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 avoid-break">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-auto items-center justify-center rounded-lg overflow-hidden shrink-0">
                    <img src="/whitelogo.jpg" alt="Seekers Entertainment" className="h-14 w-auto object-contain rounded-md" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                      {profile?.name || 'SEEKERS ENTERTAINMENT'}
                    </h2>
                    <p className="text-[11px] text-[#00897b] dark:text-[#00e5c9] print:text-slate-600 font-semibold">
                      {profile?.tagline || 'Premier Audio-Visual Production, DJ & Event Technology'}
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-300 print:text-slate-700 leading-tight space-y-0.5">
                  <div>{profile?.address || 'No. 42, Independence Avenue, Colombo 07, Sri Lanka'}</div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">Tel:</span> +94 71 035 8723 / +94 76 468 0000 / +971 54 544 6609
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">Email:</span> {profile?.email || 'ops@seekersentertainment.lk'}
                  </div>
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="text-xl font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono tracking-wider">
                  QUOTATION
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white print:text-black font-mono">
                  {quotation.quotationNumber}
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                  Quotation Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{formatDate(quotation.createdAt || new Date().toISOString())}</strong>
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                  Event Date: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{quotation.eventDate}</strong>
                </div>
                {quotation.validUntil && (
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                    Valid Until: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{quotation.validUntil}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Client & Event Scope Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-3 rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-200 avoid-break text-xs">
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-slate-700 block mb-1">
                  Quotation Prepared For
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                  {quotation.customerName}
                </div>
                {quotation.customerCompany && (
                  <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 print:text-slate-700">
                    {quotation.customerCompany}
                  </div>
                )}
                {quotation.customerPhone && (
                  <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                    Phone: {quotation.customerPhone}
                  </div>
                )}
                {quotation.customerEmail && (
                  <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                    Email: {quotation.customerEmail}
                  </div>
                )}
                {quotation.venue && (
                  <div className="text-[10.5px] text-slate-600 dark:text-slate-400 print:text-slate-600 truncate">
                    Address: {quotation.venue}
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
                    <strong className="text-slate-900 dark:text-white print:text-black">{quotation.title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Category:</span>{' '}
                    <strong className="text-slate-900 dark:text-white print:text-black">{quotation.eventType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Event Date:</span>{' '}
                    <strong className="text-slate-900 dark:text-white print:text-black">{quotation.eventDate}</strong>
                  </div>
                  {quotation.validUntil && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Valid Until:</span>{' '}
                      <strong className="text-slate-900 dark:text-white print:text-black">{quotation.validUntil}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Location:</span>{' '}
                    <strong className="text-slate-900 dark:text-white print:text-black">{quotation.venue || 'TBD'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table (Category Wise, Compact A4 Sizing) */}
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-[#121d2b] print:bg-slate-100 uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 print:text-slate-700">
                  <tr className="border-b border-slate-200 dark:border-[#1d2b3c] print:border-slate-300">
                    <th className="px-3 py-1 w-10 text-center text-[10.5px]">#</th>
                    <th className="px-3 py-1 text-[10.5px]">Service / Item Description</th>
                    <th className="px-3 py-1 text-center text-[10.5px] w-14">Qty</th>
                    {!hideItemPrices && (
                      <th className="px-3 py-1 text-right w-28 text-[10.5px]">Rate (LKR)</th>
                    )}
                    {!hideItemPrices && hasAnyItemDiscount && (
                      <th className="px-3 py-1 text-right w-24 text-[10.5px]">Discount</th>
                    )}
                    <th className="px-3 py-1 text-right w-28 text-[10.5px]">Total (LKR)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 print:text-slate-800">
                  {(() => {
                    let globalIdx = 0;
                    return categoryGroups.map((group, gIdx) => (
                      <React.Fragment key={group.category || gIdx}>
                        {/* Category Header Row */}
                        <tr className={`bg-slate-50/90 dark:bg-[#131e2b] print:bg-slate-100/90 font-bold ${gIdx > 0 ? 'border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300' : ''} avoid-break`}>
                          <td colSpan={hideItemPrices ? 4 : (hasAnyItemDiscount ? 6 : 5)} className="px-3 py-0.5 text-[10.5px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold uppercase tracking-wider text-[#00897b] dark:text-[#00e5c9] print:text-black flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00897b] dark:bg-[#00e5c9] print:bg-slate-700 inline-block" />
                                {group.category}
                              </span>
                              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 print:text-slate-600 font-mono">
                                {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Items under Category (Compact line spacing matching invoice) */}
                        {group.items.map((item, itemIdx) => {
                          globalIdx++;
                          return (
                            <tr
                              key={item.id || `${group.category}-${itemIdx}`}
                              className="hover:bg-slate-50/50 dark:hover:bg-[#121c29]/50 transition-colors avoid-break"
                            >
                              <td className="px-3 py-0.5 text-center font-mono text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-500 leading-tight">{globalIdx}</td>
                              <td className="px-3 py-0.5 leading-tight">
                                <div className="font-medium text-slate-900 dark:text-white print:text-black text-[11px] leading-tight flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  {item.size && (
                                    <span className="inline-block rounded bg-slate-100 dark:bg-[#1a2636] print:bg-slate-100 border border-slate-300 dark:border-[#283b52] print:border-slate-300 px-1.5 py-0.5 text-[9.5px] font-semibold text-[#00897b] dark:text-[#00e5c9] print:text-slate-800 leading-none">
                                      {item.size}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-0.5 text-center font-mono font-medium text-slate-800 dark:text-slate-200 print:text-black text-[11px] leading-tight">
                                {item.quantity !== null && item.quantity !== undefined && item.quantity > 0 ? item.quantity : '—'}
                              </td>
                              {!hideItemPrices ? (
                                <>
                                  <td className="px-3 py-0.5 text-right font-mono text-slate-800 dark:text-slate-200 print:text-black text-[11px] leading-tight">
                                    {formatCurrency(item.unitPrice)}
                                  </td>
                                  {hasAnyItemDiscount && (
                                    <td className="px-3 py-0.5 text-right font-mono text-amber-600 dark:text-amber-400 print:text-amber-700 text-[11px] leading-tight">
                                      {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                                    </td>
                                  )}
                                  <td className="px-3 py-0.5 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black text-[11px] leading-tight">
                                    {formatCurrency(item.totalPrice)}
                                  </td>
                                </>
                              ) : (
                                <td className="px-3 py-0.5"></td>
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
                            </td>
                            <td className="px-3 py-0.5 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black text-xs">
                              {formatCurrency(group.subtotal)}
                            </td>
                          </tr>
                        ) : (
                          categoryGroups.length > 1 && (
                            <tr className="bg-slate-50/40 dark:bg-[#0e1622]/40 print:bg-slate-50 text-[10px] border-b border-slate-200 dark:border-[#172332] print:border-slate-200 avoid-break">
                              <td colSpan={hasAnyItemDiscount ? 5 : 4} className="px-3 py-0.5 text-right font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
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

                  {quotation.items.length === 0 && (
                    <tr>
                      <td colSpan={hideItemPrices ? 4 : (hasAnyItemDiscount ? 6 : 5)} className="px-3 py-6 text-center text-slate-400">
                        No line items recorded for this quotation.
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
                    <div><strong>Beneficiary:</strong> {profile?.name || 'Seekers’s Entertainment (pvt) Ltd'}</div>
                    <div><strong>Account:</strong> {profile?.bankAccount || '94630427'} • <strong>Bank:</strong> {profile?.bankName || 'BOC bank'} ({profile?.bankBranch || 'Walgama'})</div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider text-[9.5px] block mb-0.5">
                    Terms & Conditions:
                  </span>
                  <p className="text-[9.5px] leading-snug whitespace-pre-line text-slate-500 dark:text-slate-400 print:text-slate-700">
                    {quotation.termsAndConditions || profile?.invoiceTerms || `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`}
                  </p>
                </div>

                {quotation.notes && (
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider text-[9.5px] block mb-0.5">
                      Special Notes:
                    </span>
                    <p className="text-[9.5px] leading-snug text-slate-500 dark:text-slate-400 print:text-slate-700">{quotation.notes}</p>
                  </div>
                )}
              </div>

              {/* Calculations Box */}
              <div className="bg-slate-50 dark:bg-[#0f1824] print:bg-slate-50 p-3.5 rounded-lg border border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 space-y-1.5 text-xs self-start">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(quotation.subtotal)}
                  </span>
                </div>

                {quotation.discount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 print:text-amber-700">
                    <span>Proposal Discount:</span>
                    <span className="font-mono font-bold">-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}

                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
                    <span>Tax ({quotation.taxRate}%):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                      +{formatCurrency(quotation.taxAmount)}
                    </span>
                  </div>
                )}

                {quotation.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
                    <span>Logistics & Transport:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                      +{formatCurrency(quotation.additionalCharges)}
                    </span>
                  </div>
                )}

                <div className="pt-1.5 border-t border-slate-200 dark:border-[#1d2b3c] print:border-slate-300 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                    Grand Total:
                  </span>
                  <span className="text-sm font-black text-[#00897b] dark:text-[#00e5c9] print:text-slate-900 font-mono">
                    {formatCurrency(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Page Footer Area */}
            <div className="mt-auto pt-6 space-y-3 avoid-break">
              {/* Footer Signature Row */}
              <div className="grid grid-cols-2 gap-8 text-center text-[10.5px] text-slate-500 dark:text-slate-400 print:text-slate-600 avoid-break">
                <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1.5 text-slate-600 dark:text-slate-400">
                  Authorized Signature (Seekers Entertainment)
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1.5 text-slate-600 dark:text-slate-400">
                  Client Acceptance & Confirmation Stamp
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#1a2636] text-center text-[9.5px] text-slate-400 dark:text-slate-500 avoid-break">
                Thank you for choosing Seekers Entertainment. For inquiries regarding this quotation, contact {profile?.email || 'ops@seekersentertainment.lk'}.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
