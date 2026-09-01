import { memo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

const StatCard = memo(({
  title,
  value,
  icon: Icon,
  iconClass = 'bg-primary/10 text-primary',
  trend,
  trendUp = true,
  trendLabel,
  description,
  action,
  loading = false,
  format,
}) => (
  <Card className="p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {value !== undefined && (
          <p className="dashboard-number mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            {loading ? <span className="text-text-tertiary">—</span> : format ? format(value) : value}
          </p>
        )}
        {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
        {trend && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs font-semibold',
              trendUp ? 'text-success' : 'text-danger'
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
            {trendLabel && <span className="font-normal text-text-secondary">{trendLabel}</span>}
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
