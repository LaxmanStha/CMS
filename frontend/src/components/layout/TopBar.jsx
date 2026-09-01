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
  Menu,
  Search
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
    success: <CheckCircle className="w-5 h-5 text-success" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-info" />,
  };

  const iconBtn =
    "relative flex items-center justify-center w-10 h-10 rounded-xl border border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary hover:border-border transition-all duration-200";

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  const title = resolveTitle(location.pathname, user?.role);

  return (
    <header className="sticky top-0 z-40 bg-[#0D1117]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2.5 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page Title */}
        <div className="hidden sm:block min-w-0">
          <h1 className="font-display text-[17px] font-bold text-text-primary leading-tight truncate">{title}</h1>
          <p className="text-[11px] text-amber-500/70 font-medium capitalize mt-0.5">{user?.role} Portal</p>
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden md:block w-64 lg:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 md:ml-0 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setProfileOpen(false);
              }}
              className={cn(iconBtn, notificationsOpen && "bg-white/5 text-text-primary border-border")}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0D1117]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-white/[0.06] bg-[#111827]/95 backdrop-blur-xl shadow-2xl shadow-black/40 py-2 z-50 animate-dropdown">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-text-primary text-sm">Notifications</h3>
                    {live && (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-dot" />
                        LIVE
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-secondary">
                      <Bell className="mx-auto mb-3 h-10 w-10 text-border" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "group flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]",
                          !notif.read && "bg-amber-500/[0.03]",
                          newIds.includes(notif.id) && "animate-notif-in"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex-shrink-0",
                            notif.type === "success" && "text-success",
                            notif.type === "warning" && "text-warning",
                            notif.type === "error" && "text-danger",
                            notif.type === "info" && "text-info"
                          )}
                        >
                          {notificationIcons[notif.type]}
                        </div>
                        <button
                          onClick={() => markRead(notif.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className={cn("text-sm font-medium text-text-primary", !notif.read && "font-semibold")}>
                            {notif.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-text-secondary">{notif.message}</p>
                          <p className="mt-1 text-[11px] text-text-secondary/60">{relativeTime(notif.createdAt)}</p>
                        </button>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                          <button
                            onClick={() => remove(notif.id)}
                            className="rounded-lg p-1 text-text-secondary/40 opacity-0 transition-all hover:bg-white/5 hover:text-danger group-hover:opacity-100"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-white/[0.06] px-4 py-3">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    View all notifications
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-white/[0.06] md:block mx-1" aria-hidden="true" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotificationsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-1.5 transition-all duration-200 hover:bg-white/5",
                profileOpen && "bg-white/5"
              )}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 text-xs font-bold ring-1 ring-amber-500/20">
                {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full rounded-xl object-cover" /> : getInitials(user?.name || "U")}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[13px] font-medium text-text-primary">{user?.name}</p>
                <p className="text-[11px] capitalize text-text-tertiary">{user?.role}</p>
              </div>
              <ChevronDown
                className="hidden h-4 w-4 text-text-tertiary transition-transform duration-200 md:block"
                style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.06] bg-[#111827]/95 backdrop-blur-xl shadow-2xl shadow-black/40 py-2 z-50 animate-dropdown">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="font-medium text-text-primary text-sm">{user?.name}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                  <p className="mt-1 text-[11px] capitalize text-amber-500/70">{user?.role} account</p>
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
                <div className="border-t border-white/[0.06] py-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
