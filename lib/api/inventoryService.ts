import { apiClient } from './client';
import { InventoryCategory, InventoryItem } from '../types';
import { mockStore } from '../mock/store';

export const inventoryService = {
  // Categories
  async getCategories(): Promise<InventoryCategory[]> {
    if (apiClient.isMock) {
      return mockStore.getInventoryCategories();
    }
    try {
      return await apiClient.request<InventoryCategory[]>('/inventory/categories');
    } catch {
      return mockStore.getInventoryCategories();
    }
  },

  async createCategory(data: Partial<InventoryCategory> & { name: string }): Promise<InventoryCategory> {
    const saved = mockStore.saveInventoryCategory(data);
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<InventoryCategory>('/inventory/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async updateCategory(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const saved = mockStore.saveInventoryCategory({ ...data, id, name: data.name || '' });
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<InventoryCategory>(`/inventory/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = mockStore.deleteInventoryCategory(id);
    if (!apiClient.isMock) {
      try {
        await apiClient.request(`/inventory/categories/${id}`, { method: 'DELETE' });
      } catch {}
    }
    return result;
  },

  // Items
  async getItems(filters?: { category?: string; status?: string }): Promise<InventoryItem[]> {
    if (apiClient.isMock) {
      let items = mockStore.getInventoryItems();
      if (filters?.category && filters.category !== 'All') {
        items = items.filter((i) => i.category === filters.category);
      }
      if (filters?.status && filters.status !== 'All') {
        items = items.filter((i) => i.status === filters.status);
      }
      return items;
    }
    try {
      const query = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') query.append('category', filters.category);
      if (filters?.status && filters.status !== 'All') query.append('status', filters.status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await apiClient.request<InventoryItem[]>(`/inventory/items${qs}`);
    } catch {
      let items = mockStore.getInventoryItems();
      if (filters?.category && filters.category !== 'All') {
        items = items.filter((i) => i.category === filters.category);
      }
      if (filters?.status && filters.status !== 'All') {
        items = items.filter((i) => i.status === filters.status);
      }
      return items;
    }
  },

  async getItemById(id: string): Promise<InventoryItem | undefined> {
    if (apiClient.isMock) {
      return mockStore.getInventoryItems().find((i) => i.id === id);
    }
    try {
      return await apiClient.request<InventoryItem>(`/inventory/items/${id}`);
    } catch {
      return mockStore.getInventoryItems().find((i) => i.id === id);
    }
  },

  async createItem(data: Partial<InventoryItem> & { name: string; category: string }): Promise<InventoryItem> {
    const saved = mockStore.saveInventoryItem(data);
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<InventoryItem>('/inventory/items', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async updateItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const saved = mockStore.saveInventoryItem({ ...data, id, name: data.name || '', category: data.category || '' });
    if (!apiClient.isMock) {
      try {
        return await apiClient.request<InventoryItem>(`/inventory/items/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch {}
    }
    return saved;
  },

  async deleteItem(id: string): Promise<boolean> {
    const result = mockStore.deleteInventoryItem(id);
    if (!apiClient.isMock) {
      try {
        await apiClient.request(`/inventory/items/${id}`, { method: 'DELETE' });
      } catch {}
    }
    return result;
  },
};
