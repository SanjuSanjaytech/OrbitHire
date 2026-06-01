import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 55) return 'text-amber-400';
  if (score >= 35) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15 border-emerald-500/30';
  if (score >= 55) return 'bg-amber-500/15 border-amber-500/30';
  if (score >= 35) return 'bg-orange-500/15 border-orange-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Highly Recommended';
  if (score >= 55) return 'Recommended';
  if (score >= 35) return 'Consider';
  return 'Not Recommended';
}

export function getRecommendationBadge(rec: string) {
  const map: Record<string, { label: string; class: string }> = {
    highly_recommended: { label: '⭐ Top Match',       class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    recommended:        { label: '✅ Recommended',     class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    consider:           { label: '🤔 Consider',        class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    not_recommended:    { label: '❌ Low Match',        class: 'bg-red-500/20 text-red-300 border-red-500/30' },
  };
  return map[rec] || { label: rec, class: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
}

export function formatDate(date: string | Date): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy, hh:mm a');
  } catch {
    return String(date);
  }
}

export function timeAgo(date: string | Date): string {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return String(date);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}
