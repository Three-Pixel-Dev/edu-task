/**
 * Shared domain types. These mirror the planned Firestore collections:
 * users, subjectFields, subjects, quizzes, questions, quizResults, tasks.
 * Dates are stored as ISO-8601 strings so they serialise the same way in
 * AsyncStorage (mock mode) and Firestore.
 */

export type ISODateString = string;

// ── Users ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  program: string;
  year: number;
  createdAt: ISODateString;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  fullName: string;
}

// ── Quiz content ─────────────────────────────────────────────────────────
export type FieldIconName =
  | 'cpu'
  | 'code'
  | 'share-2'
  | 'shield'
  | 'bar-chart-2'
  | 'activity'
  | 'clipboard';

export interface SubjectField {
  id: string;
  name: string;
  description: string;
  icon: FieldIconName;
  order: number;
}

export interface Subject {
  id: string;
  fieldId: string;
  code: string;
  name: string;
  levelCount: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  /** Question banks are attached to a subject, or shared across a field. */
  subjectId?: string;
  fieldId: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
}

/** One quiz = one subject + one level, always QUESTIONS_PER_QUIZ questions. */
export interface Quiz {
  id: string;
  subjectId: string;
  level: number;
  questionIds: string[];
  durationSeconds: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface QuizResult {
  id: string;
  userId: string;
  subjectId: string;
  level: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  answers: QuizAnswer[];
  durationSeconds: number;
  completedAt: ISODateString;
}

/** An unfinished quiz the student can resume ("Continue quiz"). */
export interface QuizSession {
  quizId: string;
  subjectId: string;
  level: number;
  questionIds: string[];
  /** questionId → selected option id */
  selections: Record<string, string>;
  /** questionIds whose answer has been checked (feedback shown, answer locked) */
  checked: string[];
  currentIndex: number;
  remainingSeconds: number;
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
  completedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type TaskInput = Pick<Task, 'title' | 'description' | 'subjectId' | 'dueDate' | 'priority'>;

/** Derived, display-only urgency used for colour coding. */
export type TaskUrgency = 'overdue' | 'dueSoon' | 'upcoming' | 'completed';

export type TaskSection = 'today' | 'upcoming' | 'completed';

// ── Misc ─────────────────────────────────────────────────────────────────
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
