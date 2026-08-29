import { createContext, useContext } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const value = useNotifications();
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}
