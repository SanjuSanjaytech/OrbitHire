import { cn } from '@/lib/utils';

export function BrandMark({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        className={cn('h-full w-full scale-[1.16] object-cover', imageClassName)}
      />
    </span>
  );
}
