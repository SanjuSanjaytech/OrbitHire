'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  FileSpreadsheet, Download, Trash2, Plus,
  BarChart3, TrendingUp, Star, Clock,
} from 'lucide-react';
import { cn, formatDate, formatFileSize, downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ minScore: '0', status: '' });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list().then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate({
      minScore: parseInt(filters.minScore) || 0,
      ...(filters.status && { status: filters.status }),
    }),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Report generated: ${d.stats.totalJobs} jobs included`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => reportsApi.download(id),
    onMutate: (id) => setDownloadingId(id),
    onSuccess: (res, id) => {
      const report = reports.find((r: any) => r._id === id);
      downloadBlob(res.data, report?.fileName || 'report.xlsx');
      toast.success('Download started');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Download failed');
    },
    onSettled: () => setDownloadingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report deleted');
    },
  });

  const reports = data?.data || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">
            Generate Excel exports of your AI-matched job results
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <div className="card border-brand-500/30 animate-slide-up">
          <h2 className="font-semibold text-gray-200 mb-5">New Excel Report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Minimum Match Score</label>
              <select
                className="input"
                value={filters.minScore}
                onChange={e => setFilters({ ...filters, minScore: e.target.value })}
              >
                <option value="0">All jobs (0%+)</option>
                <option value="35">Fair matches (35%+)</option>
                <option value="55">Good matches (55%+)</option>
                <option value="75">Top matches (75%+)</option>
              </select>
            </div>
            <div>
              <label className="label">Job Status Filter</label>
              <select
                className="input"
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
              </select>
            </div>
          </div>

          {/* Report preview info */}
          <div className="bg-surface-muted rounded-lg p-4 mb-5 text-sm">
            <p className="text-gray-400">
              The Excel report will include:{' '}
              <span className="text-gray-200">Company, Role, Location, Posted Time, Match Score, Matched Skills, Missing Skills, AI Reasoning, Apply URL</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Plus a Summary sheet with statistics and top companies.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-primary w-full sm:w-auto"
            >
              {generateMutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><FileSpreadsheet className="w-4 h-4" /> Generate Excel</>
              )}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <PageSpinner />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports yet"
          description="Generate your first Excel report to export AI-matched job results"
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Generate First Report
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <div key={report._id} className="card hover:border-brand-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                     <p className="text-sm font-medium text-gray-200 break-all sm:truncate">{report.fileName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 break-words leading-relaxed">
                        Generated {formatDate(report.generatedAt)} ·{' '}
                        {formatFileSize(report.fileSize)} ·{' '}
                        <span className={cn(
                          'badge text-xs',
                          report.type === 'scheduled' ? 'bg-brand-500/15 text-brand-300 border-brand-500/30' : 'bg-gray-500/15 text-gray-300 border-gray-500/30'
                        )}>
                          {report.type}
                        </span>
                      </p>
                    </div>
                    {!report.available && (
                      <span className="badge text-xs bg-red-500/15 text-red-300 border-red-500/30 flex-shrink-0">Expired</span>
                    )}
                  </div>

                  {/* Stats chips */}
                  {report.stats && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <BarChart3 className="w-3 h-3" />
                        {report.stats.totalJobs} jobs
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <Star className="w-3 h-3" />
                        {report.stats.highMatch} top matches
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-brand-400">
                        <TrendingUp className="w-3 h-3" />
                        {report.stats.avgScore}% avg score
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Download className="w-3 h-3" />
                        {report.downloadCount} downloads
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                  {report.available && (
                    <button
                      onClick={() => downloadMutation.mutate(report._id)}
                      disabled={downloadingId === report._id}
                      className="btn-primary text-sm py-2"
                    >
                      {downloadingId === report._id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Download className="w-4 h-4" /> Download</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(report._id)}
                    className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="card bg-surface-muted/50 border-surface-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <Clock className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-200 mb-1">Daily Automatic Reports</p>
            <p className="text-sm text-gray-400">
              The scheduler runs every day at 8:00 AM IST. It scrapes fresh LinkedIn jobs,
              runs AI matching against your resume, and automatically generates an Excel report —
              all without any manual action. Enable it in your profile preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
