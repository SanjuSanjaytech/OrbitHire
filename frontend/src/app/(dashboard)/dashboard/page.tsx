'use client';

import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import StatCard from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Briefcase, TrendingUp, Star, Clock,
  CheckCircle, Search, FileSpreadsheet, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['job-stats'],
    queryFn: () => jobsApi.stats().then(r => r.data.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-recent'],
    queryFn: () => jobsApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }).then(r => r.data),
  });

  const stats = statsData?.summary;
  const topCompanies = statsData?.topCompanies || [];
  const recentJobs = jobsData?.data || [];

  const pieData = stats ? [
    { name: '≥75% Match', value: stats.highMatch   || 0 },
    { name: '55-74%',     value: stats.mediumMatch || 0 },
    { name: '<55%',       value: stats.lowMatch    || 0 },
  ].filter(d => d.value > 0) : [];

  const barData = topCompanies.slice(0, 6).map((c: any) => ({
    name: c._id?.split(' ')[0] || 'Unknown',
    jobs: c.count,
    score: Math.round(c.avgScore || 0),
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Here&apos;s your job hunting overview
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/jobs" className="btn-secondary text-sm">
            <Search className="w-4 h-4" />
            Search Jobs
          </Link>
          <Link href="/reports" className="btn-primary text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Export Report
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats?.total ?? '—'}
          subtitle="Jobs analyzed"
          icon={Briefcase}
          iconColor="text-brand-400"
          loading={isLoading}
        />
        <StatCard
          title="Avg Match Score"
          value={stats ? `${Math.round(stats.avgScore || 0)}%` : '—'}
          subtitle="Across all jobs"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          loading={isLoading}
        />
        <StatCard
          title="Top Matches"
          value={stats?.highMatch ?? '—'}
          subtitle="Score ≥75%"
          icon={Star}
          iconColor="text-amber-400"
          loading={isLoading}
        />
        <StatCard
          title="Applied"
          value={stats?.applied ?? '—'}
          subtitle="Applications sent"
          icon={CheckCircle}
          iconColor="text-sky-400"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <div className="card lg:col-span-3">
          <h2 className="section-title mb-6">Top Companies by Openings</h2>
          {isLoading ? (
            <div className="h-48 shimmer rounded-lg" />
          ) : barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="jobs" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">No data yet — run a job search first</p>
          )}
        </div>

        {/* Pie chart */}
        <div className="card lg:col-span-2">
          <h2 className="section-title mb-6">Match Distribution</h2>
          {isLoading ? (
            <div className="h-48 shimmer rounded-lg" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Recent Job Matches</h2>
          <Link href="/jobs" className="text-sm text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No jobs yet.</p>
            <Link href="/jobs" className="btn-primary mt-4 inline-flex text-sm">
              <Search className="w-4 h-4" /> Search Jobs Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job: any) => (
              <Link
                key={job._id}
                href={`/jobs`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-surface-border"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-border flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0">
                  {job.company?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company?.name} · {job.location?.raw || job.location?.city}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-bold ${job.aiMatch?.score >= 75 ? 'text-emerald-400' : job.aiMatch?.score >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
                    {job.aiMatch?.score ?? '—'}%
                  </span>
                  <span className="text-xs text-gray-600">{timeAgo(job.postedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/profile', icon: '📄', title: 'Upload Resume', desc: 'Parse your skills with AI' },
          { href: '/jobs',    icon: '🔍', title: 'Search Jobs',   desc: 'Find latest LinkedIn postings' },
          { href: '/reports', icon: '📊', title: 'Export Report', desc: 'Download Excel with all matches' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="card hover:border-brand-500/40 hover:shadow-glow transition-all duration-200 group cursor-pointer"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
