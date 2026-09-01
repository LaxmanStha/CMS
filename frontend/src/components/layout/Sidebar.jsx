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
  const expanded = true;

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const navItems = useMemo(() => items, [items]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0D1117] text-text-secondary overflow-x-hidden transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:self-start lg:translate-x-0",
          "w-[256px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-transparent opacity-60" />

        <div
          className={cn(
            "relative flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3",
            "transition-all duration-200 ease-out"
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="h-5 w-5 transition-transform duration-200" />
              <div className="absolute -inset-1 rounded-xl bg-amber-500/20 blur-md -z-10" />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden opacity-100 max-w-[180px] translate-x-0">
              <span className="font-display text-[14px] font-bold text-white tracking-tight whitespace-nowrap">RapidStrik</span>
              <span className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider whitespace-nowrap">University</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-2 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors lg:hidden",
              "flex-shrink-0"
            )}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500/80 opacity-100 max-h-8">
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
                      "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium transition-colors duration-150 ease-out",
                      isActive
                        ? "bg-amber-500/[0.08] text-amber-400 font-semibold"
                        : "text-slate-400"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-500" />
                      )}

                      <div className={cn(
                        "relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-transparent",
                        isActive ? "bg-amber-500/15 text-amber-400" : ""
                      )}>
                        <Icon className="h-[17px] w-[17px]" />
                      </div>

                      <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap opacity-100 translate-x-0 max-w-[180px]">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight className={cn(
                          "h-4 w-4 flex-shrink-0 ml-auto text-amber-500/50 transition-transform duration-150",
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

        <div className="flex-shrink-0 border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 text-xs font-bold",
              "transition-all duration-200 ease-out"
            )}>
              {getInitials(user?.name || "U")}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden opacity-100 max-w-[140px] translate-x-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium text-slate-400"
          >
            <div className={cn(
              "relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            )}>
              <LogOut className="h-[16px] w-[16px] flex-shrink-0" />
            </div>
            <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap opacity-100 translate-x-0">
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
