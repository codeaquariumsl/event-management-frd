import { mockStore } from '../mock/store';
import { EventItem } from '../types';
import { apiClient } from './client';

export const eventService = {
  async getEvents(): Promise<EventItem[]> {
    try {
      const events = await apiClient.request<EventItem[]>('/events');
      if (Array.isArray(events)) {
        return events;
      }
    } catch (err) {
      console.warn('Backend API /events unreachable, using local cache:', err);
    }
    return mockStore.getEvents();
  },

  async getEventById(id: string): Promise<EventItem | undefined> {
    try {
      const event = await apiClient.request<EventItem>(`/events/${id}`);
      if (event && event.id) {
        return event;
      }
    } catch (err) {
      console.warn(`Backend API /events/${id} unreachable, using local cache:`, err);
    }
    return mockStore.getEventById(id);
  },

  async createEvent(data: Partial<EventItem> & { name: string; customerId: string }): Promise<EventItem> {
    try {
      const saved = await apiClient.request<EventItem>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveEvent(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /events failed, saving to local store:', err);
    }
    return mockStore.saveEvent(data);
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    try {
      const updated = await apiClient.request<EventItem>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.id) {
        mockStore.saveEvent(updated);
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /events/${id} failed, saving locally:`, err);
    }
    return mockStore.saveEvent({ ...data, id, name: data.name || '', customerId: data.customerId || '' });
  },

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await apiClient.request<{ success: boolean }>(`/events/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`Backend DELETE /events/${id} failed:`, err);
    }
    return mockStore.deleteEvent(id);
  },

  async checkStaffConflict(staffId: string, date: string, startTime: string, endTime: string, excludeEventId?: string) {
    try {
      return await apiClient.request<{ hasConflict: boolean; conflictingEvent?: EventItem; staffName?: string }>(
        `/events/check-conflict?staffId=${staffId}&date=${date}&startTime=${startTime}&endTime=${endTime}${
          excludeEventId ? `&excludeEventId=${excludeEventId}` : ''
        }`
      );
    } catch {
      return mockStore.checkStaffConflict(staffId, date, startTime, endTime, excludeEventId);
    }
  },
};
