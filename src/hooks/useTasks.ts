import { useCallback, useContext, useMemo } from 'react';
import { TasksContext } from '@/providers/TasksProvider';
import * as taskService from '@/services/tasks';
import type { Task, TaskInput, TaskSection } from '@/types';
import { taskSection, taskUrgency } from '@/utils/date';
import { useUid } from './useAuth';

/** Real-time tasks of the signed-in user (from TasksProvider). */
export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside <TasksProvider>');
  return ctx;
}

export function useTask(id: string | undefined) {
  const { tasks, status, error } = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
  return { task, status, error };
}

/** Task mutations bound to the signed-in UID. Results arrive via the listener. */
export function useTaskActions() {
  const uid = useUid();
  return {
    newTaskId: taskService.newTaskId,
    createTask: useCallback((taskId: string, input: TaskInput, isRetry: boolean) => taskService.createTask(uid, taskId, input, isRetry), [uid]),
    updateTask: useCallback((taskId: string, input: TaskInput) => taskService.updateTask(uid, taskId, input), [uid]),
    completeTask: useCallback((taskId: string, completed: boolean) => taskService.completeTask(uid, taskId, completed), [uid]),
    deleteTask: useCallback((taskId: string) => taskService.deleteTask(uid, taskId), [uid]),
  };
}

const bySoonest = (a: Task, b: Task) => a.dueDate.localeCompare(b.dueDate);
const byRecentlyCompleted = (a: Task, b: Task) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt);

/** Groups tasks into Today / Upcoming / Completed and counts what the UI shows. */
export function useTaskSections() {
  const { tasks } = useTasks();
  return useMemo(() => {
    const now = new Date();
    const groups: Record<TaskSection, Task[]> = { today: [], upcoming: [], completed: [] };
    for (const task of tasks) groups[taskSection(task, now)].push(task);
    groups.today.sort(bySoonest);
    groups.upcoming.sort(bySoonest);
    groups.completed.sort(byRecentlyCompleted);

    const overdue = groups.today.filter((t) => taskUrgency(t, now) === 'overdue').length;
    return {
      groups,
      counts: {
        dueToday: groups.today.length - overdue,
        overdue,
        upcoming: groups.upcoming.length,
        completed: groups.completed.length,
        active: groups.today.length + groups.upcoming.length,
        total: tasks.length,
      },
    };
  }, [tasks]);
}
