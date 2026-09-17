const DashboardHeader = ({ greeting, teacherName, dateLabel }) => {
  return (
    <section className="teacher-welcome-card relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 shadow-sm sm:px-7 animate-slide-up">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--color-primary)]/[0.06]" />
      <div className="absolute right-24 top-8 h-24 w-24 rounded-full bg-[var(--color-info)]/[0.04]" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Teacher workspace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {greeting}, {teacherName} <span aria-hidden="true">&#9995;</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">Here&apos;s what&apos;s happening with your classes today.</p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 px-3.5 py-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <span className="text-xs font-medium text-[var(--color-text)]">{dateLabel}</span>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;