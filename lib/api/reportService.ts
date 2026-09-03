import { mockStore } from '../mock/store';
import { CompanyProfile } from '../types';
import { apiClient } from './client';

export const reportService = {
  async getDashboardMetrics() {
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
    if (apiClient.isMock) {
      return mockStore.getCompanyProfile();
    }
    return apiClient.request<CompanyProfile>('/settings/profile');
  },

  async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    if (apiClient.isMock) {
      return mockStore.saveCompanyProfile(data);
    }
    return apiClient.request<CompanyProfile>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getServicesCatalog() {
    return mockStore.getServicesCatalog();
  },

  async saveService(service: { name: string; category: any; description: string; unitPrice: number; id?: string }) {
    return mockStore.saveService(service);
  },
};
