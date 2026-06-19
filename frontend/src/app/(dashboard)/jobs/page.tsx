'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, savedSearchApi } from '@/lib/api';
import { cn, getRecommendationBadge, timeAgo, truncate } from '@/lib/utils';
import {
  Search, RefreshCw, MapPin, Clock, Briefcase, ExternalLink,
  ChevronLeft, ChevronRight, Trash2, X, Radio, Target,
  ChevronDown, BookmarkPlus, CheckCircle2, XCircle,
  MessageSquare, Trophy, ArrowUpRight, Sparkles, Building2,
  Globe, AlertCircle, Loader2, Zap, ArrowLeft, Lightbulb,
  CalendarClock, NotebookPen, Send, ShieldCheck,
  Plus, Bell, BellOff, Star, ListFilter,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const STATUSES = ['new', 'saved', 'applied', 'rejected', 'interview', 'offer'] as const;
type Status = typeof STATUSES[number];

interface Job {
  _id: string;
  title: string;
  company?: { name: string };
  location?: { raw?: string; city?: string };
  employmentType?: string;
  postedAt: string;
  description?: string;
  applyUrl?: string;
  status: Status;
  notes?: string;
  followUpAt?: string;
  contactName?: string;
  aiMatch?: {
    score: number;
    reasoning?: string;
    recommendation?: string;
    matchedSkills?: string[];
    missingSkills?: string[];
    breakdown?: {
      skills?: number;
      experience?: number;
      roleFit?: number;
      location?: number;
    };
    priority?: 'apply_now' | 'save_for_later' | 'skill_gap' | 'low_priority';
    confidence?: number;
    actionPlan?: {
      resumeKeywords?: string[];
      resumeSuggestions?: string[];
      coverLetterAngle?: string;
      nextStep?: string;
    };
  };
}

interface SavedSearch {
  _id: string;
  name: string;
  queries: string[];
  location: string;
  digestEnabled: boolean;
  isDefault: boolean;
  lastRunAt?: string;
  lastResultCount?: number;
}

type JobDetailsUpdate = {
  status?: Status;
  notes?: string;
  followUpAt?: string;
  contactName?: string;
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  new:       { label: 'New',       color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)', icon: Zap },
  saved:     { label: 'Saved',     color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.22)',  icon: BookmarkPlus },
  applied:   { label: 'Applied',   color: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.22)', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.22)', icon: XCircle },
  interview: { label: 'Interview', color: '#c084fc', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.22)', icon: MessageSquare },
  offer:     { label: 'Offer 🎉',  color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.22)',  icon: Trophy },
};

function scoreColor(score: number) {
  if (score >= 75) return { text: '#10b981', track: '#10b98125' };
  if (score >= 55) return { text: '#f59e0b', track: '#f59e0b25' };
  return             { text: '#ef4444', track: '#ef444425' };
}

const PRIORITY_META = {
  apply_now: { label: 'Apply now', color: '#10b981', icon: Send },
  save_for_later: { label: 'Save for later', color: '#60a5fa', icon: BookmarkPlus },
  skill_gap: { label: 'Skill gap', color: '#f59e0b', icon: Lightbulb },
  low_priority: { label: 'Low priority', color: '#94a3b8', icon: ShieldCheck },
};

