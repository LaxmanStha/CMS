import { cn } from '@/lib/utils';

const StatTile = ({ icon: Icon, value, label, detail, tone = 'primary', loading = false }) => {
  const tones = {
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
  };

  return (
    <div className="teacher-stat-card group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-light)] hover:shadow-lg animate-slide-up">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.04] transition-transform duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-[var(--color-text)]">
            {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-[var(--color-surface-2)]" /> : value}
          </p>
          {detail && <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">{detail}</p>}
        </div>
        <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.primary)}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
};

export default StatTile;