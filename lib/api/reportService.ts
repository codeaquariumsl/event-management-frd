import { mockStore } from '../mock/store';
import { CompanyProfile } from '../types';
import { apiClient } from './client';

export const reportService = {
  async getDashboardMetrics() {
    try {
      const summary = await apiClient.request<any>('/reports/summary');
      if (summary && summary.totalEvents !== undefined) return summary;
    } catch {
      // Fallback
    }

    const events = mockStore.getEvents();
    const staff = mockStore.getStaff();
    const customers = mockStore.getCustomers();
    const customerPayments = mockStore.getCustomerPayments();
    const staffPayments = mockStore.getStaffPayments();

    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => e.status === 'Confirmed' || e.status === 'Pending').length;
    const completedEvents = events.filter((e) => e.status === 'Completed').length;
    const activeStaff = staff.filter((s) => s.status === 'Active').length;
    const totalCustomers = customers.length;
    const pendingCustomerPayments = events.reduce((sum, e) => sum + e.balance, 0);
    const staffPaymentsDue = staffPayments
      .filter((sp) => sp.status === 'Pending')
      .reduce((sum, sp) => sum + sp.balance, 0);
    const monthlyRevenue = customerPayments.reduce((sum, cp) => sum + cp.amount, 0);

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      activeStaff,
      totalCustomers,
      pendingCustomerPayments,
      staffPaymentsDue,
      monthlyRevenue,
    };
  },
};

export const settingsService = {
  async getCompanyProfile(): Promise<CompanyProfile> {
    try {
      const profile = await apiClient.request<CompanyProfile>('/settings/profile');
      if (profile && profile.name) return profile;
    } catch (err) {
      console.warn('Backend API /settings/profile unreachable:', err);
    }
    return mockStore.getCompanyProfile();
  },

  async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    try {
      const updated = await apiClient.request<CompanyProfile>('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (updated && updated.name) {
        mockStore.saveCompanyProfile(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Backend PUT /settings/profile failed:', err);
    }
    return mockStore.saveCompanyProfile(data);
  },

  async getServicesCatalog() {
    try {
      const catalog = await apiClient.request<any[]>('/settings/services');
      if (Array.isArray(catalog) && catalog.length > 0) return catalog;
    } catch {
      // Fallback
    }
    return mockStore.getServicesCatalog();
  },

  async saveService(service: { name: string; category: any; description: string; unitPrice: number; id?: string }) {
    try {
      const saved = await apiClient.request<any>('/settings/services', {
        method: 'POST',
        body: JSON.stringify(service),
      });
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return mockStore.saveService(service);
  },
};
