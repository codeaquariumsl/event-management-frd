import { apiClient } from './client';
import { Quotation, EventItem } from '../types';
import { mockStore } from '../mock/store';

export const quotationService = {
  async getAll(filters?: { status?: string; customerId?: string }): Promise<Quotation[]> {
    if (apiClient.isMock) {
      let quotations = mockStore.getQuotations();
      if (filters?.status && filters.status !== 'All') {
        quotations = quotations.filter((q) => q.status === filters.status);
      }
      if (filters?.customerId) {
        quotations = quotations.filter((q) => q.customerId === filters.customerId);
      }
      return quotations;
    }
    try {
      const query = new URLSearchParams();
      if (filters?.status && filters.status !== 'All') query.append('status', filters.status);
      if (filters?.customerId) query.append('customerId', filters.customerId);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await apiClient.request<Quotation[]>(`/quotations${qs}`);
    } catch {
      let quotations = mockStore.getQuotations();
      if (filters?.status && filters.status !== 'All') {
        quotations = quotations.filter((q) => q.status === filters.status);
      }
      if (filters?.customerId) {
        quotations = quotations.filter((q) => q.customerId === filters.customerId);
      }
      return quotations;
    }
  },

  async getById(id: string): Promise<Quotation | undefined> {
    if (apiClient.isMock) {
      return mockStore.getQuotationById(id);
    }
    try {
      return await apiClient.request<Quotation>(`/quotations/${id}`);
    } catch {
      return mockStore.getQuotationById(id);
    }
  },

  async create(data: Partial<Quotation> & { customerName: string; title: string }): Promise<Quotation> {
    const saved = mockStore.saveQuotation(data);
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<Quotation>('/quotations', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async update(id: string, data: Partial<Quotation>): Promise<Quotation> {
    const saved = mockStore.saveQuotation({ ...data, id, customerName: data.customerName || '', title: data.title || '' });
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<Quotation>(`/quotations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async delete(id: string): Promise<boolean> {
    const result = mockStore.deleteQuotation(id);
    if (!apiClient.isMock) {
      try {
        await apiClient.request(`/quotations/${id}`, { method: 'DELETE' });
      } catch {}
    }
    return result;
  },

  async convertToEvent(id: string): Promise<EventItem | null> {
    const event = mockStore.convertQuotationToEvent(id);
    if (!apiClient.isMock) {
      try {
        const res = await apiClient.request<{ message: string; event: EventItem }>(`/quotations/${id}/convert`, {
          method: 'POST',
        });
        if (res?.event) return res.event;
      } catch {}
    }
    return event;
  },
};
