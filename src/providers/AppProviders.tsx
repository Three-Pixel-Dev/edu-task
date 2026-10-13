import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { QuizProvider } from './QuizProvider';
import { TasksProvider } from './TasksProvider';

/**
 * Global state is kept to what several screens share: the auth session and
 * two real-time Firestore listeners (tasks, quiz history). Everything else
 * (catalogue, questions, forms) is loaded per screen with hooks.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <TasksProvider>
        <QuizProvider>{children}</QuizProvider>
      </TasksProvider>
    </AuthProvider>
  );
}
