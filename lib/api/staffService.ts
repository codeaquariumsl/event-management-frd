import { mockStore } from '../mock/store';
import { Staff, StaffPayrollSummary } from '../types';
import { apiClient } from './client';

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    try {
      const staff = await apiClient.request<Staff[]>('/staff');
      if (Array.isArray(staff)) {
        return staff;
      }
    } catch (err) {
      console.warn('Backend API /staff unreachable, using local cache:', err);
    }
    return mockStore.getStaff();
  },

  async getStaffById(id: string): Promise<Staff | undefined> {
    try {
      const member = await apiClient.request<Staff>(`/staff/${id}`);
      if (member && member.id) {
        return member;
      }
    } catch (err) {
      console.warn(`Backend API /staff/${id} unreachable:`, err);
    }
    return mockStore.getStaffById(id);
  },

  async createStaff(data: Partial<Staff> & { name: string; role: any }): Promise<Staff> {
    try {
      const saved = await apiClient.request<Staff>('/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveStaff(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /staff failed:', err);
    }
    return mockStore.saveStaff(data);
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    try {
      const updated = await apiClient.request<Staff>(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.id) {
        mockStore.saveStaff(updated);
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /staff/${id} failed:`, err);
    }
    return mockStore.saveStaff({ ...data, id, name: data.name || '', role: data.role });
  },

  async deleteStaff(id: string): Promise<boolean> {
    try {
      await apiClient.request<{ success: boolean }>(`/staff/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`Backend DELETE /staff/${id} failed:`, err);
    }
    return mockStore.deleteStaff(id);
  },

  async getPayrollSummary(monthYear: string): Promise<StaffPayrollSummary[]> {
    try {
      const summary = await apiClient.request<StaffPayrollSummary[]>(`/staff/payroll?month=${monthYear}`);
      if (Array.isArray(summary)) return summary;
    } catch {
      // Fallback
    }
    return mockStore.getPayrollSummary(monthYear);
  },
};
