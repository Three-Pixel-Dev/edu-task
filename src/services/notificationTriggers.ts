import type { QuizType, Task } from '@/types';
import { createNotification } from './notifications';
import { cancelTaskDueNotification, presentLocalNotification, scheduleTaskDueNotification } from './push';

/** After a quiz result is saved — inbox row + local banner. */
export async function notifyQuizCompleted(
  uid: string,
  input: {
    resultId: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    level: number;
    quizType: QuizType;
    percentage: number;
  },
): Promise<void> {
  const title = 'Quiz completed';
  const body = `${input.subjectName} (${input.subjectCode}) · Level ${input.level} · ${input.percentage}%`;
  const created = await createNotification(uid, {
    type: 'quizCompleted',
    title,
    body,
    dedupeKey: `quizCompleted:${input.resultId}`,
    resultId: input.resultId,
    subjectId: input.subjectId,
    level: input.level,
    quizType: input.quizType,
  });
  if (created) {
    await presentLocalNotification({
      title,
      body,
      data: { type: 'quizCompleted', resultId: input.resultId },
    });
  }
}

/** Schedule or cancel the local due reminder for a task. */
export async function syncTaskDueReminder(task: Pick<Task, 'id' | 'title' | 'dueDate' | 'status'>): Promise<void> {
  if (task.status === 'completed') {
    await cancelTaskDueNotification(task.id);
    return;
  }
  await scheduleTaskDueNotification(task.id, task.title, task.dueDate);
}

export async function clearTaskDueReminder(taskId: string): Promise<void> {
  await cancelTaskDueNotification(taskId);
}

/**
 * For each pending overdue task, write a one-time inbox item and show a banner
 * the first time we notice it (dedupeKey = taskOverdue:{taskId}).
 */
export async function syncOverdueTaskNotifications(uid: string, tasks: Task[]): Promise<void> {
  const now = Date.now();
  const overdue = tasks.filter((t) => t.status === 'pending' && new Date(t.dueDate).getTime() < now);
  for (const task of overdue) {
    const title = 'Task overdue';
    const body = task.title;
    const created = await createNotification(uid, {
      type: 'taskOverdue',
      title,
      body,
      dedupeKey: `taskOverdue:${task.id}`,
      taskId: task.id,
      subjectId: task.subjectId,
    });
    if (created) {
      await presentLocalNotification({
        title,
        body,
        data: { type: 'taskOverdue', taskId: task.id },
      });
    }
  }
}
