import { UserAccount, UserRole } from '../types';
import { apiClient } from './client';
import { ROLE_PERMISSIONS_MATRIX } from '../auth/permissions';

export const userService = {
  async getUsers(): Promise<UserAccount[]> {
    try {
      const users = await apiClient.request<UserAccount[]>('/users');
      if (Array.isArray(users)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_users', JSON.stringify(users));
        }
        return users;
      }
    } catch (err) {
      console.warn('Backend API /users unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_users');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getUserById(id: string): Promise<UserAccount | undefined> {
    try {
      const user = await apiClient.request<UserAccount>(`/users/${id}`);
      if (user && user.id) return user;
    } catch (err) {
      console.warn(`Backend API /users/${id} unreachable:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_users');
        if (cached) {
          const list: UserAccount[] = JSON.parse(cached);
          return list.find((u) => u.id === id);
        }
      }
    }
    return undefined;
  },

  async createUser(data: Partial<UserAccount> & { name: string; email: string; role: UserRole }): Promise<UserAccount> {
    const saved = await apiClient.request<UserAccount>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_users');
      const list: UserAccount[] = cached ? JSON.parse(cached) : [];
      list.unshift(saved);
      localStorage.setItem('seekers_users', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_users_updated'));
    }

    return saved;
  },

  async updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    const updated = await apiClient.request<UserAccount>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_users');
      if (cached) {
        const list: UserAccount[] = JSON.parse(cached);
        const idx = list.findIndex((u) => u.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_users', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_users_updated'));
    }

    return updated;
  },

  async deleteUser(id: string): Promise<boolean> {
    await apiClient.request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_users');
      if (cached) {
        const list: UserAccount[] = JSON.parse(cached);
        const filtered = list.filter((u) => u.id !== id);
        localStorage.setItem('seekers_users', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_users_updated'));
    }

    return true;
  },

  async getRolesMatrix(): Promise<Record<UserRole, string[]>> {
    try {
      const matrix = await apiClient.request<Record<UserRole, string[]>>('/users/roles/matrix');
      if (matrix) return matrix;
    } catch {
      // Fallback
    }
    return ROLE_PERMISSIONS_MATRIX;
  },
};
