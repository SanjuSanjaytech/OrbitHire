'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { cn, getRecommendationBadge, timeAgo, truncate } from '@/lib/utils';
import {
  Search, RefreshCw, MapPin, Clock, Briefcase, ExternalLink,
  ChevronLeft, ChevronRight, Trash2, X, Radio, Target,
  ChevronDown, BookmarkPlus, CheckCircle2, XCircle,
  MessageSquare, Trophy, ArrowUpRight, Sparkles, Building2,
  Globe, AlertCircle, Loader2, Zap, ArrowLeft,
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
  aiMatch?: {
    score: number;
    reasoning?: string;
    recommendation?: string;
    matchedSkills?: string[];
    missingSkills?: string[];
  };
}

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
          className="input pl-9 h-9 text-[13px] w-full bg-elevated border-white/[0.07] placeholder:text-ink-muted/50"
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
          className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-white/[0.07] min-w-[130px] cursor-pointer"
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
          className="input h-9 pl-3 pr-8 text-[12px] appearance-none bg-elevated border-white/[0.07] min-w-[120px] cursor-pointer"
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
          className="h-9 px-3 rounded-xl text-[12px] font-semibold text-ink-muted hover:text-red-400 border border-white/[0.07] hover:border-red-500/20 hover:bg-red-500/5 transition-all flex items-center gap-1"
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
        <p className="text-[13px] font-bold text-brand-300">Scanning LinkedIn for new jobs…</p>
        <p className="text-[11px] text-ink-muted mt-0.5">Apify is scraping postings · AI is matching against your resume · 2–5 min</p>
      </div>
      <div className="hidden sm:block w-28 h-1.5 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
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
          : 'border-white/[0.06] bg-card hover:border-white/[0.12] hover:bg-white/[0.025]',
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
          className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/[0.14] hover:text-ink-primary transition-all"
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
                    : 'border-white/[0.07] text-ink-muted hover:border-white/[0.14] hover:text-ink-primary',
                )}
              >
                {n}
              </button>
            )
        )}
        <button
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
          className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/[0.14] hover:text-ink-primary transition-all"
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
  onDelete,
  statusLoading,
  deleteLoading,
}: {
  job: Job;
  onStatusChange: (s: Status) => void;
  onDelete: () => void;
  statusLoading: boolean;
  deleteLoading: boolean;
}) {
  const score     = job.aiMatch?.score ?? 0;
  const { text }  = scoreColor(score);
  const rec = getRecommendationBadge(job.aiMatch?.recommendation ?? '');
  const statusMeta = STATUS_META[job.status] ?? STATUS_META.new;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl border border-white/[0.08] p-6 overflow-hidden"
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
                <span className="flex items-center gap-1.5 text-[11px] text-ink-muted px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <MapPin className="w-3 h-3" />{job.location.raw || job.location.city}
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

      {/* Description */}
      {job.description && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Description</span>
          </div>
          <div className="text-[13px] text-ink-secondary leading-relaxed whitespace-pre-line rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
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
          className="p-2.5 rounded-xl border border-white/[0.07] text-ink-muted hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 transition-all"
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
  onDelete,
  statusLoading,
  deleteLoading,
}: {
  job: Job;
  onBack: () => void;
  onStatusChange: (s: Status) => void;
  onDelete: () => void;
  statusLoading: boolean;
  deleteLoading: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* back bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-card sticky top-0 z-10">
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
    mutationFn: ({ id, status }: { id: string; status: Status }) => jobsApi.updateStatus(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(prev => prev ? { ...prev, status: vars.status } : prev);
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

  const jobs       = (data?.data ?? []) as Job[];
  const pagination = data?.pagination as { total: number; pages: number; hasPrev: boolean; hasNext: boolean } | undefined;

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

  const handleDelete = useCallback(() => {
    if (!selectedJob) return;
    deleteMutation.mutate(selectedJob._id);
  }, [selectedJob, deleteMutation]);

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
          onClick={() => searchMutation.mutate()}
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

      {/* ── FILTER BAR ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-card px-4 py-3.5">
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
            <div className="rounded-2xl border border-white/[0.06] bg-card">
              <EmptyJobs onSearch={() => searchMutation.mutate()} loading={searchMutation.isPending} />
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
            <div className="rounded-2xl border border-white/[0.08] bg-card p-6 relative z-20">
              {/* close button */}
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-white/5 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <DetailContent
                job={selectedJob}
                onStatusChange={handleStatusChange}
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