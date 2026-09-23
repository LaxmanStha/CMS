import { memo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

const StatCard = memo(({
  title,
  value,
  icon: Icon,
  iconClass = 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
  trend,
  trendUp = true,
  trendLabel,
  description,
  action,
  loading = false,
  format,
}) => (
  <Card className="p-6 hover:shadow-[var(--shadow-card)] transition-shadow duration-200">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-extrabold leading-tight text-[var(--color-text-primary)]">
            {loading ? <span className="text-[var(--color-text-muted)]">—</span> : format ? format(value) : value}
          </p>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
        </div>
        {description && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>}
        {trend && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs font-semibold',
              trendUp ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
            {trendLabel && <span className="font-normal text-[var(--color-text-muted)]">{trendLabel}</span>}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
      {Icon && (
        <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl', iconClass)}>
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  </Card>
));
StatCard.displayName = 'StatCard';

export default StatCard;