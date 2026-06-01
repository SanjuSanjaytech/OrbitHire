import { cn, getScoreColor, getScoreBg } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative flex items-center justify-center', sizes[size])}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="18" stroke="#1e1e35" strokeWidth="3" />
          <circle
            cx="22" cy="22" r="18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn('transition-all duration-700', getScoreColor(score))}
          />
        </svg>
        <span className={cn('font-bold relative z-10', getScoreColor(score), size === 'sm' ? 'text-xs' : '')}>
          {score}
        </span>
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', getScoreColor(score))}>
          {score >= 75 ? 'Top Match' : score >= 55 ? 'Good' : score >= 35 ? 'Fair' : 'Low'}
        </span>
      )}
    </div>
  );
}