function clampPercent(value?: number, fallback = 0) {
  const n = Number(value);
  return Math.min(100, Math.max(0, Number.isFinite(n) ? n : fallback));
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCORE RING  — pure SVG, no animation state
───────────────────────────────────────────────────────────────────────────── */
const ScoreRing = memo(function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const { text, track } = scoreColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={text} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - fill}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-extrabold tabular-nums" style={{ fontSize: size * 0.25, color: text }}>{score}</span>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   SKILL CHIP
───────────────────────────────────────────────────────────────────────────── */
const SkillChip = memo(function SkillChip({ label, type }: { label: string; type: 'match' | 'miss' }) {
  return type === 'match' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
      <CheckCircle2 className="w-3 h-3" />{label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-semibold">
      <XCircle className="w-3 h-3" />{label}
    </span>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────────────────────────────────────── */
const StatusPill = memo(function StatusPill({
  status, active, onClick, loading,
}: {
  status: Status; active: boolean; onClick: () => void; loading: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        active ? 'scale-[0.97]' : 'hover:scale-[1.02]',
      )}
      style={{
        background:   active ? meta.bg      : 'transparent',
        borderColor:  active ? meta.border  : 'rgba(255,255,255,0.07)',
        color:        active ? meta.color   : '#64748b',
      }}
    >
      {loading && active
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <Icon className="w-3 h-3" />
      }
      {meta.label}
    </button>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────────────────────────────────────── */
interface Filters { search: string; minScore: string; status: string }

const FilterBar = memo(function FilterBar({
  filters, onChange, onClear, total, fetching,
}: {
  filters: Filters;
  onChange: (k: keyof Filters, v: string) => void;
  onClear: () => void;
  total: number;
  fetching: boolean;
}) {
  const hasActive = !!(filters.search || filters.minScore || filters.status);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
        <input
          className="input pl-9 h-9 text-[13px] w-full bg-elevated border-slate-200 placeholder:text-ink-muted/50"
          placeholder="Role, company, location, skill…"
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
        />
        {filters.search && (
          <button
            onClick={() => onChange('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Score */}
      <div className="relative">
        <select
          className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-slate-200 min-w-[130px] cursor-pointer"
          value={filters.minScore}
          onChange={e => onChange('minScore', e.target.value)}
        >
          <option value="">All Scores</option>
          <option value="75">🟢 Top Match ≥75</option>
          <option value="55">🟡 Good Match ≥55</option>
          <option value="35">🔴 Fair Match ≥35</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" />
      </div>

      {/* Status */}
      <div className="relative">
        <select
          className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-slate-200 min-w-[120px] cursor-pointer"
          value={filters.status}
          onChange={e => onChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" />
      </div>

      {hasActive && (
        <button
          onClick={onClear}
          className="h-9 px-3 rounded-xl text-[12px] font-semibold text-ink-muted hover:text-red-400 border border-slate-200 hover:border-red-500/20 hover:bg-red-500/5 transition-all flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {fetching && <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />}
        <span className="text-[12px] text-ink-muted">
          <span className="text-ink-primary font-bold">{total.toLocaleString()}</span> jobs
        </span>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   SEARCH PROGRESS BANNER
───────────────────────────────────────────────────────────────────────────── */
function SearchBanner() {
  return (
    <div className="rounded-2xl border border-brand-500/25 bg-brand-600/6 px-5 py-4 flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <Radio className="w-4 h-4 text-brand-400" />
        </div>
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-brand-300">Scanning for new jobs…</p>
        <p className="text-[11px] text-ink-muted mt-0.5">JsearchAPI is scraping postings · AI is matching against your resume · 2–5 min</p>
      </div>
      <div className="hidden sm:block w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
        <div className="h-full w-2/5 rounded-full bg-brand-500" style={{ animation: 'jobScan 1.8s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes jobScan{0%{transform:translateX(-250%) scaleX(1)}60%{transform:translateX(0%) scaleX(2)}100%{transform:translateX(250%) scaleX(1)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   JOB CARD
───────────────────────────────────────────────────────────────────────────── */
const JobCard = memo(function JobCard({
  job, active, onClick,
}: {
  job: Job; active: boolean; onClick: () => void;
}) {
  const score     = job.aiMatch?.score ?? 0;
  const { text }  = scoreColor(score);
  const status    = job.status;
  const statusMeta = STATUS_META[status] ?? STATUS_META.new;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border transition-all duration-200 overflow-hidden',
        'flex items-start gap-3.5 p-4',
        active
          ? 'border-brand-500/50 bg-brand-600/8'
          : 'border-slate-200 bg-card hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {/* left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: active ? 'linear-gradient(180deg,#6366f1,#818cf8)' : 'transparent' }}
      />

      <ScoreRing score={score} size={48} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="flex-1 min-w-0 text-[13px] font-bold text-ink-primary truncate">{job.title}</h3>
          {status !== 'new' && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider flex-shrink-0"
              style={{ color: statusMeta.color, background: statusMeta.bg, borderColor: statusMeta.border }}
            >
              {statusMeta.label}
            </span>
          )}
        </div>

        <p className="text-[12px] font-semibold mb-2" style={{ color: text }}>
          {job.company?.name}
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-muted">
          {(job.location?.raw || job.location?.city) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location.raw || job.location.city}
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

        {job.aiMatch?.matchedSkills && job.aiMatch.matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.aiMatch.matchedSkills.slice(0, 3).map((s, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/8 text-emerald-400 border border-emerald-500/15">
                {s}
              </span>
            ))}
            {job.aiMatch.matchedSkills.length > 3 && (
              <span className="text-[10px] text-ink-muted">+{job.aiMatch.matchedSkills.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <ChevronRight className={cn(
        'w-4 h-4 flex-shrink-0 mt-0.5 transition-colors',
        active ? 'text-brand-400' : 'text-ink-muted',
      )} />
    </button>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────────────────────────── */
function Pagination({ total, pages, page, onPage }: { total: number; pages: number; page: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;

  const nums = useMemo(() => {
    const all = Array.from({ length: pages }, (_, i) => i + 1);
    if (pages <= 7) return all as (number | '…')[];
    const result: (number | '…')[] = [1];
    if (page > 3) result.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) result.push(i);
    if (page < pages - 2) result.push('…');
    result.push(pages);
    return result;
  }, [pages, page]);

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-[11px] text-ink-muted">
        Page <span className="text-ink-primary font-semibold">{page}</span> / <span className="text-ink-primary font-semibold">{pages}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-300 hover:text-ink-primary transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {nums.map((n, i) =>
          n === '…'
            ? <span key={i} className="w-8 h-8 flex items-center justify-center text-[12px] text-ink-muted">…</span>
            : (
              <button
                key={i}
                onClick={() => onPage(n as number)}
                className={cn(
                  'w-8 h-8 rounded-lg border text-[12px] font-semibold transition-all',
                  n === page
                    ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                    : 'border-slate-200 text-ink-muted hover:border-slate-300 hover:text-ink-primary',
                )}
              >
                {n}
              </button>
            )
        )}
        <button
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-300 hover:text-ink-primary transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DETAIL CONTENT  — shared between desktop panel and mobile screen
───────────────────────────────────────────────────────────────────────────── */
function DetailContent({
  job,
  onStatusChange,
  onSaveDetails,
  onDelete,
  statusLoading,
  deleteLoading,
}: {
  job: Job;
  onStatusChange: (s: Status) => void;
  onSaveDetails: (details: JobDetailsUpdate) => void;
  onDelete: () => void;
  statusLoading: boolean;
  deleteLoading: boolean;
}) {
  const score     = job.aiMatch?.score ?? 0;
  const { text }  = scoreColor(score);
  const rec = getRecommendationBadge(job.aiMatch?.recommendation ?? '');
  const statusMeta = STATUS_META[job.status] ?? STATUS_META.new;
  const priority = job.aiMatch?.priority ?? (score >= 75 ? 'apply_now' : score >= 55 ? 'save_for_later' : 'skill_gap');
  const priorityMeta = PRIORITY_META[priority];
  const PriorityIcon = priorityMeta.icon;
  const [notes, setNotes] = useState(job.notes ?? '');
  const [contactName, setContactName] = useState(job.contactName ?? '');
  const [followUpAt, setFollowUpAt] = useState(job.followUpAt ? job.followUpAt.slice(0, 10) : '');

  useEffect(() => {
    setNotes(job.notes ?? '');
    setContactName(job.contactName ?? '');
    setFollowUpAt(job.followUpAt ? job.followUpAt.slice(0, 10) : '');
  }, [job._id, job.notes, job.contactName, job.followUpAt]);

  const breakdown = [
    { label: 'Skills', value: job.aiMatch?.breakdown?.skills, fallback: score },
    { label: 'Experience', value: job.aiMatch?.breakdown?.experience, fallback: score },
    { label: 'Role fit', value: job.aiMatch?.breakdown?.roleFit, fallback: score },
    { label: 'Location', value: job.aiMatch?.breakdown?.location, fallback: 70 },
  ];
  const actionPlan = job.aiMatch?.actionPlan;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl border border-slate-200 p-6 overflow-hidden"
        style={{ background: `radial-gradient(ellipse at 25% 0%, ${text}12 0%, transparent 55%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${text}60,transparent)` }} />

        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider', rec.class)}>
                {rec.label}
              </span>
              {job.status !== 'new' && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider"
                  style={{ color: statusMeta.color, background: statusMeta.bg, borderColor: statusMeta.border }}
                >
                  {statusMeta.label}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider"
                style={{ color: priorityMeta.color, background: `${priorityMeta.color}12`, borderColor: `${priorityMeta.color}33` }}
              >
                <PriorityIcon className="w-3 h-3" />
                {priorityMeta.label}
              </span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-ink-primary leading-tight mb-1.5">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
              <p className="text-[14px] font-bold" style={{ color: text }}>
                {job.company?.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(job.location?.raw || job.location?.city) && (
                <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                  <MapPin className="w-3 h-3" />{job.location.raw || job.location.city}
                </span>
              )}
              {job.employmentType && (
                <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                  <Briefcase className="w-3 h-3" />{job.employmentType}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
              </span>
            </div>
          </div>
          <ScoreRing score={score} size={72} />
        </div>
      </div>

      {/* AI Reasoning */}
      {job.aiMatch?.reasoning && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-600/6 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' }} />
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">AI Analysis</span>
          </div>
          <p className="text-[13px] text-ink-secondary leading-relaxed">{job.aiMatch.reasoning}</p>
        </div>
      )}

      {/* Match breakdown */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Match Breakdown</span>
          </div>
          <span className="text-[11px] text-ink-muted">
            {Math.round((job.aiMatch?.confidence ?? 0.7) * 100)}% confidence
          </span>
        </div>
        <div className="space-y-3">
          {breakdown.map(item => {
            const value = clampPercent(item.value, item.fallback);
            const bar = scoreColor(value).text;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-ink-secondary">{item.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: bar }}>{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: bar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action plan */}
      {(actionPlan?.nextStep || actionPlan?.resumeKeywords?.length || actionPlan?.resumeSuggestions?.length || actionPlan?.coverLetterAngle) && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Apply Plan</span>
          </div>
          {actionPlan?.nextStep && (
            <p className="text-[13px] text-ink-secondary leading-relaxed mb-3">{actionPlan.nextStep}</p>
          )}
          {(actionPlan?.resumeKeywords?.length ?? 0) > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Resume keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {actionPlan!.resumeKeywords!.map((keyword, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-ink-secondary">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(actionPlan?.resumeSuggestions?.length ?? 0) > 0 && (
            <div className="space-y-1.5 mb-3">
              {actionPlan!.resumeSuggestions!.map((suggestion, i) => (
                <div key={i} className="flex gap-2 text-[12px] text-ink-secondary leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
          {actionPlan?.coverLetterAngle && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Cover letter angle</p>
              <p className="text-[12px] text-ink-secondary leading-relaxed">{actionPlan.coverLetterAngle}</p>
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {((job.aiMatch?.matchedSkills?.length ?? 0) > 0 || (job.aiMatch?.missingSkills?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(job.aiMatch?.matchedSkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Matched ({job.aiMatch!.matchedSkills!.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.aiMatch!.matchedSkills!.map((s, i) => <SkillChip key={i} label={s} type="match" />)}
              </div>
            </div>
          )}
          {(job.aiMatch?.missingSkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Missing ({job.aiMatch!.missingSkills!.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.aiMatch!.missingSkills!.map((s, i) => <SkillChip key={i} label={s} type="miss" />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Tracking */}
      <div>
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2.5">Track Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <StatusPill
              key={s}
              status={s}
              active={job.status === s}
              onClick={() => onStatusChange(s)}
              loading={statusLoading}
            />
          ))}
        </div>
      </div>

      {/* Application workspace */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <NotebookPen className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Application Workspace</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-[11px] text-ink-muted mb-1.5 block">Contact</span>
            <input
              className="input h-9 text-[12px]"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Recruiter or referral"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-ink-muted mb-1.5 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Follow-up date
            </span>
            <input
              type="date"
              className="input h-9 text-[12px]"
              value={followUpAt}
              onChange={e => setFollowUpAt(e.target.value)}
            />
          </label>
        </div>
        <textarea
          className="input min-h-[84px] text-[12px] resize-none"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add application notes, referral details, or interview prep points."
        />
        <button
          onClick={() => onSaveDetails({ notes, contactName, followUpAt })}
          disabled={statusLoading}
          className="btn-secondary mt-3 h-9 px-4 text-[12px] gap-2"
        >
          {statusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Save Details
        </button>
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Description</span>
          </div>
          <div className="text-[13px] text-ink-secondary leading-relaxed whitespace-pre-line rounded-xl bg-slate-50 border border-slate-200 p-4">
            {truncate(job.description, 1200)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary relative z-20 flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold"
          >
            <ExternalLink className="w-4 h-4" />
            Apply Now
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}
        <button
          onClick={onDelete}
          disabled={deleteLoading}
          className="p-2.5 rounded-xl border border-slate-200 text-ink-muted hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 transition-all"
          title="Remove job"
        >
          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE JOB DETAIL SCREEN  — full page replacement on small screens
───────────────────────────────────────────────────────────────────────────── */
function MobileDetailScreen({
  job,
  onBack,
  onStatusChange,
  onSaveDetails,
  onDelete,
  statusLoading,
  deleteLoading,
}: {
  job: Job;
  onBack: () => void;
  onStatusChange: (s: Status) => void;
  onSaveDetails: (details: JobDetailsUpdate) => void;
  onDelete: () => void;
  statusLoading: boolean;
  deleteLoading: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* back bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-card sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Jobs
        </button>
        <span className="text-[13px] font-semibold text-ink-primary truncate">{job.title}</span>
      </div>
      <div className="flex-1 px-4 py-5">
        <DetailContent
          job={job}
          onStatusChange={onStatusChange}
          onSaveDetails={onSaveDetails}
          onDelete={onDelete}
          statusLoading={statusLoading}
          deleteLoading={deleteLoading}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CARDS
───────────────────────────────────────────────────────────────────────────── */
function SkeletonCards() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl shimmer" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */
function SavedSearchPanel({
  searches,
  loading,
  onCreate,
  onBrowse,
  onMatch,
  onToggleDigest,
  onSetDefault,
  onDelete,
  busyId,
  creating,
}: {
  searches: SavedSearch[];
  loading: boolean;
  onCreate: (payload: { name: string; queries: string[]; location: string }) => void;
  onBrowse: (search?: SavedSearch) => void;
  onMatch: (search?: SavedSearch) => void;
  onToggleDigest: (search: SavedSearch) => void;
  onSetDefault: (search: SavedSearch) => void;
  onDelete: (search: SavedSearch) => void;
  busyId?: string;
  creating: boolean;
}) {
  const [draft, setDraft] = useState({
    name: '',
    queries: 'Frontend Developer, React Developer',
    location: 'India',
  });

  const submit = () => {
    const queries = draft.queries.split(',').map(q => q.trim()).filter(Boolean);
    if (!draft.name.trim() || queries.length === 0) {
      toast.error('Add a search name and at least one keyword');
      return;
    }
    onCreate({ name: draft.name.trim(), queries, location: draft.location.trim() || 'India' });
    setDraft({ name: '', queries: 'Frontend Developer, React Developer', location: draft.location || 'India' });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-card p-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListFilter className="w-4 h-4 text-brand-600" />
            <h2 className="font-display text-lg font-bold text-ink-primary">Saved search profiles</h2>
          </div>
          <p className="text-[13px] text-ink-muted">
            Browse jobs before uploading a resume, then reuse the same searches for AI matching and daily digests.
          </p>
        </div>
        <button onClick={() => onBrowse()} className="btn-secondary gap-2 px-4 py-2 text-[12px] font-bold self-start">
          <Globe className="w-4 h-4" /> Browse Default Jobs
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_1.2fr_0.8fr_auto] gap-2">
        <input className="input h-10" placeholder="Search name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        <input className="input h-10" placeholder="Keywords, comma separated" value={draft.queries} onChange={e => setDraft({ ...draft, queries: e.target.value })} />
        <input className="input h-10" placeholder="Location" value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} />
        <button onClick={submit} disabled={creating} className="btn-primary h-10 px-4 gap-2 text-[12px] font-bold disabled:opacity-60">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save
        </button>
      </div>

      {loading ? (
        <div className="h-16 rounded-xl shimmer" />
      ) : searches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[13px] text-ink-muted">
          No saved searches yet. Create one to personalize browsing and the 8 AM digest.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {searches.map(search => {
            const isBusy = busyId === search._id;
            return (
              <div key={search._id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink-primary truncate">{search.name}</h3>
                      {search.isDefault && <span className="badge bg-blue-50 text-brand-700 border-blue-200">Default</span>}
                    </div>
                    <p className="text-[12px] text-ink-muted mt-1 truncate">{search.queries.join(', ')} · {search.location}</p>
                    <p className="text-[11px] text-ink-muted mt-1">
                      Last run: {search.lastRunAt ? timeAgo(search.lastRunAt) : 'Not run yet'} · {search.lastResultCount ?? 0} results
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleDigest(search)}
                    className={cn('p-2 rounded-lg border transition-colors', search.digestEnabled ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200')}
                    title={search.digestEnabled ? 'Digest enabled' : 'Digest disabled'}
                  >
                    {search.digestEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button onClick={() => onBrowse(search)} disabled={isBusy} className="btn-secondary px-3 py-1.5 gap-1.5 text-[11px] font-bold disabled:opacity-60">
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    Browse
                  </button>
                  <button onClick={() => onMatch(search)} disabled={isBusy} className="btn-primary px-3 py-1.5 gap-1.5 text-[11px] font-bold disabled:opacity-60">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Match
                  </button>
                  {!search.isDefault && (
                    <button onClick={() => onSetDefault(search)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Default
                    </button>
                  )}
                  <button onClick={() => onDelete(search)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyJobs({ onSearch, loading }: { onSearch: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mb-4">
        <Target className="w-8 h-8 text-brand-400" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink-primary mb-1.5">No matches yet</h3>
      <p className="text-ink-muted text-[13px] max-w-xs leading-relaxed mb-5">
        Upload your resume and run a search — AI will match every posting against your skills.
      </p>
      <button
        onClick={onSearch}
        disabled={loading}
        className="btn-primary gap-2 px-5 py-2.5 text-[13px]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Search Jobs Now
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function JobsPage() {
  const queryClient = useQueryClient();

  // core state — intentionally minimal
  const [page, setPage]               = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobileDetail, setMobileDetail] = useState(false);
  const [filters, setFilters] = useState<Filters>({ search: '', minScore: '', status: '' });
  const [runningSearchId, setRunningSearchId] = useState<string | undefined>();

  const updateFilter = useCallback((k: keyof Filters, v: string) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', minScore: '', status: '' });
    setPage(1);
  }, []);

  /* ── queries ──────────────────────────────────────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', page, filters],
    queryFn: () => jobsApi.list({
      page, limit: 15,
      ...(filters.minScore && { minScore: filters.minScore }),
      ...(filters.status   && { status:   filters.status }),
      ...(filters.search   && { search:   filters.search }),
    }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: savedSearchData, isLoading: savedSearchLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchApi.list().then(r => r.data.data.searches as SavedSearch[]),
  });

  const searchMutation = useMutation({
    mutationFn: (search?: SavedSearch) => jobsApi.search(search ? {
      savedSearchId: search._id,
      queries: search.queries,
      location: search.location,
    } : undefined),
    onSuccess: res => {
      const d = res.data.data;
      toast.success(`Found ${d.saved} new jobs! Avg match: ${d.avgMatchScore}%`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setRunningSearchId(undefined);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Search failed');
      setRunningSearchId(undefined);
    },
  });

  const browseMutation = useMutation({
    mutationFn: (search?: SavedSearch) => jobsApi.browse(search ? {
      savedSearchId: search._id,
      queries: search.queries,
      location: search.location,
    } : undefined),
    onSuccess: res => {
      const d = res.data.data;
      toast.success(`Saved ${d.saved} browsed jobs`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setRunningSearchId(undefined);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Browse failed');
      setRunningSearchId(undefined);
    },
  });

  const createSavedSearchMutation = useMutation({
    mutationFn: (payload: { name: string; queries: string[]; location: string }) => savedSearchApi.create({ ...payload, digestEnabled: true }),
    onSuccess: () => {
      toast.success('Saved search created');
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not save search'),
  });

  const updateSavedSearchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavedSearch> }) => savedSearchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Saved search updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not update search'),
  });

  const deleteSavedSearchMutation = useMutation({
    mutationFn: (id: string) => savedSearchApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Saved search deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not delete search'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & JobDetailsUpdate) => jobsApi.updateStatus(id, payload as any),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(prev => prev ? { ...prev, ...vars, status: vars.status ?? prev.status } : prev);
      toast.success(vars.status ? 'Status updated' : 'Details saved');
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

  const jobs       = (data?.data ?? []) as Job[];
  const pagination = data?.pagination as { total: number; pages: number; hasPrev: boolean; hasNext: boolean } | undefined;
  const savedSearches = savedSearchData ?? [];

  const handleJobClick = useCallback((job: Job) => {
    if (selectedJob?._id === job._id) {
      setSelectedJob(null);
      setMobileDetail(false);
    } else {
      setSelectedJob(job);
      // Only show mobile detail if viewport is small (not lg)
      const isSmallViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
      setMobileDetail(isSmallViewport);
    }
  }, [selectedJob?._id]);

  const handleBack = useCallback(() => {
    setMobileDetail(false);
  }, []);

  const handleStatusChange = useCallback((status: Status) => {
    if (!selectedJob) return;
    statusMutation.mutate({ id: selectedJob._id, status });
  }, [selectedJob, statusMutation]);

  const handleSaveDetails = useCallback((details: JobDetailsUpdate) => {
    if (!selectedJob) return;
    statusMutation.mutate({ id: selectedJob._id, status: selectedJob.status, ...details });
  }, [selectedJob, statusMutation]);

  const handleDelete = useCallback(() => {
    if (!selectedJob) return;
    deleteMutation.mutate(selectedJob._id);
  }, [selectedJob, deleteMutation]);

  const handleBrowseSearch = useCallback((search?: SavedSearch) => {
    setRunningSearchId(search?._id || 'default');
    browseMutation.mutate(search);
  }, [browseMutation]);

  const handleMatchSearch = useCallback((search?: SavedSearch) => {
    setRunningSearchId(search?._id || 'default');
    searchMutation.mutate(search);
  }, [searchMutation]);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Mobile: show detail screen instead of list ─────────────────── */
  if (isMobileDetail && selectedJob) {
    return (
      <div className="lg:hidden">
        <MobileDetailScreen
          job={selectedJob}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
          onSaveDetails={handleSaveDetails}
          onDelete={handleDelete}
          statusLoading={statusMutation.isPending}
          deleteLoading={deleteMutation.isPending}
        />
      </div>
    );
  }

  /* ── Desktop + mobile list view ─────────────────────────────────── */
  return (
    <div className="space-y-5 pb-12">
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Intel Feed</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink-primary">Job Matches</h1>
          <p className="text-ink-muted text-[13px] mt-1">
            AI-matched against your resume · {(pagination?.total ?? 0).toLocaleString()} jobs indexed
          </p>
        </div>

        <button
          onClick={() => handleMatchSearch()}
          disabled={searchMutation.isPending}
          className="btn-primary gap-2 px-5 py-2.5 text-[13px] font-bold self-start disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {searchMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning LinkedIn…</>
            : <><RefreshCw className="w-4 h-4" />Search New Jobs</>
          }
        </button>
      </div>

      {searchMutation.isPending && <SearchBanner />}

      <SavedSearchPanel
        searches={savedSearches}
        loading={savedSearchLoading}
        onCreate={payload => createSavedSearchMutation.mutate(payload)}
        onBrowse={handleBrowseSearch}
        onMatch={handleMatchSearch}
        onToggleDigest={search => updateSavedSearchMutation.mutate({ id: search._id, data: { digestEnabled: !search.digestEnabled } })}
        onSetDefault={search => updateSavedSearchMutation.mutate({ id: search._id, data: { isDefault: true } })}
        onDelete={search => deleteSavedSearchMutation.mutate(search._id)}
        busyId={runningSearchId}
        creating={createSavedSearchMutation.isPending}
      />

      {/* ── FILTER BAR ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-card px-4 py-3.5">
        <FilterBar
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
          total={pagination?.total ?? 0}
          fetching={isFetching && !isLoading}
        />
      </div>

      {/* ── MAIN CONTENT: list + optional detail panel ──────────────── */}
      <div className={cn(
        'grid gap-5 items-start',
        selectedJob ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1',
      )}>

        {/* JOB LIST */}
        <div className="min-w-0 space-y-2">
          {isLoading ? (
            <SkeletonCards />
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-card">
              <EmptyJobs onSearch={() => handleMatchSearch()} loading={searchMutation.isPending} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {jobs.map(job => (
                  <div key={job._id} className="relative z-0">
                    <JobCard
                      job={job}
                      active={selectedJob?._id === job._id}
                      onClick={() => handleJobClick(job)}
                    />
                  </div>
                ))}
              </div>
              <Pagination
                total={pagination?.total ?? 0}
                pages={pagination?.pages ?? 1}
                page={page}
                onPage={handlePageChange}
              />
            </>
          )}
        </div>

        {/* DETAIL PANEL — desktop only, no fixed/sticky positioning */}
        {selectedJob && (
          <div className="hidden lg:block min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-card p-6 relative z-20">
              {/* close button */}
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <DetailContent
                job={selectedJob}
                onStatusChange={handleStatusChange}
                onSaveDetails={handleSaveDetails}
                onDelete={handleDelete}
                statusLoading={statusMutation.isPending}
                deleteLoading={deleteMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
