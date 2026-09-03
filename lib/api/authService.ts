import { UserAccount } from '../types';
import { apiClient } from './client';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserAccount;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await apiClient.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.token && res.user) {
        localStorage.setItem('seekers_auth_token', res.token);
        localStorage.setItem('seekers_auth_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('seekers_auth_changed'));
        return res;
      }
    } catch (err: any) {
      const msg = err.message || '';
      const isNetworkFailure =
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('networkerror') ||
        msg.toLowerCase().includes('connection refused') ||
        msg.toLowerCase().includes('proxy error');

      if (!isNetworkFailure) {
        throw err;
      }
      console.warn('Backend unreachable, checking cached credentials:', err.message);
    }

    // Emergency offline login check with cached users
    let cachedUsers: UserAccount[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('seekers_users');
      if (stored) {
        try {
          cachedUsers = JSON.parse(stored);
        } catch {}
      }
    }

    const matched = cachedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (matched) {
      if (matched.status === 'Suspended') {
        throw new Error('This operator account is suspended. Contact Director.');
      }
      if (password !== 'seekers2026') {
        throw new Error('Invalid password. Please check your credentials.');
      }
      const token = `sk_sess_local_${matched.id}_${Date.now()}`;
      const user = { ...matched, lastLogin: new Date().toLocaleString() };
      localStorage.setItem('seekers_auth_token', token);
      localStorage.setItem('seekers_auth_user', JSON.stringify(user));
      window.dispatchEvent(new Event('seekers_auth_changed'));
      return { success: true, token, user };
    }

    // Fallback Director login if database empty or completely offline
    if (email.toLowerCase() === 'director@seekers.lk' && password === 'seekers2026') {
      const adminUser: UserAccount = {
        id: 'USR-001',
        name: 'Suresh Wickramasinghe',
        email: 'director@seekers.lk',
        role: 'Super Admin',
        status: 'Active',
        permissions: ['*'],
        lastLogin: new Date().toLocaleString(),
        createdAt: '2026-01-01',
      };
      const token = `sk_sess_local_admin_${Date.now()}`;
      localStorage.setItem('seekers_auth_token', token);
      localStorage.setItem('seekers_auth_user', JSON.stringify(adminUser));
      window.dispatchEvent(new Event('seekers_auth_changed'));
      return { success: true, token, user: adminUser };
    }

    throw new Error('Invalid email or password. Operator account not found.');
  },

  async getMe(): Promise<UserAccount | null> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('seekers_auth_token') : null;
    if (!token) return null;

    try {
      const res = await apiClient.request<{ user: UserAccount }>('/auth/me');
      if (res.user) {
        localStorage.setItem('seekers_auth_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch {
      // Fall through to cached user
    }

    return this.getCurrentUser();
  },

  getCurrentUser(): UserAccount | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('seekers_auth_user');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('seekers_auth_token');
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      apiClient.request('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    localStorage.removeItem('seekers_auth_token');
    localStorage.removeItem('seekers_auth_user');
    window.dispatchEvent(new Event('seekers_auth_changed'));
    window.location.href = '/login';
  },
};
