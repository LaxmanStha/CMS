import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { cn, getInitials, relativeTime } from '@/lib/utils';
import { ROLE_NAV, ROLE_HOME } from '@/config/navigation';

const TITLE_MAP = {
  '/admin': 'Admin Dashboard',
  '/students': 'Students',
  '/faculty-list': 'Faculty',
  '/attendance': 'Attendance',
  '/exams': 'Examinations',
  '/timetable': 'Timetable',
  '/classrooms': 'Classrooms',
  '/fees': 'Finance',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
  '/faculty': 'Faculty Dashboard',
  '/faculty/attendance': 'Attendance',
  '/faculty/grading': 'Grading',
  '/student': 'Student Dashboard',
  '/student/attendance': 'Attendance',
  '/student/grades': 'Grades',
  '/student/timetable': 'Timetable',
  '/accountant': 'Accountant Dashboard',
  '/accountant/dues': 'Dues',
  '/accountant/invoices': 'Invoices',
  '/accountant/payments': 'Payments',
};

const resolveTitle = (pathname, role) => {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // Match by prefix (e.g. /admin/students)
  const exact = Object.keys(TITLE_MAP).find(
    (k) => k !== '/' && pathname.startsWith(k)
  );
  if (exact) return TITLE_MAP[exact];
  const roleHome = ROLE_HOME[role];
  if (pathname === roleHome) return `${role ? role[0].toUpperCase() + role.slice(1) : ''} Dashboard`;
  const seg = pathname.split('/').filter(Boolean).pop();
  return seg ? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Dashboard';
};

const TopBar = ({ onMenuClick }) => {
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    'relative flex items-center justify-center w-10 h-10 rounded-full border border-border text-text-secondary hover:bg-hover hover:text-text-primary transition-colors';

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  const title = resolveTitle(location.pathname, user?.role);

  return (
    <header className="navbar sticky top-0 z-40 bg-navbar border-b border-border">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2.5 text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:block">
          <h1 className="font-display text-xl font-bold text-text-primary leading-tight">{title}</h1>
          <p className="text-xs text-text-secondary capitalize">{user?.role} Portal</p>
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden md:block w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10 h-11"
          />
        </div>

        <div className="flex items-center gap-2 md:ml-0 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setProfileOpen(false);
              }}
              className={cn(iconBtn)}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-navbar shadow-card py-2 z-50 animate-dropdown">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-text-primary">Notifications</h3>
                    {live && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-live-dot" />
                        LIVE
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-sm font-medium text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-secondary">
                      <Bell className="mx-auto mb-3 h-12 w-12 text-border" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'group flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-hover',
                          !notif.read && 'bg-primary/5',
                          newIds.includes(notif.id) && 'animate-notif-in'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex-shrink-0',
                            notif.type === 'success' && 'text-success',
                            notif.type === 'warning' && 'text-warning',
                            notif.type === 'error' && 'text-danger',
                            notif.type === 'info' && 'text-info'
                          )}
                        >
                          {notificationIcons[notif.type]}
                        </div>
                        <button
                          onClick={() => markRead(notif.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className={cn('text-sm font-medium text-text-primary', !notif.read && 'font-semibold')}>
                            {notif.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-text-secondary">{notif.message}</p>
                          <p className="mt-1 text-[11px] text-text-secondary/70">{relativeTime(notif.createdAt)}</p>
                        </button>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                          <button
                            onClick={() => remove(notif.id)}
                            className="rounded-lg p-1 text-text-secondary/60 opacity-0 transition-all hover:bg-hover hover:text-danger group-hover:opacity-100"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-border px-4 py-3">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View all notifications
                    <ChevronDown className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-6 w-px bg-border md:block" aria-hidden="true" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-hover hover:text-text-primary"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <div className="avatar avatar-md bg-primary/10 text-primary">
                {user?.avatar ? <img src={user.avatar} alt="" className="avatar-img" /> : getInitials(user?.name || 'User')}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="text-xs capitalize text-text-secondary">{user?.role}</p>
              </div>
              <ChevronDown
                className="hidden h-4 w-4 text-text-secondary transition-transform md:block"
                style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)' }}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-navbar py-2 shadow-card z-50 animate-dropdown">
                <div className="border-b border-border px-4 py-3">
                  <p className="font-medium text-text-primary">{user?.name}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                  <p className="mt-0.5 text-xs capitalize text-text-secondary/70">{user?.role} account</p>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider" />
                <button
                  onClick={handleLogout}
                  className="dropdown-item w-full text-danger flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
