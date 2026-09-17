import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock3, MapPin, Users, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusTone = (tone) => ({
  primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20',
  success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
  danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20',
  slate: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  muted: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
}[tone] || 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]');

const TodayClassRow = ({ item, onAttendance }) => {
  const status = item.status;
  return (
    <div className="teacher-class-row flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-2)] sm:flex-row sm:items-center animate-slide-up">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <BookOpen className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{item.course}</h3>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', statusTone(status.tone))}>{status.label}</span>
          </div>
          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
            {item.section || item.semester || 'Assigned class'}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.room || 'Room not specified'}</span>
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.time} <span className="text-[var(--color-text-muted)]">to</span> {item.endTime || 'not specified'}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[var(--color-primary)]" />{item.studentCount ?? '—'} students</span>
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <span className="text-[11px] text-[var(--color-text-muted)]">{item.day}</span>
        <Link
          to={onAttendance}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[var(--color-primary-hover)] hover:shadow-md animate-scale-in"
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Take Attendance
        </Link>
      </div>
    </div>
  );
};

const TodaysClasses = ({ classes, onAttendance }) => {
  return (
    <div className="xl:col-span-2">
      <div className="h-full">
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--color-text)]">Today&apos;s Classes</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Your scheduled sessions and quick attendance access</p>
              </div>
            </div>
            <Link to="/faculty/attendance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
              Open attendance <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {classes.length ? classes.map((item, index) => (
              <TodayClassRow
                key={`${item.id || item.course}-${index}`}
                item={item}
                onAttendance={onAttendance(item)}
              />
            )) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 py-12 px-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mb-3 h-9 w-9 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <p className="text-sm font-medium text-[var(--color-text)]">No classes scheduled today</p>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">Upcoming sessions will appear here from the existing timetable.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysClasses;