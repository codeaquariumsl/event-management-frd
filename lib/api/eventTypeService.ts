import { apiClient } from './client';
import { EventTypeItem } from '../types';
import { mockStore } from '../mock/store';

export const eventTypeService = {
  async getAll(): Promise<EventTypeItem[]> {
    if (apiClient.isMock) {
      return mockStore.getEventTypes();
    }
    try {
      return await apiClient.request<EventTypeItem[]>('/event-types');
    } catch {
      return mockStore.getEventTypes();
    }
  },

  async getById(id: string): Promise<EventTypeItem | undefined> {
    if (apiClient.isMock) {
      return mockStore.getEventTypes().find((e) => e.id === id);
    }
    try {
      return await apiClient.request<EventTypeItem>(`/event-types/${id}`);
    } catch {
      return mockStore.getEventTypes().find((e) => e.id === id);
    }
  },

  async create(data: Partial<EventTypeItem> & { name: string }): Promise<EventTypeItem> {
    const saved = mockStore.saveEventType(data);
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<EventTypeItem>('/event-types', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async update(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    const saved = mockStore.saveEventType({ ...data, id, name: data.name || '' });
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<EventTypeItem>(`/event-types/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async delete(id: string): Promise<boolean> {
    const result = mockStore.deleteEventType(id);
    if (!apiClient.isMock) {
      try {
        await apiClient.request(`/event-types/${id}`, { method: 'DELETE' });
      } catch {}
    }
    return result;
  },
};
