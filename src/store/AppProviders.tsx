import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { QuizProvider } from './QuizProvider';
import { TasksProvider } from './TasksProvider';

/**
 * App-wide state uses React Context — enough for this app's size, no Redux.
 * Auth sits on top; Tasks and Quiz reload whenever the signed-in user changes.
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
