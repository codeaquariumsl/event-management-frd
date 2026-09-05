import { apiClient } from './client';
import { EventTypeItem } from '../types';

export const eventTypeService = {
  async getAll(): Promise<EventTypeItem[]> {
    try {
      const types = await apiClient.request<EventTypeItem[]>('/event-types');
      if (Array.isArray(types)) {
        return types;
      }
    } catch (err) {
      console.warn('Backend API /event-types unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_event_types');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getEventTypes(): Promise<EventTypeItem[]> {
    return this.getAll();
  },

  async getById(id: string): Promise<EventTypeItem | undefined> {
    try {
      const type = await apiClient.request<EventTypeItem>(`/event-types/${id}`);
      if (type && type.id) return type;
    } catch (err) {
      console.warn(`Backend API /event-types/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_event_types');
        if (cached) {
          const list: EventTypeItem[] = JSON.parse(cached);
          return list.find((e) => e.id === id);
        }
      }
    }
    return undefined;
  },

  async create(data: Partial<EventTypeItem> & { name: string }): Promise<EventTypeItem> {
    const saved = await apiClient.request<EventTypeItem>('/event-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return saved;
  },

  async createEventType(data: Partial<EventTypeItem> & { name: string }): Promise<EventTypeItem> {
    return this.create(data);
  },

  async update(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    const updated = await apiClient.request<EventTypeItem>(`/event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return updated;
  },

  async updateEventType(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    return this.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.request(`/event-types/${id}`, { method: 'DELETE' });
    return true;
  },

  async deleteEventType(id: string): Promise<boolean> {
    return this.delete(id);
  },
};
