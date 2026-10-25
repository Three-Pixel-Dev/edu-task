import { useCallback, useContext, useMemo } from 'react';
import { TasksContext } from '@/providers/TasksProvider';
import { clearTaskDueReminder, syncTaskDueReminder } from '@/services/notificationTriggers';
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
    createTask: useCallback(
      async (taskId: string, input: TaskInput, isRetry: boolean) => {
        await taskService.createTask(uid, taskId, input, isRetry);
        void syncTaskDueReminder({ id: taskId, title: input.title, dueDate: input.dueDate, status: 'pending' }).catch(() => undefined);
      },
      [uid],
    ),
    updateTask: useCallback(
      async (taskId: string, input: TaskInput) => {
        await taskService.updateTask(uid, taskId, input);
        void syncTaskDueReminder({ id: taskId, title: input.title, dueDate: input.dueDate, status: 'pending' }).catch(() => undefined);
      },
      [uid],
    ),
    completeTask: useCallback(
      async (taskId: string, completed: boolean) => {
        await taskService.completeTask(uid, taskId, completed);
        if (completed) void clearTaskDueReminder(taskId).catch(() => undefined);
        else {
          const task = await taskService.getTask(uid, taskId).catch(() => null);
          if (task) void syncTaskDueReminder(task).catch(() => undefined);
        }
      },
      [uid],
    ),
    deleteTask: useCallback(
      async (taskId: string) => {
        await taskService.deleteTask(uid, taskId);
        void clearTaskDueReminder(taskId).catch(() => undefined);
      },
      [uid],
    ),
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
