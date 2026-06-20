'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, CheckCircle2, Zap, Target, Brain } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   CURSOR ORB
────────────────────────────────────────────────────────────────────────────── */
function CursorOrb() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 150, damping: 16, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 150, damping: 16, mass: 0.5 });
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX - 16); y.set(e.clientY - 16); };
    const enter = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('a,button,input')) setHov(true); };
    const leave = () => setHov(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', enter);
    window.addEventListener('mouseout', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', enter);
      window.removeEventListener('mouseout', leave);
    };
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] hidden md:block"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        animate={{ scale: hov ? 2.8 : 1, opacity: hov ? 0.6 : 0.3 }}
        transition={{ duration: 0.2 }}
        className="w-8 h-8 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,1) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)', filter: 'blur(6px)' }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROTATING MESSAGE
────────────────────────────────────────────────────────────────────────────── */
const MESSAGES = [
  'Find opportunities tailored to your skills.',
  'AI-powered job matching, every morning.',
  'Your next career move starts here.',
  'Land interviews faster with OrbitHire.',
  'Upload once. Get matched forever.',
];

function RotatingMessage() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="h-7 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-blue-200 text-sm font-medium absolute inset-0 flex items-center"
        >
          {MESSAGES[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CHIP
────────────────────────────────────────────────────────────────────────────── */
function StatChip({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/8 border border-white/12 backdrop-blur-sm"
    >
      <span className="text-2xl font-extrabold text-white">{value}</span>
      <span className="text-xs text-blue-200 leading-tight">{label}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED INPUT
────────────────────────────────────────────────────────────────────────────── */
function FormInput({
  id, label, type, placeholder, value, onChange, icon: Icon, rightSlot, autoComplete, required,
}: {
  id: string; label: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon: React.ElementType; rightSlot?: React.ReactNode;
  autoComplete?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="group">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <motion.div
        animate={{ scale: focused ? 1.005 : 1 }}
        transition={{ duration: 0.15 }}
        className="relative"
      >
        <Icon className={cn(
          'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
          focused ? 'text-blue-400' : 'text-slate-500',
        )} />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500',
            'bg-white/6 border transition-all duration-200 outline-none',
            focused
              ? 'border-blue-500/60 bg-white/10 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
              : 'border-white/12 hover:border-white/20',
          )}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LEFT BRAND PANEL (shared)
────────────────────────────────────────────────────────────────────────────── */
function BrandPanel({ mode }: { mode: 'login' | 'register' }) {
  return (
    <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
      {/* Animated gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

      {/* Animated blobs */}
      <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 12, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/12 blur-3xl pointer-events-none" />
      <motion.div animate={{ y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-violet-500/8 blur-2xl pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          className="absolute w-1 h-1 rounded-full bg-blue-400/60"
          style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 18}%` }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-14">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Sparkles className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">OrbitHire</span>
        </motion.div>

        {/* Mid content */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/25 text-blue-300 text-[11px] font-semibold mb-6 self-start"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered Career Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-extrabold text-white leading-[1.06] tracking-tight mb-4"
          >
            {mode === 'login' ? (
              <>Your next role<br /><span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">is waiting.</span></>
            ) : (
              <>Start your<br /><span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI job search.</span></>
            )}
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <RotatingMessage />
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55 }}
            className="mt-10 grid grid-cols-2 gap-3"
          >
            {[
              { icon: Brain,   label: 'AI skill extraction' },
              { icon: Target,  label: 'Precision job matching' },
              { icon: Zap,     label: 'Daily 8 AM digest' },
              { icon: CheckCircle2, label: 'Application tracking' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs text-blue-200 font-medium">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Stats */}
          <div className="mt-10 flex flex-col gap-3">
            <StatChip value="50k+" label="jobs matched monthly"       delay={0.6} />
            <StatChip value="87%"  label="average match score"        delay={0.7} />
            <StatChip value="8 AM" label="daily job digest, every day" delay={0.8} />
          </div>
        </div>

        {/* Bottom trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 text-xs text-blue-300/60"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          256-bit encrypted · No spam · Cancel anytime
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN PAGE
────────────────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  useGuestGuard();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.data.user, res.data.data.token);
      setSuccess(true);
      toast.success('Welcome back!');
      setTimeout(() => router.push('/dashboard'), 600);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-950">
      <CursorOrb />
      <BrandPanel mode="login" />

      {/* Right — Auth Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-[520px] flex flex-col items-center justify-center relative bg-slate-950 overflow-y-auto"
      >
        {/* Subtle right-side glow */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-indigo-600/6 blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm px-6 py-12">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white">OrbitHire</span>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-sm">Continue your job search journey with OrbitHire.</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="space-y-4"
          >
            <FormInput
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={v => setForm({ ...form, email: v })}
              icon={Mail}
              autoComplete="email"
              required
            />

            <FormInput
              id="login-password"
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={v => setForm({ ...form, password: v })}
              icon={Lock}
              autoComplete="current-password"
              required
              rightSlot={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/6 accent-blue-500 cursor-pointer" />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                'relative w-full py-3.5 rounded-xl text-sm font-bold mt-2 overflow-hidden',
                'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
                'shadow-lg shadow-blue-900/40',
                'hover:shadow-blue-600/50 hover:shadow-xl',
                'transition-shadow duration-200',
                'disabled:opacity-70 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              )}
            >
              {/* Shimmer sweep */}
              <span aria-hidden className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span key="success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Signed in!
                  </motion.span>
                ) : loading ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 my-6"
          >
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] text-slate-500 font-medium">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </motion.div>

          {/* Register link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center text-[12px] text-slate-500"
          >
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Create one free →
            </Link>
          </motion.p>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-1.5 mt-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-600">256-bit encrypted · No spam · Cancel anytime</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
