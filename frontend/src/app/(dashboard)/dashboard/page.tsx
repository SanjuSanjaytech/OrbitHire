'use client';

import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Briefcase, TrendingUp, Star, CheckCircle,
  Search, FileSpreadsheet, Zap, ArrowUpRight,
  Target, Radio, Activity, ChevronRight,
  Cpu, Globe, Bell,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from 'recharts';
import { timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   SCORE RING  — SVG donut with animated stroke-dashoffset
───────────────────────────────────────────────────────────────────────────── */
function ScoreRing({ score = 0, size = 180 }: { score: number; size?: number }) {
  const r = size / 2 - 16;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(t);
  }, [score]);

  const dash = (animated / 100) * circ;

  const color =
    score >= 75 ? '#10b981'
    : score >= 55 ? '#f59e0b'
    : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth={10}
        />
        {/* glow ring behind */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={10} strokeOpacity={0.15}
          strokeDasharray={circ}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        {/* main arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          filter={`drop-shadow(0 0 8px ${color})`}
        />
      </svg>
      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-extrabold font-display leading-none"
          style={{ color }}
        >
          {Math.round(score)}
        </span>
        <span className="text-[10px] text-ink-muted font-semibold uppercase tracking-widest mt-1">
          Avg Match
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────────────────────── */
function Counter({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PULSE DOT
───────────────────────────────────────────────────────────────────────────── */
function PulseDot({ color = '#10b981' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT NODE — the 4 big metric tiles
───────────────────────────────────────────────────────────────────────────── */
function StatNode({
  label, value, sub, icon: Icon, color, loading, delay = 0,
}: {
  label: string; value: number | string; sub: string;
  icon: any; color: string; loading?: boolean; delay?: number;
}) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div
      className={cn(
        'relative p-5 rounded-2xl border border-white/[0.06] bg-card overflow-hidden group cursor-default',
        'transition-all duration-700',
        vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      )}
    >
      {/* ambient glow on hover */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}22 0%, transparent 70%)` }}
      />

      {/* corner accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="font-display text-3xl font-extrabold text-ink-primary mb-0.5">
        {loading ? (
          <span className="inline-block w-16 h-8 rounded-lg shimmer" />
        ) : typeof value === 'number' ? (
          <Counter to={value} />
        ) : (
          value
        )}
      </div>
      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">{label}</div>
      <div className="text-[11px] text-ink-muted mt-0.5">{sub}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MATCH SCORE BADGE
───────────────────────────────────────────────────────────────────────────── */
function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : score >= 55 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20';
  return (
    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border font-display', color)}>
      {score}%
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE TICKER — scrolls recent job titles
───────────────────────────────────────────────────────────────────────────── */
function LiveTicker({ jobs }: { jobs: any[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!jobs.length) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % jobs.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs]);

  if (!jobs.length) return null;
  const job = jobs[idx];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-brand-600/8 border border-brand-500/15">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <PulseDot color="#6366f1" />
        <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Live</span>
      </div>
      <div
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <span className="text-[12px] text-ink-secondary truncate block">
          <span className="font-semibold text-ink-primary">{job.title}</span>
          {' '}at <span className="text-brand-300">{job.company?.name}</span>
          {' '}· <MatchBadge score={job.aiMatch?.score ?? 0} />
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CUSTOM TOOLTIP for charts
───────────────────────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-elevated border border-border text-[12px] shadow-xl">
      <p className="text-ink-muted mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RADAR SKILL CHART
───────────────────────────────────────────────────────────────────────────── */
function SkillRadar({ companies }: { companies: any[] }) {
  const data = companies.slice(0, 6).map((c: any) => ({
    subject: c._id?.split(' ')[0] || '?',
    score: Math.round(c.avgScore || 0),
    jobs: c.count,
  }));

  if (!data.length) return (
    <div className="flex items-center justify-center h-full text-ink-muted text-sm">
      No company data yet
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'inherit' }}
        />
        <Radar
          name="Avg Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Radar
          name="Jobs"
          dataKey="jobs"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.1}
          strokeWidth={2}
        />
        <Tooltip content={<ChartTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AREA TREND CHART (mock weekly trend from stats)
───────────────────────────────────────────────────────────────────────────── */
function TrendChart({ total = 0, highMatch = 0 }: { total?: number; highMatch?: number }) {
  // generate plausible-looking mock weekly distribution
  const data = Array.from({ length: 7 }, (_, i) => {
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
    const base = Math.round((total / 7) * (0.7 + Math.random() * 0.6));
    return {
      day,
      jobs: base,
      matches: Math.round(base * (highMatch / Math.max(total, 1))),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gJobs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMatches" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="jobs"    stroke="#6366f1" fill="url(#gJobs)"    strokeWidth={2} name="Jobs" />
        <Area type="monotone" dataKey="matches" stroke="#10b981" fill="url(#gMatches)" strokeWidth={2} name="Top Matches" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MATCH DISTRIBUTION — horizontal bar stack
───────────────────────────────────────────────────────────────────────────── */
function MatchDistribution({ high = 0, mid = 0, low = 0 }: { high?: number; mid?: number; low?: number }) {
  const total = high + mid + low || 1;
  const bars = [
    { label: '≥75% Strong', value: high, pct: (high / total) * 100, color: '#10b981' },
    { label: '55-74% Good',  value: mid,  pct: (mid  / total) * 100, color: '#f59e0b' },
    { label: '<55% Weak',   value: low,  pct: (low  / total) * 100, color: '#ef4444' },
  ];

  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-ink-muted">{b.label}</span>
            <span className="text-[11px] font-bold text-ink-secondary">{b.value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${b.pct}%`,
                background: b.color,
                boxShadow: `0 0 8px ${b.color}80`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RECENT JOB ROW
───────────────────────────────────────────────────────────────────────────── */
function JobRow({ job, delay = 0 }: { job: any; delay?: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  const initials = job.company?.name?.slice(0, 2).toUpperCase() || '??';
  const score = job.aiMatch?.score ?? 0;
  const scoreColor = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <Link
      href="/jobs"
      className={cn(
        'flex items-center gap-4 px-4 py-3.5 rounded-xl',
        'border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]',
        'transition-all duration-500 group',
        vis ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
      )}
    >
      {/* company avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 font-display"
        style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}25`, color: scoreColor }}
      >
        {initials}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink-primary truncate group-hover:text-white transition-colors">
          {job.title}
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5">
          {job.company?.name}
          {(job.location?.raw || job.location?.city) && (
            <> · {job.location?.raw || job.location?.city}</>
          )}
        </p>
      </div>

      {/* score + time */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <MatchBadge score={score} />
        <span className="text-[11px] text-ink-muted w-16 text-right">{timeAgo(job.postedAt)}</span>
        <ChevronRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUICK ACTION CARD
───────────────────────────────────────────────────────────────────────────── */
function ActionCard({
  href, emoji, title, desc, accent, delay = 0,
}: {
  href: string; emoji: string; title: string; desc: string;
  accent: string; delay?: number;
}) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <Link
      href={href}
      className={cn(
        'relative p-5 rounded-2xl border border-white/[0.06] bg-card overflow-hidden group',
        'hover:border-white/[0.12] transition-all duration-500',
        vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      )}
    >
      {/* hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 20% 20%, ${accent}12 0%, transparent 70%)` }}
      />
      {/* top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
      />

      <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 inline-block">
        {emoji}
      </div>
      <h3 className="text-[13px] font-bold text-ink-primary mb-1 group-hover:text-white transition-colors font-display">
        {title}
      </h3>
      <p className="text-[11px] text-ink-muted leading-relaxed">{desc}</p>
      <div
        className="absolute bottom-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
        style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
      >
        <ArrowUpRight className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['job-stats'],
    queryFn: () => jobsApi.stats().then(r => r.data.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-recent'],
    queryFn: () => jobsApi.list({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }).then(r => r.data),
  });

  const stats      = statsData?.summary;
  const companies  = statsData?.topCompanies || [];
  const recentJobs = jobsData?.data || [];

  const hour     = new Date().getHours();
  const greeting = hour < 5 ? 'Still up,' : hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6 pb-10">

      {/* ══════════════════════════════════════════════════════════════════
          HEADER ROW
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
          'transition-all duration-600',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3',
        )}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PulseDot color="#10b981" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              Live · Jobs updated today
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink-primary leading-tight">
            {greeting}{' '}
            <span className="text-gradient">{firstName}</span>
            <span className="ml-2 text-2xl">
              {hour < 12 ? '☀️' : hour < 18 ? '🌤' : '🌙'}
            </span>
          </h1>
          <p className="text-ink-muted text-[13px] mt-1">
            Your AI job command center · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/jobs"
            className="btn-secondary text-[12px] h-9 px-4 gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            Search Jobs
          </Link>
          <Link
            href="/reports"
            className="btn-primary text-[12px] h-9 px-4 gap-2 relative overflow-hidden group"
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Report
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LIVE TICKER
      ══════════════════════════════════════════════════════════════════ */}
      {recentJobs.length > 0 && (
        <div
          className={cn(
            'transition-all duration-500 delay-100',
            mounted ? 'opacity-100' : 'opacity-0',
          )}
        >
          <LiveTicker jobs={recentJobs} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STAT NODES — 4 big metrics
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatNode
          label="Total Jobs"     value={stats?.total ?? 0}
          sub="in your feed"     icon={Briefcase}
          color="#6366f1"        loading={isLoading}  delay={150}
        />
        <StatNode
          label="Top Matches"    value={stats?.highMatch ?? 0}
          sub="score ≥ 75%"      icon={Star}
          color="#f59e0b"        loading={isLoading}  delay={250}
        />
        <StatNode
          label="Applied"        value={stats?.applied ?? 0}
          sub="applications sent" icon={CheckCircle}
          color="#10b981"        loading={isLoading}  delay={350}
        />
        <StatNode
          label="Avg Match"
          value={stats ? `${Math.round(stats.avgScore || 0)}%` : '—'}
          sub="across all jobs"  icon={TrendingUp}
          color="#38bdf8"        loading={isLoading}  delay={450}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT — score ring + trend + distribution
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* SCORE RING CARD */}
        <div
          className={cn(
            'lg:col-span-3 card flex flex-col items-center justify-center gap-4 py-8',
            'relative overflow-hidden transition-all duration-700 delay-200',
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          )}
        >
          {/* ambient glow behind ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%,
                ${(stats?.avgScore ?? 0) >= 75 ? '#10b98120' : (stats?.avgScore ?? 0) >= 55 ? '#f59e0b20' : '#ef444420'}
                0%, transparent 70%)`,
            }}
          />
          {/* top label */}
          <div className="flex items-center gap-1.5 z-10">
            <Target className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
              Match Score
            </span>
          </div>

          <div className="relative z-10">
            {isLoading ? (
              <div className="w-44 h-44 rounded-full shimmer" />
            ) : (
              <ScoreRing score={stats?.avgScore ?? 0} size={176} />
            )}
          </div>

          <div className="z-10 text-center">
            <p className="text-[11px] text-ink-muted">
              {(stats?.highMatch ?? 0)} strong matches out of {stats?.total ?? 0} jobs
            </p>
          </div>

          {/* outer ring decoration */}
          <div className="absolute inset-3 rounded-full border border-white/[0.03] pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-white/[0.02] pointer-events-none" />
        </div>

        {/* TREND CHART */}
        <div
          className={cn(
            'lg:col-span-5 card transition-all duration-700 delay-300',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-ink-primary text-[15px]">Weekly Activity</h2>
              <p className="text-[11px] text-ink-muted mt-0.5">Jobs + top matches this week</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-semibold text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Jobs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Matches
              </span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-40 shimmer rounded-xl" />
          ) : (
            <TrendChart total={stats?.total} highMatch={stats?.highMatch} />
          )}
        </div>

        {/* MATCH DISTRIBUTION */}
        <div
          className={cn(
            'lg:col-span-4 card transition-all duration-700 delay-400',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          )}
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-brand-400" />
            <h2 className="font-display font-bold text-ink-primary text-[15px]">Match Breakdown</h2>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-8 shimmer rounded-lg" />)}
            </div>
          ) : (
            <MatchDistribution
              high={stats?.highMatch}
              mid={stats?.mediumMatch}
              low={stats?.lowMatch}
            />
          )}

          {/* mini company radar */}
          <div className="mt-6 pt-5 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">
                Company Radar
              </h3>
            </div>
            <SkillRadar companies={companies} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RECENT JOBS TABLE
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          'card transition-all duration-700 delay-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        )}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-400" />
            <h2 className="font-display font-bold text-ink-primary text-[15px]">Recent Matches</h2>
            {recentJobs.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600/15 text-brand-400 border border-brand-500/20">
                {recentJobs.length} new
              </span>
            )}
          </div>
          <Link
            href="/jobs"
            className="text-[12px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-brand-400" />
            </div>
            <p className="text-ink-primary font-semibold mb-1">No job data yet</p>
            <p className="text-ink-muted text-[13px] mb-5">
              Upload your resume and run your first job search to see matches here.
            </p>
            <Link href="/jobs" className="btn-primary text-[13px] px-5 py-2.5 gap-2">
              <Search className="w-4 h-4" /> Search Jobs Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentJobs.map((job: any, i: number) => (
              <JobRow key={job._id} job={job} delay={550 + i * 60} />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-ink-muted" />
          <h2 className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            href="/profile" emoji="📄"
            title="Upload Resume"
            desc="Let AI extract your skills and build your match profile automatically."
            accent="#6366f1" delay={700}
          />
          <ActionCard
            href="/jobs" emoji="🔍"
            title="Search Jobs"
            desc="Discover the latest LinkedIn postings matched to your skill set."
            accent="#10b981" delay={800}
          />
          <ActionCard
            href="/reports" emoji="📊"
            title="Export Report"
            desc="Download an Excel sheet with all your matches, scores, and links."
            accent="#f59e0b" delay={900}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER HINT
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          'flex items-center justify-center gap-2 py-2 transition-all duration-700 delay-[1000ms]',
          mounted ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Bell className="w-3 h-3 text-ink-muted" />
        <p className="text-[11px] text-ink-muted">
          Job digest runs every morning at <span className="text-ink-secondary font-semibold">8:00 AM IST</span> · Next run in {
            (() => {
              const now = new Date();
              const next = new Date(); next.setHours(8, 0, 0, 0);
              if (now >= next) next.setDate(next.getDate() + 1);
              const diff = Math.round((next.getTime() - now.getTime()) / 60000);
              const h = Math.floor(diff / 60); const m = diff % 60;
              return `${h}h ${m}m`;
            })()
          }
        </p>
      </div>
    </div>
  );
}