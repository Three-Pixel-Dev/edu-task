import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { EmptyState, Screen } from '@/components';
import { useTask, useTasks } from '@/hooks';
import type { TaskInput } from '@/types';
import { TaskFormScreen } from './TaskFormScreen';

export function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTask(id);
  const { updateTask } = useTasks();

  // Memoised so the form's "unsaved changes" check has a stable baseline.
  const initial = useMemo<TaskInput | undefined>(
    () =>
      task
        ? { title: task.title, description: task.description, subjectId: task.subjectId, dueDate: task.dueDate, priority: task.priority }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task?.id],
  );

  if (!task || !initial) {
    return (
      <Screen>
        <EmptyState icon="inbox" title="Task not found" message="It may have been deleted." actionLabel="Close" actionIcon="x" onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <TaskFormScreen
      mode="edit"
      initial={initial}
      onSubmit={async (input) => {
        await updateTask(task.id, input);
      }}
    />
  );
}
