import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OrbitHire AI — Smart Career Dashboard',
  description: 'AI-powered job matching for developers. Find your perfect MERN/Node.js role in India.',
  keywords: ['job search', 'AI', 'MERN', 'Node.js', 'developer jobs India'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-gray-100 antialiased">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#16162a',
                color: '#f1f5f9',
                border: '1px solid #1e1e35',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#16162a' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#16162a' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
