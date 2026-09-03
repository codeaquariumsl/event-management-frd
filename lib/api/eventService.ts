import { mockStore } from '../mock/store';
import { EventItem } from '../types';
import { apiClient } from './client';

export const eventService = {
  async getEvents(): Promise<EventItem[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 60));
      return mockStore.getEvents();
    }
    return apiClient.request<EventItem[]>('/events');
  },

  async getEventById(id: string): Promise<EventItem | undefined> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 60));
      return mockStore.getEventById(id);
    }
    return apiClient.request<EventItem>(`/events/${id}`);
  },

  async createEvent(data: Partial<EventItem> & { name: string; customerId: string }): Promise<EventItem> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 120));
      return mockStore.saveEvent(data);
    }
    return apiClient.request<EventItem>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 120));
      return mockStore.saveEvent({ ...data, id, name: data.name || '', customerId: data.customerId || '' });
    }
    return apiClient.request<EventItem>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 80));
      return mockStore.deleteEvent(id);
    }
    return apiClient.request<boolean>(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  async checkStaffConflict(staffId: string, date: string, startTime: string, endTime: string, excludeEventId?: string) {
    if (apiClient.isMock) {
      return mockStore.checkStaffConflict(staffId, date, startTime, endTime, excludeEventId);
    }
    return apiClient.request<{ hasConflict: boolean; conflictingEvent?: EventItem; staffName?: string }>(
      `/events/check-conflict?staffId=${staffId}&date=${date}&startTime=${startTime}&endTime=${endTime}`
    );
  },
};
