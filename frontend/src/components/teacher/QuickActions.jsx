import { Link } from 'react-router-dom';
import { ChevronRight, CalendarCheck, FileText, Users, BookOpen } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    { to: '/faculty/attendance', icon: CalendarCheck, label: 'Take Attendance', primary: true },
    { to: '/faculty/assignments', icon: FileText, label: 'Add Assignment', primary: false },
    { to: '/faculty/students', icon: Users, label: 'View Students', primary: false },
    { to: '/faculty/courses', icon: BookOpen, label: 'View Courses', primary: false },
  ];

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Quick Actions</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Jump into your daily workflow</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all duration-150 ${
                action.primary
                  ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 text-[var(--color-text)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-2)]'
              } animate-slide-up`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Icon className={`h-5 w-5 ${action.primary ? '' : 'text-[var(--color-primary)]'}`} />
              <span>{action.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;