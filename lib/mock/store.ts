import {
  CompanyProfile,
  Customer,
  CustomerPayment,
  EventItem,
  EventTypeItem,
  InventoryCategory,
  InventoryItem,
  Quotation,
  RecurringEvent,
  Staff,
  StaffPayment,
  StaffPayrollSummary,
  SystemNotification,
  UserAccount,
  UserRole,
} from '../types';
import {
  defaultServicesList,
  initialCompanyProfile,
  initialCustomerPayments,
  initialCustomers,
  initialEvents,
  initialEventTypes,
  initialInventoryCategories,
  initialInventoryItems,
  initialNotifications,
  initialQuotations,
  initialRecurringEvents,
  initialStaff,
  initialStaffPayments,
} from './data';

const STORAGE_KEYS = {
  EVENTS: 'seekers_events',
  CUSTOMERS: 'seekers_customers',
  STAFF: 'seekers_staff',
  RECURRING: 'seekers_recurring',
  CUSTOMER_PAYMENTS: 'seekers_customer_payments',
  STAFF_PAYMENTS: 'seekers_staff_payments',
  NOTIFICATIONS: 'seekers_notifications',
  PROFILE: 'seekers_company_profile',
  SERVICES: 'seekers_services_list',
  USERS: 'seekers_users',
  EVENT_TYPES: 'seekers_event_types',
  INVENTORY_CATEGORIES: 'seekers_inventory_categories',
  INVENTORY_ITEMS: 'seekers_inventory_items',
  QUOTATIONS: 'seekers_quotations',
};

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, string[]> = {
  'Super Admin': [
    'events:view',
    'events:create',
    'events:edit',
    'events:delete',
    'calendar:view',
    'recurring:manage',
    'staff:view',
    'staff:manage',
    'payroll:view',
    'payroll:manage',
    'customers:view',
    'customers:manage',
    'billing:manage',
    'reports:view',
    'users:manage',
    'settings:manage',
  ],
  'Event Director': [
    'events:view',
    'events:create',
    'events:edit',
    'calendar:view',
    'recurring:manage',
    'staff:view',
    'staff:manage',
    'customers:view',
    'customers:manage',
    'billing:manage',
    'reports:view',
  ],
  'Production Manager': [
    'events:view',
    'events:create',
    'events:edit',
    'calendar:view',
    'recurring:manage',
    'staff:view',
    'staff:manage',
    'reports:view',
  ],
  'Finance Officer': [
    'events:view',
    'staff:view',
    'payroll:view',
    'payroll:manage',
    'customers:view',
    'billing:manage',
    'reports:view',
  ],
  'Crew Coordinator': [
    'events:view',
    'calendar:view',
    'staff:view',
    'staff:manage',
  ],
  'Read Only': ['events:view', 'calendar:view'],
};

const initialUsers: UserAccount[] = [
  {
    id: 'USR-001',
    name: 'Dilruwan Perera (Director)',
    email: 'admin@seekersentertainment.lk',
    avatar: 'DP',
    phone: '+94 77 100 2000',
    role: 'Super Admin',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MATRIX['Super Admin'],
    lastLogin: '2026-09-03 12:15',
    createdAt: '2025-01-01',
  },
  {
    id: 'USR-002',
    name: 'Shannon Fonseka',
    email: 'shannon@seekersentertainment.lk',
    avatar: 'SF',
    phone: '+94 77 123 9081',
    role: 'Event Director',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MATRIX['Event Director'],
    lastLogin: '2026-09-03 10:30',
    createdAt: '2025-03-15',
  },
  {
    id: 'USR-003',
    name: 'Kasun Perera',
    email: 'kasun.sound@seekersentertainment.lk',
    avatar: 'KP',
    phone: '+94 71 492 8102',
    role: 'Production Manager',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MATRIX['Production Manager'],
    lastLogin: '2026-09-02 18:40',
    createdAt: '2025-04-01',
  },
  {
    id: 'USR-004',
    name: 'Nirasha Senanayake',
    email: 'finance@seekersentertainment.lk',
    avatar: 'NS',
    phone: '+94 77 889 9001',
    role: 'Finance Officer',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MATRIX['Finance Officer'],
    lastLogin: '2026-09-03 09:05',
    createdAt: '2025-05-10',
  },
  {
    id: 'USR-005',
    name: 'Dilantha Wickrama',
    email: 'ops@seekersentertainment.lk',
    avatar: 'DW',
    phone: '+94 76 555 1234',
    role: 'Crew Coordinator',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MATRIX['Crew Coordinator'],
    lastLogin: '2026-09-01 14:20',
    createdAt: '2025-06-20',
  },
];

