'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@seekersentertainment.lk');
  const [password, setPassword] = useState('seekers2026');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Set mock JWT token
      localStorage.setItem('seekers_auth_token', 'mock_jwt_token_seekers_production_ops_2026');
      showToast('✓ Welcome back, Seeker! Signed into command center.');
      router.push('/');
    }, 400);
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Staff / Manager Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@seekersentertainment.lk"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-3 text-white text-xs focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-medium text-slate-300">Password</label>
              <a href="#" className="text-[11px] text-[#00e5c9] hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-3 text-white text-xs focus:border-[#00e5c9] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00e5c9] py-3 text-xs font-bold text-[#041816] hover:bg-[#1affda] shadow-lg shadow-[#00e5c9]/20 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Command Center'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Demo Quick Access */}
        <div className="mt-6 pt-6 border-t border-[#1a2738] text-center text-xs text-slate-400">
          <p className="text-[11px] text-slate-500 mb-2">Demo Credentials Pre-filled</p>
          <div className="rounded-lg bg-[#0f1824] border border-[#1b2a3b] p-2.5 font-mono text-[11px] text-slate-300">
            Role: <strong className="text-white">Production Director / Admin</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
