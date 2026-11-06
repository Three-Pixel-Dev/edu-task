import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type { AppNotification, NotificationInput, NotificationType, QuizType } from '@/types';
import { bool, dataOf, num, oneOf, str, toIso } from './converters';
import { toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

const NOTIFICATION_TYPES = ['taskDue', 'taskOverdue', 'quizCompleted'] as const satisfies readonly NotificationType[];

const notificationsCol = () => collection(getFirebase().db, COLLECTIONS.notifications);
const notificationRef = (id: string) => doc(getFirebase().db, COLLECTIONS.notifications, id);

/** Firestore-safe document id derived from dedupeKey (retries reuse the same doc). */
export function notificationIdFromDedupeKey(dedupeKey: string) {
  return dedupeKey.replace(/[/\\]/g, '_');
}

function toNotification(id: string, data: DocumentData): AppNotification {
  const type = oneOf(data.type, NOTIFICATION_TYPES, 'taskDue');
  const quizTypeRaw = data.quizType;
  const quizType: QuizType | undefined =
    quizTypeRaw === 'trueFalse' || quizTypeRaw === 'multipleChoice' ? quizTypeRaw : undefined;
  const taskId = data.taskId != null ? str(data.taskId) : undefined;
  const resultId = data.resultId != null ? str(data.resultId) : undefined;
  const subjectId = data.subjectId != null ? str(data.subjectId) : undefined;
  const level = data.level != null ? num(data.level) : undefined;
  return {
    id,
    userId: str(data.userId),
    type,
    title: str(data.title),
    body: str(data.body),
    read: bool(data.read),
    dedupeKey: str(data.dedupeKey),
    createdAt: toIso(data.createdAt),
    ...(taskId ? { taskId } : {}),
    ...(resultId ? { resultId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(level != null && level > 0 ? { level } : {}),
    ...(quizType ? { quizType } : {}),
  };
}

/**
 * Creates (or no-ops if the dedupeKey doc already exists). Uses a fixed id so
 * retries and overdue scans never spam the inbox.
 * @returns true if a new document was written.
 */
export async function createNotification(uid: string, input: NotificationInput): Promise<boolean> {
  const id = notificationIdFromDedupeKey(input.dedupeKey);
  const ref = notificationRef(id);
  try {
    const existing = await withTimeout(getDoc(ref), 'read');
    if (existing.exists()) return false;
    await withTimeout(
      setDoc(ref, {
        userId: uid,
        type: input.type,
        title: input.title.trim(),
        body: input.body.trim(),
        read: false,
        dedupeKey: input.dedupeKey,
        createdAt: serverTimestamp(),
        ...(input.taskId ? { taskId: input.taskId } : {}),
        ...(input.resultId ? { resultId: input.resultId } : {}),
        ...(input.subjectId ? { subjectId: input.subjectId } : {}),
        ...(input.level != null ? { level: input.level } : {}),
        ...(input.quizType ? { quizType: input.quizType } : {}),
      }),
      'write',
    );
    return true;
  } catch (error) {
    // Concurrent create with the same dedupeKey — treat as already written.
    try {
      const again = await getDoc(ref);
      if (again.exists()) return false;
    } catch {
      // fall through
    }
    throw toAppError(error, 'We couldn’t save this notification.');
  }
}

/** Live inbox for one user, newest first. Needs the (userId, createdAt desc) index. */
export function subscribeToNotifications(
  uid: string,
  onNext: (items: AppNotification[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    query(notificationsCol(), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => onNext(snap.docs.map((d) => toNotification(d.id, dataOf(d)))),
    (error) => onError(toAppError(error, 'We couldn’t load your notifications.').message),
  );
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const ref = notificationRef(notificationId);
  try {
    const snap = await withTimeout(getDoc(ref), 'read');
    if (!snap.exists()) return;
    const data = dataOf(snap);
    if (str(data.userId) !== uid) return;
    if (bool(data.read)) return;
    await withTimeout(updateDoc(ref, { read: true }), 'write');
  } catch (error) {
    throw toAppError(error, 'We couldn’t update this notification.');
  }
}

/** Marks the given notification ids as read (caller passes unread ids from the live list). */
export async function markAllNotificationsRead(uid: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const { db } = getFirebase();
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const id of chunk) {
        // Ownership is enforced by rules; we still only touch docs we already listed.
        batch.update(notificationRef(id), { read: true });
      }
      await withTimeout(batch.commit(), 'write');
    }
  } catch (error) {
    throw toAppError(error, 'We couldn’t mark notifications as read.');
  }
}

export async function deleteNotification(uid: string, notificationId: string): Promise<void> {
  const ref = notificationRef(notificationId);
  try {
    const snap = await withTimeout(getDoc(ref), 'read');
    if (!snap.exists()) return;
    if (str(dataOf(snap).userId) !== uid) return;
    await withTimeout(deleteDoc(ref), 'write');
  } catch (error) {
    throw toAppError(error, 'We couldn’t delete this notification.');
  }
}
