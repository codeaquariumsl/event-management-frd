import { mockStore } from '../mock/store';
import { CustomerPayment, StaffPayment } from '../types';
import { apiClient } from './client';

export const paymentService = {
  // Customer Payments
  async getCustomerPayments(): Promise<CustomerPayment[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getCustomerPayments();
    }
    return apiClient.request<CustomerPayment[]>('/payments/customer');
  },

  async recordCustomerPayment(data: Omit<CustomerPayment, 'id'>): Promise<CustomerPayment> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 120));
      return mockStore.saveCustomerPayment(data);
    }
    return apiClient.request<CustomerPayment>('/payments/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Staff Payments
  async getStaffPayments(): Promise<StaffPayment[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getStaffPayments();
    }
    return apiClient.request<StaffPayment[]>('/payments/staff');
  },

  async recordStaffPayment(data: Omit<StaffPayment, 'id'>): Promise<StaffPayment> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 120));
      return mockStore.saveStaffPayment(data);
    }
    return apiClient.request<StaffPayment>('/payments/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
