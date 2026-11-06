import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { NotificationEffects } from './NotificationEffects';
import { NotificationsProvider } from './NotificationsProvider';
import { QuizProvider } from './QuizProvider';
import { TasksProvider } from './TasksProvider';

/**
 * Global state is kept to what several screens share: the auth session and
 * real-time Firestore listeners (tasks, quiz history, notifications).
 * Everything else (catalogue, questions, forms) is loaded per screen with hooks.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <TasksProvider>
        <NotificationsProvider>
          <NotificationEffects />
          <QuizProvider>{children}</QuizProvider>
        </NotificationsProvider>
      </TasksProvider>
    </AuthProvider>
  );
}
