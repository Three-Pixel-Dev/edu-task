import { useRef, useState } from 'react';
import { useTaskActions } from '@/hooks';
import { TaskFormScreen } from './TaskFormScreen';

export function CreateTaskScreen() {
  const { createTask, newTaskId } = useTaskActions();
  // The id is fixed for this form, so "try again" after a timeout can never
  // create a second copy of the task.
  const [taskId] = useState(() => newTaskId());
  const attempts = useRef(0);

  return (
    <TaskFormScreen
      mode="create"
      onSubmit={async (input) => {
        const isRetry = attempts.current > 0;
        attempts.current += 1;
        await createTask(taskId, input, isRetry);
      }}
    />
  );
}
