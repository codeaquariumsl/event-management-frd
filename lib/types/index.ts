export type EventStatus = 'Draft' | 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export type EventType =
  | 'Wedding'
  | 'Corporate'
  | 'Club / Concert'
  | 'Private Party'
  | 'Festival'
  | 'Hotel Event'
  | 'Other'
  | string;

export type StaffRole =
  | 'DJ'
  | 'VJ'
  | 'Sound Engineer'
  | 'Lighting Technician'
  | 'LED Technician'
  | 'Event Crew'
  | 'Event Manager'
  | 'Driver'
  | 'Assistant'
  | 'Other';

export type EmploymentType = 'Full Time' | 'Part Time' | 'Freelance' | 'Contract';

export type StaffStatus = 'Active' | 'On Leave' | 'Inactive';

export type CustomerType =
  | 'Individual'
  | 'Company'
  | 'Hotel'
  | 'Club'
  | 'Restaurant'
  | 'Corporate'
  | 'Other';

export type CustomerStatus = 'Active' | 'Inactive' | 'Lead';

export type PaymentType =
  | 'Event Payment'
  | 'Salary'
  | 'Advance'
  | 'Bonus'
  | 'Deduction'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Online Gateway' | 'Other';

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Cancelled';

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Custom';

export interface ServiceItem {
  id: string;
  name: string;
  category: 'DJ' | 'Sound' | 'Lighting' | 'LED' | 'Production' | 'Staff' | 'Special FX' | 'Other' | string;
  description?: string;
  size?: string;
  quantity?: number | null;
  unitPrice: number;
  totalPrice: number;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  assignedDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  paymentAmount: number;
  paidAmount: number;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface EventExpense {
  id: string;
  title: string;
  category: 'Transport' | 'Equipment Rental' | 'Catering' | 'Venue Fee' | 'Miscellaneous';
  amount: number;
  date: string;
  notes?: string;
}

export interface EventTimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  type?: 'created' | 'confirmed' | 'payment' | 'staff' | 'logistics' | 'completed';
}

export interface EventItem {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerEmail?: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  address?: string;
  description?: string;
  notes?: string;
  status: EventStatus;
  services: ServiceItem[];
  assignedStaff: StaffAssignment[];
  expenses: EventExpense[];
  timeline: EventTimelineItem[];
  subtotal: number;
  discount: number;
  additionalCharges: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  recurringSeriesId?: string;
}

export interface RecurringEvent {
  id: string;
  seriesName: string;
  customerId: string;
  customerName: string;
  eventType: EventType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
  eventDay?: string; // Monday, Friday, etc.
  startTime: string;
  endTime: string;
  location: string;
  defaultPrice: number;
  paymentTerms: string;
  services: ServiceItem[];
  assignedStaffIds: string[];
  status: 'Active' | 'Paused' | 'Completed';
  generatedCount: number;
  lastGeneratedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  email: string;
  role: StaffRole;
  skills: string[];
  employmentType: EmploymentType;
  status: StaffStatus;
  joiningDate: string;
  basicSalary: number;
  defaultRatePerEvent: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branch: string;
  };
  notes?: string;
  totalEventsAssigned: number;
  totalEventsCompleted: number;
  totalEarnings: number;
  pendingPayments: number;
}

export interface StaffPayment {
  id: string;
  staffId: string;
  staffName: string;
  eventId?: string;
  eventName?: string;
  paymentType: PaymentType;
  date: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  monthYear?: string; // YYYY-MM for payroll
}

export interface StaffPayrollSummary {
  staffId: string;
  staffName: string;
  role: StaffRole;
  employmentType: EmploymentType;
  basicSalary: number;
  eventPayments: number;
  overtime: number;
  bonus: number;
  deductions: number;
  advance: number;
  netPay: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  customerType: CustomerType;
  status: CustomerStatus;
  notes?: string;
  totalEvents: number;
  totalRevenue: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  invoiceNumber: string;
  eventId: string;
  eventName: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  eventTotal: number;
  eventPaid: number;
  eventBalance: number;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  businessRegistration: string;
  currency: string;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  logoUrl?: string;
  invoiceTerms: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  timestamp: string;
  read: boolean;
  link?: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Event Director'
  | 'Production Manager'
  | 'Finance Officer'
  | 'Crew Coordinator'
  | 'Read Only';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  password?: string;
}

export interface EventTypeItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder?: number;
  defaultServices?: string[];
  createdAt?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  icon?: string;
  status: 'Active' | 'Inactive';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  unitPrice: number;
  rentalRate: number;
  totalStock: number;
  availableQuantity: number;
  damagedQuantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Maintenance';
  unit: string;
  specifications?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface QuotationLineItem {
  id: string;
  itemId?: string;
  name: string;
  category: string;
  description?: string;
  size?: string;
  quantity?: number | null;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  eventType: string;
  eventDate: string;
  validUntil: string;
  venue?: string;
  items: QuotationLineItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  additionalCharges: number;
  totalAmount: number;
  status: QuotationStatus;
  notes?: string;
  termsAndConditions?: string;
  convertedEventId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: 'DJ' | 'Sound' | 'Lighting' | 'LED' | 'Production' | 'Staff' | 'Special FX' | 'Other' | string;
  description?: string;
  unitPrice: number;
  duration?: string;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

