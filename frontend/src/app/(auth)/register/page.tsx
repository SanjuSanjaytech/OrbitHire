'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Zap, Mail, Lock, User,
  ShieldCheck, RefreshCw,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  useGuestGuard();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('form');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [pwError, setPwError] = useState('');

  // ── Password strength ────────────────────────────────────────────────────────
  const pwStrength =
    form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors  = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
  const strengthText    = ['', 'text-red-400', 'text-amber-400', 'text-emerald-400'];

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    if (form.password !== form.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOTP(form);
      setRegisteredEmail(form.email);
      setStep('otp');
      toast.success(`Verification code sent to ${form.email}`);
      startResendCooldown();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOTP({ email: registeredEmail, otp });
      setAuth(res.data.data.user, res.data.data.token);
      toast.success('Account created! Welcome to OrbitHire 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP with cooldown ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authApi.resendOTP({ email: registeredEmail });
      toast.success('New verification code sent!');
      startResendCooldown();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── OTP input — digits only ─────────────────────────────────────────────────
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  return (
    <div className="min-h-screen bg-base flex">

      {/* ── Left decorative panel (desktop only) ────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 items-center justify-center p-12 relative overflow-hidden mesh bg-grid">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-accent-500/8 blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-6 glow-brand">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink-primary leading-tight mb-4">
            Start your AI-powered<br />
            <span className="text-gradient">job search today.</span>
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed">
            Upload your resume → AI extracts your skills →<br />
            Get matched jobs in your inbox daily.
          </p>

          <div className="mt-8 p-4 bg-elevated/50 border border-border rounded-2xl text-left">
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-3">
              How it works
            </p>
            <div className="space-y-2.5">
              {[
                'Create account (30 seconds)',
                'Upload your PDF resume',
                'AI extracts 20+ skills automatically',
                'Jobs scraped every morning at 8 AM',
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-[10px] font-bold text-brand-400 flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-ink-secondary">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex flex-col items-center justify-center p-8 bg-card border-l border-border overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center glow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-ink-primary">OrbitHire</span>
        </div>

        <div className="w-full max-w-sm">

          {/* ── Step indicator ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6">
            {(['form', 'otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  step === s
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : s === 'form' && step === 'otp'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-elevated border-border text-ink-muted',
                )}>
                  {s === 'form' && step === 'otp' ? '✓' : i + 1}
                </div>
                <span className={cn(
                  'text-xs font-medium flex-1',
                  step === s ? 'text-ink-primary' : 'text-ink-muted',
                )}>
                  {s === 'form' ? 'Your details' : 'Verify email'}
                </span>
                {i === 0 && (
                  <div className={cn(
                    'h-px flex-1 mx-1 transition-all',
                    step === 'otp' ? 'bg-brand-500' : 'bg-border',
                  )} />
                )}
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-primary mb-1">
            {step === 'form' ? 'Create account' : 'Verify your email'}
          </h2>
          <p className="text-ink-muted text-[12px] mb-6">
            {step === 'form'
              ? 'Step 1 of 2 — Your details'
              : `We sent a 6-digit code to ${registeredEmail}`}
          </p>

          {/* ── FORM STEP ──────────────────────────────────────────────────── */}
          {step === 'form' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Sanjay Kumar"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required minLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => {
                      setForm({ ...form, password: e.target.value });
                      setPwError('');
                    }}
                    required minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength meter */}
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(l => (
                        <div
                          key={l}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all',
                            pwStrength >= l ? strengthColors[pwStrength] : 'bg-border',
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn('text-[10px] font-bold', strengthText[pwStrength])}>
                      {strengthLabels[pwStrength]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={cn(
                      'input pl-10 pr-10',
                      pwError && 'border-red-500/60 focus:ring-red-500/40',
                    )}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={e => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      setPwError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwError && (
                  <p className="text-red-400 text-[11px] mt-1.5">⚠ {pwError}</p>
                )}
                {!pwError && form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-emerald-400 text-[11px] mt-1.5">✓ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-[13px] mt-2"
                disabled={loading}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending code...</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send verification code</>
                )}
              </button>
            </form>
          )}

          {/* ── OTP STEP ───────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">

              {/* Email badge */}
              <div className="flex items-center gap-3 bg-elevated border border-border rounded-xl px-4 py-3">
                <ShieldCheck className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-ink-muted">Code sent to</p>
                  <p className="text-sm font-medium text-ink-primary">{registeredEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="ml-auto text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  Change
                </button>
              </div>

              {/* OTP input */}
              <div>
                <label className="label">6-digit verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input text-center text-2xl font-bold tracking-[0.5em] py-4"
                  placeholder="••••••"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-[13px]"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Verify & Create Account</>
                )}
              </button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm text-ink-muted">
                  Didn&apos;t receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className={cn(
                      'font-semibold transition-colors inline-flex items-center gap-1',
                      resendCooldown > 0
                        ? 'text-ink-muted cursor-not-allowed'
                        : 'text-brand-400 hover:text-brand-300',
                    )}
                  >
                    {resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      <><RefreshCw className="w-3 h-3" /> Resend code</>
                    )}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Sign-in link */}
          <p className="text-center text-[12px] text-ink-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}