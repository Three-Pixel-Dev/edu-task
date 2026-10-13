import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { taskService } from '@/services/tasks';
import { messageOf } from '@/services/storage';
import type { AsyncStatus, Task, TaskInput } from '@/types';
import { nowIso } from '@/utils/format';
import { AuthContext } from './AuthProvider';

export interface TasksContextValue {
  tasks: Task[];
  status: AsyncStatus;
  error: string | null;
  reload(): Promise<void>;
  createTask(input: TaskInput): Promise<Task>;
  updateTask(id: string, input: TaskInput): Promise<Task>;
  setCompleted(id: string, completed: boolean): Promise<void>;
  deleteTask(id: string): Promise<void>;
}

export const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: PropsWithChildren) {
  const userId = useContext(AuthContext)?.user?.id ?? null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<AsyncStatus>(userId ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    try {
      setTasks(await taskService.list(userId));
      setStatus('success');
    } catch (e) {
      setError(messageOf(e, 'We couldn’t load your tasks. Check your connection and try again.'));
      setStatus('error');
    }
  }, [userId]);

  // Reset synchronously when the signed-in user changes (no stale tasks between accounts).
  const [loadedFor, setLoadedFor] = useState(userId);
  if (loadedFor !== userId) {
    setLoadedFor(userId);
    setTasks([]);
    setError(null);
    setStatus(userId ? 'loading' : 'idle');
  }

  // Initial load for the signed-in user. setState only runs in the async callbacks.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    taskService.list(userId).then(
      (loaded) => {
        if (cancelled) return;
        setTasks(loaded);
        setStatus('success');
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(messageOf(e, 'We couldn’t load your tasks. Check your connection and try again.'));
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    await fetchTasks();
  }, [fetchTasks]);

  const requireUser = useCallback(() => {
    if (!userId) throw new Error('Not signed in');
    return userId;
  }, [userId]);

  const createTask = useCallback(
    async (input: TaskInput) => {
      const task = await taskService.create(requireUser(), input);
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [requireUser],
  );

  const updateTask = useCallback(
    async (id: string, input: TaskInput) => {
      const task = await taskService.update(requireUser(), id, input);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      return task;
    },
    [requireUser],
  );

  /** Optimistic: the checkbox flips immediately and rolls back on failure. */
  const setCompleted = useCallback(
    async (id: string, completed: boolean) => {
      const uid = requireUser();
      const patch = completed
        ? { status: 'completed' as const, completedAt: nowIso() }
        : { status: 'pending' as const, completedAt: undefined };
      let previous: Task | undefined;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          previous = t;
          return { ...t, ...patch, updatedAt: nowIso() };
        }),
      );
      try {
        await taskService.update(uid, id, patch);
      } catch (e) {
        if (previous) {
          const restore = previous;
          setTasks((prev) => prev.map((t) => (t.id === id ? restore : t)));
        }
        throw e;
      }
    },
    [requireUser],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.remove(requireUser(), id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [requireUser],
  );

  const value = useMemo(
    () => ({ tasks, status, error, reload, createTask, updateTask, setCompleted, deleteTask }),
    [tasks, status, error, reload, createTask, updateTask, setCompleted, deleteTask],
  );
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
