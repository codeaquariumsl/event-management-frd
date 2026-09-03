// Base API Client Configuration
// This enables seamless communication with the live Node.js + MongoDB REST backend.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const apiClient = {
  isMock: USE_MOCK,
  baseUrl: API_BASE_URL,

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('seekers_auth_token') : null;
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error [${response.status}]: ${errorBody}`);
    }

    return response.json();
  },
};
