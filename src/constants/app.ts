export const APP_NAME = 'EduTask';

export const QUIZ = {
  questionsPerQuiz: 10,
  levelCount: 15,
  durationSeconds: 10 * 60,
  /** The timer turns amber below this many seconds. */
  lowTimeSeconds: 2 * 60,
  /** Score (out of questionsPerQuiz) that counts as passing a level. */
  passMark: 6,
} as const;

export const TASKS = {
  /** A pending task due within this many hours counts as "due soon". */
  dueSoonHours: 24,
  titleMaxLength: 80,
  descriptionMaxLength: 500,
} as const;

export const STORAGE_KEYS = {
  session: 'edutask.session.v1',
  users: 'edutask.users.v1',
  tasks: 'edutask.tasks.v1',
  quizResults: 'edutask.quizResults.v1',
  quizSessions: 'edutask.quizSessions.v1',
  preferences: 'edutask.preferences.v1',
} as const;

/** Simulated latency for mock services so loading states are visible in development. */
export const MOCK_LATENCY_MS = 350;
