import { apiClient } from './client';
import { Quotation, EventItem } from '../types';

export const quotationService = {
  async getAll(filters?: { status?: string; customerId?: string }): Promise<Quotation[]> {
    try {
      const query = new URLSearchParams();
      if (filters?.status && filters.status !== 'All') query.append('status', filters.status);
      if (filters?.customerId) query.append('customerId', filters.customerId);
      const qs = query.toString() ? `?${query.toString()}` : '';
      const quotations = await apiClient.request<Quotation[]>(`/quotations${qs}`);
      if (Array.isArray(quotations)) {
        return quotations;
      }
    } catch (err) {
      console.warn('Backend API /quotations unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_quotations');
        if (cached) {
          let list: Quotation[] = JSON.parse(cached);
          if (filters?.status && filters.status !== 'All') {
            list = list.filter((q) => q.status === filters.status);
          }
          if (filters?.customerId) {
            list = list.filter((q) => q.customerId === filters.customerId);
          }
          return list;
        }
      }
    }
    return [];
  },

  async getById(id: string): Promise<Quotation | undefined> {
    try {
      const quotation = await apiClient.request<Quotation>(`/quotations/${id}`);
      if (quotation && quotation.id) return quotation;
    } catch (err) {
      console.warn(`Backend API /quotations/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_quotations');
        if (cached) {
          const list: Quotation[] = JSON.parse(cached);
          return list.find((q) => q.id === id);
        }
      }
    }
    return undefined;
  },

  async create(data: Partial<Quotation> & { customerName: string; title: string }): Promise<Quotation> {
    const saved = await apiClient.request<Quotation>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return saved;
  },

  async update(id: string, data: Partial<Quotation>): Promise<Quotation> {
    const updated = await apiClient.request<Quotation>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.request(`/quotations/${id}`, { method: 'DELETE' });
    return true;
  },

  async convertToEvent(id: string): Promise<EventItem | null> {
    const res = await apiClient.request<{ message: string; event: EventItem }>(`/quotations/${id}/convert`, {
      method: 'POST',
    });
    if (res?.event) {
      window.dispatchEvent(new Event('seekers_events_updated'));
      window.dispatchEvent(new Event('seekers_quotations_updated'));
      return res.event;
    }
    return null;
  },
};
