import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, compact: boolean = false): string {
  if (isNaN(amount)) return 'LKR 0'
  
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `LKR ${(amount / 1_000_000).toFixed(2)}M`
    }
    if (Math.abs(amount) >= 1_000) {
      return `LKR ${(amount / 1_000).toFixed(1)}K`
    }
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('LKR', 'LKR ')
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatTime(timeString: string): string {
  if (!timeString) return '—'
  try {
    const [hours, minutes] = timeString.split(':')
    const h = parseInt(hours, 10)
    if (isNaN(h)) return timeString
    const ampm = h >= 12 ? 'PM' : 'AM'
    const formattedHours = h % 12 || 12
    return `${formattedHours}:${minutes || '00'} ${ampm}`
  } catch {
    return timeString
  }
}

export function calculateProfit(totalAmount: number, staffPayments: number, expenses: number): {
  profit: number;
  margin: number;
} {
  const profit = totalAmount - staffPayments - expenses
  const margin = totalAmount > 0 ? Math.round((profit / totalAmount) * 100) : 0
  return { profit, margin }
}
