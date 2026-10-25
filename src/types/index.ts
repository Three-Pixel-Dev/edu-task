/**
 * Domain types. Each one maps to a Firestore collection:
 *   users/{uid}                         → UserProfile
 *   subjectFields/{fieldId}             → SubjectField
 *   subjects/{subjectId}                → Subject
 *   questions/{questionId}              → Question (Multiple choice, A–D)
 *   (Quiz True/False statements are bundled in the app — see src/data/true-false/)
 *   quizResults/{resultId}              → QuizResult
 *   tasks/{taskId}                      → Task
 *   notifications/{notificationId}      → AppNotification (inbox)
 *   users/{uid}/quizSessions/{id}       → QuizSession (an unfinished quiz, for "Continue quiz")
 *
 * Firestore Timestamps are converted to ISO-8601 strings when read (see
 * services/converters.ts) so screens never deal with Timestamp objects.
 */

export type ISODateString = string;

// ── Users ────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  displayName: string;
}

// ── Quiz content (read-only for students) ────────────────────────────────
/**
 * The two kinds of practice. Shown in the UI as "Multiple choice" (A–D,
 * `questions` collection) and "Quiz" (True / False, local JSON bank).
 * Documents saved before Quiz existed have no type and count as multipleChoice.
 */
export type QuizType = 'multipleChoice' | 'trueFalse';

export interface SubjectField {
  id: string;
  name: string;
  description: string;
  /** Feather icon name, e.g. "cpu". Unknown names fall back to a book icon. */
  icon: string;
  order: number;
}

export interface Subject {
  id: string;
  fieldId: string;
  code: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface Question {
  id: string;
  subjectId: string;
  level: number;
  question: string;
  options: string[];
  /** Must equal one of `options`. */
  correctAnswer: string;
  explanation: string;
  order: number;
  isActive: boolean;
}

// ── Quiz attempts ────────────────────────────────────────────────────────
export interface QuizAnswer {
  questionId: string;
  /** Snapshot of the question text so history stays readable if content changes. */
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizType: QuizType;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  level: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  percentage: number;
  durationSeconds: number;
  answers: QuizAnswer[];
  completedAt: ISODateString;
}

/** An unfinished quiz, saved so the student can leave and continue later. */
export interface QuizSession {
  id: string;
  quizType: QuizType;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  level: number;
  questionIds: string[];
  /** questionId → selected option text */
  answers: Record<string, string>;
  /** questionIds whose answer has been checked (feedback shown, answer locked) */
  checked: string[];
  currentIndex: number;
  remainingSeconds: number;
  /** Pre-generated quizResults document id — makes submission idempotent. */
  resultId: string;
  startedAt: ISODateString;
  updatedAt: ISODateString;
}

export type LevelStatus = 'completed' | 'current' | 'available';

export interface LevelProgress {
  level: number;
  status: LevelStatus;
  bestScore?: number;
  /** 1-based question number when status is "current". */
  currentQuestion?: number;
}

// ── Tasks ────────────────────────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: ISODateString;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** True while a local change hasn't been confirmed by the server yet. */
  hasPendingWrites: boolean;
}

export type TaskInput = Pick<Task, 'title' | 'description' | 'subjectId' | 'dueDate' | 'priority'>;

/** Derived, display-only urgency used for colour coding. */
export type TaskUrgency = 'overdue' | 'dueSoon' | 'upcoming' | 'completed';

export type TaskSection = 'today' | 'upcoming' | 'completed';

// ── Notifications (inbox) ────────────────────────────────────────────────
export type NotificationType = 'taskDue' | 'taskOverdue' | 'quizCompleted';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  /** Stable key to avoid duplicates, e.g. taskOverdue:{taskId} or quizCompleted:{resultId}. */
  dedupeKey: string;
  createdAt: ISODateString;
  taskId?: string;
  resultId?: string;
  subjectId?: string;
  level?: number;
  quizType?: QuizType;
}

export type NotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  dedupeKey: string;
  taskId?: string;
  resultId?: string;
  subjectId?: string;
  level?: number;
  quizType?: QuizType;
};

// ── Misc ─────────────────────────────────────────────────────────────────
export type AsyncStatus = 'loading' | 'success' | 'error';
