import { UserRole } from '../types';

export type PermissionActionType = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage';

export interface PermissionAction {
  key: string;
  label: string;
  description: string;
  actionType: PermissionActionType;
}

export interface SystemModule {
  id: string;
  name: string;
  category: 'Core Operations' | 'Financials' | 'Catalog & Resources' | 'Administration';
  route: string;
  description: string;
  actions: PermissionAction[];
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'Command Center Dashboard',
    category: 'Core Operations',
    route: '/',
    description: 'Executive analytics, operational summary stats, upcoming gigs, and live revenue tracking',
    actions: [
      {
        key: 'dashboard.view',
        label: 'View Dashboard & Analytics',
        description: 'Access the operational command center and high-level KPI cards',
        actionType: 'view',
      },
    ],
  },
  {
    id: 'events',
    name: 'Events & Productions',
    category: 'Core Operations',
    route: '/events',
    description: 'Event run sheets, audio-visual technical setups, venue schedules, and budget tracking',
    actions: [
      {
        key: 'events.view',
        label: 'View Events & Schedules',
        description: 'Browse production events list, event summaries, and detailed run sheets',
        actionType: 'view',
      },
      {
        key: 'events.create',
        label: 'Create New Events',
        description: 'Book new client events, configure packages, and calculate initial estimates',
        actionType: 'create',
      },
      {
        key: 'events.edit',
        label: 'Edit Events & Budgets',
        description: 'Update event schedules, gear allocations, customer rates, and status',
        actionType: 'edit',
      },
      {
        key: 'events.delete',
        label: 'Delete / Cancel Events',
        description: 'Cancel bookings or permanently remove event records from the system',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'calendar',
    name: 'Production Calendar',
    category: 'Core Operations',
    route: '/calendar',
    description: 'Visual calendar scheduler, residency clash detection, and timeline management',
    actions: [
      {
        key: 'calendar.view',
        label: 'View Production Calendar',
        description: 'Inspect visual calendar view, date filters, and multi-day timelines',
        actionType: 'view',
      },
    ],
  },
  {
    id: 'quotations',
    name: 'Quotations & Estimates',
    category: 'Financials',
    route: '/quotations',
    description: 'Custom client quotation proposals, rate calculations, and formal PDF generators',
    actions: [
      {
        key: 'quotations.view',
        label: 'View Quotations & Proposals',
        description: 'Browse issued quotations, price estimates, and proposal statuses',
        actionType: 'view',
      },
      {
        key: 'quotations.create',
        label: 'Create New Quotations',
        description: 'Generate itemized cost estimates with custom markups and terms',
        actionType: 'create',
      },
      {
        key: 'quotations.edit',
        label: 'Edit Quotation Details',
        description: 'Modify draft proposals, adjust line items, and update customer discounts',
        actionType: 'edit',
      },
      {
        key: 'quotations.delete',
        label: 'Delete / Void Quotations',
        description: 'Void or remove outdated quotation proposals',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'recurring',
    name: 'Recurring Residencies',
    category: 'Core Operations',
    route: '/recurring-events',
    description: 'Weekly and monthly club, hotel, and lounge residencies with recurring automation',
    actions: [
      {
        key: 'recurring.view',
        label: 'View Recurring Residencies',
        description: 'Inspect active residency templates and scheduled recurring dates',
        actionType: 'view',
      },
      {
        key: 'recurring.create',
        label: 'Create Recurring Templates',
        description: 'Set up new recurring series with frequency rules and default crew',
        actionType: 'create',
      },
      {
        key: 'recurring.edit',
        label: 'Edit Residency Rules',
        description: 'Update frequency cycles, pricing templates, and customer contracts',
        actionType: 'edit',
      },
      {
        key: 'recurring.delete',
        label: 'Delete Recurring Series',
        description: 'Cancel or remove recurring residency configurations',
        actionType: 'delete',
      },
      {
        key: 'recurring.manage',
        label: 'Batch Generate Event Instances',
        description: 'Trigger batch creation of individual event instances from active residencies',
        actionType: 'manage',
      },
    ],
  },
  {
    id: 'customers',
    name: 'Clients & Customer CRM',
    category: 'Financials',
    route: '/customers',
    description: 'Corporate clients, private customers, hotel partners, and booking histories',
    actions: [
      {
        key: 'customers.view',
        label: 'View Client CRM Directory',
        description: 'Browse client listings, contact books, and past booking ledgers',
        actionType: 'view',
      },
      {
        key: 'customers.create',
        label: 'Add New Client Profiles',
        description: 'Register corporate and individual clients in the CRM database',
        actionType: 'create',
      },
      {
        key: 'customers.edit',
        label: 'Edit Client Profiles',
        description: 'Update client contacts, billing addresses, and tax identifiers',
        actionType: 'edit',
      },
      {
        key: 'customers.delete',
        label: 'Delete Client Profiles',
        description: 'Remove client accounts and associated contact information',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'customer_payments',
    name: 'Customer Billing & Payments',
    category: 'Financials',
    route: '/customer-payments',
    description: 'Customer payment receipts, advance settlements, outstanding invoices, and billing ledgers',
    actions: [
      {
        key: 'customer_payments.view',
        label: 'View Invoices & Receipts',
        description: 'Review customer payment history, invoice balances, and payment receipts',
        actionType: 'view',
      },
      {
        key: 'customer_payments.create',
        label: 'Record Customer Payments',
        description: 'Record incoming bank transfers, cash receipts, and milestone advances',
        actionType: 'create',
      },
      {
        key: 'customer_payments.delete',
        label: 'Void / Delete Payments',
        description: 'Cancel erroneous payment receipts and adjust outstanding balances',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'event_types',
    name: 'Event Types & Categories',
    category: 'Catalog & Resources',
    route: '/event-types',
    description: 'Event categories (Concerts, Weddings, Corporate, Private) and standard production templates',
    actions: [
      {
        key: 'event_types.view',
        label: 'View Event Type Categories',
        description: 'Inspect configured event types, default icons, and category palettes',
        actionType: 'view',
      },
      {
        key: 'event_types.create',
        label: 'Create Event Types',
        description: 'Add new event categories with color codes and standard service templates',
        actionType: 'create',
      },
      {
        key: 'event_types.edit',
        label: 'Edit Event Types',
        description: 'Update event type names, colors, and default service presets',
        actionType: 'edit',
      },
      {
        key: 'event_types.delete',
        label: 'Delete Event Types',
        description: 'Remove unused event type categories from system dropdowns',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'services',
    name: 'Services & AV Rate Catalog',
    category: 'Catalog & Resources',
    route: '/services',
    description: 'Sound, lighting, LED screens, DJ gear, stage trusses, and production rate cards',
    actions: [
      {
        key: 'services.view',
        label: 'View Services Catalog',
        description: 'Browse standard equipment and talent rate cards with pricing',
        actionType: 'view',
      },
      {
        key: 'services.create',
        label: 'Add Catalog Services',
        description: 'Introduce new sound, lighting, and technical service packages',
        actionType: 'create',
      },
      {
        key: 'services.edit',
        label: 'Edit Service Rates & Specs',
        description: 'Modify unit pricing, equipment dimensions, and package inclusions',
        actionType: 'edit',
      },
      {
        key: 'services.delete',
        label: 'Delete Catalog Services',
        description: 'Remove obsolete service line items from the catalog',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory & Gear Management',
    category: 'Catalog & Resources',
    route: '/inventory',
    description: 'Sound consoles, line-array speakers, moving heads, wireless mics, and asset tracking',
    actions: [
      {
        key: 'inventory.view',
        label: 'View Inventory & Equipment',
        description: 'Browse gear inventory, serial numbers, maintenance logs, and stock counts',
        actionType: 'view',
      },
      {
        key: 'inventory.create',
        label: 'Add New Equipment Items',
        description: 'Register new hardware gear, purchase costs, and SKU asset tags',
        actionType: 'create',
      },
      {
        key: 'inventory.edit',
        label: 'Edit Gear Specs & Stock',
        description: 'Update maintenance condition, stock quantities, and storage locations',
        actionType: 'edit',
      },
      {
        key: 'inventory.delete',
        label: 'Delete Gear Items',
        description: 'Decommission and remove equipment assets from the registry',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'staff',
    name: 'Staff & Crew Management',
    category: 'Catalog & Resources',
    route: '/staff',
    description: 'DJs, sound engineers, lighting technicians, stage crew, and contact rosters',
    actions: [
      {
        key: 'staff.view',
        label: 'View Staff & Crew Directory',
        description: 'Inspect crew contact details, technical skills, and employment types',
        actionType: 'view',
      },
      {
        key: 'staff.create',
        label: 'Add Crew Members',
        description: 'Onboard new technical operators, artists, and production personnel',
        actionType: 'create',
      },
      {
        key: 'staff.edit',
        label: 'Edit Staff Profiles & Rates',
        description: 'Modify standard gig pay rates, monthly salaries, and bank accounts',
        actionType: 'edit',
      },
      {
        key: 'staff.delete',
        label: 'Delete Staff Profiles',
        description: 'Remove crew members or archive inactive technician accounts',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'staff_payments',
    name: 'Staff Payroll & Gig Payouts',
    category: 'Financials',
    route: '/staff-payments',
    description: 'Gig disbursements, monthly salary reconciliations, advances, and payout vouchers',
    actions: [
      {
        key: 'staff_payments.view',
        label: 'View Staff Payroll & Payouts',
        description: 'Review staff payment history, gig pay vouchers, and settlement sheets',
        actionType: 'view',
      },
      {
        key: 'staff_payments.create',
        label: 'Disburse Staff Payments',
        description: 'Issue gig payments, disburse monthly salaries, and record cash advances',
        actionType: 'create',
      },
      {
        key: 'staff_payments.delete',
        label: 'Void / Delete Payout Records',
        description: 'Void erroneous payroll settlements or refund payment adjustments',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'reports',
    name: 'Financial Reports & Analytics',
    category: 'Financials',
    route: '/reports',
    description: 'Executive P&L statements, monthly gross margins, revenue trends, and data exports',
    actions: [
      {
        key: 'reports.view',
        label: 'View Financial Analytics & P&L',
        description: 'Inspect executive revenue breakdowns, profit margins, and monthly trends',
        actionType: 'view',
      },
      {
        key: 'reports.export',
        label: 'Export Financial Reports',
        description: 'Export PDF financial statements and raw spreadsheet data tables',
        actionType: 'export',
      },
    ],
  },
  {
    id: 'users',
    name: 'User & Access Administration',
    category: 'Administration',
    route: '/users',
    description: 'Operator accounts, role permissions matrix (RBAC), and security clearances',
    actions: [
      {
        key: 'users.view',
        label: 'View Operators & RBAC Matrix',
        description: 'Inspect administrative users list and permissions assignment matrix',
        actionType: 'view',
      },
      {
        key: 'users.create',
        label: 'Provision New Operators',
        description: 'Create new system operator accounts and set initial passwords',
        actionType: 'create',
      },
      {
        key: 'users.edit',
        label: 'Edit Privileges & Passwords',
        description: 'Modify assigned roles, custom permission overrides, and passwords',
        actionType: 'edit',
      },
      {
        key: 'users.delete',
        label: 'Revoke & Delete Accounts',
        description: 'Revoke operator access and remove accounts from the console',
        actionType: 'delete',
      },
    ],
  },
  {
    id: 'settings',
    name: 'Company Profile & Settings',
    category: 'Administration',
    route: '/settings',
    description: 'Company registration, bank remittance info, tax numbers, and system configs',
    actions: [
      {
        key: 'settings.view',
        label: 'View Company Information',
        description: 'Inspect company address, bank account presets, and invoice footer terms',
        actionType: 'view',
      },
      {
        key: 'settings.edit',
        label: 'Modify Settings & Bank Details',
        description: 'Update corporate profile, remittance accounts, and invoice templates',
        actionType: 'edit',
      },
    ],
  },
];

export interface PermissionFlatItem {
  key: string;
  label: string;
  group: string;
  moduleId: string;
  category: string;
  actionType: PermissionActionType;
  description: string;
}

export const ALL_PERMISSIONS: PermissionFlatItem[] = SYSTEM_MODULES.flatMap((mod) =>
  mod.actions.map((act) => ({
    key: act.key,
    label: act.label,
    group: mod.name,
    moduleId: mod.id,
    category: mod.category,
    actionType: act.actionType,
    description: act.description,
  }))
);

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, string[]> = {
  'Super Admin': ALL_PERMISSIONS.map((p) => p.key),

  'Event Director': [
    'dashboard.view',
    'events.view',
    'events.create',
    'events.edit',
    'calendar.view',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'recurring.view',
    'recurring.create',
    'recurring.edit',
    'recurring.manage',
    'customers.view',
    'customers.create',
    'customers.edit',
    'customer_payments.view',
    'customer_payments.create',
    'event_types.view',
    'event_types.create',
    'event_types.edit',
    'services.view',
    'services.create',
    'services.edit',
    'inventory.view',
    'staff.view',
    'staff.create',
    'staff.edit',
    'staff_payments.view',
    'reports.view',
    'reports.export',
    'settings.view',
  ],

  'Production Manager': [
    'dashboard.view',
    'events.view',
    'events.create',
    'events.edit',
    'calendar.view',
    'quotations.view',
    'recurring.view',
    'event_types.view',
    'services.view',
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'staff.view',
    'staff.create',
    'staff.edit',
    'reports.view',
  ],

  'Finance Officer': [
    'dashboard.view',
    'events.view',
    'quotations.view',
    'customers.view',
    'customers.create',
    'customer_payments.view',
    'customer_payments.create',
    'customer_payments.delete',
    'staff.view',
    'staff_payments.view',
    'staff_payments.create',
    'staff_payments.delete',
    'reports.view',
    'reports.export',
    'settings.view',
  ],

  'Crew Coordinator': [
    'dashboard.view',
    'events.view',
    'calendar.view',
    'recurring.view',
    'staff.view',
    'staff.create',
    'staff.edit',
  ],

  'Read Only': [
    'dashboard.view',
    'events.view',
    'calendar.view',
    'quotations.view',
    'recurring.view',
    'customers.view',
    'customer_payments.view',
    'event_types.view',
    'services.view',
    'inventory.view',
    'staff.view',
    'staff_payments.view',
    'reports.view',
    'settings.view',
  ],
};

/**
 * Normalizes legacy colon-delimited permission keys (e.g. 'events:view' -> 'events.view')
 */
export function normalizePermissionKey(key: string): string {
  if (!key) return '';
  return key.replace(':', '.');
}

/**
 * Checks if a given permission is satisfied by a user's permissions array and role.
 */
export function checkUserPermission(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  requiredPermission: string
): boolean {
  if (!userRole) return false;
  if (userRole === 'Super Admin') return true;
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true;

  const target = normalizePermissionKey(requiredPermission);

  return userPermissions.some((p) => {
    const norm = normalizePermissionKey(p);
    if (norm === target) return true;
    if (norm.endsWith('.*')) {
      const modulePrefix = norm.slice(0, -2);
      return target.startsWith(modulePrefix + '.');
    }
    return false;
  });
}

/**
 * Resolves the primary view permission for a module ID.
 */
export function getModuleViewPermission(moduleId: string): string {
  return `${moduleId}.view`;
}
