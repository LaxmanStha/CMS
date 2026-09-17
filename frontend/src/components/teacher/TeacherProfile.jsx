import { GraduationCap, Mail, BookOpen } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const TeacherProfile = ({ teacherName, email, department, coursesLabel }) => {
  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <GraduationCap className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Teacher Profile</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Authenticated account details</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-lg font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20">
          {getInitials(teacherName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{teacherName}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{email}</p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
            <GraduationCap className="h-3 w-3" />Teacher
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2.5 border-t border-[var(--color-border)] pt-4 text-xs">
        <div className="flex items-center gap-2.5 text-[var(--color-text-muted)]">
          <Mail className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span className="truncate">Department: <span className="font-medium text-[var(--color-text)]">{department}</span></span>
        </div>
        <div className="flex items-center gap-2.5 text-[var(--color-text-muted)]">
          <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span className="truncate">Courses: <span className="font-medium text-[var(--color-text)]">{coursesLabel}</span></span>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;