import { apiClient } from './client';
import { ServiceCatalogItem } from '../types';

export interface ServicePresetItem {
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  duration: string;
  features: string[];
}

export const serviceService = {
  async getServices(): Promise<ServiceCatalogItem[]> {
    try {
      const services = await apiClient.request<ServiceCatalogItem[]>('/settings/services');
      if (Array.isArray(services)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_services_list', JSON.stringify(services));
        }
        return services;
      }
    } catch (err) {
      console.warn('Backend API /settings/services unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_services_list');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getCategories(): Promise<string[]> {
    try {
      const categories = await apiClient.request<string[]>('/settings/services/categories');
      if (Array.isArray(categories) && categories.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_service_categories', JSON.stringify(categories));
        }
        return categories;
      }
    } catch (err) {
      console.warn('Backend API /settings/services/categories unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_service_categories');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getPresets(): Promise<ServicePresetItem[]> {
    try {
      const presets = await apiClient.request<ServicePresetItem[]>('/settings/services/presets');
      if (Array.isArray(presets) && presets.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_service_presets', JSON.stringify(presets));
        }
        return presets;
      }
    } catch (err) {
      console.warn('Backend API /settings/services/presets unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_service_presets');
        if (cached) return JSON.parse(cached);
      }
    }
    return [];
  },

  async getServiceById(id: string): Promise<ServiceCatalogItem | undefined> {
    try {
      const service = await apiClient.request<ServiceCatalogItem>(`/settings/services/${id}`);
      if (service && service.id) return service;
    } catch (err) {
      console.warn(`Backend API /settings/services/${id} failed:`, err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_services_list');
        if (cached) {
          const list: ServiceCatalogItem[] = JSON.parse(cached);
          return list.find((s) => s.id === id);
        }
      }
    }
    return undefined;
  },

  async createService(data: Partial<ServiceCatalogItem> & { name: string }): Promise<ServiceCatalogItem> {
    const saved = await apiClient.request<ServiceCatalogItem>('/settings/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_services_list');
      const list: ServiceCatalogItem[] = cached ? JSON.parse(cached) : [];
      list.push(saved);
      localStorage.setItem('seekers_services_list', JSON.stringify(list));
      window.dispatchEvent(new Event('seekers_services_updated'));
    }

    return saved;
  },

  async updateService(id: string, data: Partial<ServiceCatalogItem>): Promise<ServiceCatalogItem> {
    const updated = await apiClient.request<ServiceCatalogItem>(`/settings/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_services_list');
      if (cached) {
        const list: ServiceCatalogItem[] = JSON.parse(cached);
        const idx = list.findIndex((s) => s.id === id);
        if (idx >= 0) list[idx] = updated;
        localStorage.setItem('seekers_services_list', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('seekers_services_updated'));
    }

    return updated;
  },

  async deleteService(id: string): Promise<boolean> {
    await apiClient.request(`/settings/services/${id}`, {
      method: 'DELETE',
    });

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('seekers_services_list');
      if (cached) {
        const list: ServiceCatalogItem[] = JSON.parse(cached);
        const filtered = list.filter((s) => s.id !== id);
        localStorage.setItem('seekers_services_list', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('seekers_services_updated'));
    }

    return true;
  },
};
