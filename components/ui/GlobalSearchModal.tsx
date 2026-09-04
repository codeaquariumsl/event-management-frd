'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CalendarDays, Users, ClipboardList, FileText, ArrowRight, X } from 'lucide-react';
import { eventService } from '@/lib/api/eventService';
import { customerService } from '@/lib/api/customerService';
import { staffService } from '@/lib/api/staffService';
import { paymentService } from '@/lib/api/paymentService';
import { EventItem, Customer, Staff, CustomerPayment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [paymentsList, setPaymentsList] = useState<CustomerPayment[]>([]);

  useEffect(() => {
    if (isOpen) {
      eventService.getEvents().then((e) => { if (Array.isArray(e)) setEventsList(e); });
      customerService.getCustomers().then((c) => { if (Array.isArray(c)) setCustomersList(c); });
      staffService.getStaff().then((s) => { if (Array.isArray(s)) setStaffList(s); });
      paymentService.getCustomerPayments().then((p) => { if (Array.isArray(p)) setPaymentsList(p); });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return { events: [], customers: [], staff: [], payments: [] };
    }

    const q = query.toLowerCase();
    const events = eventsList
      .filter((e) => e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.customerName.toLowerCase().includes(q))
      .slice(0, 4);

    const customers = customersList
      .filter((c) => c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q)) || c.phone.includes(q))
      .slice(0, 4);

    const staff = staffList
      .filter((s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || (s.skills && s.skills.some((sk) => sk.toLowerCase().includes(q))))
      .slice(0, 4);

    const payments = paymentsList
      .filter((p) => p.invoiceNumber.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.eventName.toLowerCase().includes(q))
      .slice(0, 4);

    return { events, customers, staff, payments };
  }, [query, eventsList, customersList, staffList, paymentsList]);

  const hasResults =
    results.events.length > 0 ||
    results.customers.length > 0 ||
    results.staff.length > 0 ||
    results.payments.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Search Palette */}
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-[#243549] bg-white dark:bg-[#0d151f] shadow-2xl overflow-hidden animate-fade-in z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-[#1c2a3a]">
          <Search className="h-5 w-5 text-[#00897b] dark:text-[#00e5c9]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, customers, staff, invoices... (Try 'John', 'Wedding', 'Sound')"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block rounded bg-slate-100 dark:bg-[#162332] px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 flex-1 divide-y divide-slate-100 dark:divide-[#182535]">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Type keywords to search across Seekers Entertainment records
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for <span className="text-white font-medium">&quot;{query}&quot;</span>
            </div>
          ) : (
            <>
              {/* Events */}
              {results.events.length > 0 && (
                <div className="pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                    Events
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {results.events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          onClose();
                          router.push(`/events/${evt.id}`);
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#14202d] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CalendarDays className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9] shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#00897b] dark:group-hover:text-[#00e5c9]">
                              {evt.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {evt.customerName} • {formatDate(evt.eventDate)} • {evt.location}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0">
                          {formatCurrency(evt.totalAmount, true)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div className="py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                    Customers
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {results.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onClose();
                          router.push(`/customers/${c.id}`);
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#14202d] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {c.company || c.customerType} • {c.phone}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff */}
              {results.staff.length > 0 && (
                <div className="py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                    Staff & Production Crew
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {results.staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onClose();
                          router.push(`/staff/${s.id}`);
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#14202d] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                              {s.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {s.role} • {s.employmentType} • {s.phone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                          {s.totalEventsAssigned} events
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices & Payments */}
              {results.payments.length > 0 && (
                <div className="pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">
                    Invoices & Payments
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {results.payments.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onClose();
                          router.push('/customer-payments');
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#14202d] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-300">
                              {p.invoiceNumber} — {p.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.eventName} • {p.paymentMethod}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                          + {formatCurrency(p.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
