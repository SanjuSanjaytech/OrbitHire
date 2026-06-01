'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import ScoreBadge from '@/components/ui/ScoreBadge';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Search, RefreshCw, MapPin, Clock, ExternalLink,
  Briefcase, Filter, ChevronLeft, ChevronRight,
  BookmarkPlus, CheckCircle2, Trash2, Building2,
} from 'lucide-react';
import { cn, getRecommendationBadge, timeAgo, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUSES = ['new', 'saved', 'applied', 'rejected', 'interview', 'offer'];

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    minScore: '',
    recommendation: '',
    status: '',
    search: '',
  });
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', page, filters],
    queryFn: () => jobsApi.list({
      page,
      limit: 15,
      ...(filters.minScore && { minScore: filters.minScore }),
      ...(filters.recommendation && { recommendation: filters.recommendation }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  // Search mutation (trigger Apify)
  const searchMutation = useMutation({
    mutationFn: () => jobsApi.search(),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Found ${d.saved} new jobs! Avg match: ${d.avgMatchScore}%`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Search failed. Check your Apify API key.');
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      jobsApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (selectedJob) setSelectedJob((prev: any) => ({ ...prev, status: statusMutation.variables?.status }));
      toast.success('Status updated');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(null);
      toast.success('Job removed');
    },
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination;

  const statusColors: Record<string, string> = {
    new:       'bg-gray-500/15 text-gray-300 border-gray-500/30',
    saved:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
    applied:   'bg-brand-500/15 text-brand-300 border-brand-500/30',
    rejected:  'bg-red-500/15 text-red-300 border-red-500/30',
    interview: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    offer:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Matches</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pagination?.total ?? 0} jobs found · AI-matched against your resume
          </p>
        </div>
        <button
          onClick={() => searchMutation.mutate()}
          disabled={searchMutation.isPending}
          className="btn-primary"
        >
          {searchMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching LinkedIn...
            </>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Search New Jobs</>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input pl-9 py-2"
              placeholder="Search company, role, location..."
              value={filters.search}
              onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            />
          </div>

          {/* Min Score */}
          <select
            className="input w-40 py-2"
            value={filters.minScore}
            onChange={e => { setFilters({ ...filters, minScore: e.target.value }); setPage(1); }}
          >
            <option value="">All Scores</option>
            <option value="75">Top Match (≥75%)</option>
            <option value="55">Good (≥55%)</option>
            <option value="35">Fair (≥35%)</option>
          </select>

          {/* Status */}
          <select
            className="input w-36 py-2"
            value={filters.status}
            onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          >
            <option value="">All Status</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Clear */}
          {(filters.search || filters.minScore || filters.status || filters.recommendation) && (
            <button
              onClick={() => { setFilters({ minScore: '', recommendation: '', status: '', search: '' }); setPage(1); }}
              className="btn-ghost text-xs"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Search Progress Banner */}
      {searchMutation.isPending && (
        <div className="card border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium text-brand-300">Scraping LinkedIn jobs via Apify...</p>
              <p className="text-xs text-gray-400 mt-0.5">This may take 2–5 minutes. AI is analyzing each job against your resume.</p>
            </div>
          </div>
        </div>
      )}

      <div className={cn('grid gap-6', selectedJob ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1')}>
        {/* Job List */}
        <div className={cn('space-y-3', selectedJob ? 'lg:col-span-2' : '')}>
          {isLoading ? (
            <PageSpinner />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try searching for new jobs or adjust your filters"
              action={
                <button onClick={() => searchMutation.mutate()} className="btn-primary text-sm" disabled={searchMutation.isPending}>
                  <Search className="w-4 h-4" /> Search Jobs Now
                </button>
              }
            />
          ) : (
            jobs.map((job: any) => {
              const rec = getRecommendationBadge(job.aiMatch?.recommendation);
              return (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(selectedJob?._id === job._id ? null : job)}
                  className={cn(
                    'card cursor-pointer transition-all duration-150 hover:border-brand-500/40',
                    selectedJob?._id === job._id && 'border-brand-500/60 shadow-glow'
                  )}
                >
                  <div className="flex gap-3">
                    {/* Score */}
                    <div className="flex-shrink-0 pt-1">
                      <ScoreBadge score={job.aiMatch?.score ?? 0} size="sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-100 truncate">{job.title}</h3>
                          <p className="text-xs text-brand-400 mt-0.5">{job.company?.name}</p>
                        </div>
                        <span className={cn('badge flex-shrink-0 text-xs', rec.class)}>{rec.label}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location?.raw || job.location?.city || 'India'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(job.postedAt)}
                        </span>
                        {job.status !== 'new' && (
                          <span className={cn('badge text-xs', statusColors[job.status])}>
                            {job.status}
                          </span>
                        )}
                      </div>

                      {/* Matched skills preview */}
                      {job.aiMatch?.matchedSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.aiMatch.matchedSkills.slice(0, 4).map((s: string, i: number) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                              {s}
                            </span>
                          ))}
                          {job.aiMatch.matchedSkills.length > 4 && (
                            <span className="text-xs text-gray-500">+{job.aiMatch.matchedSkills.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="btn-ghost py-1.5 px-2 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-ghost py-1.5 px-2 text-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Detail Panel */}
        {selectedJob && (
          <div className="lg:col-span-3 card animate-slide-up sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedJob.title}</h2>
                <p className="text-brand-400 font-medium">{selectedJob.company?.name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ScoreBadge score={selectedJob.aiMatch?.score ?? 0} size="md" showLabel />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedJob.location?.raw || 'India'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(selectedJob.postedAt)}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{selectedJob.employmentType}</span>
            </div>

            {/* AI Analysis */}
            {selectedJob.aiMatch?.reasoning && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mb-5">
                <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">AI Analysis</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedJob.aiMatch.reasoning}</p>
              </div>
            )}

            {/* Skills */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {selectedJob.aiMatch?.matchedSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✓ Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.aiMatch.matchedSkills.map((s: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedJob.aiMatch?.missingSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">✗ Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.aiMatch.missingSkills.map((s: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status selector */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2 font-medium">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate({ id: selectedJob._id, status: s })}
                    className={cn(
                      'badge text-xs cursor-pointer hover:opacity-80 transition-opacity',
                      selectedJob.status === s ? statusColors[s] : 'bg-surface-border text-gray-400 border-surface-border'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {truncate(selectedJob.description || '', 800)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-surface-border">
              {selectedJob.applyUrl && (
                <a
                  href={selectedJob.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Apply Now
                </a>
              )}
              <button
                onClick={() => deleteMutation.mutate(selectedJob._id)}
                className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm px-3"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
