'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, KeyRound } from 'lucide-react';
import { SYSTEM_MODULES } from '@/lib/auth/permissions';

interface AppShellProps {
  children: React.ReactNode;
}

interface RouteAccessRule {
  path: string;
  exact?: boolean;
  requiredPermission: string;
  moduleName: string;
}

const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { path: '/events/new', exact: false, requiredPermission: 'events.create', moduleName: 'Create Event' },
  { path: '/events', exact: false, requiredPermission: 'events.view', moduleName: 'Events Management' },
  { path: '/quotations/new', exact: false, requiredPermission: 'quotations.create', moduleName: 'Create Quotation' },
  { path: '/quotations', exact: false, requiredPermission: 'quotations.view', moduleName: 'Quotations & Estimates' },
  { path: '/calendar', exact: false, requiredPermission: 'calendar.view', moduleName: 'Production Calendar' },
  { path: '/recurring-events', exact: false, requiredPermission: 'recurring.view', moduleName: 'Recurring Residencies' },
  { path: '/customers', exact: false, requiredPermission: 'customers.view', moduleName: 'Clients & Customer CRM' },
  { path: '/customer-payments', exact: false, requiredPermission: 'customer_payments.view', moduleName: 'Customer Billing & Payments' },
  { path: '/event-types', exact: false, requiredPermission: 'event_types.view', moduleName: 'Event Types & Categories' },
  { path: '/services', exact: false, requiredPermission: 'services.view', moduleName: 'Services & AV Rate Catalog' },
  { path: '/inventory', exact: false, requiredPermission: 'inventory.view', moduleName: 'Inventory & Gear Management' },
  { path: '/staff-payments', exact: false, requiredPermission: 'staff_payments.view', moduleName: 'Staff Payroll & Gig Payouts' },
  { path: '/staff', exact: false, requiredPermission: 'staff.view', moduleName: 'Staff & Crew Management' },
  { path: '/reports', exact: false, requiredPermission: 'reports.view', moduleName: 'Financial Reports & Analytics' },
  { path: '/users', exact: false, requiredPermission: 'users.view', moduleName: 'User & Access Administration' },
  { path: '/settings', exact: false, requiredPermission: 'settings.view', moduleName: 'Company Profile & Settings' },
  { path: '/', exact: true, requiredPermission: 'dashboard.view', moduleName: 'Command Center Dashboard' },
];

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, hasPermission, getFirstAllowedRoute, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Determine if current route has permission check
  const matchingRule = ROUTE_ACCESS_RULES.find((rule) => {
    if (rule.exact) {
      return pathname === rule.path;
    }
    return pathname.startsWith(rule.path);
  });

  const isAccessAllowed = !matchingRule || hasPermission(matchingRule.requiredPermission);

  // Prevent flash of protected UI before session authentication is confirmed
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00e5c9] border-t-transparent shadow-lg shadow-[#00e5c9]/20" />
          <span className="text-xs font-mono text-muted-foreground">Verifying Operator Session & Clearance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-[#00e5c9] selection:text-black transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-2 sm:p-2 lg:p-2 max-w-[1600px] w-full mx-auto">
          {isAccessAllowed ? (
            children
          ) : (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
              <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-rose-500/30 dark:border-rose-900/50 bg-white dark:bg-[#0c1420] p-8 shadow-2xl text-center space-y-6">
                {/* Glow Backdrop */}
                <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[#00e5c9]/10 blur-3xl" />

                {/* Shield Alert Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
                  <ShieldAlert className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <span className="rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 px-3 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest inline-block">
                    403 Access Forbidden
                  </span>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Access Restricted to {matchingRule?.moduleName || 'Module'}
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Your current operator profile (<strong className="text-slate-800 dark:text-slate-200">{user?.role}</strong>) does not have the required security authorization privilege (
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#152332] text-[#00897b] dark:text-[#00e5c9] font-mono text-[11px]">
                      {matchingRule?.requiredPermission}
                    </code>
                    ) to access this operational area.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => router.push(getFirstAllowedRoute())}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2.5 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Allowed Workspace</span>
                  </button>
                  <button
                    onClick={logout}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#111c29] px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#182637] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
