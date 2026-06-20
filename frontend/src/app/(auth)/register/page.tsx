'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowRight, ArrowLeft, Sparkles,
  ShieldCheck, RefreshCw, CheckCircle2, Zap, Target, Brain,
} from 'lucide-react';
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
    <motion.div className="pointer-events-none fixed z-[9999] hidden md:block" style={{ x: sx, y: sy }}>
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
   LEFT BRAND PANEL
────────────────────────────────────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
      <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 12, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/12 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
      />
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          className="absolute w-1 h-1 rounded-full bg-blue-400/60"
          style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 18}%` }}
        />
      ))}

      <div className="relative z-10 flex flex-col h-full p-14">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Sparkles className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">OrbitHire</span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/25 text-blue-300 text-[11px] font-semibold mb-6 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Start for free today
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-extrabold text-white leading-[1.06] tracking-tight mb-4">
            Start your<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI job search.</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <RotatingMessage />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 space-y-3">
            {[
              { icon: User,        step: '01', label: 'Create account',          sub: '30 seconds to sign up' },
              { icon: Brain,       step: '02', label: 'Upload resume',           sub: 'AI extracts 20+ skills' },
              { icon: Target,      step: '03', label: 'Get matched daily',       sub: 'Fresh jobs every 8 AM' },
              { icon: CheckCircle2,step: '04', label: 'Apply with confidence',   sub: 'Tailored resumes & scores' },
            ].map(({ icon: Icon, step, label, sub }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[10px] text-blue-300/70">{sub}</p>
                </div>
                <span className="ml-auto text-[9px] font-bold text-blue-400/40 tracking-widest">{step}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="flex items-center gap-2 text-xs text-blue-300/60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          256-bit encrypted · No spam · Cancel anytime
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED INPUT
────────────────────────────────────────────────────────────────────────────── */
function FormInput({
  id, label, type, placeholder, value, onChange, icon: Icon, rightSlot,
  autoComplete, required, minLength, error, success: isSuccess,
}: {
  id: string; label: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon: React.ElementType; rightSlot?: React.ReactNode;
  autoComplete?: string; required?: boolean; minLength?: number;
  error?: string; success?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <motion.div animate={{ scale: focused ? 1.005 : 1 }} transition={{ duration: 0.15 }} className="relative">
        <Icon className={cn(
          'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
          focused ? 'text-blue-400' : error ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-slate-500',
        )} />
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500',
            'bg-white/6 border transition-all duration-200 outline-none',
            error
              ? 'border-red-500/60 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : isSuccess
              ? 'border-emerald-500/40'
              : focused
              ? 'border-blue-500/60 bg-white/10 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
              : 'border-white/12 hover:border-white/20',
          )}
        />
        {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[11px] mt-1.5 flex items-center gap-1">
            ⚠ {error}
          </motion.p>
        )}
        {isSuccess && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-emerald-400 text-[11px] mt-1.5 flex items-center gap-1">
            ✓ {isSuccess}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PASSWORD STRENGTH METER
────────────────────────────────────────────────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const colors = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Good', 'Strong'];
  const textColors = ['', 'text-red-400', 'text-amber-400', 'text-emerald-400'];
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(l => (
          <motion.div key={l}
            animate={{ backgroundColor: strength >= l ? undefined : undefined }}
            className={cn('h-1 flex-1 rounded-full transition-all duration-300', strength >= l ? colors[strength] : 'bg-white/10')}
          />
        ))}
      </div>
      <span className={cn('text-[10px] font-bold', textColors[strength])}>{labels[strength]}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS STEPS
────────────────────────────────────────────────────────────────────────────── */
type RegStep = 'details' | 'otp';

function StepIndicator({ current }: { current: RegStep }) {
  const steps = [
    { key: 'details', label: 'Your details' },
    { key: 'otp',     label: 'Verify email' },
  ] as const;

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = s.key === 'details' && current === 'otp';
        const active = s.key === current;
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: done ? '#10b981' : active ? '#4f46e5' : 'rgba(255,255,255,0.06)',
                  borderColor: done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.12)',
                  scale: active ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 text-white"
              >
                {done ? '✓' : i + 1}
              </motion.div>
              <span className={cn('text-[10px] font-semibold mt-1.5 whitespace-nowrap', active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-500')}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                animate={{ backgroundColor: current === 'otp' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)' }}
                transition={{ duration: 0.4 }}
                className="flex-1 h-px mx-3 mb-4"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REGISTER PAGE
────────────────────────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  useGuestGuard();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<RegStep>('details');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [pwError, setPwError] = useState('');

  const passwordMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  /* ── Step 1: Send OTP ─────────────────────────────────────────────────── */
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (form.password !== form.confirmPassword) { setPwError('Passwords do not match'); return; }
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

  /* ── Step 2: Verify OTP ───────────────────────────────────────────────── */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOTP({ email: registeredEmail, otp });
      setAuth(res.data.data.user, res.data.data.token);
      setSuccess(true);
      toast.success('Account created! Welcome to OrbitHire 🎉');
      setTimeout(() => router.push('/dashboard'), 700);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ───────────────────────────────────────────────────────── */
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
    const iv = setInterval(() => {
      setResendCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-950">
      <CursorOrb />
      <BrandPanel />

      {/* Right — Auth Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-[540px] flex flex-col items-center justify-center relative bg-slate-950 overflow-y-auto"
      >
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

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Animated step content */}
          <AnimatePresence mode="wait">
            {/* ══════════════ STEP 1 — Details ══════════════ */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7">
                  <h2 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Create account</h2>
                  <p className="text-slate-400 text-sm">Start your AI-powered job search in 30 seconds.</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <FormInput
                    id="reg-name"
                    label="Full Name"
                    type="text"
                    placeholder="Sanjay Kumar"
                    value={form.name}
                    onChange={v => setForm({ ...form, name: v })}
                    icon={User}
                    autoComplete="name"
                    required
                    minLength={2}
                  />

                  <FormInput
                    id="reg-email"
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={v => setForm({ ...form, email: v })}
                    icon={Mail}
                    autoComplete="email"
                    required
                  />

                  <div>
                    <FormInput
                      id="reg-password"
                      label="Password"
                      type={showPw ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={v => { setForm({ ...form, password: v }); setPwError(''); }}
                      icon={Lock}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      rightSlot={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    <PasswordStrength password={form.password} />
                  </div>

                  <FormInput
                    id="reg-confirm"
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={v => { setForm({ ...form, confirmPassword: v }); setPwError(''); }}
                    icon={Lock}
                    autoComplete="new-password"
                    required
                    error={pwError || (passwordMismatch ? 'Passwords do not match' : undefined)}
                    success={passwordMatch ? 'Passwords match' : undefined}
                    rightSlot={
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className={cn(
                      'relative w-full py-3.5 rounded-xl text-sm font-bold mt-2 overflow-hidden',
                      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
                      'shadow-lg shadow-blue-900/40 hover:shadow-blue-600/50 hover:shadow-xl',
                      'transition-shadow duration-200 flex items-center justify-center gap-2',
                      'disabled:opacity-70 disabled:cursor-not-allowed',
                    )}
                  >
                    <span aria-hidden className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending code…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Send Verification Code
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </form>

                {/* Sign in link */}
                <p className="text-center text-[12px] text-slate-500 mt-6">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                    Sign in →
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ══════════════ STEP 2 — OTP ══════════════ */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7">
                  <h2 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Check your email</h2>
                  <p className="text-slate-400 text-sm">We sent a 6-digit verification code to your inbox.</p>
                </div>

                {/* Email badge */}
                <div className="flex items-center gap-3 bg-white/6 border border-white/12 rounded-xl px-4 py-3.5 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/25 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-400 w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Code sent to</p>
                    <p className="text-sm font-semibold text-white truncate">{registeredEmail}</p>
                  </div>
                  <button onClick={() => setStep('details')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors flex-shrink-0 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />Change
                  </button>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  {/* OTP Input */}
                  <div>
                    <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
                      Verification Code
                    </label>
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      className={cn(
                        'w-full py-4 rounded-xl text-center text-3xl font-extrabold tracking-[0.6em] text-white',
                        'bg-white/6 border border-white/12 outline-none transition-all duration-200',
                        'focus:border-blue-500/60 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
                        'placeholder-slate-700',
                      )}
                      placeholder="······"
                      value={otp}
                      onChange={handleOtpChange}
                      maxLength={6}
                      autoFocus
                    />
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-3">
                      {[...Array(6)].map((_, i) => (
                        <motion.div key={i}
                          animate={{
                            backgroundColor: i < otp.length ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.08)',
                            scale: i < otp.length ? 1.3 : 1,
                          }}
                          transition={{ duration: 0.15 }}
                          className="w-1.5 h-1.5 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || otp.length !== 6 || success}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className={cn(
                      'relative w-full py-3.5 rounded-xl text-sm font-bold overflow-hidden',
                      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
                      'shadow-lg shadow-blue-900/40 hover:shadow-blue-600/50 hover:shadow-xl',
                      'transition-all duration-200 flex items-center justify-center gap-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    <span aria-hidden className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <AnimatePresence mode="wait">
                      {success ? (
                        <motion.span key="success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Account created!
                        </motion.span>
                      ) : loading ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Verify & Create Account
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </form>

                {/* Resend */}
                <div className="text-center mt-5">
                  <p className="text-sm text-slate-500">
                    Didn&apos;t receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || loading}
                      className={cn(
                        'font-semibold inline-flex items-center gap-1 transition-colors',
                        resendCooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300',
                      )}
                    >
                      {resendCooldown > 0 ? (
                        <span className="tabular-nums">Resend in {resendCooldown}s</span>
                      ) : (
                        <><RefreshCw className="w-3 h-3" /> Resend code</>
                      )}
                    </button>
                  </p>
                </div>

                {/* Already have account */}
                <p className="text-center text-[12px] text-slate-500 mt-4">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Sign in →</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-600">256-bit encrypted · No spam · Cancel anytime</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
