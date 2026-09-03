import { mockStore } from '../mock/store';
import { Customer } from '../types';
import { apiClient } from './client';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getCustomers();
    }
    return apiClient.request<Customer[]>('/customers');
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getCustomerById(id);
    }
    return apiClient.request<Customer>(`/customers/${id}`);
  },

  async createCustomer(data: Partial<Customer> & { name: string; phone: string }): Promise<Customer> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveCustomer(data);
    }
    return apiClient.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveCustomer({ ...data, id, name: data.name || '', phone: data.phone || '' });
    }
    return apiClient.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (apiClient.isMock) {
      return mockStore.deleteCustomer(id);
    }
    return apiClient.request<boolean>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
