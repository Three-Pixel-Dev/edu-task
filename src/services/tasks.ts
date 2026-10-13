import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import type { Task, TaskInput } from '@/types';
import { dataOf, oneOf, str, toIso } from './converters';
import { AppError, toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

/**
 * Firestore CRUD for tasks/{taskId}. Every function takes the signed-in UID
 * from Firebase Auth (never from user input); the security rules enforce the
 * same ownership on the server.
 */

const tasksCol = () => collection(getFirebase().db, COLLECTIONS.tasks);
const taskRef = (id: string) => doc(getFirebase().db, COLLECTIONS.tasks, id);

function toTask(id: string, data: DocumentData, hasPendingWrites = false): Task {
  return {
    id,
    userId: str(data.userId),
    title: str(data.title),
    description: str(data.description),
    subjectId: str(data.subjectId),
    dueDate: toIso(data.dueDate),
    priority: oneOf(data.priority, ['low', 'medium', 'high'] as const, 'medium'),
    status: oneOf(data.status, ['pending', 'completed'] as const, 'pending'),
    completedAt: data.completedAt ? toIso(data.completedAt) : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    hasPendingWrites,
  };
}

const inputFields = (input: TaskInput) => ({
  title: input.title.trim(),
  description: input.description.trim(),
  subjectId: input.subjectId,
  dueDate: Timestamp.fromDate(new Date(input.dueDate)),
  priority: input.priority,
});

/** A new task id, generated on the device (exactly what addDoc does internally). */
export const newTaskId = () => doc(tasksCol()).id;

/**
 * Creates a task. Uses a pre-generated id instead of addDoc so that retrying
 * after a timeout can't create a duplicate: on retry we first ask the server
 * whether the first attempt already landed.
 */
export async function createTask(uid: string, taskId: string, input: TaskInput, isRetry = false): Promise<void> {
  try {
    if (isRetry) {
      const existing = await withTimeout(getDocFromServer(taskRef(taskId)), 'read');
      if (existing.exists()) return;
    }
    await withTimeout(
      setDoc(taskRef(taskId), {
        userId: uid,
        ...inputFields(input),
        status: 'pending',
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      'write',
    );
  } catch (error) {
    throw toAppError(error, 'We couldn’t save this task.');
  }
}

/** One-off read of the user's tasks (screens use subscribeToTasks instead). */
export async function getTasks(uid: string): Promise<Task[]> {
  try {
    const snap = await withTimeout(getDocs(query(tasksCol(), where('userId', '==', uid), orderBy('dueDate', 'asc'))), 'read');
    return snap.docs.map((d) => toTask(d.id, dataOf(d)));
  } catch (error) {
    throw toAppError(error, 'We couldn’t load your tasks.');
  }
}

/**
 * Real-time task list for one user. Includes metadata changes so items show
 * "Not synced yet" until the server confirms a local write.
 * Needs the (userId asc, dueDate asc) composite index.
 */
export function subscribeToTasks(uid: string, onNext: (tasks: Task[]) => void, onError: (message: string) => void) {
  return onSnapshot(
    query(tasksCol(), where('userId', '==', uid), orderBy('dueDate', 'asc')),
    { includeMetadataChanges: true },
    (snap) => onNext(snap.docs.map((d) => toTask(d.id, dataOf(d), d.metadata.hasPendingWrites))),
    (error) => onError(toAppError(error, 'We couldn’t load your tasks.').message),
  );
}

/** Reads a task and verifies it belongs to `uid`. */
export async function getTask(uid: string, taskId: string): Promise<Task> {
  const snap = await withTimeout(getDoc(taskRef(taskId)), 'read').catch((error: unknown) => {
    throw toAppError(error, 'We couldn’t load this task.');
  });
  if (!snap.exists()) throw new AppError('This task no longer exists.', 'not-found');
  const task = toTask(snap.id, dataOf(snap), snap.metadata.hasPendingWrites);
  if (task.userId !== uid) throw new AppError('This task belongs to another account.', 'permission-denied');
  return task;
}

export async function updateTask(uid: string, taskId: string, input: TaskInput): Promise<void> {
  await getTask(uid, taskId); // ownership check (the rules enforce it too)
  try {
    await withTimeout(updateDoc(taskRef(taskId), { ...inputFields(input), updatedAt: serverTimestamp() }), 'write');
  } catch (error) {
    throw toAppError(error, 'We couldn’t save your changes.');
  }
}

export async function completeTask(uid: string, taskId: string, completed: boolean): Promise<void> {
  await getTask(uid, taskId);
  try {
    await withTimeout(
      updateDoc(taskRef(taskId), {
        status: completed ? 'completed' : 'pending',
        completedAt: completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      }),
      'write',
    );
  } catch (error) {
    throw toAppError(error, 'We couldn’t update this task.');
  }
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  try {
    await getTask(uid, taskId);
  } catch (error) {
    // Already gone (e.g. deleted on another device) — nothing left to do.
    if (error instanceof AppError && error.code === 'not-found') return;
    throw error;
  }
  try {
    await withTimeout(deleteDoc(taskRef(taskId)), 'write');
  } catch (error) {
    throw toAppError(error, 'We couldn’t delete this task.');
  }
}
