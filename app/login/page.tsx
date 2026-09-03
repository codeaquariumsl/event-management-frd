'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, KeyRound, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{ name: string; email: string; role: string }>>([]);

  // Load existing operators for quick profile selection
  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableUsers(data.map((u: any) => ({ name: u.name, email: u.email, role: u.role })));
          setEmail(data[0].email);
        } else {

        }
      })
      .catch(() => {

      });
  }, []);

  // If already authenticated, redirect to command center
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      showToast('✓ Welcome back! Authentication successful.');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b10] p-4 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1d2d3e] bg-[#0c1420] p-8 shadow-2xl">
        {/* Glow behind card */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[#00e5c9]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[#7c5cff]/15 blur-3xl" />

        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#00e5c9]/30 bg-black p-1 shadow-xl shadow-[#00e5c9]/20">
            <img
              src="/seekers_logo.jpg"
              alt="Seekers Entertainment"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white mt-4">
            SEEKERS ENTERTAINMENT
          </h1>
          <p className="text-xs text-[#00e5c9] font-medium tracking-wide">
            Operations & Technical Production Command Center
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Operator / Manager Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="operator@seekersentertainment.lk"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-3 text-white text-xs focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-medium text-slate-300">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-3 pr-10 text-white text-xs focus:border-[#00e5c9] focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00e5c9] py-3 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Authenticating Session...' : 'Sign In to Command Center'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
