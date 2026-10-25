import { Platform } from 'react-native';
import type { AppNotification } from '@/types';

const TASK_DUE_CHANNEL = 'task-due';
const PREFIX_TASK_DUE = 'task-due:';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
let configured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  if (Notifications) return Notifications;
  try {
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch {
    return null;
  }
}

/** Handler + Android channel. Safe to call more than once; no-op on web. */
export async function configurePush(): Promise<void> {
  if (configured || Platform.OS === 'web') return;
  const mod = await loadNotifications();
  if (!mod) return;
  mod.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === 'android') {
    await mod.setNotificationChannelAsync(TASK_DUE_CHANNEL, {
      name: 'Task reminders',
      importance: mod.AndroidImportance.DEFAULT,
    });
  }
  configured = true;
}

/** Asks for permission once. Returns whether we can show banners. */
export async function ensurePushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await configurePush();
  const mod = await loadNotifications();
  if (!mod) return false;
  const current = await mod.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await mod.requestPermissionsAsync();
  return next.granted;
}

export type LocalNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/** Shows a banner immediately (quiz completed, overdue scan). */
export async function presentLocalNotification(payload: LocalNotificationPayload): Promise<void> {
  if (Platform.OS === 'web') return;
  const allowed = await ensurePushPermission();
  if (!allowed) return;
  const mod = await loadNotifications();
  if (!mod) return;
  await mod.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      ...(Platform.OS === 'android' ? { channelId: TASK_DUE_CHANNEL } : {}),
    },
    trigger: null,
  });
}

/** Schedules (or replaces) a local reminder at the task due date. */
export async function scheduleTaskDueNotification(taskId: string, title: string, dueDateIso: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) {
    await cancelTaskDueNotification(taskId);
    return;
  }
  const allowed = await ensurePushPermission();
  if (!allowed) return;
  const mod = await loadNotifications();
  if (!mod) return;
  await cancelTaskDueNotification(taskId);
  await mod.scheduleNotificationAsync({
    identifier: `${PREFIX_TASK_DUE}${taskId}`,
    content: {
      title: 'Task due',
      body: title,
      data: { type: 'taskDue', taskId },
      ...(Platform.OS === 'android' ? { channelId: TASK_DUE_CHANNEL } : {}),
    },
    trigger: {
      type: mod.SchedulableTriggerInputTypes.DATE,
      date: due,
    },
  });
}

export async function cancelTaskDueNotification(taskId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = await loadNotifications();
  if (!mod) return;
  try {
    await mod.cancelScheduledNotificationAsync(`${PREFIX_TASK_DUE}${taskId}`);
  } catch {
    // Already cancelled or never scheduled.
  }
}

/** Maps a tap on a local notification into a deep-link shape the inbox uses. */
export function notificationFromPushData(data: Record<string, unknown> | undefined): Partial<AppNotification> | null {
  if (!data || typeof data !== 'object') return null;
  const taskId = typeof data.taskId === 'string' ? data.taskId : undefined;
  const resultId = typeof data.resultId === 'string' ? data.resultId : undefined;
  if (!taskId && !resultId) return null;
  return {
    taskId,
    resultId,
    type: data.type === 'quizCompleted' ? 'quizCompleted' : taskId ? 'taskDue' : 'quizCompleted',
  };
}

/**
 * Listens for notification taps. Returns an unsubscribe. No-op on web.
 * Call after the root navigator is ready.
 */
export function subscribeToNotificationResponses(onOpen: (data: Record<string, unknown>) => void): () => void {
  if (Platform.OS === 'web') return () => undefined;
  let sub: { remove(): void } | null = null;
  void (async () => {
    const mod = await loadNotifications();
    if (!mod) return;
    sub = mod.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onOpen(data ?? {});
    });
    const last = await mod.getLastNotificationResponseAsync();
    if (last) {
      const data = last.notification.request.content.data as Record<string, unknown>;
      onOpen(data ?? {});
    }
  })();
  return () => sub?.remove();
}
