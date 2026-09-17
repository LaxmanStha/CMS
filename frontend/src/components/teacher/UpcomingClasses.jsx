import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Clock3, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusTone = (tone) => ({
  primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20',
  success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
  danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20',
  slate: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  muted: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
}[tone] || 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]');

const UpcomingClasses = ({ classes }) => {
  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Calendar className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Upcoming Classes</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">The next sessions from your timetable</p>
          </div>
        </div>
        <Link to="/timetable" className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          View full timetable
        </Link>
      </div>
      {classes.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((item, index) => (
            <div key={`${item.id || item.course}-${index}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-2)] animate-slide-up" style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{item.course}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{item.section || 'Assigned class'}</p>
                </div>
                <span className={cn('flex-shrink-0 border', statusTone(item.status.tone))}>{item.status.label}</span>
              </div>
              <div className="mt-4 space-y-2 text-xs text-[var(--color-text-muted)]">
                <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.date || '—'}</p>
                <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.time || '—'} to {item.endTime || 'not specified'}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.room || 'Room not specified'}</p>
                <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.studentCount ?? '—'} students</p>
              </div>
              <Link to={item.classroomId ? `/faculty/attendance?classroomId=${item.classroomId}` : '/faculty/attendance'} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                Take Attendance <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Calendar className="mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">No upcoming classes found</p>
          <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">Classes from the existing timetable will be listed here.</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingClasses;