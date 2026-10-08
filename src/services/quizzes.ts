import { collection, deleteDoc, doc, documentId, getDocs, onSnapshot, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';
import { QUIZ } from '@/constants/app';
import type { Question, QuizSession } from '@/types';
import { selectQuizQuestions, validateQuestion } from '@/utils/quiz';
import { bool, dataOf, num, str, strArray, toIso } from './converters';
import { toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

// ── Questions (read-only content) ────────────────────────────────────────
function toQuestion(id: string, data: Record<string, unknown>): Question {
  return {
    id,
    subjectId: str(data.subjectId),
    level: num(data.level),
    question: str(data.question),
    options: strArray(data.options),
    correctAnswer: str(data.correctAnswer),
    explanation: str(data.explanation),
    order: num(data.order, 999),
    isActive: bool(data.isActive, true),
  };
}

export interface QuestionPool {
  /** Valid, active questions for the subject + level. */
  questions: Question[];
  /** Documents skipped because they're malformed (e.g. correctAnswer not in options). */
  invalidCount: number;
}

/** All active questions for one subject level. */
export async function getQuestions(subjectId: string, level: number): Promise<QuestionPool> {
  try {
    const { db } = getFirebase();
    const snap = await withTimeout(
      getDocs(
        query(
          collection(db, COLLECTIONS.questions),
          where('subjectId', '==', subjectId),
          where('level', '==', level),
          where('isActive', '==', true),
        ),
      ),
      'read',
    );
    const all = snap.docs.map((d) => toQuestion(d.id, dataOf(d)));
    const questions = all.filter((q) => validateQuestion(q) === null).sort((a, b) => a.order - b.order);
    if (__DEV__ && questions.length < all.length) {
      all.forEach((q) => {
        const problem = validateQuestion(q);
        if (problem) console.warn(`[EduTask] Skipping question ${q.id}: ${problem}`);
      });
    }
    return { questions, invalidCount: all.length - questions.length };
  } catch (error) {
    throw toAppError(error, 'We couldn’t load the questions.');
  }
}

export type QuizStart =
  | { kind: 'ready'; questions: Question[]; available: number }
  | { kind: 'notEnough'; available: number; required: number };

/**
 * Loads the pool and picks QUIZ.questionsPerQuiz unique questions in random
 * order. Never starts an incomplete quiz — returns `notEnough` instead.
 * Question documents are only read, never modified.
 */
export async function startQuiz(subjectId: string, level: number): Promise<QuizStart> {
  const { questions } = await getQuestions(subjectId, level);
  const picked = selectQuizQuestions(questions, QUIZ.questionsPerQuiz);
  if (!picked) return { kind: 'notEnough', available: questions.length, required: QUIZ.questionsPerQuiz };
  return { kind: 'ready', questions: picked, available: questions.length };
}

/**
 * Re-loads the exact questions of a saved session, in the saved order.
 * Returns null if any question was removed or deactivated since.
 */
export async function getQuestionsByIds(ids: string[]): Promise<Question[] | null> {
  if (ids.length === 0 || ids.length > 30) return null; // Firestore "in" supports up to 30 values
  try {
    const { db } = getFirebase();
    const snap = await withTimeout(getDocs(query(collection(db, COLLECTIONS.questions), where(documentId(), 'in', ids))), 'read');
    const byId = new Map(snap.docs.map((d) => [d.id, toQuestion(d.id, dataOf(d))]));
    const ordered = ids.map((id) => byId.get(id));
    if (ordered.some((q) => !q || !q.isActive || validateQuestion(q) !== null)) return null;
    return ordered as Question[];
  } catch (error) {
    throw toAppError(error, 'We couldn’t load this quiz.');
  }
}

// ── Unfinished quiz sessions: users/{uid}/quizSessions/{subjectId__L{level}} ──
export const sessionIdFor = (subjectId: string, level: number) => `${subjectId}__L${level}`;

const sessionsCol = (uid: string) => collection(getFirebase().db, COLLECTIONS.users, uid, COLLECTIONS.quizSessions);

function toSession(id: string, data: Record<string, unknown>): QuizSession {
  const rawAnswers = typeof data.answers === 'object' && data.answers !== null ? (data.answers as Record<string, unknown>) : {};
  const answers = Object.fromEntries(Object.entries(rawAnswers).filter((e): e is [string, string] => typeof e[1] === 'string'));
  return {
    id,
    subjectId: str(data.subjectId),
    subjectName: str(data.subjectName),
    subjectCode: str(data.subjectCode),
    level: num(data.level, 1),
    questionIds: strArray(data.questionIds),
    answers,
    checked: strArray(data.checked),
    currentIndex: num(data.currentIndex),
    remainingSeconds: num(data.remainingSeconds, QUIZ.durationSeconds),
    resultId: str(data.resultId),
    startedAt: toIso(data.startedAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function subscribeToQuizSessions(uid: string, onNext: (sessions: QuizSession[]) => void, onError: (message: string) => void) {
  return onSnapshot(
    sessionsCol(uid),
    (snap) => onNext(snap.docs.map((d) => toSession(d.id, dataOf(d)))),
    (error) => onError(toAppError(error, 'We couldn’t load your unfinished quizzes.').message),
  );
}

/**
 * Saves progress so "Continue quiz" works. Fire-and-forget by design: it runs
 * on every answer, and a progress save that is still syncing must never block
 * the student. The quiz result itself is saved with confirmation.
 */
export function saveQuizSession(uid: string, session: Omit<QuizSession, 'updatedAt'>): Promise<void> {
  const { id, startedAt, ...rest } = session;
  return setDoc(doc(sessionsCol(uid), id), {
    ...rest,
    startedAt: Timestamp.fromDate(new Date(startedAt)),
    updatedAt: serverTimestamp(),
  }).catch((error: unknown) => {
    if (__DEV__) console.warn('[EduTask] Could not save quiz progress', error);
  });
}

export async function deleteQuizSession(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(sessionsCol(uid), sessionId)).catch(() => undefined);
}
