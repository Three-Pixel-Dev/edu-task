import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { subscribeToNotifications } from '@/services/notifications';
import type { AppNotification, AsyncStatus } from '@/types';
import { AuthContext } from './AuthProvider';

export interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  status: AsyncStatus;
  error: string | null;
  retry(): void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * One real-time listener on the signed-in user's notification inbox, shared by
 * Home (bell badge) and the Notifications screen.
 */
export function NotificationsProvider({ children }: PropsWithChildren) {
  const uid = useContext(AuthContext)?.user?.uid ?? null;
  const [state, setState] = useState<{ key: string; notifications: AppNotification[]; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${uid}:${attempt}`;

  useEffect(() => {
    if (!uid) return;
    return subscribeToNotifications(
      uid,
      (notifications) => setState({ key, notifications, error: null }),
      (error) => setState({ key, notifications: [], error }),
    );
  }, [uid, key]);

  const value = useMemo<NotificationsContextValue>(() => {
    const current = state?.key === key ? state : null;
    const notifications = current?.notifications ?? [];
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      status: !current ? 'loading' : current.error ? 'error' : 'success',
      error: current?.error ?? null,
      retry: () => setAttempt((n) => n + 1),
    };
  }, [state, key]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
