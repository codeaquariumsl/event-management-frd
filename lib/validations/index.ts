import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  customerId: z.string().min(1, 'Please select a customer'),
  eventType: z.enum([
    'Wedding',
    'Corporate',
    'Club / Concert',
    'Private Party',
    'Festival',
    'Hotel Event',
    'Other',
  ]),
  eventDate: z.string().min(1, 'Event date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(2, 'Venue / Location is required'),
  address: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).default(0),
  additionalCharges: z.number().min(0).default(0),
});

export const staffFormSchema = z.object({
  name: z.string().min(2, 'Staff name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum([
    'DJ',
    'VJ',
    'Sound Engineer',
    'Lighting Technician',
    'LED Technician',
    'Event Manager',
    'Driver',
    'Assistant',
    'Other',
  ]),
  employmentType: z.enum(['Full Time', 'Part Time', 'Freelance', 'Contract']),
  status: z.enum(['Active', 'On Leave', 'Inactive']).default('Active'),
  basicSalary: z.number().min(0).default(0),
  defaultRatePerEvent: z.number().min(0).default(15000),
  notes: z.string().optional(),
});

export const customerFormSchema = z.object({
  name: z.string().min(2, 'Customer / Contact name is required'),
  company: z.string().optional(),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').or(z.literal('')),
  address: z.string().optional(),
  customerType: z.enum([
    'Individual',
    'Company',
    'Hotel',
    'Club',
    'Restaurant',
    'Corporate',
    'Other',
  ]),
  notes: z.string().optional(),
});

export const paymentFormSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Online Gateway', 'Other']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

export const staffPaymentFormSchema = z.object({
  staffId: z.string().min(1, 'Staff member is required'),
  eventId: z.string().optional(),
  paymentType: z.enum(['Event Payment', 'Salary', 'Advance', 'Bonus', 'Deduction', 'Other']),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Card', 'Other']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  monthYear: z.string().optional(),
});

export const recurringEventFormSchema = z.object({
  seriesName: z.string().min(3, 'Series name is required'),
  customerId: z.string().min(1, 'Customer is required'),
  eventType: z.enum([
    'Wedding',
    'Corporate',
    'Club / Concert',
    'Private Party',
    'Festival',
    'Hotel Event',
    'Other',
  ]),
  frequency: z.enum(['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Custom']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  eventDay: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(2, 'Location is required'),
  defaultPrice: z.number().min(0, 'Default price must be 0 or more'),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});
