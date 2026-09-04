'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in text-xs font-medium min-w-[280px] max-w-md',
              toast.type === 'success' && 'border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/95 dark:bg-[#091a14]/95 text-emerald-800 dark:text-emerald-300',
              toast.type === 'error' && 'border-rose-200 dark:border-rose-700/60 bg-rose-50/95 dark:bg-[#1c0d12]/95 text-rose-800 dark:text-rose-300',
              toast.type === 'info' && 'border-teal-200 dark:border-[#00e5c9]/40 bg-teal-50/95 dark:bg-[#07161b]/95 text-teal-800 dark:text-[#00e5c9]'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />}
            {toast.type === 'info' && <Info className="h-4 w-4 shrink-0 text-[#00897b] dark:text-[#00e5c9]" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
