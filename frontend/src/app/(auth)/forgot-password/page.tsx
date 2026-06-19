'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Reset password</h1>
            <p className="text-sm text-slate-500">Password reset is coming soon.</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-600" />
            <div>
              <p className="font-semibold">Use your existing password for now</p>
              <p className="mt-1 text-blue-800">
                The app currently supports changing your password after login from Settings. Public forgot-password email reset has not been wired yet.
              </p>
            </div>
          </div>
        </div>

        <Link href="/login" className="btn-primary mt-6 w-full">
          <Mail className="h-4 w-4" />
          Return to login
        </Link>
      </div>
    </div>
  );
}
