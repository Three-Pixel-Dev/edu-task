import { useContext, useMemo } from 'react';
import { TasksContext } from '@/store/TasksProvider';
import type { Task, TaskSection } from '@/types';
import { taskSection, taskUrgency } from '@/utils/date';

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside <TasksProvider>');
  return ctx;
}

export function useTask(id: string | undefined) {
  const { tasks } = useTasks();
  return useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
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
