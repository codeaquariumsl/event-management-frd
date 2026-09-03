import { Customer } from '../types';
import { apiClient } from './client';

export const customerService = {
  /**
   * Fetch all customers from backend REST API
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const customers = await apiClient.request<Customer[]>('/customers');
      if (Array.isArray(customers)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_customers', JSON.stringify(customers));
        }
        return customers;
      }
    } catch (err) {
      console.warn('Backend API /customers unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_customers');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
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
      console.warn(`Backend API /customers/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_customers');
        if (cached) {
          const list: Customer[] = JSON.parse(cached);
          return list.find((c) => c.id === id);
        }
      }
    }
    return undefined;
  },

  /**
   * Create new customer via backend POST /customers
   */
  async createCustomer(data: Partial<Customer> & { name: string; phone: string }): Promise<Customer> {
    const saved = await apiClient.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_customers');
      const list: Customer[] = cached ? JSON.parse(cached) : [];
      list.unshift(saved);
      localStorage.setItem('seekers_customers', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_customers_updated'));
    }

    return saved;
  },

  /**
   * Update existing customer via backend PUT /customers/:id
   */
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const updated = await apiClient.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_customers');
      if (cached) {
        const list: Customer[] = JSON.parse(cached);
        const idx = list.findIndex((c) => c.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_customers', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_customers_updated'));
    }

    return updated;
  },

  /**
   * Delete customer via backend DELETE /customers/:id
   */
  async deleteCustomer(id: string): Promise<boolean> {
    await apiClient.request<{ success: boolean }>(`/customers/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_customers');
      if (cached) {
        const list: Customer[] = JSON.parse(cached);
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem('seekers_customers', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_customers_updated'));
    }

    return true;
  },
};
