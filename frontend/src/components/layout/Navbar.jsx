import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, MessageSquare, Moon, Sun, 
  User, Settings, LogOut, ChevronDown, X, 
  CheckCircle, AlertCircle, Info, Menu,
  Grid, LayoutDashboard, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { cn, getInitials } from '@/lib/utils';

const Navbar = ({ 
  sidebarCollapsed, 
  onMenuClick, 
  className 
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'New Enrollment', message: 'John Doe enrolled in Computer Science 101', time: '2 min ago', read: false },
    { id: 2, type: 'warning', title: 'Fee Overdue', message: '3 students have overdue payments', time: '15 min ago', read: false },
    { id: 3, type: 'info', title: 'Exam Schedule', message: 'Mid-term exams scheduled for next week', time: '1 hour ago', read: true },
    { id: 4, type: 'success', title: 'Report Generated', message: 'Monthly attendance report is ready', time: '3 hours ago', read: true },
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
      if (messagesRef.current && !messagesRef.current.contains(e.target)) setMessagesOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notificationIcons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-info" />,
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search:', searchQuery);
      setSearchOpen(false);
    }
  };

  return (
    <header
      className={cn(
        'navbar sticky top-0 left-0 right-0 h-18 bg-navbar/90 backdrop-blur-xl border-b border-border z-40 transition-all duration-300 flex items-center',
        sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-70',
        className
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={onMenuClick}
            className="p-2.5 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary hover:text-text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-text-primary">RapidStrik</span>
          </Link>
        </div>

        <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search students, faculty, courses..."
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-background border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-secondary hover:bg-hover hover:text-text-primary hover:text-text-primary transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setMessagesOpen(false); setProfileOpen(false); }}
              className="relative p-2.5 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass rounded-2xl shadow-lg border border-border py-2 z-50 animate-dropdown">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setUnreadCount(0);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-secondary">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-border" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) {
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                          }
                        }}
                        className={cn(
                          'w-full px-4 py-3 hover:bg-hover transition-colors flex items-start gap-3',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className={cn('flex-shrink-0 mt-0.5', 
                          notif.type === 'success' && 'text-success',
                          notif.type === 'warning' && 'text-warning',
                          notif.type === 'error' && 'text-danger',
                          notif.type === 'info' && 'text-info'
                        )}>
                          {notificationIcons[notif.type]}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={cn('text-sm font-medium', !notif.read && 'font-semibold')}>{notif.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 truncate">{notif.message}</p>
                          <p className="text-[11px] text-text-secondary/70 mt-1">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <Link to="/notifications" className="text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1" onClick={() => setNotificationsOpen(false)}>
                    View all notifications
                    <ChevronDown className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => { setMessagesOpen(!messagesOpen); setNotificationsOpen(false); setProfileOpen(false); }}
              className="relative p-2.5 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">5</span>
            </button>

            {messagesOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl shadow-lg border border-border py-2 z-50 animate-dropdown">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-text-primary">Messages</h3>
                </div>
                <div className="px-4 py-8 text-center text-text-secondary">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-border" />
                  <p>No new messages</p>
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <Link to="/messages" className="text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1" onClick={() => setMessagesOpen(false)}>
                    View all messages
                    <ChevronDown className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary hover:text-text-primary transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); setMessagesOpen(false); }}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-hover transition-colors hover:text-text-primary"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <div className="avatar avatar-md bg-primary/10 text-primary">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="avatar-img" />
                ) : (
                  getInitials(user?.name || 'User')
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text-primary text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-secondary dark:text-gray-300 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-secondary transition-transform" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-lg border border-border py-2 z-50 animate-dropdown">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-medium text-text-primary text-text-primary">{user?.name}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                  <p className="text-xs text-text-secondary/70 capitalize mt-0.5">{user?.role} account</p>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider" />
                <button onClick={handleLogout} className="dropdown-item text-danger flex items-center gap-3 px-4 py-2.5 text-sm w-full">
                  <LogOut className="w-5 h-5" />
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

export default Navbar;
