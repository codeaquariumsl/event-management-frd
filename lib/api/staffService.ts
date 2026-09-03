import { mockStore } from '../mock/store';
import { Staff, StaffPayrollSummary } from '../types';
import { apiClient } from './client';

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getStaff();
    }
    return apiClient.request<Staff[]>('/staff');
  },

  async getStaffById(id: string): Promise<Staff | undefined> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 50));
      return mockStore.getStaffById(id);
    }
    return apiClient.request<Staff>(`/staff/${id}`);
  },

  async createStaff(data: Partial<Staff> & { name: string; role: any }): Promise<Staff> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveStaff(data);
    }
    return apiClient.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveStaff({ ...data, id, name: data.name || '', role: data.role });
    }
    return apiClient.request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteStaff(id: string): Promise<boolean> {
    if (apiClient.isMock) {
      return mockStore.deleteStaff(id);
    }
    return apiClient.request<boolean>(`/staff/${id}`, {
      method: 'DELETE',
    });
  },

  async getPayrollSummary(monthYear: string): Promise<StaffPayrollSummary[]> {
    if (apiClient.isMock) {
      return mockStore.getPayrollSummary(monthYear);
    }
    return apiClient.request<StaffPayrollSummary[]>(`/staff/payroll?month=${monthYear}`);
  },
};
