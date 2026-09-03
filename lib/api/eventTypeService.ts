import { apiClient } from './client';
import { EventTypeItem } from '../types';
import { mockStore } from '../mock/store';

export const eventTypeService = {
  async getAll(): Promise<EventTypeItem[]> {
    try {
      const types = await apiClient.request<EventTypeItem[]>('/event-types');
      if (Array.isArray(types)) return types;
    } catch {
      // Fallback
    }
    return mockStore.getEventTypes();
  },

  async getEventTypes(): Promise<EventTypeItem[]> {
    return this.getAll();
  },

  async getById(id: string): Promise<EventTypeItem | undefined> {
    try {
      const type = await apiClient.request<EventTypeItem>(`/event-types/${id}`);
      if (type && type.id) return type;
    } catch {
      // Fallback
    }
    return mockStore.getEventTypes().find((e) => e.id === id);
  },

  async create(data: Partial<EventTypeItem> & { name: string }): Promise<EventTypeItem> {
    try {
      const saved = await apiClient.request<EventTypeItem>('/event-types', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveEventType(saved);
        return saved;
      }
    } catch {}
    return mockStore.saveEventType(data);
  },

  async createEventType(data: Partial<EventTypeItem> & { name: string }): Promise<EventTypeItem> {
    return this.create(data);
  },

  async update(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    try {
      const updated = await apiClient.request<EventTypeItem>(`/event-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.id) {
        mockStore.saveEventType(updated);
        return updated;
      }
    } catch {}
    return mockStore.saveEventType({ ...data, id, name: data.name || '' });
  },

  async updateEventType(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    return this.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.request(`/event-types/${id}`, { method: 'DELETE' });
    } catch {}
    return mockStore.deleteEventType(id);
  },

  async deleteEventType(id: string): Promise<boolean> {
    return this.delete(id);
  },
};
