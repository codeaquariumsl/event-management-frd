'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'seekers_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [mounted, setMounted] = useState(false);

  // Compute resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }, [theme]);

  // Apply theme to DOM
  const applyTheme = (resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
  };

  useEffect(() => {
    setMounted(true);
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      window.dispatchEvent(
        new CustomEvent('seekers_theme_changed', {
          detail: {
            theme: newTheme,
            resolvedTheme: newTheme === 'system' ? getSystemTheme() : newTheme,
          },
        })
      );
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: mounted ? resolvedTheme : 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
