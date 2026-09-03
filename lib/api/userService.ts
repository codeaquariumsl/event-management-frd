import { UserAccount, UserRole } from '../types';
import { apiClient } from './client';
import { mockStore } from '../mock/store';

export const userService = {
  async getUsers(): Promise<UserAccount[]> {
    try {
      const users = await apiClient.request<UserAccount[]>('/users');
      if (Array.isArray(users)) return users;
    } catch (err) {
      console.warn('Backend API /users unreachable:', err);
    }
    return mockStore.getUsers();
  },

  async getUserById(id: string): Promise<UserAccount | undefined> {
    try {
      const user = await apiClient.request<UserAccount>(`/users/${id}`);
      if (user && user.id) return user;
    } catch (err) {
      console.warn(`Backend API /users/${id} unreachable:`, err);
    }
    return mockStore.getUserById(id);
  },

  async createUser(data: Partial<UserAccount> & { name: string; email: string; role: UserRole }): Promise<UserAccount> {
    try {
      const saved = await apiClient.request<UserAccount>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        mockStore.saveUser(saved);
        return saved;
      }
    } catch (err) {
      console.warn('Backend POST /users failed:', err);
    }
    return mockStore.saveUser(data);
  },

  async updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    try {
      const updated = await apiClient.request<UserAccount>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.id) {
        mockStore.saveUser(updated);
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /users/${id} failed:`, err);
    }
    return mockStore.saveUser({ ...data, id, name: data.name || '', email: data.email || '', role: data.role || 'Event Director' });
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      await apiClient.request<{ success: boolean }>(`/users/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`Backend DELETE /users/${id} failed:`, err);
    }
    return mockStore.deleteUser(id);
  },

  async getRolesMatrix(): Promise<Record<UserRole, string[]>> {
    try {
      const matrix = await apiClient.request<Record<UserRole, string[]>>('/users/roles/matrix');
      if (matrix) return matrix;
    } catch {
      // Fallback
    }
    return mockStore.getRolesMatrix();
  },
};
