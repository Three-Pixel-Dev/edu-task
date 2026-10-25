import { useContext, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import { routes } from '@/constants/routes';
import { syncOverdueTaskNotifications, syncTaskDueReminder } from '@/services/notificationTriggers';
import { configurePush, ensurePushPermission, subscribeToNotificationResponses } from '@/services/push';
import { AuthContext } from './AuthProvider';
import { TasksContext } from './TasksProvider';

/**
 * Side effects for notifications: permission prompt, overdue inbox sync, and
 * deep links from local notification taps. Must sit under Auth + Tasks providers.
 */
export function NotificationEffects() {
  const auth = useContext(AuthContext);
  const tasksCtx = useContext(TasksContext);
  const uid = auth?.user?.uid ?? null;
  const signedIn = auth?.status === 'signedIn' && Boolean(uid);

  useEffect(() => {
    if (!signedIn || Platform.OS === 'web') return;
    void configurePush().then(() => ensurePushPermission());
  }, [signedIn]);

  const lastSync = useRef('');
  useEffect(() => {
    if (!uid || !tasksCtx || tasksCtx.status !== 'success') return;
    const key = `${uid}:${tasksCtx.tasks.map((t) => `${t.id}:${t.status}:${t.dueDate}`).join('|')}`;
    if (key === lastSync.current) return;
    lastSync.current = key;
    void syncOverdueTaskNotifications(uid, tasksCtx.tasks).catch(() => undefined);
    // Keep local due reminders in sync with the live task list (create/edit/delete on any device).
    for (const task of tasksCtx.tasks) {
      void syncTaskDueReminder(task).catch(() => undefined);
    }
  }, [uid, tasksCtx]);

  useEffect(() => {
    if (!uid || !tasksCtx) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        lastSync.current = '';
        void syncOverdueTaskNotifications(uid, tasksCtx.tasks).catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [uid, tasksCtx]);

  useEffect(() => {
    if (!signedIn || Platform.OS === 'web') return;
    return subscribeToNotificationResponses((data) => {
      const taskId = typeof data.taskId === 'string' ? data.taskId : undefined;
      const resultId = typeof data.resultId === 'string' ? data.resultId : undefined;
      if (taskId) router.push(routes.taskDetail(taskId));
      else if (resultId) router.push(routes.quizResult(resultId));
      else router.push(routes.notifications);
    });
  }, [signedIn]);

  return null;
}
