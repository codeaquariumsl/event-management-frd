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
      console.warn('Backend API /staff unreachable:', err);
    }
    return [];
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
    return undefined;
  },

  async createStaff(data: Partial<Staff> & { name: string; role: any }): Promise<Staff> {
    const saved = await apiClient.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return saved;
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    const updated = await apiClient.request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return updated;
  },

  async deleteStaff(id: string): Promise<boolean> {
    await apiClient.request<{ success: boolean }>(`/staff/${id}`, {
      method: 'DELETE',
    });

    return true;
  },

  async getPayrollSummary(monthYear: string): Promise<StaffPayrollSummary[]> {
    try {
      const summary = await apiClient.request<StaffPayrollSummary[]>(`/staff/payroll?month=${monthYear}`);
      if (Array.isArray(summary)) return summary;
    } catch (err) {
      console.warn('Backend API /staff/payroll failed:', err);
    }
    return [];
  },
};
