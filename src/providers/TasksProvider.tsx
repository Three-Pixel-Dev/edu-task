import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { subscribeToTasks } from '@/services/tasks';
import type { AsyncStatus, Task } from '@/types';
import { AuthContext } from './AuthProvider';

export interface TasksContextValue {
  tasks: Task[];
  status: AsyncStatus;
  error: string | null;
  /** Re-attaches the listener after an error. */
  retry(): void;
}

export const TasksContext = createContext<TasksContextValue | null>(null);

/**
 * One real-time listener on the signed-in user's tasks, shared by Home,
 * Tasks, Task details and Profile. Adds, edits, completes and deletes show up
 * everywhere automatically — no manual refresh.
 */
export function TasksProvider({ children }: PropsWithChildren) {
  const uid = useContext(AuthContext)?.user?.uid ?? null;
  const [state, setState] = useState<{ key: string; tasks: Task[]; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${uid}:${attempt}`;

  useEffect(() => {
    if (!uid) return;
    return subscribeToTasks(
      uid,
      (tasks) => setState({ key, tasks, error: null }),
      (error) => setState({ key, tasks: [], error }),
    );
  }, [uid, key]);

  const value = useMemo<TasksContextValue>(() => {
    const current = state?.key === key ? state : null;
    return {
      tasks: current?.tasks ?? [],
      status: !current ? 'loading' : current.error ? 'error' : 'success',
      error: current?.error ?? null,
      retry: () => setAttempt((n) => n + 1),
    };
  }, [state, key]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
