import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { EmptyState, LoadingState, Screen, ScreenHeader } from '@/components';
import { useTask, useTaskActions } from '@/hooks';
import type { TaskInput } from '@/types';
import { TaskFormScreen } from './TaskFormScreen';

export function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { task, status } = useTask(id);
  const { updateTask } = useTaskActions();

  // Memoised on the id so live updates don't reset what the student is typing.
  const initial = useMemo<TaskInput | undefined>(
    () =>
      task
        ? { title: task.title, description: task.description, subjectId: task.subjectId, dueDate: task.dueDate, priority: task.priority }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task?.id],
  );

  if (!initial && status === 'loading') {
    return (
      <Screen>
        <ScreenHeader back backIcon="x" backLabel="Close" />
        <LoadingState rows={4} label="Loading task" />
      </Screen>
    );
  }

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
