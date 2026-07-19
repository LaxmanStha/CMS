import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar, Clock, 
  FileText, DollarSign, BarChart3, Settings, LogOut, GraduationCap,
  Grid, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/faculty-list', label: 'Faculty', icon: UserCheck },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/enrollment', label: 'Enrollment', icon: Calendar },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/exams', label: 'Exams', icon: FileText },
  { to: '/timetable', label: 'Timetable', icon: Grid },
  { to: '/fees', label: 'Fees', icon: DollarSign },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ 
  collapsed = false, 
  onHover,
  className,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleKeyDown = (e, to) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onCloseMobile) onCloseMobile();
    }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    onCloseMobile?.();
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'sidebar fixed top-0 left-0 h-full bg-sidebar z-50 transition-all duration-300 ease-out flex flex-col',
          collapsed ? 'w-18 lg:w-18' : 'w-70 lg:w-70',
          mobileOpen && 'lg:hidden translate-x-0',
          !mobileOpen && 'hidden lg:block',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        <div className={cn(
          'flex items-center h-18 px-4 border-b border-white/10 gap-2',
          collapsed ? 'flex-col justify-center' : 'justify-between'
        )}>
          <div className={cn('flex items-center gap-3 transition-all duration-300', collapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-text-primary whitespace-nowrap">RapidStack</span>
            )}
          </div>

        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onMouseEnter={() => setHoveredItem(item.to)}
                onMouseLeave={() => setHoveredItem(null)}
                onKeyDown={(e) => handleKeyDown(e, item.to)}
                className={({ isActive: active }) => cn(
                  'sidebar-link relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-sidebar',
                  active 
                    ? 'sidebar-link-active shadow-lg shadow-primary/30' 
                    : 'hover:bg-accent-blue-soft hover:text-accent-blue',
                  collapsed && 'justify-center px-3'
                )}
                style={{ 
                  transitionDelay: `${index * 30}ms`,
                  animation: 'slideUp 0.4s ease-out forwards',
                  opacity: 0
                }}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span 
                  className={cn(
                    'sidebar-link-icon w-5 h-5 flex-shrink-0 transition-all duration-200',
                    isActive && 'text-accent-blue',
                    hoveredItem === item.to && 'animate-pulse'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </span>
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'w-full sidebar-link relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              'text-text-secondary hover:bg-danger/20 hover:text-danger',
              collapsed && 'justify-center px-3'
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <span className="sidebar-link-icon w-5 h-5 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </span>
            {!collapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="p-4 mt-auto">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-text-secondary/70 uppercase tracking-wider mb-2">Version</p>
              <p className="font-semibold text-text-primary">2.1.0</p>
              <p className="text-xs text-text-secondary/70 mt-1">RapidStrik University</p>
            </div>
          </div>
        )}
      </aside>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
