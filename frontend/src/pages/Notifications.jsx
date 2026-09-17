import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { cn, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const notificationIcons = {
  success: <Bell className="w-5 h-5" style={{ color: 'var(--color-success)' }} />,
  warning: <Bell className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />,
  error: <Bell className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />,
  info: <Bell className="w-5 h-5" style={{ color: 'var(--color-info)' }} />,
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
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {notifications.length} total
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          icon={<CheckCheck className="w-4 h-4" />}
        >
          Mark all read
        </Button>
      </div>

      <div className="inline-flex p-1 rounded-xl gap-1" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
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
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
          <Bell className="w-12 h-12 mb-3" style={{ color: 'var(--color-border)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>No notifications</p>
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
                'group flex items-start gap-4 p-4 rounded-2xl border transition-colors',
                !notif.read && 'bg-[var(--color-accent-muted)] border-[var(--color-accent)]/20',
                'bg-[var(--color-bg-card)] border-[var(--color-border)]'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                notif.type === 'success' && 'bg-[var(--color-success)]/10',
                notif.type === 'warning' && 'bg-[var(--color-warning)]/10',
                notif.type === 'error' && 'bg-[var(--color-danger)]/10',
                notif.type === 'info' && 'bg-[var(--color-info)]/10'
              )}>
                {notificationIcons[notif.type] || notificationIcons.info}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', !notif.read && 'font-semibold')} style={{ color: 'var(--color-text-primary)' }}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} aria-label="Unread" />
                  )}
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{notif.message}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>{relativeTime(notif.createdAt)}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-success)] transition-colors"
                    aria-label="Mark as read"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(notif.id)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-danger)] transition-colors"
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