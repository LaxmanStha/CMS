import { Bell, Clock3, FileText, CalendarCheck, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS = {
  'attendance-submitted': CalendarCheck,
  'assignment-created': FileText,
  'assignment-updated': FileText,
  'notice-received': Bell,
  'class-completed': GraduationCap,
};

const ACTIVITY_TONES = {
  'attendance-submitted': 'success',
  'assignment-created': 'primary',
  'assignment-updated': 'warning',
  'notice-received': 'info',
  'class-completed': 'muted',
};

const RecentActivity = ({ activities }) => {
  const defaultIcon = Bell;

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Bell className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Activity</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Latest classroom activity</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {activities.length ? activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type] || activity.icon || defaultIcon;
          const tone = ACTIVITY_TONES[activity.type] || 'primary';
          const toneStyles = {
            primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
            success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
            warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
            info: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
            muted: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
          };
          return (
            <div key={activity.id} className="flex items-start gap-3 animate-slide-in-right" style={{ animationDelay: `${Math.min(activities.indexOf(activity) * 60, 300)}ms` }}>
              <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', toneStyles[tone])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug text-[var(--color-text)]">{activity.description}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                  <Clock3 className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">No recent activity</p>
            <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">Attendance submissions will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;