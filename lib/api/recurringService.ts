import { EventItem, RecurringEvent } from '../types';
import { apiClient } from './client';

export const recurringService = {
  async getRecurringEvents(): Promise<RecurringEvent[]> {
    try {
      const series = await apiClient.request<RecurringEvent[]>('/recurring-events');
      if (Array.isArray(series)) {
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
    return saved;
  },

  async updateRecurringEvent(id: string, data: Partial<RecurringEvent>): Promise<RecurringEvent> {
    const updated = await apiClient.request<RecurringEvent>(`/recurring-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return updated;
  },

  async deleteRecurringEvent(id: string): Promise<boolean> {
    await apiClient.request(`/recurring-events/${id}`, {
      method: 'DELETE',
    });
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
