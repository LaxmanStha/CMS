import { memo, useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck,
  CalendarDays, Building2, School, Wallet, BarChart3, Settings,
  LogOut, X, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_NAV } from "@/config/navigation";
import { cn, getInitials } from "@/lib/utils";

const LABEL_ICONS = {
  Dashboard: LayoutDashboard, Students: Users, Faculty: GraduationCap, Teachers: GraduationCap,
  Attendance: CalendarCheck, Timetable: CalendarDays,
  Departments: Building2, Classrooms: School, Fees: Wallet,
  Reports: BarChart3, Settings: Settings,
  Schedule: CalendarDays,
};

const Sidebar = memo(({ open = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = ROLE_NAV[user?.role] || [];

  const handleLogout = useCallback(() => {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const navItems = useMemo(() => items, [items]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:self-start lg:translate-x-0",
          "bg-[var(--color-bg-card)] border-r w-[260px]",
          "border-[var(--color-border)]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-muted)]">
              <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
              <span className="sr-only">RapidStrik</span>
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="font-semibold text-[14px] text-[var(--color-text-primary)] tracking-tight whitespace-nowrap">RapidStrik</span>
              <span className="text-[10px] text-[var(--color-accent)] font-medium uppercase tracking-wider whitespace-nowrap">University</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors lg:hidden",
              "flex-shrink-0"
            )}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Main Menu
          </p>
          <div className="space-y-1">
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
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-semibold"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[var(--color-accent)]" />
                      )}

                      <div className={cn(
                        "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                        isActive ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                      )}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>

                      <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight className={cn(
                          "h-4 w-4 flex-shrink-0 ml-auto text-[var(--color-accent)]/50 transition-transform duration-150",
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

        <div className="flex-shrink-0 border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] text-sm font-bold">
              {getInitials(user?.name || "U")}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
              <p className="text-[10px] capitalize text-[var(--color-text-muted)]">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--color-danger)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-danger)] transition-all duration-200 hover:bg-[var(--color-danger)]/20 hover:text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogOut className="h-[16px] w-[16px] flex-shrink-0 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
            <span className="relative">
              Sign Out
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-white transition-all duration-200 group-hover:w-full" />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
});
Sidebar.displayName = 'Sidebar';

export default Sidebar;