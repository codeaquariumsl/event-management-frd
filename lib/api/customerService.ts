import { mockStore } from '../mock/store';
import { Customer } from '../types';
import { apiClient } from './client';

export const customerService = {
  /**
   * Fetch all customers from backend REST API
   * Falls back to local store if backend is unreachable
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const customers = await apiClient.request<Customer[]>('/customers');
      if (Array.isArray(customers)) {
        // Sync local cache
        localStorage.setItem('seekers_customers', JSON.stringify(customers));
        return customers;
      }
    } catch (err) {
      console.warn('Backend API /customers unreachable, falling back to cached store:', err);
    }
    return mockStore.getCustomers();
  },

  /**
   * Fetch single customer by ID from backend
   */
  async getCustomerById(id: string): Promise<Customer | undefined> {
    try {
      const customer = await apiClient.request<Customer>(`/customers/${id}`);
      if (customer && customer.id) {
        return customer;
      }
    } catch (err) {
      console.warn(`Backend API /customers/${id} failed, falling back:`, err);
    }
    return mockStore.getCustomerById(id);
  },

  /**
   * Create new customer via backend POST /customers
   */
  async createCustomer(data: Partial<Customer> & { name: string; phone: string }): Promise<Customer> {
    try {
      const saved = await apiClient.request<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveCustomer(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /customers failed, saving to local store:', err);
    }
    return mockStore.saveCustomer(data);
  },

  /**
   * Update existing customer via backend PUT /customers/:id
   */
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const updated = await apiClient.request<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.id) {
        mockStore.saveCustomer(updated);
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /customers/${id} failed, saving locally:`, err);
    }
    return mockStore.saveCustomer({ ...data, id, name: data.name || '', phone: data.phone || '' });
  },

  /**
   * Delete customer via backend DELETE /customers/:id
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await apiClient.request<{ success: boolean }>(`/customers/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`Backend DELETE /customers/${id} failed:`, err);
    }
    return mockStore.deleteCustomer(id);
  },
};
