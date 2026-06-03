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
  // ── Tab / browser title ──────────────────────────────────────────────────
  title: {
    default:  'OrbitHire — AI-Powered Job Matching',
    template: '%s | OrbitHire',   // "Jobs | OrbitHire", "Dashboard | OrbitHire"
  },
  description:
    'Upload your resume, let AI extract your skills, and get matched developer jobs in your inbox every morning at 8 AM.',
  keywords: ['job search', 'AI', 'MERN', 'Node.js', 'developer jobs India', 'job matching'],

  // ── Favicons (put all files inside /public/) ─────────────────────────────
  icons: {
    icon:    [
      { url: '/favicon.ico',        sizes: '32x32',   type: 'image/x-icon' },
      { url: '/favicon-96x96.png',  sizes: '96x96',   type: 'image/png'    },
    ],
    apple:   '/apple-touch-icon.png',   // 180×180
    shortcut:'/favicon.ico',
  },

  // ── Open Graph — shown when you share on WhatsApp, Slack, LinkedIn ───────
  openGraph: {
    title:       'OrbitHire — AI-Powered Job Matching',
    description: 'AI matches your resume to fresh jobs every morning. Built for Indian developers.',
    url:         'https://orbithire.com',
    siteName:    'OrbitHire',
    images: [
      {
        url:    '/og-image.png',    // 1200×630 — export the SVG above as PNG
        width:  1200,
        height: 630,
        alt:    'OrbitHire Dashboard — AI Job Matching for Developers',
      },
    ],
    locale: 'en_IN',
    type:   'website',
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       'OrbitHire — AI-Powered Job Matching',
    description: 'AI matches your resume to fresh jobs every morning.',
    images:      ['/og-image.png'],
  },

  // ── PWA / mobile ──────────────────────────────────────────────────────────
  manifest:    '/site.webmanifest',
  themeColor:  '#0a0a18',
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
                color:      '#f1f5f9',
                border:     '1px solid #1e1e35',
                borderRadius: '10px',
                fontSize:   '14px',
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