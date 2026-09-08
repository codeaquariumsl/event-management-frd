'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  category?: string;
  extraInfo?: string;
  disabled?: boolean;
  raw?: any;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value?: string;
  onChange: (value: string, option?: SearchableOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  resetOnSelect?: boolean;
  clearable?: boolean;
  icon?: React.ReactNode;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Select an option --',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  required = false,
  className = '',
  resetOnSelect = false,
  clearable = false,
  icon,
  emptyMessage = 'No matching options found',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    if (resetOnSelect || !value) return null;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value, resetOnSelect]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.sublabel?.toLowerCase().includes(q) ?? false;
      const matchBadge = opt.badge?.toLowerCase().includes(q) ?? false;
      const matchCat = opt.category?.toLowerCase().includes(q) ?? false;
      const matchExtra = opt.extraInfo?.toLowerCase().includes(q) ?? false;
      return matchLabel || matchSub || matchBadge || matchCat || matchExtra;
    });
  }, [options, searchQuery]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full rounded-lg border text-left flex items-center justify-between gap-2 px-3 py-2 text-xs transition-all focus:outline-none ${
          isOpen
            ? 'border-[#00897b] dark:border-[#00e5c9] ring-2 ring-[#00e5c9]/20 bg-white dark:bg-[#111c29]'
            : 'border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] hover:border-slate-400 dark:hover:border-[#304763]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
          {selectedOption ? (
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedOption.label}
              </div>
              {selectedOption.sublabel && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedOption.sublabel}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e as any);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2838] transition-colors"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#00897b] dark:text-[#00e5c9]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-[#1e2f42] bg-white dark:bg-[#0c1420] shadow-2xl overflow-hidden animate-in fade-in-50 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-[#192737] bg-slate-50/70 dark:bg-[#0f1826]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 dark:border-[#22354a] bg-white dark:bg-[#141f2e] pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#00e5c9] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-[#162232] text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = !resetOnSelect && value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-[#0f2430] border-l-2 border-[#00897b] dark:border-[#00e5c9]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#131f2d]'
                    } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold truncate ${
                            isSelected
                              ? 'text-[#00897b] dark:text-[#00e5c9]'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9] shrink-0" />}
                      </div>

                      {opt.sublabel && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>

                    {/* Right side info / badge / price */}
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      {opt.extraInfo && (
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {opt.extraInfo}
                        </span>
                      )}
                      {opt.badge && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-[#182637] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#22354c]">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
                <Search className="h-5 w-5 mx-auto opacity-40 mb-1" />
                <p className="font-medium text-xs text-slate-700 dark:text-slate-300">{emptyMessage}</p>
                {searchQuery && (
                  <p className="text-[11px] text-slate-400">
                    No results found for &ldquo;<span className="text-slate-600 dark:text-slate-300 font-semibold">{searchQuery}</span>&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#0a121c] border-t border-slate-100 dark:border-[#172535] text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              Showing {filteredOptions.length} of {options.length} options
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-mono">Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
