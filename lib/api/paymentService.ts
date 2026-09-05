import { CustomerPayment, StaffPayment } from '../types';
import { apiClient } from './client';

export const paymentService = {
  // Customer Payments
  async getCustomerPayments(): Promise<CustomerPayment[]> {
    try {
      const payments = await apiClient.request<CustomerPayment[]>('/payments/customer');
      if (Array.isArray(payments)) {
        return payments;
      }
    } catch (err) {
      console.warn('Backend API /payments/customer unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_customer_payments');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async recordCustomerPayment(data: Omit<CustomerPayment, 'id'>): Promise<CustomerPayment> {
    const saved = await apiClient.request<CustomerPayment>('/payments/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return saved;
  },

  // Staff Payments
  async getStaffPayments(): Promise<StaffPayment[]> {
    try {
      const payments = await apiClient.request<StaffPayment[]>('/payments/staff');
      if (Array.isArray(payments)) {
        return payments;
      }
    } catch (err) {
      console.warn('Backend API /payments/staff unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_staff_payments');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async recordStaffPayment(data: Omit<StaffPayment, 'id'>): Promise<StaffPayment> {
    const saved = await apiClient.request<StaffPayment>('/payments/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return saved;
  },
};
