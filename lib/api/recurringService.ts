import { EventItem, RecurringEvent } from '../types';
import { apiClient } from './client';

export const recurringService = {
  async getRecurringEvents(): Promise<RecurringEvent[]> {
    try {
      const series = await apiClient.request<RecurringEvent[]>('/recurring-events');
      if (Array.isArray(series)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_recurring', JSON.stringify(series));
        }
        return series;
      }
    } catch (err) {
      console.warn('Backend API /recurring-events unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_recurring');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async createRecurringEvent(data: Partial<RecurringEvent> & { seriesName: string; customerId: string }): Promise<RecurringEvent> {
    const saved = await apiClient.request<RecurringEvent>('/recurring-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_recurring');
      const list: RecurringEvent[] = cached ? JSON.parse(cached) : [];
      list.unshift(saved);
      localStorage.setItem('seekers_recurring', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_recurring_updated'));
    }

    return saved;
  },

  async updateRecurringEvent(id: string, data: Partial<RecurringEvent>): Promise<RecurringEvent> {
    const updated = await apiClient.request<RecurringEvent>(`/recurring-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_recurring');
      if (cached) {
        const list: RecurringEvent[] = JSON.parse(cached);
        const idx = list.findIndex((r) => r.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_recurring', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_recurring_updated'));
    }

    return updated;
  },

  async deleteRecurringEvent(id: string): Promise<boolean> {
    await apiClient.request(`/recurring-events/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_recurring');
      if (cached) {
        const list: RecurringEvent[] = JSON.parse(cached);
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem('seekers_recurring', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_recurring_updated'));
    }

    return true;
  },

  async generateEvents(seriesId: string, count: number = 4): Promise<EventItem[]> {
    const generated = await apiClient.request<EventItem[]>(`/recurring-events/${seriesId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('seekers_events_updated'));
      window.dispatchEvent(new Event('seekers_recurring_updated'));
    }

    return generated;
  },
};
