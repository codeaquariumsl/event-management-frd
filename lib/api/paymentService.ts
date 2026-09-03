import { mockStore } from '../mock/store';
import { CustomerPayment, StaffPayment } from '../types';
import { apiClient } from './client';

export const paymentService = {
  // Customer Payments
  async getCustomerPayments(): Promise<CustomerPayment[]> {
    try {
      const payments = await apiClient.request<CustomerPayment[]>('/payments/customer');
      if (Array.isArray(payments)) return payments;
    } catch (err) {
      console.warn('Backend API /payments/customer unreachable:', err);
    }
    return mockStore.getCustomerPayments();
  },

  async recordCustomerPayment(data: Omit<CustomerPayment, 'id'>): Promise<CustomerPayment> {
    try {
      const saved = await apiClient.request<CustomerPayment>('/payments/customer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveCustomerPayment(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /payments/customer failed:', err);
    }
    return mockStore.saveCustomerPayment(data);
  },

  // Staff Payments
  async getStaffPayments(): Promise<StaffPayment[]> {
    try {
      const payments = await apiClient.request<StaffPayment[]>('/payments/staff');
      if (Array.isArray(payments)) return payments;
    } catch (err) {
      console.warn('Backend API /payments/staff unreachable:', err);
    }
    return mockStore.getStaffPayments();
  },

  async recordStaffPayment(data: Omit<StaffPayment, 'id'>): Promise<StaffPayment> {
    try {
      const saved = await apiClient.request<StaffPayment>('/payments/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveStaffPayment(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /payments/staff failed:', err);
    }
    return mockStore.saveStaffPayment(data);
  },
};