function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger window storage event for cross-component sync
    window.dispatchEvent(new Event('seekers_store_updated'));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

class MockStore {
  // EVENTS
  getEvents(): EventItem[] {
    return getStorageItem<EventItem[]>(STORAGE_KEYS.EVENTS, initialEvents);
  }

  getEventById(id: string): EventItem | undefined {
    const events = this.getEvents();
    return events.find((e) => e.id === id);
  }

  saveEvent(eventData: Partial<EventItem> & { name: string; customerId: string }): EventItem {
    const events = this.getEvents();
    const existingIndex = events.findIndex((e) => e.id === eventData.id);
    const now = new Date().toISOString();

    let saved: EventItem;

    if (existingIndex >= 0) {
      saved = {
        ...events[existingIndex],
        ...eventData,
        updatedAt: now,
      };
      events[existingIndex] = saved;
    } else {
      const newId = `EVT-2026-${String(events.length + 1).padStart(3, '0')}`;
      saved = {
        id: newId,
        name: eventData.name,
        customerId: eventData.customerId,
        customerName: eventData.customerName || 'Unknown Customer',
        customerCompany: eventData.customerCompany,
        customerPhone: eventData.customerPhone,
        customerEmail: eventData.customerEmail,
        eventType: eventData.eventType || 'Other',
        eventDate: eventData.eventDate || new Date().toISOString().split('T')[0],
        startTime: eventData.startTime || '18:00',
        endTime: eventData.endTime || '23:00',
        location: eventData.location || 'Colombo',
        address: eventData.address || '',
        description: eventData.description || '',
        notes: eventData.notes || '',
        status: eventData.status || 'Confirmed',
        services: eventData.services || [],
        assignedStaff: eventData.assignedStaff || [],
        expenses: eventData.expenses || [],
        timeline: eventData.timeline || [
          {
            id: `tl-${Date.now()}`,
            title: 'Event Created',
            description: 'New event created in the system',
            timestamp: new Date().toLocaleString(),
            completed: true,
            type: 'created',
          },
        ],
        subtotal: eventData.subtotal || 0,
        discount: eventData.discount || 0,
        additionalCharges: eventData.additionalCharges || 0,
        totalAmount: eventData.totalAmount || 0,
        paidAmount: eventData.paidAmount || 0,
        balance: (eventData.totalAmount || 0) - (eventData.paidAmount || 0),
        createdAt: now,
        updatedAt: now,
      };
      events.unshift(saved);
    }

    setStorageItem(STORAGE_KEYS.EVENTS, events);
    this.updateCustomerBalances(saved.customerId);
    return saved;
  }

  deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const event = events.find((e) => e.id === id);
    if (!event) return false;

