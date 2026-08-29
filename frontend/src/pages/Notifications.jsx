import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { cn, relativeTime } from '@/lib/utils';

const notificationIcons = {
  success: <Bell className="w-5 h-5 text-success" />,
  warning: <Bell className="w-5 h-5 text-warning" />,
  error: <Bell className="w-5 h-5 text-danger" />,
  info: <Bell className="w-5 h-5 text-info" />,
};

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
  } = useNotificationsContext();

  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {notifications.length} total
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            unreadCount === 0
              ? 'text-text-secondary/50 cursor-not-allowed'
              : 'text-primary hover:bg-primary/10'
          )}
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      <div className="inline-flex p-1 rounded-xl bg-hover gap-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 text-text-secondary">
          <Bell className="w-12 h-12 mb-3 text-border" />
          <p className="font-medium text-text-primary">No notifications</p>
          <p className="text-sm mt-1">
            {filter === 'unread' ? 'You have no unread notifications.' : 'You are all caught up.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((notif) => (
            <li
              key={notif.id}
              className={cn(
                'group flex items-start gap-4 p-4 rounded-2xl border border-border bg-card transition-colors',
                !notif.read && 'bg-primary/5 border-primary/20'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                notif.type === 'success' && 'bg-success/10',
                notif.type === 'warning' && 'bg-warning/10',
                notif.type === 'error' && 'bg-danger/10',
                notif.type === 'info' && 'bg-info/10'
              )}>
                {notificationIcons[notif.type] || notificationIcons.info}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium text-text-primary', !notif.read && 'font-semibold')}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{notif.message}</p>
                <p className="text-[11px] text-text-secondary/70 mt-1">{relativeTime(notif.createdAt)}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-hover hover:text-success transition-colors"
                    aria-label="Mark as read"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(notif.id)}
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-hover hover:text-danger transition-colors"
                  aria-label="Dismiss notification"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
