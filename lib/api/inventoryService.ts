import { apiClient } from './client';
import { InventoryCategory, InventoryItem } from '../types';

export const inventoryService = {
  // Categories
  async getCategories(): Promise<InventoryCategory[]> {
    try {
      const cats = await apiClient.request<InventoryCategory[]>('/inventory/categories');
      if (Array.isArray(cats)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_inventory_categories', JSON.stringify(cats));
        }
        return cats;
      }
    } catch (err) {
      console.warn('Backend API /inventory/categories unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_inventory_categories');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async createCategory(data: Partial<InventoryCategory> & { name: string }): Promise<InventoryCategory> {
    const saved = await apiClient.request<InventoryCategory>('/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_categories');
      const list: InventoryCategory[] = cached ? JSON.parse(cached) : [];
      list.push(saved);
      localStorage.setItem('seekers_inventory_categories', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_inventory_categories_updated'));
    }

    return saved;
  },

  async updateCategory(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const updated = await apiClient.request<InventoryCategory>(`/inventory/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_categories');
      if (cached) {
        const list: InventoryCategory[] = JSON.parse(cached);
        const idx = list.findIndex((c) => c.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_inventory_categories', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_inventory_categories_updated'));
    }

    return updated;
  },

  async deleteCategory(id: string): Promise<boolean> {
    await apiClient.request(`/inventory/categories/${id}`, { method: 'DELETE' });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_categories');
      if (cached) {
        const list: InventoryCategory[] = JSON.parse(cached);
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem('seekers_inventory_categories', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_inventory_categories_updated'));
    }

    return true;
  },

  // Items
  async getItems(filters?: { category?: string; status?: string }): Promise<InventoryItem[]> {
    try {
      const query = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') query.append('category', filters.category);
      if (filters?.status && filters.status !== 'All') query.append('status', filters.status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      const items = await apiClient.request<InventoryItem[]>(`/inventory/items${qs}`);
      if (Array.isArray(items)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_inventory_items', JSON.stringify(items));
        }
        return items;
      }
    } catch (err) {
      console.warn('Backend API /inventory/items unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_inventory_items');
        if (cached) {
          let items: InventoryItem[] = JSON.parse(cached);
          if (filters?.category && filters.category !== 'All') {
            items = items.filter((i) => i.category === filters.category);
          }
          if (filters?.status && filters.status !== 'All') {
            items = items.filter((i) => i.status === filters.status);
          }
          return items;
        }
      }
    }
    return [];
  },

  async getItemById(id: string): Promise<InventoryItem | undefined> {
    try {
      const item = await apiClient.request<InventoryItem>(`/inventory/items/${id}`);
      if (item && item.id) return item;
    } catch (err) {
      console.warn(`Backend API /inventory/items/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_inventory_items');
        if (cached) {
          const list: InventoryItem[] = JSON.parse(cached);
          return list.find((i) => i.id === id);
        }
      }
    }
    return undefined;
  },

  async createItem(data: Partial<InventoryItem> & { name: string; category: string }): Promise<InventoryItem> {
    const saved = await apiClient.request<InventoryItem>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_items');
      const list: InventoryItem[] = cached ? JSON.parse(cached) : [];
      list.push(saved);
      localStorage.setItem('seekers_inventory_items', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_inventory_items_updated'));
    }

    return saved;
  },

  async updateItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const updated = await apiClient.request<InventoryItem>(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_items');
      if (cached) {
        const list: InventoryItem[] = JSON.parse(cached);
        const idx = list.findIndex((i) => i.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_inventory_items', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_inventory_items_updated'));
    }

    return updated;
  },

  async deleteItem(id: string): Promise<boolean> {
    await apiClient.request(`/inventory/items/${id}`, { method: 'DELETE' });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_inventory_items');
      if (cached) {
        const list: InventoryItem[] = JSON.parse(cached);
        const filtered = list.filter((i) => i.id !== id);
        localStorage.setItem('seekers_inventory_items', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_inventory_items_updated'));
    }

    return true;
  },
};
