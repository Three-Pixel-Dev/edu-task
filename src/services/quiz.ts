import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { STORAGE_KEYS } from '@/constants/app';
import {
  findField,
  findSubject,
  mockUsers,
  questionBankFor,
  questionsByIds,
  seedQuizResults,
  seedQuizSessions,
  subjectFields,
  subjectsInField,
} from '@/data';
import type { Question, Quiz, QuizResult, QuizSession, Subject, SubjectField } from '@/types';
import { buildQuiz } from '@/utils/quiz';
import { COLLECTIONS, getFirebase, isFirebaseConfigured } from './firebase';
import { AppError, mockDelay, storage, userKey } from './storage';

/**
 * Quiz content (fields, subjects, questions) is bundled with the app for now.
 * The functions are async so they can later read the `subjectFields`,
 * `subjects` and `questions` collections without changing any screen.
 */
export const quizContent = {
  async getFields(): Promise<SubjectField[]> {
    await mockDelay(200);
    return [...subjectFields].sort((a, b) => a.order - b.order);
  },

  async getField(fieldId: string): Promise<SubjectField> {
    const field = findField(fieldId);
    if (!field) throw new AppError('We couldn’t find that field.', 'quiz/field-not-found');
    return field;
  },

  async getSubjects(fieldId: string): Promise<Subject[]> {
    await mockDelay(250);
    return subjectsInField(fieldId);
  },

  async getSubject(subjectId: string): Promise<Subject> {
    const subject = findSubject(subjectId);
    if (!subject) throw new AppError('We couldn’t find that subject.', 'quiz/subject-not-found');
    return subject;
  },

  async getQuiz(subjectId: string, level: number): Promise<{ quiz: Quiz; questions: Question[] }> {
    await mockDelay(300);
    const subject = await quizContent.getSubject(subjectId);
    if (level < 1 || level > subject.levelCount) throw new AppError('That level doesn’t exist.', 'quiz/level-not-found');
    const quiz = buildQuiz(subject, level, questionBankFor(subject));
    return { quiz, questions: questionsByIds(quiz.questionIds) };
  },

  /** Rehydrates the questions of a saved session or result. */
  getQuestions(ids: string[]): Question[] {
    return questionsByIds(ids);
  },
};

// ── Quiz results ─────────────────────────────────────────────────────────
export interface QuizResultService {
  list(userId: string): Promise<QuizResult[]>;
  save(result: QuizResult): Promise<void>;
}

const isDemoUser = (userId: string) => mockUsers.some((u) => u.id === userId);

const mockResults: QuizResultService = {
  async list(userId) {
    const key = userKey(STORAGE_KEYS.quizResults, userId);
    const stored = await storage.get<QuizResult[]>(key);
    if (stored) return stored;
    const initial = isDemoUser(userId) ? seedQuizResults(userId) : [];
    await storage.set(key, initial);
    return initial;
  },
  async save(result) {
    await mockDelay(250);
    const existing = await mockResults.list(result.userId);
    await storage.set(userKey(STORAGE_KEYS.quizResults, result.userId), [result, ...existing]);
  },
};

const firestoreResults: QuizResultService = {
  async list(userId) {
    const { db } = getFirebase();
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.quizResults), where('userId', '==', userId)));
    return snapshot.docs.map((d) => ({ ...(d.data() as Omit<QuizResult, 'id'>), id: d.id }));
  },
  async save(result) {
    const { db } = getFirebase();
    const { id, ...data } = result;
    await setDoc(doc(db, COLLECTIONS.quizResults, id), data);
  },
};

export const quizResultService: QuizResultService = isFirebaseConfigured ? firestoreResults : mockResults;

// ── In-progress sessions (device-local, so a quiz can be resumed) ────────
export const quizSessionService = {
  async list(userId: string): Promise<QuizSession[]> {
    const key = userKey(STORAGE_KEYS.quizSessions, userId);
    const stored = await storage.get<QuizSession[]>(key);
    if (stored) return stored;
    const initial = isDemoUser(userId) ? seedQuizSessions() : [];
    await storage.set(key, initial);
    return initial;
  },
  async saveAll(userId: string, sessions: QuizSession[]) {
    await storage.set(userKey(STORAGE_KEYS.quizSessions, userId), sessions);
  },
};
