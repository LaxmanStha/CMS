import { memo, useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck, FileText,
  CalendarDays, Building2, School, Wallet, BarChart3, Settings,
  ClipboardEdit, LogOut, X, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_NAV } from "@/config/navigation";
import { cn, getInitials } from "@/lib/utils";

const LABEL_ICONS = {
  Dashboard: LayoutDashboard, Students: Users, Faculty: GraduationCap, Teachers: GraduationCap,
  Attendance: CalendarCheck, Exams: FileText, Timetable: CalendarDays,
  Departments: Building2, Classrooms: School, Fees: Wallet,
  Reports: BarChart3, Settings: Settings, Grading: ClipboardEdit,
  Schedule: CalendarDays,
};

const Sidebar = memo(({ open = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = ROLE_NAV[user?.role] || [];

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const navItems = useMemo(() => items, [items]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[var(--color-border)] overflow-x-hidden transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:self-start lg:translate-x-0",
          "w-[256px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="font-semibold text-[14px] text-[var(--color-text)] tracking-tight whitespace-nowrap">RapidStrik</span>
              <span className="text-[10px] text-[var(--color-primary)] font-medium uppercase tracking-wider whitespace-nowrap">University</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors lg:hidden",
              "flex-shrink-0"
            )}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3">
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Main Menu
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = LABEL_ICONS[item.label] || LayoutDashboard;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors duration-150",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-primary)]" />
                      )}

                      <div className={cn(
                        "relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                        isActive ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : ""
                      )}>
                        <Icon className="h-[17px] w-[17px]" />
                      </div>

                      <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight className={cn(
                          "h-4 w-4 flex-shrink-0 ml-auto text-[var(--color-primary)]/50 transition-transform duration-150",
                          "rotate-0"
                        )} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">
              {getInitials(user?.name || "U")}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{user?.name}</p>
              <p className="text-[10px] capitalize text-[var(--color-text-muted)]">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors"
          >
            <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
              <LogOut className="h-[16px] w-[16px] flex-shrink-0" />
            </div>
            <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
});
Sidebar.displayName = 'Sidebar';

export default Sidebar;