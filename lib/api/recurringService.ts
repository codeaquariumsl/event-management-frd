import { mockStore } from '../mock/store';
import { EventItem, RecurringEvent } from '../types';
import { apiClient } from './client';

export const recurringService = {
  async getRecurringEvents(): Promise<RecurringEvent[]> {
    try {
      const series = await apiClient.request<RecurringEvent[]>('/recurring-events');
      if (Array.isArray(series)) return series;
    } catch (err) {
      console.warn('Backend API /recurring-events unreachable:', err);
    }
    return mockStore.getRecurringEvents();
  },

  async createRecurringEvent(data: Partial<RecurringEvent> & { seriesName: string; customerId: string }): Promise<RecurringEvent> {
    try {
      const saved = await apiClient.request<RecurringEvent>('/recurring-events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveRecurringEvent(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /recurring-events failed:', err);
    }
    return mockStore.saveRecurringEvent(data);
  },

  async generateEvents(seriesId: string, count: number = 4): Promise<EventItem[]> {
    try {
      const generated = await apiClient.request<EventItem[]>(`/recurring-events/${seriesId}/generate`, {
        method: 'POST',
        body: JSON.stringify({ count }),
      });
      if (Array.isArray(generated)) return generated;
    } catch (err) {
      console.warn(`Backend POST /recurring-events/${seriesId}/generate failed:`, err);
    }
    return mockStore.generateEventsFromRecurring(seriesId, count);
  },
};
