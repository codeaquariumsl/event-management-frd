'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserAccount } from '../types';
import { authService } from '../api/authService';
import { checkUserPermission, SYSTEM_MODULES } from './permissions';

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasModuleAccess: (moduleId: string) => boolean;
  getFirstAllowedRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('seekers_auth_token');
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);

      // Verify or refresh in background
      authService.getMe().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshSession();

    const handleSessionExpiredEvent = () => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('seekers_auth_changed', refreshSession);
    window.addEventListener('seekers_roles_updated', refreshSession);
    window.addEventListener('seekers_session_expired', handleSessionExpiredEvent);

    return () => {
      window.removeEventListener('seekers_auth_changed', refreshSession);
      window.removeEventListener('seekers_roles_updated', refreshSession);
      window.removeEventListener('seekers_session_expired', handleSessionExpiredEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return checkUserPermission(user.permissions, user.role, permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.permissions?.includes('*')) return true;
      return permissions.some((perm) => hasPermission(perm));
    },
    [user, hasPermission]
  );

  const hasModuleAccess = useCallback(
    (moduleId: string): boolean => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.permissions?.includes('*')) return true;
      const mod = SYSTEM_MODULES.find((m) => m.id === moduleId);
      if (!mod) return hasPermission(`${moduleId}.view`);
      return mod.actions.some((act) => hasPermission(act.key));
    },
    [user, hasPermission]
  );

  const getFirstAllowedRoute = useCallback((): string => {
    if (!user) return '/login';
    if (user.role === 'Super Admin' || user.permissions?.includes('*')) return '/';

    // If dashboard is permitted, return '/'
    if (hasPermission('dashboard.view')) return '/';

    // Otherwise, find first allowed module route
    for (const mod of SYSTEM_MODULES) {
      const viewKey = mod.actions.find((a) => a.actionType === 'view')?.key || mod.actions[0]?.key;
      if (viewKey && hasPermission(viewKey)) {
        return mod.route;
      }
    }

    return '/';
  }, [user, hasPermission]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasModuleAccess,
        getFirstAllowedRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
