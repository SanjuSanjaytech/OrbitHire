'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import ScoreBadge from '@/components/ui/ScoreBadge';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Search, RefreshCw, MapPin, Clock, ExternalLink,
  Briefcase, ChevronLeft, ChevronRight, Trash2,
  X, Zap, Radio, Target, ChevronDown, SlidersHorizontal,
  BookmarkPlus, CheckCircle2, XCircle, MessageSquare,
  Trophy, ArrowUpRight, Sparkles, Building2, Globe,
  AlertCircle, Loader2,
} from 'lucide-react';
import { cn, getRecommendationBadge, timeAgo, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const STATUSES = ['new', 'saved', 'applied', 'rejected', 'interview', 'offer'] as const;
type Status = typeof STATUSES[number];

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string; icon: any }> = {
  new:       { label: 'New',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', icon: Zap },
  saved:     { label: 'Saved',     color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  icon: BookmarkPlus },
  applied:   { label: 'Applied',   color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: XCircle },
  interview: { label: 'Interview', color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)', icon: MessageSquare },
  offer:     { label: 'Offer 🎉',  color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  icon: Trophy },
};

/* ─────────────────────────────────────────────────────────────────────────────
   SCORE UTILS
───────────────────────────────────────────────────────────────────────────── */
function scoreColor(score: number) {
  if (score >= 75) return { text: '#10b981', glow: '#10b98140', ring: '#10b98130' };
  if (score >= 55) return { text: '#f59e0b', glow: '#f59e0b40', ring: '#f59e0b30' };
  return { text: '#ef4444', glow: '#ef444440', ring: '#ef444430' };
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKILL CHIP
───────────────────────────────────────────────────────────────────────────── */
function SkillChip({ label, type }: { label: string; type: 'match' | 'miss' | 'neutral' }) {
  const styles = {
    match:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    miss:    'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-white/5 text-ink-muted border-white/10',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold', styles[type])}>
      {type === 'match' && <span className="mr-1 text-emerald-500">✓</span>}
      {type === 'miss'  && <span className="mr-1 text-red-500">✗</span>}
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCORE ARC — mini SVG ring
───────────────────────────────────────────────────────────────────────────── */
function ScoreArc({ score, size = 52 }: { score: number; size?: number }) {
  const r    = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  const { text, glow } = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setAnim(score), 200);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={text} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (anim / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-extrabold font-display" style={{ color: text }}>{score}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS PILL BUTTON
───────────────────────────────────────────────────────────────────────────── */
function StatusPill({
  status, active, onClick, loading,
}: {
  status: Status; active: boolean; onClick: () => void; loading?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold',
        'transition-all duration-200 select-none',
        active ? 'scale-95' : 'hover:scale-[1.02]',
        loading && 'opacity-60 cursor-not-allowed',
      )}
      style={{
        background: active ? meta.bg : 'transparent',
        borderColor: active ? meta.border : 'rgba(255,255,255,0.06)',
        color: active ? meta.color : '#64748b',
        boxShadow: active ? `0 0 12px ${meta.bg}` : 'none',
      }}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {meta.label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────────────────────────────────────── */
function FilterBar({
  filters,
  onChange,
  onClear,
  total,
  fetching,
}: {
  filters: any;
  onChange: (k: string, v: string) => void;
  onClear: () => void;
  total: number;
  fetching: boolean;
}) {
  const hasActive = filters.search || filters.minScore || filters.status;

  return (
    <div className="flex flex-col gap-3">
      {/* top row */}
      <div className="flex flex-wrap gap-2.5 items-center">

        {/* search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            className="input pl-10 h-9 text-[13px] bg-elevated border-white/[0.07] focus:border-brand-500/40 placeholder:text-ink-muted/50"
            placeholder="Company, role, location, skill…"
            value={filters.search}
            onChange={e => onChange('search', e.target.value)}
          />
          {filters.search && (
            <button
              onClick={() => onChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* score filter */}
        <div className="relative">
          <select
            className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-white/[0.07] min-w-[130px] cursor-pointer"
            value={filters.minScore}
            onChange={e => onChange('minScore', e.target.value)}
          >
            <option value="">All Scores</option>
            <option value="75">🟢 Top Match ≥75%</option>
            <option value="55">🟡 Good ≥55%</option>
            <option value="35">🔴 Fair ≥35%</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
        </div>

        {/* status filter */}
        <div className="relative">
          <select
            className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-white/[0.07] min-w-[120px] cursor-pointer"
            value={filters.status}
            onChange={e => onChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
        </div>

        {/* clear */}
        {hasActive && (
          <button
            onClick={onClear}
            className="h-9 px-3 rounded-xl text-[12px] font-semibold text-ink-muted hover:text-red-400 border border-white/[0.07] hover:border-red-500/20 hover:bg-red-500/5 transition-all flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        {/* result count */}
        <div className="ml-auto flex items-center gap-2">
          {fetching && <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />}
          <span className="text-[12px] text-ink-muted font-medium">
            <span className="text-ink-primary font-bold">{total.toLocaleString()}</span> jobs
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SEARCH PROGRESS BANNER
───────────────────────────────────────────────────────────────────────────── */
function SearchBanner() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-500/25 bg-brand-600/6 px-5 py-4">
      {/* scan line animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)',
          animation: 'scanLine 2s linear infinite',
        }}
      />
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      <div className="flex items-center gap-4 relative z-10">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-brand-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-500 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-brand-300 mb-0.5">
            Scanning LinkedIn for new jobs{dots}
          </p>
          <p className="text-[11px] text-ink-muted">
            Apify is scraping job postings · AI is matching each against your resume · Takes 2–5 min
          </p>
        </div>
        {/* progress bar */}
        <div className="hidden sm:block w-32 h-1.5 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ animation: 'indeterminate 1.8s ease-in-out infinite', width: '40%' }}
          />
        </div>
      </div>
      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-250%) scaleX(1); }
          60%  { transform: translateX(0%) scaleX(2); }
          100% { transform: translateX(250%) scaleX(1); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   JOB CARD (list item)
───────────────────────────────────────────────────────────────────────────── */
function JobCard({
  job,
  active,
  onClick,
  index,
}: {
  job: any;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const [vis, setVis] = useState(false);
  const score = job.aiMatch?.score ?? 0;
  const { text: sColor, glow } = scoreColor(score);
  const status = job.status as Status;
  const statusMeta = STATUS_META[status] || STATUS_META.new;

  useEffect(() => {
    const t = setTimeout(() => setVis(true), index * 45);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer rounded-xl border overflow-hidden',
        'transition-all duration-300',
        vis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
        active
          ? 'border-brand-500/50 bg-brand-600/6 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
          : 'border-white/[0.06] bg-card hover:border-white/[0.12] hover:bg-white/[0.02]',
      )}
    >
      {/* active left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300"
        style={{
          background: active ? 'linear-gradient(180deg, #6366f1, #818cf8)' : 'transparent',
          boxShadow: active ? '0 0 10px #6366f180' : 'none',
        }}
      />

      {/* hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
        style={{ background: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.04) 0%, transparent 60%)' }}
      />

      <div className="flex items-start gap-3.5 p-4 pl-5">
        {/* score arc */}
        <ScoreArc score={score} size={48} />

        {/* main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                'text-[13px] font-bold leading-snug truncate transition-colors',
                active ? 'text-white' : 'text-ink-primary group-hover:text-white',
              )}>
                {job.title}
              </h3>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: sColor }}>
                {job.company?.name}
              </p>
            </div>
            {/* status badge */}
            {status !== 'new' && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 uppercase tracking-wider"
                style={{ color: statusMeta.color, background: statusMeta.bg, borderColor: statusMeta.border }}
              >
                {statusMeta.label}
              </span>
            )}
          </div>

          {/* meta row */}
          <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-ink-muted mb-2">
            {(job.location?.raw || job.location?.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location?.raw || job.location?.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(job.postedAt)}
            </span>
            {job.employmentType && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {job.employmentType}
              </span>
            )}
          </div>

          {/* matched skills preview */}
          {job.aiMatch?.matchedSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.aiMatch.matchedSkills.slice(0, 3).map((s: string, i: number) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/8 text-emerald-400 border border-emerald-500/15"
                >
                  {s}
                </span>
              ))}
              {job.aiMatch.matchedSkills.length > 3 && (
                <span className="text-[10px] text-ink-muted px-1">
                  +{job.aiMatch.matchedSkills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* arrow */}
        <ChevronRight
          className="w-4 h-4 text-ink-muted flex-shrink-0 mt-1 transition-all duration-200 group-hover:text-brand-400 group-hover:translate-x-0.5"
          style={{ opacity: active ? 1 : 0.4 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DETAIL PANEL
───────────────────────────────────────────────────────────────────────────── */
function DetailPanel({
  job,
  onClose,
  onStatusChange,
  onDelete,
  statusLoading,
  deleteLoading,
}: {
  job: any;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  statusLoading: boolean;
  deleteLoading: boolean;
}) {
  const [vis, setVis] = useState(false);
  const score = job.aiMatch?.score ?? 0;
  const { text: sColor, glow, ring } = scoreColor(score);
  const rec = getRecommendationBadge(job.aiMatch?.recommendation);

  useEffect(() => {
    const t = requestAnimationFrame(() => { requestAnimationFrame(() => setVis(true)); });
    return () => cancelAnimationFrame(t);
  }, [job._id]);

  // reset vis on job change
  useEffect(() => { setVis(false); }, [job._id]);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t);
  }, [job._id]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-card overflow-hidden"
      style={{
        transition: 'all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateX(0) scale(1)' : 'translateX(16px) scale(0.99)',
      }}
    >
      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b border-white/[0.06]">
        {/* ambient glow behind header */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${glow} 0%, transparent 60%)` }}
        />
        {/* top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${sColor}80, transparent)` }}
        />

        <div className="relative z-10">
          {/* close + actions row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider', rec.class)}>
                {rec.label}
              </span>
              {job.status !== 'new' && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider"
                  style={{
                    color: STATUS_META[job.status as Status]?.color ?? '#94a3b8',
                    background: STATUS_META[job.status as Status]?.bg ?? 'transparent',
                    borderColor: STATUS_META[job.status as Status]?.border ?? 'transparent',
                  }}
                >
                  {STATUS_META[job.status as Status]?.label ?? job.status}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* title + score */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-extrabold text-ink-primary leading-tight mb-1">
                {job.title}
              </h2>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                <p className="text-[14px] font-bold" style={{ color: sColor }}>{job.company?.name}</p>
              </div>
            </div>

            {/* big score ring */}
            <ScoreArc score={score} size={72} />
          </div>

          {/* meta chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(job.location?.raw || job.location?.city) && (
              <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <MapPin className="w-3 h-3" />{job.location?.raw || job.location?.city}
              </span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Briefcase className="w-3 h-3" />{job.employmentType}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* AI Analysis */}
        {job.aiMatch?.reasoning && (
          <div className="rounded-xl border border-brand-500/20 bg-brand-600/6 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">AI Analysis</span>
            </div>
            <p className="text-[13px] text-ink-secondary leading-relaxed">{job.aiMatch.reasoning}</p>
          </div>
        )}

        {/* Skills grid */}
        {(job.aiMatch?.matchedSkills?.length > 0 || job.aiMatch?.missingSkills?.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {job.aiMatch?.matchedSkills?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Matched ({job.aiMatch.matchedSkills.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.aiMatch.matchedSkills.map((s: string, i: number) => (
                    <SkillChip key={i} label={s} type="match" />
                  ))}
                </div>
              </div>
            )}
            {job.aiMatch?.missingSkills?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    Missing ({job.aiMatch.missingSkills.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.aiMatch.missingSkills.map((s: string, i: number) => (
                    <SkillChip key={i} label={s} type="miss" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status selector */}
        <div>
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">
            Track Status
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <StatusPill
                key={s}
                status={s}
                active={job.status === s}
                onClick={() => onStatusChange(s)}
                loading={statusLoading && job.status === s}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Globe className="w-3.5 h-3.5 text-ink-muted" />
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Description</span>
            </div>
            <div className="text-[13px] text-ink-secondary leading-relaxed whitespace-pre-line rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 max-h-56 overflow-y-auto">
              {truncate(job.description, 1200)}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-white/[0.06] bg-elevated/30 flex items-center gap-3">
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-[13px] py-2.5 gap-2 group relative overflow-hidden"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <ExternalLink className="w-4 h-4" />
            Apply Now
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}
        <button
          onClick={onDelete}
          disabled={deleteLoading}
          className="p-2.5 rounded-xl border border-white/[0.07] text-ink-muted hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 transition-all duration-200"
          title="Remove job"
        >
          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */
function JobsEmpty({ onSearch, loading }: { onSearch: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center">
          <Target className="w-9 h-9 text-brand-400" />
        </div>
        <div className="absolute -inset-3 rounded-3xl border border-brand-500/10 animate-ping" style={{ animationDuration: '3s' }} />
      </div>
      <h3 className="font-display text-xl font-bold text-ink-primary mb-2">No matches yet</h3>
      <p className="text-ink-muted text-[13px] max-w-xs leading-relaxed mb-6">
        Upload your resume and run a job search — AI will match every posting against your skills.
      </p>
      <button
        onClick={onSearch}
        disabled={loading}
        className="btn-primary gap-2 px-6 py-3 text-[13px] relative overflow-hidden group"
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Search Jobs Now
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────────────────────────── */
function Pagination({ pagination, page, setPage }: { pagination: any; page: number; setPage: (p: number) => void }) {
  if (!pagination || pagination.pages <= 1) return null;

  const pages = Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
    if (pagination.pages <= 7) return i + 1;
    // window logic
    if (i === 0) return 1;
    if (i === 6) return pagination.pages;
    const start = Math.max(2, page - 2);
    const end   = Math.min(pagination.pages - 1, page + 2);
    if (i === 1 && start > 2)  return '…';
    if (i === 5 && end < pagination.pages - 1) return '…';
    return start + i - 1;
  });

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-[11px] text-ink-muted">
        Page <span className="text-ink-primary font-semibold">{page}</span> of{' '}
        <span className="text-ink-primary font-semibold">{pagination.pages}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={!pagination.hasPrev}
          className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-ink-muted hover:text-ink-primary hover:border-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={i} className="w-8 h-8 flex items-center justify-center text-[12px] text-ink-muted">…</span>
          ) : (
            <button
              key={i}
              onClick={() => typeof p === 'number' && setPage(p)}
              className={cn(
                'w-8 h-8 rounded-lg border text-[12px] font-semibold transition-all',
                p === page
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                  : 'border-white/[0.07] text-ink-muted hover:text-ink-primary hover:border-white/[0.14]',
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage(page + 1)}
          disabled={!pagination.hasNext}
          className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-ink-muted hover:text-ink-primary hover:border-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function JobsPage() {
  const queryClient = useQueryClient();
  const [page, setPage]             = useState(1);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mounted, setMounted]         = useState(false);
  const [filters, setFilters]         = useState({
    search: '', minScore: '', recommendation: '', status: '',
  });
  // mobile detail drawer
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const updateFilter = useCallback((k: string, v: string) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', minScore: '', recommendation: '', status: '' });
    setPage(1);
  }, []);

  /* ── queries ──────────────────────────────────────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', page, filters],
    queryFn: () => jobsApi.list({
      page, limit: 15,
      ...(filters.minScore       && { minScore:       filters.minScore }),
      ...(filters.recommendation && { recommendation: filters.recommendation }),
      ...(filters.status         && { status:         filters.status }),
      ...(filters.search         && { search:         filters.search }),
    }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const searchMutation = useMutation({
    mutationFn: () => jobsApi.search(),
    onSuccess: res => {
      const d = res.data.data;
      toast.success(`Found ${d.saved} new jobs! Avg match: ${d.avgMatchScore}%`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Search failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => jobsApi.updateStatus(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob((prev: any) => prev ? { ...prev, status: vars.status } : prev);
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(null);
      setMobileDetail(false);
      toast.success('Job removed');
    },
  });

  const jobs       = data?.data || [];
  const pagination = data?.pagination;

  const handleJobClick = (job: any) => {
    if (selectedJob?._id === job._id) {
      setSelectedJob(null);
      setMobileDetail(false);
    } else {
      setSelectedJob(job);
      setMobileDetail(true);
    }
  };

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'space-y-5 pb-10 transition-all duration-600',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
    >
      {/* ══════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Intel Feed
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink-primary">Job Matches</h1>
          <p className="text-ink-muted text-[13px] mt-1">
            AI-matched against your resume · {(pagination?.total ?? 0).toLocaleString()} jobs indexed
          </p>
        </div>

        {/* search trigger button */}
        <button
          onClick={() => searchMutation.mutate()}
          disabled={searchMutation.isPending}
          className={cn(
            'btn-primary gap-2 px-5 py-2.5 text-[13px] font-bold relative overflow-hidden group self-start',
            'transition-all duration-200',
            searchMutation.isPending && 'opacity-80 cursor-not-allowed',
          )}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          {searchMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning LinkedIn…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Search New Jobs
            </>
          )}
        </button>
      </div>

      {/* search progress banner */}
      {searchMutation.isPending && <SearchBanner />}

      {/* ══════════════════════════════════════════════════════════════
          FILTER BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/[0.06] bg-card px-4 py-3.5">
        <FilterBar
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
          total={pagination?.total ?? 0}
          fetching={isFetching && !isLoading}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MAIN GRID — list | detail
      ══════════════════════════════════════════════════════════════ */}
      <div className={cn(
        'grid gap-5',
        selectedJob ? 'grid-cols-1 xl:grid-cols-[1fr_420px]' : 'grid-cols-1',
      )}>

        {/* ── JOB LIST ──────────────────────────────────────────────── */}
        <div className="space-y-2 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl shimmer" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-card">
              <JobsEmpty onSearch={() => searchMutation.mutate()} loading={searchMutation.isPending} />
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job: any, i: number) => (
                <JobCard
                  key={job._id}
                  job={job}
                  active={selectedJob?._id === job._id}
                  onClick={() => handleJobClick(job)}
                  index={i}
                />
              ))}
            </div>
          )}

          <Pagination pagination={pagination} page={page} setPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>

        {/* ── DETAIL PANEL (desktop sticky) ─────────────────────────── */}
        {selectedJob && (
          <div className="hidden xl:block sticky top-6 h-[calc(100vh-5rem)]">
            <DetailPanel
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
              onStatusChange={status => statusMutation.mutate({ id: selectedJob._id, status })}
              onDelete={() => deleteMutation.mutate(selectedJob._id)}
              statusLoading={statusMutation.isPending}
              deleteLoading={deleteMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE DETAIL DRAWER
      ══════════════════════════════════════════════════════════════ */}
      {mobileDetail && selectedJob && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            style={{
              opacity: mobileDetail ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            onClick={() => { setMobileDetail(false); setSelectedJob(null); }}
          />
          {/* bottom sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-card border-t border-white/[0.08] flex flex-col"
            style={{
              height: '90vh',
              transform: mobileDetail ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
            }}
          >
            {/* drag handle */}
            <div className="flex justify-center py-3 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 overflow-hidden px-1 pb-1">
              <DetailPanel
                job={selectedJob}
                onClose={() => { setMobileDetail(false); setSelectedJob(null); }}
                onStatusChange={status => statusMutation.mutate({ id: selectedJob._id, status })}
                onDelete={() => deleteMutation.mutate(selectedJob._id)}
                statusLoading={statusMutation.isPending}
                deleteLoading={deleteMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}