import { EventItem } from '../types';
import { apiClient } from './client';

export const eventService = {
  async getEvents(): Promise<EventItem[]> {
    try {
      const events = await apiClient.request<EventItem[]>('/events');
      if (Array.isArray(events)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_events', JSON.stringify(events));
        }
        return events;
      }
    } catch (err) {
      console.warn('Backend API /events unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_events');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getEventById(id: string): Promise<EventItem | undefined> {
    try {
      const event = await apiClient.request<EventItem>(`/events/${id}`);
      if (event && event.id) {
        return event;
      }
    } catch (err) {
      console.warn(`Backend API /events/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_events');
        if (cached) {
          const list: EventItem[] = JSON.parse(cached);
          return list.find((e) => e.id === id);
        }
      }
    }
    return undefined;
  },

  async createEvent(data: Partial<EventItem> & { name: string; customerId: string }): Promise<EventItem> {
    const saved = await apiClient.request<EventItem>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_events');
      const list: EventItem[] = cached ? JSON.parse(cached) : [];
      list.unshift(saved);
      localStorage.setItem('seekers_events', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_events_updated'));
    }

    return saved;
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    const updated = await apiClient.request<EventItem>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_events');
      if (cached) {
        const list: EventItem[] = JSON.parse(cached);
        const idx = list.findIndex((e) => e.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_events', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_events_updated'));
    }

    return updated;
  },

  async deleteEvent(id: string): Promise<boolean> {
    await apiClient.request<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_events');
      if (cached) {
        const list: EventItem[] = JSON.parse(cached);
        const filtered = list.filter((e) => e.id !== id);
        localStorage.setItem('seekers_events', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_events_updated'));
    }

    return true;
  },

  async checkStaffConflict(staffId: string, date: string, startTime: string, endTime: string, excludeEventId?: string) {
    try {
      return await apiClient.request<{ hasConflict: boolean; conflictingEvent?: EventItem; staffName?: string }>(
        `/events/check-conflict?staffId=${staffId}&date=${date}&startTime=${startTime}&endTime=${endTime}${
          excludeEventId ? `&excludeEventId=${excludeEventId}` : ''
        }`
      );
    } catch {
      return { hasConflict: false };
    }
  },
};
