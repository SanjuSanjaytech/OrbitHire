'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── tiny floating orb (purely decorative) ─────────────────────────────── */
function Orb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute rounded-full pointer-events-none',
        className,
      )}
    />
  );
}

/* ─── animated stat pill shown on the left panel ────────────────────────── */
function StatPill({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm',
        'transition-all duration-700',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
    >
      <span className="text-xl font-extrabold font-display text-white">{value}</span>
      <span className="text-[11px] text-white/50 leading-tight">{label}</span>
    </div>
  );
}

export default function LoginPage() {
  useGuestGuard();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  /* panel entrance animation */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex overflow-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          LEFT — brand / hero panel
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden mesh bg-grid">

        {/* layered glow orbs */}
        <Orb className="w-[520px] h-[520px] top-[-120px] left-[-160px] bg-brand-600/20 blur-[100px]" />
        <Orb className="w-[380px] h-[380px] bottom-[-80px] right-[-80px]  bg-accent-500/15 blur-[90px]" />
        <Orb className="w-[220px] h-[220px] top-[45%]    left-[55%]       bg-brand-400/10 blur-[70px]" />

        {/* grid noise overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.6) 40px),' +
              'repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.6) 40px)',
          }}
        />

        {/* content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-14">

          {/* logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center glow-brand">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-ink-primary tracking-tight">
              OrbitHire
            </span>
          </div>

          {/* headline */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-600/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-semibold text-brand-300 uppercase tracking-widest">
                AI-Powered Job Matching
              </span>
            </div>

            <h1 className="font-display text-5xl font-extrabold text-ink-primary leading-[1.08] mb-5">
              Your next role<br />
              <span className="text-gradient">is one upload</span><br />
              away.
            </h1>

            <p className="text-ink-muted text-[14px] leading-relaxed mb-10">
              Upload your resume. Our AI maps your skills, then<br />
              surfaces fresh-scraped matches every morning at 8 AM.
            </p>

            {/* animated stat pills */}
            <div className="flex flex-wrap gap-3">
              <StatPill value="20+" label="skills extracted automatically" delay={200} />
              <StatPill value="8 AM" label="daily job digest, every day"   delay={350} />
              <StatPill value="<30s" label="to set up your profile"         delay={500} />
            </div>
          </div>

          {/* testimonial */}
          <div
            className={cn(
              'flex items-start gap-4 p-5 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm max-w-sm',
              'transition-all duration-700 delay-700',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            )}
          >
            <div className="w-9 h-9 rounded-full bg-brand-600/40 border border-brand-500/30 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-300">
              S
            </div>
            <div>
              <p className="text-[13px] text-ink-secondary leading-snug mb-1">
                "Got 4 interview calls within a week of signing up. The daily digest is addictive."
              </p>
              <p className="text-[11px] text-ink-muted font-semibold">Sanjay K. — Senior SWE, Bengaluru</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT — form panel
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          'w-full lg:w-[460px] flex flex-col items-center justify-center p-8 bg-card border-l border-border overflow-y-auto',
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-6',
        )}
      >
        {/* mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center glow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-ink-primary">OrbitHire</span>
        </div>

        <div className="w-full max-w-sm">

          {/* heading */}
          <div
            className={cn(
              'mb-8 transition-all duration-500 delay-100',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            <h2 className="font-display text-3xl font-bold text-ink-primary mb-1 leading-tight">
              Welcome back
            </h2>
            <p className="text-ink-muted text-[13px]">
              Sign in to your OrbitHire dashboard
            </p>
          </div>

          {/* form */}
          <form
            onSubmit={handleSubmit}
            className={cn(
              'space-y-5 transition-all duration-500 delay-200',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            {/* email */}
            <div className="group">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within:text-brand-400" />
                <input
                  type="email"
                  className="input pl-10 transition-shadow focus:shadow-[0_0_0_3px_rgba(var(--color-brand-500),.18)]"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* password */}
            <div className="group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within:text-brand-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-10 pr-10 transition-shadow focus:shadow-[0_0_0_3px_rgba(var(--color-brand-500),.18)]"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn-primary w-full py-3 text-[13px] font-semibold mt-1 group',
                'relative overflow-hidden',
                'transition-all duration-200',
                loading && 'opacity-80 cursor-not-allowed',
              )}
            >
              {/* shimmer sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
              />

              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          </form>

          {/* divider */}
          <div
            className={cn(
              'flex items-center gap-3 my-6 transition-all duration-500 delay-300',
              mounted ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-ink-muted font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* social / SSO placeholder (commented out — wire up as needed) */}
          {/*
          <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-elevated hover:bg-elevated/80 text-ink-secondary text-[13px] font-medium transition-colors mb-6">
            <GoogleIcon className="w-4 h-4" />
            Continue with Google
          </button>
          */}

          {/* register link */}
          <p
            className={cn(
              'text-center text-[12px] text-ink-muted transition-all duration-500 delay-400',
              mounted ? 'opacity-100' : 'opacity-0',
            )}
          >
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Create one free
            </Link>
          </p>

          {/* subtle trust badge */}
          <div
            className={cn(
              'flex items-center justify-center gap-1.5 mt-8 transition-all duration-500 delay-500',
              mounted ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-ink-muted">
              256-bit encrypted · No spam · Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}