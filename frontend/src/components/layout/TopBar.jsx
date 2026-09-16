import { memo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Menu
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotificationsContext } from "@/context/NotificationsContext";
import { cn, getInitials, relativeTime } from "@/lib/utils";
import { ROLE_NAV, ROLE_HOME } from "@/config/navigation";

const TITLE_MAP = {
  "/admin": "Admin Dashboard",
  "/students": "Students",
  "/teachers": "Teachers",
  "/attendance": "Attendance",
  "/exams": "Examinations",
  "/timetable": "Timetable",
  "/classrooms": "Classrooms",
  "/fees": "Finance",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/faculty": "Faculty Dashboard",
  "/faculty/attendance": "Attendance",
  "/faculty/grading": "Grading",
  "/student": "Student Dashboard",
  "/student/attendance": "Attendance",
  "/student/grades": "Grades",
  "/student/timetable": "Timetable",
  "/accountant": "Accountant Dashboard",
  "/accountant/dues": "Dues",
  "/accountant/invoices": "Invoices",
  "/accountant/payments": "Payments",
};

const resolveTitle = (pathname, role) => {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  const exact = Object.keys(TITLE_MAP).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  if (exact) return TITLE_MAP[exact];
  const roleHome = ROLE_HOME[role];
  if (pathname === roleHome) return `${role ? role[0].toUpperCase() + role.slice(1) : ""} Dashboard`;
  const seg = pathname.split("/").filter(Boolean).pop();
  return seg ? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Dashboard";
};

const TopBar = memo(({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    newIds,
    live,
    markRead,
    markAllRead,
    remove,
  } = useNotificationsContext();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [, setNow] = useState(Date.now());

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const notificationIcons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
    warning: <AlertCircle className="w-5 h-5 text-[var(--color-warning)]" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--color-danger)]" />,
    info: <Info className="w-5 h-5 text-[var(--color-primary)]" />,
  };

  const iconBtn =
    "relative flex items-center justify-center w-10 h-10 rounded-xl border border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-all duration-200";

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  const title = resolveTitle(location.pathname, user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page Title */}
        <div className="hidden sm:block min-w-0">
          <h1 className="font-semibold text-[17px] text-[var(--color-text)] leading-tight truncate">{title}</h1>
          <p className="text-[11px] text-[var(--color-primary)] font-medium capitalize mt-0.5">{user?.role} Portal</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setProfileOpen(false);
              }}
              className={cn(iconBtn, notificationsOpen && "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]")}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[var(--color-border)] bg-white shadow-xl py-2 z-50">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--color-text)] text-sm">Notifications</h3>
                    {live && (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                      <Bell className="mx-auto mb-3 h-10 w-10 text-[var(--color-border)]" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "group flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface)]",
                          !notif.read && "bg-[var(--color-primary)]/[0.03]"
                        )}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {notificationIcons[notif.type]}
                        </div>
                        <button
                          onClick={() => markRead(notif.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className={cn("text-sm font-medium text-[var(--color-text)]", !notif.read && "font-semibold")}>
                            {notif.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{notif.message}</p>
                          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]/60">{relativeTime(notif.createdAt)}</p>
                        </button>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                          <button
                            onClick={() => remove(notif.id)}
                            className="rounded-lg p-1 text-[var(--color-text-muted)]/40 opacity-0 transition-all hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] group-hover:opacity-100"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                  >
                    View all notifications
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-[var(--color-border)] md:block mx-1" aria-hidden="true" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotificationsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-1.5 transition-all duration-200 hover:bg-[var(--color-surface)]",
                profileOpen && "bg-[var(--color-surface)]"
              )}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold ring-1 ring-[var(--color-primary)]/20">
                {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full rounded-xl object-cover" /> : getInitials(user?.name || "U")}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[13px] font-medium text-[var(--color-text)]">{user?.name}</p>
                <p className="text-[11px] capitalize text-[var(--color-text-muted)]">{user?.role}</p>
              </div>
              <ChevronDown
                className="hidden h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 md:block"
                style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-white shadow-xl py-2 z-50">
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <p className="font-medium text-[var(--color-text)] text-sm">{user?.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                  <p className="mt-1 text-[11px] capitalize text-[var(--color-primary)]">{user?.role} account</p>
                </div>
                <div className="py-1">
                  <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </div>
                <div className="border-t border-[var(--color-border)] py-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
TopBar.displayName = 'TopBar';

export default TopBar;