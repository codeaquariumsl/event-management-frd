'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { mockStore } from '@/lib/mock/store';
import { useAuth } from '@/lib/auth/AuthContext';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';

interface HeaderProps {
  onOpenMobile: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifications = mockStore.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#182332] bg-[#090e15]/90 px-4 backdrop-blur-md sm:px-6">
        {/* Left: Mobile Hamburger & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#152130] hover:text-white lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 rounded-lg border border-[#1f2e41] bg-[#0e1622] px-3.5 py-1.5 text-xs text-slate-400 hover:border-[#2d4057] hover:text-slate-200 transition-colors sm:w-64"
          >
            <Search className="h-3.5 w-3.5 text-[#00e5c9]" />
            <span className="truncate text-left">Search events, staff, clients...</span>
            <kbd className="hidden sm:inline-block ml-auto rounded bg-[#162232] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-[#14202e] hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5c9] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5c9]" />
                </span>
              )}
            </button>

            {/* Notification Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#233549] bg-[#0c1420] shadow-2xl z-50 p-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#1b293a] px-1">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[11px] text-[#00e5c9]">{unreadCount} unread</span>
                </div>
                <div className="mt-2 max-h-72 overflow-y-auto space-y-1.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        mockStore.markNotificationRead(n.id);
                        if (n.link) router.push(n.link);
                        setIsNotifOpen(false);
                      }}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#131d2b] transition-colors cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                        {n.type === 'info' && <Info className="h-4 w-4 text-[#00e5c9]" />}
                        {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-semibold text-white">{n.title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-lg p-1 text-left hover:bg-[#14202e] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#7c5cff] to-[#00e5c9] text-xs font-bold text-white shadow">
                {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'SE')}
              </div>
              <div className="hidden md:block text-xs">
                <span className="block font-semibold text-white truncate max-w-[140px]">
                  {user?.name || 'Seekers Admin'}
                </span>
                <span className="block text-[10px] text-[#00e5c9] font-medium">
                  {user?.role || 'Production Director'}
                </span>
              </div>
            </button>

            {/* Profile Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#233549] bg-[#0c1420] shadow-2xl z-50 p-2 animate-fade-in text-xs">
                <div className="px-3 py-2 border-b border-[#1b293a]">
                  <p className="font-semibold text-white truncate">{user?.name || 'Seekers Operations'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@seekers.lk'}</p>
                  <span className="mt-1 inline-block rounded bg-[#00e5c9]/10 px-2 py-0.5 text-[10px] font-bold text-[#00e5c9]">
                    {user?.role || 'Super Admin'}
                  </span>
                </div>
                <div className="py-1 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-[#131d2b] hover:text-white transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Workspace Settings</span>
                  </Link>
                  <Link
                    href="/staff"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-[#131d2b] hover:text-white transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Manage Team</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-[#1b293a]">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
