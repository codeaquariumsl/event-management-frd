import { Staff, StaffPayrollSummary } from '../types';
import { apiClient } from './client';

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    try {
      const staff = await apiClient.request<Staff[]>('/staff');
      if (Array.isArray(staff)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_staff', JSON.stringify(staff));
        }
        return staff;
      }
    } catch (err) {
      console.warn('Backend API /staff unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_staff');
        if (cached) return JSON.parse(cached);
      }
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
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_staff');
        if (cached) {
          const list: Staff[] = JSON.parse(cached);
          return list.find((s) => s.id === id);
        }
      }
    }
    return undefined;
  },

  async createStaff(data: Partial<Staff> & { name: string; role: any }): Promise<Staff> {
    const saved = await apiClient.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_staff');
      const list: Staff[] = cached ? JSON.parse(cached) : [];
      list.unshift(saved);
      localStorage.setItem('seekers_staff', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_staff_updated'));
    }

    return saved;
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    const updated = await apiClient.request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_staff');
      if (cached) {
        const list: Staff[] = JSON.parse(cached);
        const idx = list.findIndex((s) => s.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_staff', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_staff_updated'));
    }

    return updated;
  },

  async deleteStaff(id: string): Promise<boolean> {
    await apiClient.request<{ success: boolean }>(`/staff/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_staff');
      if (cached) {
        const list: Staff[] = JSON.parse(cached);
        const filtered = list.filter((s) => s.id !== id);
        localStorage.setItem('seekers_staff', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_staff_updated'));
    }

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
