import { apiClient } from './client';
import { EventTypeItem } from '../types';

export const eventTypeService = {
  async getAll(): Promise<EventTypeItem[]> {
    try {
      const types = await apiClient.request<EventTypeItem[]>('/event-types');
      if (Array.isArray(types)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_event_types', JSON.stringify(types));
        }
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

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_event_types');
      const list: EventTypeItem[] = cached ? JSON.parse(cached) : [];
      list.push(saved);
      localStorage.setItem('seekers_event_types', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_event_types_updated'));
    }

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

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_event_types');
      if (cached) {
        const list: EventTypeItem[] = JSON.parse(cached);
        const idx = list.findIndex((e) => e.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_event_types', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_event_types_updated'));
    }

    return updated;
  },

  async updateEventType(id: string, data: Partial<EventTypeItem>): Promise<EventTypeItem> {
    return this.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.request(`/event-types/${id}`, { method: 'DELETE' });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_event_types');
      if (cached) {
        const list: EventTypeItem[] = JSON.parse(cached);
        const filtered = list.filter((e) => e.id !== id);
        localStorage.setItem('seekers_event_types', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_event_types_updated'));
    }

    return true;
  },

  async deleteEventType(id: string): Promise<boolean> {
    return this.delete(id);
  },
};
