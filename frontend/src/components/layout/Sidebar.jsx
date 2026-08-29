import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  FileText,
  CalendarDays,
  Building2,
  School,
  Wallet,
  BarChart3,
  Settings,
  ClipboardEdit,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAV } from '@/config/navigation';
import { cn } from '@/lib/utils';

const LABEL_ICONS = {
  Dashboard: LayoutDashboard,
  Students: Users,
  Faculty: GraduationCap,
  Attendance: CalendarCheck,
  Exams: FileText,
  Timetable: CalendarDays,
  Departments: Building2,
  Courses: Building2,
  Classrooms: School,
  Fees: Wallet,
  Reports: BarChart3,
  Settings: Settings,
  Grading: ClipboardEdit,
  Schedule: CalendarDays,
};

const Sidebar = ({ open = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = ROLE_NAV[user?.role] || [];
  // On desktop the rail expands on hover and collapses on mouse leave.
  const [hovered, setHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A] text-slate-300 transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:self-start lg:translate-x-0',
          'w-[280px]',
          hovered ? 'lg:!w-[280px]' : 'lg:w-[80px]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6',
            !hovered && 'lg:justify-center'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className={cn('font-display text-lg font-bold text-white', !hovered && 'lg:hidden')}>
              RapidStrik
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p
            className={cn(
              'px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500',
              !hovered && 'lg:hidden'
            )}
          >
            Menu
          </p>
          {items.map((item) => {
            const Icon = LABEL_ICONS[item.label] || LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={!hovered ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    !hovered && 'lg:justify-center lg:px-0',
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn('truncate', !hovered && 'lg:hidden')}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            title={!hovered ? 'Logout' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
              !hovered && 'lg:justify-center lg:px-0'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn(!hovered && 'lg:hidden')}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

