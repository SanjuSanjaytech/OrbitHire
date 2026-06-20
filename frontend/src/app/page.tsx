'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useInView, animate, useScroll, useTransform } from 'framer-motion';
import { BrandMark } from '@/components/ui/BrandMark';
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  FileText,
  Brain,
  Target,
  BarChart3,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  Upload,
  Search,
  Send,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   CURSOR ORB — spring-based glow that follows mouse, desktop only
────────────────────────────────────────────────────────────────────────────── */
function CursorOrb() {
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const springX = useSpring(cursorX, { stiffness: 120, damping: 18, mass: 0.6 });
  const springY = useSpring(cursorY, { stiffness: 120, damping: 18, mass: 0.6 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 20);
      cursorY.set(e.clientY - 20);
    };
    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a,button,[data-hover]')) setHovering(true);
    };
    const onLeave = () => setHovering(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', onEnter);
    window.addEventListener('mouseout', onLeave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', onEnter);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] hidden md:block"
      style={{ x: springX, y: springY }}
    >
      <motion.div
        animate={{ scale: hovering ? 2.6 : 1, opacity: hovering ? 0.55 : 0.35 }}
        transition={{ duration: 0.25 }}
        className="w-10 h-10 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.9) 0%, rgba(37,99,235,0.5) 50%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
────────────────────────────────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 2.2,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION WRAPPER — fade+slide in on scroll
────────────────────────────────────────────────────────────────────────────── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GRADIENT BORDER CARD
────────────────────────────────────────────────────────────────────────────── */
function GradientCard({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`relative group rounded-2xl bg-white border border-slate-200 p-6 overflow-hidden shadow-card hover:shadow-xl hover:border-blue-200 transition-shadow duration-300 ${className}`}
    >
      {/* Gradient top edge on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVBAR
────────────────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 rounded-lg" />
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">OrbitHire</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
          >
            Get Started Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-600">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-1"
        >
          {[{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'About', href: '#about' }].map(item => (
            <a key={item.label} href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
              {item.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link href="/login" className="block text-center py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg">Sign in</Link>
            <Link href="/register" className="block text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg">Get Started Free</Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO
────────────────────────────────────────────────────────────────────────────── */
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -80]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-16">
      {/* Mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Floating orbs */}
        <motion.div animate={{ y: [0, -24, 0], rotate: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-28 left-[8%] w-72 h-72 rounded-full bg-indigo-400/8 blur-3xl" />
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-20 right-[6%] w-96 h-96 rounded-full bg-blue-400/8 blur-3xl" />
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-300/5 blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      <motion.div style={{ y }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Powered by Google Gemini AI
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6"
        >
          Land Your Next Job
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Faster with AI
            </span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 origin-left"
            />
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload your resume, let Gemini AI extract your skills, discover perfectly matched jobs,
          and receive a curated digest every morning at 8 AM — tailored just for you.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm shadow-lg hover:shadow-blue-200/60 hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-semibold px-7 py-3.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Upload className="w-4 h-4" />
            Upload Resume
          </Link>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glow behind mockup */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-indigo-500/8 to-transparent blur-2xl rounded-3xl transform scale-110" />

          {/* Mock browser frame */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 mx-4 text-xs text-slate-400 text-center">
                orbithire.com/dashboard
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="p-6 bg-slate-50 min-h-[380px]">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Jobs Matched', value: '48', color: 'blue' },
                  { label: 'Applied', value: '12', color: 'indigo' },
                  { label: 'Interviews', value: '3', color: 'violet' },
                  { label: 'Match Score', value: '87%', color: 'emerald' },
                ].map((stat, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                  >
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-extrabold text-${stat.color}-600`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Job cards */}
              <div className="space-y-3">
                {[
                  { title: 'Senior React Developer', company: 'TechCorp', score: 92, tag: 'apply_now' },
                  { title: 'Full Stack Engineer', company: 'StartupAI', score: 78, tag: 'recommended' },
                  { title: 'Node.js Backend Dev', company: 'Innovate Inc', score: 85, tag: 'apply_now' },
                ].map((job, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + i * 0.15 }}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${job.tag === 'apply_now' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                        {job.tag === 'apply_now' ? '✓ Apply Now' : '★ Recommended'}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.score}%` }}
                            transition={{ delay: 1.5 + i * 0.1, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{job.score}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating AI badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -right-4 bg-white border border-indigo-200 shadow-lg rounded-xl px-3.5 py-2.5 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-none">AI Match Score</p>
              <p className="text-sm font-extrabold text-slate-900">92%</p>
            </div>
          </motion.div>

          {/* Floating skills badge */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-4 -left-4 bg-white border border-blue-200 shadow-lg rounded-xl px-3.5 py-2.5 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700">24 skills extracted</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATS
────────────────────────────────────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: 50000, suffix: '+', label: 'Jobs Matched' },
    { value: 12000, suffix: '+', label: 'Resumes Analyzed' },
    { value: 4500,  suffix: '+', label: 'Active Users' },
    { value: 87,    suffix: '%', label: 'Average Match Score' },
  ];

  return (
    <Section className="py-20 bg-gradient-to-b from-white to-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm text-slate-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURES
────────────────────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: FileText,
    title: 'AI Resume Analysis',
    description: 'Upload your PDF resume and let Gemini extract structured profile data, skills, experience, and education in seconds.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'Smart Skill Extraction',
    description: 'Our AI categorizes your skills (language, framework, cloud, tools) and rates your proficiency level automatically.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Target,
    title: 'Precision Job Matching',
    description: 'Gemini compares each job description against your full resume profile to produce 0-100 match scores with detailed breakdowns.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Application Tracking',
    description: 'Track every application stage — saved, applied, interviewing, offer, rejected — all in one organized dashboard.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Daily Job Digest',
    description: 'Every morning at 8 AM, OrbitHire automatically fetches fresh jobs, scores them, and sends you a curated email digest.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: TrendingUp,
    title: 'AI Resume Tailoring',
    description: 'One-click AI rewrite of your resume summary and bullet points tailored specifically for each job application.',
    gradient: 'from-indigo-500 to-blue-700',
  },
];

function Features() {
  return (
    <Section id="features" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" /> Platform Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4"
          >
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              land your next role
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            From resume parsing to job matching and application tracking — all powered by Google Gemini AI.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <GradientCard key={i} delay={i * 0.08}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.description}</p>
              </GradientCard>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS
────────────────────────────────────────────────────────────────────────────── */
const steps = [
  { icon: Upload,      num: '01', title: 'Upload Resume',       desc: 'Drop your PDF resume. Our AI reads and extracts every detail — skills, experience, education, and more.' },
  { icon: Brain,       num: '02', title: 'AI Extracts Skills',  desc: 'Gemini categorizes your technical stack, soft skills, certifications, and proficiency levels automatically.' },
  { icon: Search,      num: '03', title: 'Match Jobs',          desc: 'Fresh jobs are fetched daily via JSearch API and matched against your profile using AI scoring algorithms.' },
  { icon: Send,        num: '04', title: 'Apply Smarter',       desc: 'Get prioritized job lists, tailored resumes, cover letter angles, and daily email digests to apply with confidence.' },
];

function HowItWorks() {
  return (
    <Section id="how-it-works" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4"
          >
            <Play className="w-3.5 h-3.5" /> Simple 4-Step Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4"
          >
            From resume to hired —{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">in four steps</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="absolute top-10 left-[12.5%] right-[12.5%] hidden lg:block h-px bg-gradient-to-r from-blue-200 via-indigo-300 to-violet-200" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.55 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 flex items-center justify-center shadow-sm">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{step.num}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BENEFITS
────────────────────────────────────────────────────────────────────────────── */
const benefits = [
  { icon: Clock,       title: 'Save 10+ Hours Per Week', desc: 'No more endless job board browsing. AI curates the right opportunities and delivers them to your inbox daily.' },
  { icon: TrendingUp,  title: 'Increase Interview Rate by 3×', desc: 'Tailored resumes and precise AI matching drastically improve your callback rate.' },
  { icon: Target,      title: 'Discover Hidden Opportunities', desc: 'Surface fresh jobs from JSearch/RapidAPI that match your skills before the competition even sees them.' },
  { icon: Award,       title: 'AI-Powered Career Growth', desc: 'Get skill gap analysis, cover letter angles, and actionable next steps with every matched job.' },
];

function Benefits() {
  // id="about" anchors the Navbar 'About' link here
  return (
    <Section id="about" className="py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold mb-4"
          >
            <Shield className="w-3.5 h-3.5" /> Why OrbitHire
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            Your unfair advantage in{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              the job market
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-slate-400 text-lg max-w-xl mx-auto">
            Stop applying blindly. Start applying smarter.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-blue-500/30 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{b.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TESTIMONIALS
────────────────────────────────────────────────────────────────────────────── */
/* testimonials removed — will be added once real user reviews are available */
const _placeholder = [
  { name: 'Sanjay Kumar',   role: 'Senior SWE · Bengaluru',      body: 'Got 4 interview calls in my first week. The daily digest at 8 AM is the first thing I check every morning.', stars: 5 },
  { name: 'Priya Sharma',   role: 'Full-Stack Dev · Hyderabad',  body: 'The AI match scores are incredibly accurate. I stopped wasting time on jobs that were clearly not a fit.', stars: 5 },
  { name: 'Arjun Mehta',    role: 'Backend Engineer · Pune',     body: 'Resume tailoring alone is worth it. One-click and my resume reads like it was written for that specific role.', stars: 5 },
  { name: 'Divya Nair',     role: 'React Developer · Chennai',   body: 'Tracked all my applications in one place. No more spreadsheets. Went from 0 to 3 offers in 6 weeks.', stars: 5 },
  { name: 'Rahul Agarwal',  role: 'DevOps Engineer · Noida',     body: 'The skill gap analysis showed me exactly what I needed to learn. It felt like having a career coach in my pocket.', stars: 5 },
  { name: 'Meera Iyer',     role: 'Node.js Dev · Mumbai',        body: 'I switched jobs after just 3 weeks of using OrbitHire. The AI recommendations were spot-on for my profile.', stars: 5 },
];



/* ─────────────────────────────────────────────────────────────────────────────
   CTA SECTION
────────────────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <Section className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden p-12 md:p-16 text-center shadow-2xl">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.07) 0%, transparent 50%)' }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/90 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Start Free — No Credit Card Required
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
              Ready to Accelerate<br />Your Career?
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of developers who land better jobs faster with AI-powered matching, daily digests, and smart application tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-bold px-8 py-4 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-all duration-200"
              >
                Sign In
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-blue-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Free to get started</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />No spam ever</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOOTER
────────────────────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandMark className="h-8 w-8 rounded-lg" />
              <span className="font-extrabold text-white text-lg">OrbitHire</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered job search and career acceleration platform. Built for developers who want to land better roles faster.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} OrbitHire. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT PAGE — assemble all sections
────────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <CursorOrb />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
