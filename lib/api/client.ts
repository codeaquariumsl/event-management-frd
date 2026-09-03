// Base API Client Configuration
// This enables seamless communication with the live Node.js + MongoDB REST backend.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

// In-flight promise cache to deduplicate simultaneous identical GET requests
const inFlightRequests = new Map<string, Promise<any>>();

export const apiClient = {
  isMock: false,
  baseUrl: API_BASE_URL,

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Deduplicate simultaneous GET requests
    if (method === 'GET') {
      const cacheKey = normalizedEndpoint;
      if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey) as Promise<T>;
      }

      const promise = this._executeRequest<T>(normalizedEndpoint, options).finally(() => {
        inFlightRequests.delete(cacheKey);
      });

      inFlightRequests.set(cacheKey, promise);
      return promise;
    }

    return this._executeRequest<T>(normalizedEndpoint, options);
  },

  async _executeRequest<T>(normalizedEndpoint: string, options: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('seekers_auth_token') : null;
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error [${response.status}]`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const errorBody = await response.text();
          if (errorBody) errorMessage = errorBody;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};
