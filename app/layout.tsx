import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'Seekers Entertainment | Event & Business Operations Management',
  description:
    'Comprehensive operational command center for Seekers Entertainment. Manage events, sound & lighting productions, crew scheduling, client billing, staff payroll, and reports.',
  icons: {
    icon: '/seekers_logo.jpg',
    shortcut: '/seekers_logo.jpg',
    apple: '/seekers_logo.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d12',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d12] text-slate-100 antialiased selection:bg-[#00e5c9] selection:text-black min-h-screen">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
