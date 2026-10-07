import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { STORAGE_KEYS } from '@/constants/app';
import { mockUsers, seedTasks } from '@/data';
import type { Task, TaskInput } from '@/types';
import { createId, nowIso } from '@/utils/format';
import { COLLECTIONS, getFirebase, isFirebaseConfigured } from './firebase';
import { AppError, mockDelay, storage, userKey } from './storage';

export interface TaskService {
  list(userId: string): Promise<Task[]>;
  create(userId: string, input: TaskInput): Promise<Task>;
  update(userId: string, id: string, patch: Partial<Omit<Task, 'id' | 'userId'>>): Promise<Task>;
  remove(userId: string, id: string): Promise<void>;
}

const newTask = (userId: string, input: TaskInput): Task => {
  const now = nowIso();
  return { id: createId('task'), userId, ...input, status: 'pending', createdAt: now, updatedAt: now };
};

// ── Mock implementation (AsyncStorage, per user) ─────────────────────────
const isDemoUser = (userId: string) => mockUsers.some((u) => u.id === userId);

async function readAll(userId: string): Promise<Task[]> {
  const key = userKey(STORAGE_KEYS.tasks, userId);
  const stored = await storage.get<Task[]>(key);
  if (stored) return stored;
  // Demo students start with realistic tasks; new accounts start empty.
  const initial = isDemoUser(userId) ? seedTasks(userId) : [];
  await storage.set(key, initial);
  return initial;
}

const writeAll = (userId: string, tasks: Task[]) => storage.set(userKey(STORAGE_KEYS.tasks, userId), tasks);

const mockTasks: TaskService = {
  async list(userId) {
    await mockDelay();
    return readAll(userId);
  },
  async create(userId, input) {
    await mockDelay(200);
    const task = newTask(userId, input);
    await writeAll(userId, [task, ...(await readAll(userId))]);
    return task;
  },
  async update(userId, id, patch) {
    const tasks = await readAll(userId);
    const existing = tasks.find((t) => t.id === id);
    if (!existing) throw new AppError('This task no longer exists.', 'tasks/not-found');
    const updated: Task = { ...existing, ...patch, updatedAt: nowIso() };
    await writeAll(userId, tasks.map((t) => (t.id === id ? updated : t)));
    return updated;
  },
  async remove(userId, id) {
    const tasks = await readAll(userId);
    await writeAll(userId, tasks.filter((t) => t.id !== id));
  },
};

// ── Firestore implementation ─────────────────────────────────────────────
const firestoreTasks: TaskService = {
  async list(userId) {
    const { db } = getFirebase();
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.tasks), where('userId', '==', userId)));
    return snapshot.docs.map((d) => ({ ...(d.data() as Omit<Task, 'id'>), id: d.id }));
  },
  async create(userId, input) {
    const { db } = getFirebase();
    const task = newTask(userId, input);
    const { id, ...data } = task;
    await setDoc(doc(db, COLLECTIONS.tasks, id), stripUndefined(data));
    return task;
  },
  async update(userId, id, patch) {
    const { db } = getFirebase();
    const data = stripUndefined({ ...patch, updatedAt: nowIso() });
    await updateDoc(doc(db, COLLECTIONS.tasks, id), data);
    const all = await firestoreTasks.list(userId);
    const updated = all.find((t) => t.id === id);
    if (!updated) throw new AppError('This task no longer exists.', 'tasks/not-found');
    return updated;
  },
  async remove(_userId, id) {
    const { db } = getFirebase();
    await deleteDoc(doc(db, COLLECTIONS.tasks, id));
  },
};

/** Firestore rejects `undefined` values. */
function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

export const taskService: TaskService = isFirebaseConfigured ? firestoreTasks : mockTasks;