    const filtered = events.filter((e) => e.id !== id);
    setStorageItem(STORAGE_KEYS.EVENTS, filtered);
    this.updateCustomerBalances(event.customerId);
    return true;
  }

  // SCHEDULING CONFLICT DETECTION
  checkStaffConflict(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): { hasConflict: boolean; conflictingEvent?: EventItem; staffName?: string } {
    const events = this.getEvents();
    const staffMember = this.getStaff().find((s) => s.id === staffId);
    const staffName = staffMember?.name || 'Staff member';

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    for (const evt of events) {
      if (excludeEventId && evt.id === excludeEventId) continue;
      if (evt.status === 'Cancelled') continue;
      if (evt.eventDate !== date) continue;

      const isStaffAssigned = evt.assignedStaff.some((as) => as.staffId === staffId);
      if (!isStaffAssigned) continue;

      const evtStart = this.timeToMinutes(evt.startTime);
      const evtEnd = this.timeToMinutes(evt.endTime);

      // Overlap condition: start < otherEnd && end > otherStart
      if (startMinutes < evtEnd && endMinutes > evtStart) {
        return {
          hasConflict: true,
          conflictingEvent: evt,
          staffName,
        };
      }
    }

    return { hasConflict: false };
  }

  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // CUSTOMERS
  getCustomers(): Customer[] {
    return getStorageItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  saveCustomer(customerData: Partial<Customer> & { name: string; phone: string }): Customer {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex((c) => c.id === customerData.id);

    let saved: Customer;
    if (existingIndex >= 0) {
      saved = { ...customers[existingIndex], ...customerData };
      customers[existingIndex] = saved;
    } else {
      const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      saved = {
        id: newId,
        name: customerData.name,
        company: customerData.company || '',
        phone: customerData.phone,
        email: customerData.email || '',
        address: customerData.address || '',
        customerType: customerData.customerType || 'Individual',
        status: customerData.status || 'Active',
        notes: customerData.notes || '',
        totalEvents: 0,
        totalRevenue: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      customers.push(saved);
    }

    setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);

    // Asynchronously synchronize with live backend
    if (typeof window !== 'undefined') {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      const isNew = existingIndex < 0;
      fetch(`${API_URL}/customers${isNew ? '' : `/${saved.id}`}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch((err) => console.warn('Background sync failed for customer:', err));
    }

    return saved;
  }

  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    setStorageItem(STORAGE_KEYS.CUSTOMERS, filtered);

    // Asynchronously delete from backend
    if (typeof window !== 'undefined') {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Background delete failed for customer:', err));
    }

    return true;
  }

  private updateCustomerBalances(customerId: string): void {
    const events = this.getEvents().filter((e) => e.customerId === customerId && e.status !== 'Cancelled');
    const totalEvents = events.length;
    const totalRevenue = events.reduce((sum, e) => sum + e.totalAmount, 0);
    const outstandingBalance = events.reduce((sum, e) => sum + e.balance, 0);

    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx >= 0) {
      customers[idx].totalEvents = totalEvents;
      customers[idx].totalRevenue = totalRevenue;
      customers[idx].outstandingBalance = outstandingBalance;
      setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
  }

  // STAFF
  getStaff(): Staff[] {
    return getStorageItem<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
  }

  getStaffById(id: string): Staff | undefined {
    return this.getStaff().find((s) => s.id === id);
  }

  saveStaff(staffData: Partial<Staff> & { name: string; role: any }): Staff {
    const staffList = this.getStaff();
    const existingIndex = staffList.findIndex((s) => s.id === staffData.id);

    let saved: Staff;
    if (existingIndex >= 0) {
      saved = { ...staffList[existingIndex], ...staffData };
      staffList[existingIndex] = saved;
    } else {
      const newId = `STF-${String(staffList.length + 1).padStart(3, '0')}`;
      const initials = staffData.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      saved = {
        id: newId,
        name: staffData.name,
        avatar: initials,
        phone: staffData.phone || '',
        email: staffData.email || '',
        role: staffData.role || 'Assistant',
        skills: staffData.skills || [],
        employmentType: staffData.employmentType || 'Freelance',
        status: staffData.status || 'Active',
        joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
        basicSalary: staffData.basicSalary || 0,
        defaultRatePerEvent: staffData.defaultRatePerEvent || 15000,
        bankDetails: staffData.bankDetails,
        notes: staffData.notes || '',
        totalEventsAssigned: 0,
        totalEventsCompleted: 0,
        totalEarnings: 0,
        pendingPayments: 0,
      };
      staffList.push(saved);
    }

    setStorageItem(STORAGE_KEYS.STAFF, staffList);
    return saved;
  }

  deleteStaff(id: string): boolean {
    const staffList = this.getStaff();
    const filtered = staffList.filter((s) => s.id !== id);
    setStorageItem(STORAGE_KEYS.STAFF, filtered);
    return true;
  }

  // CUSTOMER PAYMENTS
  getCustomerPayments(): CustomerPayment[] {
    return getStorageItem<CustomerPayment[]>(STORAGE_KEYS.CUSTOMER_PAYMENTS, initialCustomerPayments);
  }

  saveCustomerPayment(payment: Omit<CustomerPayment, 'id'>): CustomerPayment {
    const payments = this.getCustomerPayments();
    const newId = `PAY-CUST-${String(payments.length + 101)}`;

    const savedPayment: CustomerPayment = {
      ...payment,
      id: newId,
    };

    payments.unshift(savedPayment);
    setStorageItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, payments);

    // Update the event's paidAmount & balance
    const events = this.getEvents();
    const evtIndex = events.findIndex((e) => e.id === payment.eventId);
    if (evtIndex >= 0) {
      const evt = events[evtIndex];
      evt.paidAmount += payment.amount;
      evt.balance = Math.max(0, evt.totalAmount - evt.paidAmount);
      evt.timeline.push({
        id: `tl-${Date.now()}`,
        title: `Payment Received (LKR ${payment.amount.toLocaleString()})`,
        description: `Recorded via ${payment.paymentMethod} (Ref: ${payment.referenceNumber || 'N/A'})`,
        timestamp: new Date().toLocaleString(),
        completed: true,
        type: 'payment',
      });
      events[evtIndex] = evt;
      setStorageItem(STORAGE_KEYS.EVENTS, events);
      this.updateCustomerBalances(evt.customerId);
    }

    return savedPayment;
  }

  // STAFF PAYMENTS
  getStaffPayments(): StaffPayment[] {
    return getStorageItem<StaffPayment[]>(STORAGE_KEYS.STAFF_PAYMENTS, initialStaffPayments);
  }

  saveStaffPayment(paymentData: Omit<StaffPayment, 'id'>): StaffPayment {
    const payments = this.getStaffPayments();
    const newId = `PAY-STF-${String(payments.length + 1).padStart(3, '0')}`;

    const savedPayment: StaffPayment = {
      ...paymentData,
      id: newId,
    };

    payments.unshift(savedPayment);
    setStorageItem(STORAGE_KEYS.STAFF_PAYMENTS, payments);

    // If linked to an event and staff, update assignedStaff paid status
    if (paymentData.eventId && paymentData.staffId) {
      const events = this.getEvents();
      const evtIdx = events.findIndex((e) => e.id === paymentData.eventId);
      if (evtIdx >= 0) {
        const asIdx = events[evtIdx].assignedStaff.findIndex((as) => as.staffId === paymentData.staffId);
        if (asIdx >= 0) {
          events[evtIdx].assignedStaff[asIdx].paidAmount += paymentData.paidAmount;
          setStorageItem(STORAGE_KEYS.EVENTS, events);
        }
      }
    }

    return savedPayment;
  }

  // PAYROLL SUMMARY COMPUTATION
  getPayrollSummary(monthYear: string): StaffPayrollSummary[] {
    const staff = this.getStaff();
    const staffPayments = this.getStaffPayments();
    const events = this.getEvents();

    return staff.map((member) => {
      // Basic salary
      const basic = member.employmentType === 'Full Time' ? member.basicSalary : 0;

      // Event payments for this month
      const memberEvents = events.filter((e) => {
        if (!e.eventDate.startsWith(monthYear)) return false;
        return e.assignedStaff.some((as) => as.staffId === member.id);
      });

      const eventPayments = memberEvents.reduce((acc, evt) => {
        const as = evt.assignedStaff.find((a) => a.staffId === member.id);
        return acc + (as?.paymentAmount || 0);
      }, 0);

      // Payments already paid
      const paid = staffPayments
        .filter((p) => p.staffId === member.id && p.date.startsWith(monthYear) && p.status === 'Paid')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      const overtime = member.employmentType === 'Full Time' ? Math.round(basic * 0.08) : 0;
      const bonus = memberEvents.length > 5 ? 15000 : 0;
      const deductions = 0;
      const advance = 0;

      const netPay = basic + eventPayments + overtime + bonus - deductions - advance;
      const balance = Math.max(0, netPay - paid);

      return {
        staffId: member.id,
        staffName: member.name,
        role: member.role,
        employmentType: member.employmentType,
        basicSalary: basic,
        eventPayments,
        overtime,
        bonus,
        deductions,
        advance,
        netPay,
        paidAmount: paid,
        balance,
        status: balance === 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending',
      };
    });
  }

  // RECURRING EVENTS
  getRecurringEvents(): RecurringEvent[] {
    return getStorageItem<RecurringEvent[]>(STORAGE_KEYS.RECURRING, initialRecurringEvents);
  }

  saveRecurringEvent(data: Partial<RecurringEvent> & { seriesName: string; customerId: string }): RecurringEvent {
    const list = this.getRecurringEvents();
    const existingIndex = list.findIndex((r) => r.id === data.id);

    let saved: RecurringEvent;
    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...data };
      list[existingIndex] = saved;
    } else {
      const newId = `REC-${String(list.length + 1).padStart(3, '0')}`;
      saved = {
        id: newId,
        seriesName: data.seriesName,
        customerId: data.customerId,
        customerName: data.customerName || 'Customer',
        eventType: data.eventType || 'Club / Concert',
        frequency: data.frequency || 'Weekly',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || '2026-12-31',
        eventDay: data.eventDay || 'Friday',
        startTime: data.startTime || '21:00',
        endTime: data.endTime || '03:00',
        location: data.location || 'Colombo',
        defaultPrice: data.defaultPrice || 100000,
        paymentTerms: data.paymentTerms || 'Weekly settlement',
        services: data.services || [],
        assignedStaffIds: data.assignedStaffIds || [],
        status: data.status || 'Active',
        generatedCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      list.push(saved);
    }

    setStorageItem(STORAGE_KEYS.RECURRING, list);
    return saved;
  }

  generateEventsFromRecurring(seriesId: string, countToGenerate: number = 4): EventItem[] {
    const recurring = this.getRecurringEvents().find((r) => r.id === seriesId);
    if (!recurring) return [];

    const generatedEvents: EventItem[] = [];
    const staffList = this.getStaff();

    // Map assigned staff ids to StaffAssignment objects
    const assignedStaff = recurring.assignedStaffIds.map((sid) => {
      const s = staffList.find((st) => st.id === sid);
      return {
        id: `as-${Date.now()}-${sid}`,
        staffId: sid,
        staffName: s?.name || 'Staff',
        role: s?.role || 'DJ',
        assignedDate: recurring.startDate,
        startTime: recurring.startTime,
        endTime: recurring.endTime,
        paymentAmount: s?.defaultRatePerEvent || 20000,
        paidAmount: 0,
        status: 'Confirmed' as const,
      };
    });

    // Generate dates based on frequency
    const baseDate = new Date(recurring.startDate);
    const dayInterval = recurring.frequency === 'Daily' ? 1 : recurring.frequency === 'Biweekly' ? 14 : recurring.frequency === 'Monthly' ? 30 : 7;

    for (let i = 1; i <= countToGenerate; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + i * dayInterval);
      const dateStr = targetDate.toISOString().split('T')[0];

      const newEvt = this.saveEvent({
        name: `${recurring.seriesName} (Session #${recurring.generatedCount + i})`,
        customerId: recurring.customerId,
        customerName: recurring.customerName,
        eventType: recurring.eventType,
        eventDate: dateStr,
        startTime: recurring.startTime,
        endTime: recurring.endTime,
        location: recurring.location,
        description: `Generated from recurring series: ${recurring.seriesName}`,
        status: 'Confirmed',
        services: recurring.services,
        assignedStaff: assignedStaff.map((as) => ({ ...as, assignedDate: dateStr })),
        subtotal: recurring.defaultPrice,
        discount: 0,
        additionalCharges: 0,
        totalAmount: recurring.defaultPrice,
        paidAmount: 0,
        recurringSeriesId: recurring.id,
      });

      generatedEvents.push(newEvt);
    }

    // Update generatedCount in recurring series
    const recurringList = this.getRecurringEvents();
    const idx = recurringList.findIndex((r) => r.id === seriesId);
    if (idx >= 0) {
      recurringList[idx].generatedCount += countToGenerate;
      recurringList[idx].lastGeneratedDate = new Date().toISOString().split('T')[0];
      setStorageItem(STORAGE_KEYS.RECURRING, recurringList);
    }

    return generatedEvents;
  }

  // NOTIFICATIONS
  getNotifications(): SystemNotification[] {
    return getStorageItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      list[idx].read = true;
      setStorageItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  // COMPANY PROFILE
  getCompanyProfile(): CompanyProfile {
    return getStorageItem<CompanyProfile>(STORAGE_KEYS.PROFILE, initialCompanyProfile);
  }

  saveCompanyProfile(data: Partial<CompanyProfile>): CompanyProfile {
    const current = this.getCompanyProfile();
    const updated = { ...current, ...data };
    setStorageItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  // SERVICES CATALOG
  getServicesCatalog() {
    return getStorageItem(STORAGE_KEYS.SERVICES, defaultServicesList);
  }

  saveService(service: { name: string; category: any; description: string; unitPrice: number; id?: string }) {
    const list = this.getServicesCatalog();
    if (service.id) {
      const idx = list.findIndex((s) => s.id === service.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...service };
      }
    } else {
      list.push({ ...service, id: `srv-${Date.now()}` });
    }
    setStorageItem(STORAGE_KEYS.SERVICES, list);
    return list;
  }

  // USERS & ACCESS CONTROL
  getUsers(): UserAccount[] {
    return getStorageItem<UserAccount[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  getUserById(id: string): UserAccount | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  saveUser(data: Partial<UserAccount> & { name: string; email: string; role: UserRole }): UserAccount {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === data.id);
    let saved: UserAccount;

    if (existingIndex >= 0) {
      saved = {
        ...users[existingIndex],
        ...data,
      };
      users[existingIndex] = saved;
    } else {
      const newId = `USR-${String(users.length + 1).padStart(3, '0')}`;
      const initials = data.name
        ? data.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : 'U';
      saved = {
        id: newId,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        avatar: data.avatar || initials,
        role: data.role,
        status: data.status || 'Active',
        permissions: data.permissions || ROLE_PERMISSIONS_MATRIX[data.role] || [],
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0],
      };
      users.unshift(saved);
    }

    setStorageItem(STORAGE_KEYS.USERS, users);

    // Forward to live backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    fetch(`${API_URL}/users${existingIndex >= 0 ? `/${saved.id}` : ''}`, {
      method: existingIndex >= 0 ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return saved;
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length !== users.length) {
      setStorageItem(STORAGE_KEYS.USERS, filtered);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  }

  // EVENT TYPES MANAGEMENT
  getEventTypes(): EventTypeItem[] {
    return getStorageItem(STORAGE_KEYS.EVENT_TYPES, initialEventTypes);
  }

  saveEventType(data: Partial<EventTypeItem> & { name: string }): EventTypeItem {
    const list = this.getEventTypes();
    const existingIndex = data.id ? list.findIndex((e) => e.id === data.id) : -1;
    let saved: EventTypeItem;

    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...data };
      list[existingIndex] = saved;
    } else {
      saved = {
        id: data.id || `et-${Date.now()}`,
        name: data.name,
        code: data.code || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
        description: data.description || '',
        color: data.color || '#00e5c9',
        icon: data.icon || 'Sparkles',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder || list.length + 1,
        defaultServices: data.defaultServices || [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      list.push(saved);
    }

    setStorageItem(STORAGE_KEYS.EVENT_TYPES, list);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    fetch(`${API_URL}/event-types${existingIndex >= 0 ? `/${saved.id}` : ''}`, {
      method: existingIndex >= 0 ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return saved;
  }

  deleteEventType(id: string): boolean {
    const list = this.getEventTypes();
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length !== list.length) {
      setStorageItem(STORAGE_KEYS.EVENT_TYPES, filtered);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/event-types/${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  }

  // INVENTORY CATEGORIES
  getInventoryCategories(): InventoryCategory[] {
    return getStorageItem(STORAGE_KEYS.INVENTORY_CATEGORIES, initialInventoryCategories);
  }

  saveInventoryCategory(data: Partial<InventoryCategory> & { name: string }): InventoryCategory {
    const list = this.getInventoryCategories();
    const existingIndex = data.id ? list.findIndex((c) => c.id === data.id) : -1;
    let saved: InventoryCategory;

    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...data };
      list[existingIndex] = saved;
    } else {
      saved = {
        id: data.id || `cat-${Date.now()}`,
        name: data.name,
        code: data.code || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
        description: data.description || '',
        color: data.color || '#00e5c9',
        icon: data.icon || 'Boxes',
        status: data.status || 'Active',
      };
      list.push(saved);
    }

    setStorageItem(STORAGE_KEYS.INVENTORY_CATEGORIES, list);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    fetch(`${API_URL}/inventory/categories${existingIndex >= 0 ? `/${saved.id}` : ''}`, {
      method: existingIndex >= 0 ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return saved;
  }

  deleteInventoryCategory(id: string): boolean {
    const list = this.getInventoryCategories();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length !== list.length) {
      setStorageItem(STORAGE_KEYS.INVENTORY_CATEGORIES, filtered);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/inventory/categories/${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  }

  // INVENTORY ITEMS (EQUIPMENT & SERVICES)
  getInventoryItems(): InventoryItem[] {
    return getStorageItem(STORAGE_KEYS.INVENTORY_ITEMS, initialInventoryItems);
  }

  saveInventoryItem(data: Partial<InventoryItem> & { name: string; category: string }): InventoryItem {
    const list = this.getInventoryItems();
    const existingIndex = data.id ? list.findIndex((i) => i.id === data.id) : -1;
    let saved: InventoryItem;

    const available = Number(data.availableQuantity ?? (existingIndex >= 0 ? list[existingIndex].availableQuantity : 1));
    let status: InventoryItem['status'] = data.status || 'In Stock';
    if (available <= 0) status = 'Out of Stock';
    else if (available <= 2 && status !== 'Maintenance') status = 'Low Stock';

    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...data, availableQuantity: available, status };
      list[existingIndex] = saved;
    } else {
      saved = {
        id: data.id || `inv-${Date.now()}`,
        sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
        name: data.name,
        category: data.category,
        description: data.description || '',
        unitPrice: Number(data.unitPrice || 0),
        rentalRate: Number(data.rentalRate || 0),
        totalStock: Number(data.totalStock || 1),
        availableQuantity: available,
        damagedQuantity: Number(data.damagedQuantity || 0),
        status,
        unit: data.unit || 'Unit',
        specifications: data.specifications || '',
      };
      list.push(saved);
    }

    setStorageItem(STORAGE_KEYS.INVENTORY_ITEMS, list);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    fetch(`${API_URL}/inventory/items${existingIndex >= 0 ? `/${saved.id}` : ''}`, {
      method: existingIndex >= 0 ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return saved;
  }

  deleteInventoryItem(id: string): boolean {
    const list = this.getInventoryItems();
    const filtered = list.filter((i) => i.id !== id);
    if (filtered.length !== list.length) {
      setStorageItem(STORAGE_KEYS.INVENTORY_ITEMS, filtered);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/inventory/items/${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  }

  // QUOTATION MANAGEMENT
  getQuotations(): Quotation[] {
    return getStorageItem(STORAGE_KEYS.QUOTATIONS, initialQuotations);
  }

  getQuotationById(id: string): Quotation | undefined {
    return this.getQuotations().find((q) => q.id === id);
  }

  saveQuotation(data: Partial<Quotation> & { customerName: string; title: string }): Quotation {
    const list = this.getQuotations();
    const existingIndex = data.id ? list.findIndex((q) => q.id === data.id) : -1;
    let saved: Quotation;

    const subtotal = data.items?.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0) ?? (existingIndex >= 0 ? list[existingIndex].subtotal : 0);
    const discount = Number(data.discount ?? (existingIndex >= 0 ? list[existingIndex].discount : 0));
    const taxAmount = Number(data.taxAmount ?? (existingIndex >= 0 ? list[existingIndex].taxAmount : 0));
    const additionalCharges = Number(data.additionalCharges ?? (existingIndex >= 0 ? list[existingIndex].additionalCharges : 0));
    const totalAmount = Math.max(0, subtotal - discount + taxAmount + additionalCharges);

    if (existingIndex >= 0) {
      saved = {
        ...list[existingIndex],
        ...data,
        subtotal,
        discount,
        taxAmount,
        additionalCharges,
        totalAmount,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      list[existingIndex] = saved;
    } else {
      const year = new Date().getFullYear();
      const count = list.length + 1;
      saved = {
        id: data.id || `quot-${Date.now()}`,
        quotationNumber: data.quotationNumber || `QT-${year}-${String(count).padStart(3, '0')}`,
        title: data.title,
        customerId: data.customerId || '',
        customerName: data.customerName,
        customerEmail: data.customerEmail || '',
        customerPhone: data.customerPhone || '',
        customerCompany: data.customerCompany || '',
        eventType: data.eventType || 'Wedding & Reception',
        eventDate: data.eventDate || new Date().toISOString().split('T')[0],
        validUntil: data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        venue: data.venue || '',
        items: data.items || [],
        subtotal,
        discount,
        taxRate: Number(data.taxRate || 0),
        taxAmount,
        additionalCharges,
        totalAmount,
        status: data.status || 'Draft',
        notes: data.notes || '',
        termsAndConditions: data.termsAndConditions || '50% advance upon confirmation. Remaining balance due within 24 hours of event completion.',
        convertedEventId: null,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      list.unshift(saved);
    }

    setStorageItem(STORAGE_KEYS.QUOTATIONS, list);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    fetch(`${API_URL}/quotations${existingIndex >= 0 ? `/${saved.id}` : ''}`, {
      method: existingIndex >= 0 ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return saved;
  }

  deleteQuotation(id: string): boolean {
    const list = this.getQuotations();
    const filtered = list.filter((q) => q.id !== id);
    if (filtered.length !== list.length) {
      setStorageItem(STORAGE_KEYS.QUOTATIONS, filtered);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      fetch(`${API_URL}/quotations/${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  }

  convertQuotationToEvent(quotationId: string): EventItem | null {
    const quotation = this.getQuotationById(quotationId);
    if (!quotation) return null;

    const eventServices = quotation.items.map((item, idx) => ({
      id: item.id || `srv-conv-${idx + 1}`,
      name: item.name,
      category: (item.category as any) || 'Production',
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
    }));

    const events = this.getEvents();
    const eventId = `EVT-${Date.now()}`;

    const newEvent: EventItem = {
      id: eventId,
      name: quotation.title || `Event for ${quotation.customerName}`,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerCompany: quotation.customerCompany,
      customerPhone: quotation.customerPhone,
      customerEmail: quotation.customerEmail,
      eventType: (quotation.eventType as any) || 'Other',
      eventDate: quotation.eventDate,
      startTime: '18:00',
      endTime: '23:30',
      location: quotation.venue || 'TBD',
      address: quotation.venue || '',
      status: 'Confirmed',
      services: eventServices,
      assignedStaff: [],
      expenses: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          title: 'Quotation Converted to Event',
          description: `Generated from Quotation ${quotation.quotationNumber}`,
          timestamp: new Date().toLocaleString(),
          completed: true,
          type: 'created',
        },
      ],
      subtotal: quotation.subtotal || 0,
      discount: quotation.discount || 0,
      additionalCharges: quotation.additionalCharges || 0,
      totalAmount: quotation.totalAmount || 0,
      paidAmount: 0,
      balance: quotation.totalAmount || 0,
      notes: quotation.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.saveEvent(newEvent);

    // Update Quotation status to Accepted and convertedEventId
    this.saveQuotation({
      ...quotation,
      status: 'Accepted',
      convertedEventId: eventId,
    });

    return newEvent;
  }

  getRolesMatrix(): Record<UserRole, string[]> {
    return ROLE_PERMISSIONS_MATRIX;
  }

  resetStoreToDefaults(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.STAFF);
    localStorage.removeItem(STORAGE_KEYS.RECURRING);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.STAFF_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.EVENT_TYPES);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
    window.dispatchEvent(new Event('seekers_store_updated'));
  }

  // REAL BACKEND INTEGRATION
  async syncWithBackend(): Promise<void> {
    if (typeof window === 'undefined') return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
    try {
      const healthRes = await fetch(`${API_URL}/health`);
      if (!healthRes.ok) return;

      const [
        eventsRes,
        customersRes,
        staffRes,
        recurringRes,
        custPayRes,
        staffPayRes,
        profileRes,
        servicesRes,
        usersRes,
        eventTypesRes,
        invCategoriesRes,
        invItemsRes,
        quotationsRes,
      ] = await Promise.all([
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/customers`),
        fetch(`${API_URL}/staff`),
        fetch(`${API_URL}/recurring-events`),
        fetch(`${API_URL}/payments/customer`),
        fetch(`${API_URL}/payments/staff`),
        fetch(`${API_URL}/settings/profile`),
        fetch(`${API_URL}/settings/services`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/event-types`),
        fetch(`${API_URL}/inventory/categories`),
        fetch(`${API_URL}/inventory/items`),
        fetch(`${API_URL}/quotations`),
      ]);

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        if (Array.isArray(events)) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      }
      if (customersRes.ok) {
        const customers = await customersRes.json();
        if (Array.isArray(customers)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      }
      if (staffRes.ok) {
        const staff = await staffRes.json();
        if (Array.isArray(staff)) localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      }
      if (recurringRes.ok) {
        const recurring = await recurringRes.json();
        if (Array.isArray(recurring)) localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
      }
      if (custPayRes.ok) {
        const cp = await custPayRes.json();
        if (Array.isArray(cp)) localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify(cp));
      }
      if (staffPayRes.ok) {
        const sp = await staffPayRes.json();
        if (Array.isArray(sp)) localStorage.setItem(STORAGE_KEYS.STAFF_PAYMENTS, JSON.stringify(sp));
      }
      if (profileRes.ok) {
        const prof = await profileRes.json();
        if (prof && prof.name) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(prof));
      }
      if (servicesRes.ok) {
        const srv = await servicesRes.json();
        if (Array.isArray(srv)) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(srv));
      }
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (Array.isArray(users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      if (eventTypesRes.ok) {
        const et = await eventTypesRes.json();
        if (Array.isArray(et)) localStorage.setItem(STORAGE_KEYS.EVENT_TYPES, JSON.stringify(et));
      }
      if (invCategoriesRes.ok) {
        const cats = await invCategoriesRes.json();
        if (Array.isArray(cats)) localStorage.setItem(STORAGE_KEYS.INVENTORY_CATEGORIES, JSON.stringify(cats));
      }
      if (invItemsRes.ok) {
        const items = await invItemsRes.json();
        if (Array.isArray(items)) localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(items));
      }
      if (quotationsRes.ok) {
        const quots = await quotationsRes.json();
        if (Array.isArray(quots)) localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quots));
      }

      window.dispatchEvent(new Event('seekers_store_updated'));
      console.log('✅ Real-time synchronization with Node.js & MongoDB backend active.');
    } catch {
      // Backend not running or still booting
    }
  }
}

export const mockStore = new MockStore();
