import { UserAccount, UserRole } from '../types';
import { apiClient } from './client';
import { mockStore } from '../mock/store';

export const userService = {
  async getUsers(): Promise<UserAccount[]> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 60));
      return mockStore.getUsers();
    }
    return apiClient.request<UserAccount[]>('/users');
  },

  async getUserById(id: string): Promise<UserAccount | undefined> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 60));
      return mockStore.getUserById(id);
    }
    return apiClient.request<UserAccount>(`/users/${id}`);
  },

  async createUser(data: Partial<UserAccount> & { name: string; email: string; role: UserRole }): Promise<UserAccount> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveUser(data);
    }
    return apiClient.request<UserAccount>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 100));
      return mockStore.saveUser({ ...data, id, name: data.name || '', email: data.email || '', role: data.role || 'Event Director' });
    }
    return apiClient.request<UserAccount>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string): Promise<boolean> {
    if (apiClient.isMock) {
      await new Promise((res) => setTimeout(res, 80));
      return mockStore.deleteUser(id);
    }
    return apiClient.request<boolean>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getRolesMatrix(): Promise<Record<UserRole, string[]>> {
    if (apiClient.isMock) {
      return mockStore.getRolesMatrix();
    }
    return apiClient.request<Record<UserRole, string[]>>('/users/roles/matrix');
  },
};
