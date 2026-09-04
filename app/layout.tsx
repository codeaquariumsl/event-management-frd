import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090d12' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
  colorScheme: 'dark light',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('seekers_theme') || 'dark';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-[#00e5c9] selection:text-black min-h-screen transition-colors duration-200">
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

