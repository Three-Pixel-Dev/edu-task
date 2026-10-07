import { useTasks } from '@/hooks';
import { TaskFormScreen } from './TaskFormScreen';

export function CreateTaskScreen() {
  const { createTask } = useTasks();
  return (
    <TaskFormScreen
      mode="create"
      onSubmit={async (input) => {
        await createTask(input);
      }}
    />
  );
}
