import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

export default function StatCard({
  title, value, subtitle, icon: Icon,
  iconColor = 'text-brand-400',
  trend, loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="shimmer h-4 w-24 rounded mb-3" />
        <div className="shimmer h-8 w-16 rounded mb-2" />
        <div className="shimmer h-3 w-32 rounded" />
      </div>
    );
  }

  return (
    <div className="card hover:border-brand-500/30 transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <div className={cn('p-2 rounded-lg bg-white/5', iconColor.replace('text-', 'text-').replace('400', '500/10'))}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
