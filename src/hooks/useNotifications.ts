import { useCallback, useContext, useMemo } from 'react';
import { router } from 'expo-router';
import { NotificationsContext } from '@/providers/NotificationsProvider';
import * as notificationService from '@/services/notifications';
import { routes } from '@/constants/routes';
import type { AppNotification } from '@/types';
import { useUid } from './useAuth';

/** Real-time notification inbox (from NotificationsProvider). */
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}

export function useNotificationActions() {
  const uid = useUid();
  const { notifications } = useNotifications();

  const markRead = useCallback((id: string) => notificationService.markNotificationRead(uid, id), [uid]);
  const markAllRead = useCallback(() => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    return notificationService.markAllNotificationsRead(uid, ids);
  }, [uid, notifications]);
  const remove = useCallback((id: string) => notificationService.deleteNotification(uid, id), [uid]);

  const openNotification = useCallback(
    async (item: AppNotification) => {
      if (!item.read) {
        try {
          await markRead(item.id);
        } catch {
          // Navigation still proceeds if the read flag fails.
        }
      }
      if (item.taskId) {
        router.push(routes.taskDetail(item.taskId));
        return;
      }
      if (item.resultId) {
        router.push(routes.quizResult(item.resultId));
        return;
      }
      router.push(routes.notifications);
    },
    [markRead],
  );

  return useMemo(() => ({ markRead, markAllRead, remove, openNotification }), [markRead, markAllRead, remove, openNotification]);
}
