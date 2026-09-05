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

    return {
      totalEvents: 0,
      upcomingEvents: 0,
      completedEvents: 0,
      activeStaff: 0,
      totalCustomers: 0,
      pendingCustomerPayments: 0,
      staffPaymentsDue: 0,
      monthlyRevenue: 0,
    };
  },
};

export const settingsService = {
  async getCompanyProfile(): Promise<CompanyProfile> {
    try {
      const profile = await apiClient.request<CompanyProfile>('/settings/profile');
      if (profile && profile.name) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_company_profile', JSON.stringify(profile));
        }
        return profile;
      }
    } catch (err) {
      console.warn('Backend API /settings/profile unreachable:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('seekers_company_profile');
        if (cached) return JSON.parse(cached);
      }
    }

    return {
      name: 'Seekers’s Entertainment (pvt) Ltd',
      tagline: 'Premier Audio-Visual Production, DJ & Event Technology',
      email: 'ops@seekersentertainment.lk',
      phone: `+94 71 035 87 23 (Voice / WhatsApp)
+94 76 468 00 00
+971 54 544 66 09 (UAE)`,
      address: 'No. 42, Independence Avenue, Colombo 07, Sri Lanka',
      taxNumber: 'TIN-109482710-8000',
      businessRegistration: 'PV-0028941',
      currency: 'LKR',
      bankName: 'BOC bank',
      bankAccount: '94630427',
      bankBranch: 'Walgama',
      logoUrl: '/seekers-logo.svg',
      invoiceTerms: `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`,
    };
  },

  async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const updated = await apiClient.request<CompanyProfile>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('seekers_company_profile', JSON.stringify(updated));
      window.dispatchEvent(new Event('seekers_profile_updated'));
    }

    return updated;
  },

  async getServicesCatalog() {
    try {
      const catalog = await apiClient.request<any[]>('/settings/services');
      if (Array.isArray(catalog) && catalog.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('seekers_services_list', JSON.stringify(catalog));
        }
        return catalog;
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

  async saveService(service: { name: string; category: any; description: string; unitPrice: number; id?: string }) {
    const method = service.id ? 'PUT' : 'POST';
    const endpoint = service.id ? `/settings/services/${service.id}` : '/settings/services';
    const saved = await apiClient.request<any>(endpoint, {
      method,
      body: JSON.stringify(service),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('seekers_services_updated'));
    }

    return saved;
  },
};
