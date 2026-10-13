import { collection, doc, getDoc, getDocFromServer, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import type { QuizAnswer, QuizResult } from '@/types';
import { bool, dataOf, num, str, toIso } from './converters';
import { AppError, toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

/** Pre-generates a result id when a quiz starts, so submission is idempotent. */
export const newResultId = () => doc(collection(getFirebase().db, COLLECTIONS.quizResults)).id;

function toAnswers(value: unknown): QuizAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
    .map((a) => ({
      questionId: str(a.questionId),
      question: str(a.question),
      selectedAnswer: str(a.selectedAnswer),
      correctAnswer: str(a.correctAnswer),
      isCorrect: bool(a.isCorrect),
    }));
}

function toResult(id: string, data: Record<string, unknown>): QuizResult {
  return {
    id,
    userId: str(data.userId),
    subjectId: str(data.subjectId),
    subjectName: str(data.subjectName, 'Subject'),
    subjectCode: str(data.subjectCode),
    level: num(data.level, 1),
    totalQuestions: num(data.totalQuestions),
    correctAnswers: num(data.correctAnswers),
    incorrectAnswers: num(data.incorrectAnswers),
    score: num(data.score),
    percentage: num(data.percentage),
    durationSeconds: num(data.durationSeconds),
    answers: toAnswers(data.answers),
    completedAt: toIso(data.completedAt),
  };
}

export type NewQuizResult = Omit<QuizResult, 'completedAt' | 'userId'>;

/**
 * Saves the result and removes the unfinished session in one atomic batch.
 * `userId` always comes from the signed-in user (passed in by the caller from
 * Firebase Auth), and the rules reject any other value.
 *
 * Idempotent: the id is fixed per quiz session, so a retry after a timeout
 * first checks the server and never creates a second result.
 */
export async function saveQuizResult(uid: string, result: NewQuizResult, sessionId: string, isRetry: boolean): Promise<void> {
  const { db } = getFirebase();
  const resultRef = doc(db, COLLECTIONS.quizResults, result.id);
  try {
    if (isRetry) {
      // getDocFromServer ignores the local cache (which may hold our own
      // unconfirmed write), so "exists" really means "saved".
      const existing = await withTimeout(getDocFromServer(resultRef), 'read');
      if (existing.exists()) return;
    }
    const { id: _id, ...fields } = result;
    const batch = writeBatch(db);
    batch.set(resultRef, { ...fields, userId: uid, completedAt: serverTimestamp() });
    batch.delete(doc(db, COLLECTIONS.users, uid, COLLECTIONS.quizSessions, sessionId));
    await withTimeout(
      batch.commit(),
      'write',
      'We couldn’t reach the server, so your result hasn’t been saved yet. Check your connection and tap Submit again — your answers are kept.',
    );
  } catch (error) {
    throw toAppError(error, 'We couldn’t submit your quiz. Your answers are kept — try again.');
  }
}

/** Live quiz history for one user, newest first. Needs the (userId, completedAt desc) index. */
export function subscribeToQuizHistory(uid: string, onNext: (results: QuizResult[]) => void, onError: (message: string) => void) {
  const q = query(collection(getFirebase().db, COLLECTIONS.quizResults), where('userId', '==', uid), orderBy('completedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onNext(snap.docs.map((d) => toResult(d.id, dataOf(d)))),
    (error) => onError(toAppError(error, 'We couldn’t load your quiz history.').message),
  );
}

export async function getQuizResult(uid: string, resultId: string): Promise<QuizResult> {
  try {
    const snap = await withTimeout(getDoc(doc(getFirebase().db, COLLECTIONS.quizResults, resultId)), 'read');
    if (!snap.exists()) throw new AppError('This quiz result doesn’t exist.', 'not-found');
    const result = toResult(snap.id, dataOf(snap));
    if (result.userId !== uid) throw new AppError('This quiz result belongs to another account.', 'permission-denied');
    return result;
  } catch (error) {
    throw toAppError(error, 'We couldn’t load this quiz result.');
  }
}
