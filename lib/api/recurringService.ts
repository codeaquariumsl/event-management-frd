import { mockStore } from '../mock/store';
import { EventItem, RecurringEvent } from '../types';
import { apiClient } from './client';

export const recurringService = {
  async getRecurringEvents(): Promise<RecurringEvent[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getRecurringEvents();
    }
    return apiClient.request<RecurringEvent[]>('/recurring-events');
  },

  async createRecurringEvent(data: Partial<RecurringEvent> & { seriesName: string; customerId: string }): Promise<RecurringEvent> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveRecurringEvent(data);
    }
    return apiClient.request<RecurringEvent>('/recurring-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateEvents(seriesId: string, count: number = 4): Promise<EventItem[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 200));
      return mockStore.generateEventsFromRecurring(seriesId, count);
    }
    return apiClient.request<EventItem[]>(`/recurring-events/${seriesId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  },
};
