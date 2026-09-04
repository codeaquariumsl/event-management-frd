'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '@/lib/theme/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'dropdown', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Avoid hydration mismatch before client mount
  if (!mounted) {
    return (
      <div className={cn('h-8 w-8 rounded-lg border border-border bg-card/60 p-1.5 opacity-60', className)}>
        <div className="h-full w-full rounded bg-muted animate-pulse" />
      </div>
    );
  }

  // Quick single-button toggle variant
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground transition-all duration-200',
          className
        )}
        title={`Current: ${theme}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
        )}
      </button>
    );
  }

  // Segmented control (ideal for Settings page or inline controls)
  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: typeof Sun }[] = [
      { value: 'light', label: 'Light', icon: Sun },
      { value: 'dark', label: 'Dark', icon: Moon },
      { value: 'system', label: 'System', icon: Laptop },
    ];

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-lg border border-border bg-card p-1 text-xs shadow-sm',
          className
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all duration-150',
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (standard for Header bar)
  const themeOptions: { value: Theme; label: string; desc: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', desc: 'Crisp & high contrast', icon: Sun },
    { value: 'dark', label: 'Dark', desc: 'Cyber Teal console', icon: Moon },
    { value: 'system', label: 'System', desc: 'Follow OS preference', icon: Laptop },
  ];

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-[#1f2e41] bg-white dark:bg-[#0e1622] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-[#2d4057] hover:text-slate-900 dark:hover:text-white transition-all duration-200"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-[#00e5c9] transition-transform duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
        )}
        {theme === 'system' && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#7c5cff] text-[7px] font-bold text-white">
            A
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 dark:border-[#233549] bg-white dark:bg-[#0c1420] p-1.5 shadow-2xl z-50 animate-fade-in text-xs text-slate-900 dark:text-white">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-[#1b293a] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance
            </span>
          </div>

          <div className="space-y-0.5">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                    isSelected
                      ? 'bg-[#00e5c9]/10 text-[#00897b] dark:text-[#00e5c9] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14202e] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <div className="font-medium leading-none">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
