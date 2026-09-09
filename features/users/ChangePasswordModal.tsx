'use client';

import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/lib/api/userService';
import { useToast } from '@/components/ui/Toast';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Wand2,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ChangePasswordModalProps) {
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, user]);

  if (!user) return null;

  // Calculate password strength
  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 20, label: 'Very Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 40, label: 'Weak', color: 'bg-amber-500' };
      case 3:
        return { score: 65, label: 'Medium', color: 'bg-yellow-500' };
      case 4:
        return { score: 85, label: 'Strong', color: 'bg-teal-500' };
      case 5:
        return { score: 100, label: 'Very Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'None', color: 'bg-slate-300 dark:bg-slate-700' };
    }
  };

  const strength = calculateStrength(password);

  // Generate strong random password
  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';

    let result = '';
    result += uppercase[Math.floor(Math.random() * uppercase.length)];
    result += lowercase[Math.floor(Math.random() * lowercase.length)];
    result += numbers[Math.floor(Math.random() * numbers.length)];
    result += symbols[Math.floor(Math.random() * symbols.length)];

    const all = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      result += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle characters
    const shuffled = result
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    setPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setError(null);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    showToast('✓ Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.changePassword(user.id, password);
      showToast(`✓ Password for ${user.name} changed successfully`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300';
      case 'Event Director':
        return 'bg-teal-50 dark:bg-[#00e5c9]/10 border border-teal-200 dark:border-[#00e5c9]/30 text-teal-700 dark:text-[#00e5c9]';
      case 'Production Manager':
        return 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300';
      case 'Finance Officer':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300';
      case 'Crew Coordinator':
        return 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Operator Password"
      subtitle="Update console access credentials directly in the secure system database"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Operator Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#203246] bg-slate-50/70 dark:bg-[#0c1420]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00e5c9] to-[#7c5cff] text-sm font-bold text-black shadow-sm">
            {user.avatar || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {user.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">({user.id})</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <span
            className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${getRoleBadgeStyle(
              user.role
            )}`}
          >
            {user.role}
          </span>
        </div>

        {/* Informational Callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-teal-200 dark:border-[#00e5c9]/20 bg-teal-50/50 dark:bg-[#00e5c9]/5 text-teal-900 dark:text-teal-200">
          <KeyRound className="h-4 w-4 shrink-0 text-[#00897b] dark:text-[#00e5c9] mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            The new password will immediately be updated in the system database. The operator will be required to use this new credential on their next sign-in.
          </p>
        </div>

        {/* Generator Quick Action */}
        <div className="flex items-center justify-between pt-1">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            New Password *
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateStrongPassword}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#00897b] dark:text-[#00e5c9] hover:underline"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Generate Strong Password</span>
            </button>
            {password && (
              <button
                type="button"
                onClick={handleCopyPassword}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                title="Copy password to clipboard"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* New Password Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter new password (min. 6 characters)"
            className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] pl-9 pr-10 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00897b] dark:focus:border-[#00e5c9]"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password Strength Meter */}
        {password && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Strength:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#162232] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            Confirm New Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Re-enter new password"
              className={`w-full rounded-lg border bg-white dark:bg-[#111c29] pl-9 pr-10 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none ${
                confirmPassword && password !== confirmPassword
                  ? 'border-rose-400 dark:border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-300 dark:border-[#233549] focus:border-[#00897b] dark:focus:border-[#00e5c9]'
              }`}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-[11px] text-rose-500 pt-0.5">Passwords do not match</p>
          )}
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1c2a3a]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#14202e] px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b2b3d] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !password ||
              password.length < 6 ||
              password !== confirmPassword
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-md shadow-[#00a894]/20 dark:shadow-[#00e5c9]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white dark:border-[#041816] border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
