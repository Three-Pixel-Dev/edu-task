import { useLocalSearchParams } from 'expo-router';
import { useContext, useMemo } from 'react';
import { QUIZ } from '@/constants/app';
import { QuizContext } from '@/providers/QuizProvider';
import type { QuizResult, QuizSession, QuizType } from '@/types';
import { levelProgressFor, ofType } from '@/utils/quiz';

/** Real-time quiz history + unfinished sessions (from QuizProvider), all quiz types. */
export function useQuizHistory() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuizHistory must be used inside <QuizProvider>');
  return ctx;
}

/**
 * The quiz type of the current flow, read from the `type` route param.
 * Multiple choice routes have no param, so they keep their original URLs.
 */
export function useQuizType(): QuizType {
  const { type } = useLocalSearchParams<{ type?: string }>();
  return type === 'trueFalse' ? 'trueFalse' : 'multipleChoice';
}

/** History limited to one quiz type (or every type when `quizType` is omitted). */
export function useQuizHistoryFor(quizType?: QuizType) {
  const ctx = useQuizHistory();
  return useMemo(
    () =>
      quizType
        ? { ...ctx, results: ofType(ctx.results, quizType), sessions: ofType(ctx.sessions, quizType) }
        : ctx,
    [ctx, quizType],
  );
}

/** Most recently touched unfinished quiz — powers the "Continue" cards. */
export function useActiveSession(quizType?: QuizType) {
  const { sessions } = useQuizHistoryFor(quizType);
  return useMemo(() => [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null, [sessions]);
}

export function statsOf(results: readonly QuizResult[]) {
  const attempts = results.length;
  const average = attempts ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / attempts) : 0;
  const levelsCompleted = new Set(results.map((r) => `${r.quizType}:${r.subjectId}:${r.level}`)).size;
  const best = attempts ? Math.max(...results.map((r) => r.percentage)) : 0;
  return { attempts, average, levelsCompleted, best };
}

/** Attempts, average, levels done and best score — for one quiz type, or all of them. */
export function useQuizStats(quizType?: QuizType) {
  const { results } = useQuizHistoryFor(quizType);
  return useMemo(() => statsOf(results), [results]);
}

export function useLevelProgress(subjectId: string, quizType: QuizType = 'multipleChoice') {
  const { results, sessions } = useQuizHistory();
  return useMemo(() => levelProgressFor(subjectId, results, sessions, quizType), [subjectId, results, sessions, quizType]);
}

export interface RecentSubject {
  quizType: QuizType;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  /** Highest level touched (completed or in progress). */
  level: number;
  levelsCompleted: number;
  progress: number;
  lastActivity: string;
}

/** Subject + quiz type pairs practised most recently (from results and sessions), newest first. */
export function useRecentSubjects(limit = 3, quizType?: QuizType) {
  const { results, sessions } = useQuizHistoryFor(quizType);
  return useMemo(() => {
    const map = new Map<string, RecentSubject & { completed: Set<number> }>();
    const touch = (item: QuizResult | QuizSession, at: string, completed: boolean) => {
      const key = `${item.quizType}:${item.subjectId}`;
      const entry = map.get(key) ?? {
        quizType: item.quizType,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        subjectCode: item.subjectCode,
        level: item.level,
        levelsCompleted: 0,
        progress: 0,
        lastActivity: at,
        completed: new Set<number>(),
      };
      entry.level = Math.max(entry.level, item.level);
      if (completed) entry.completed.add(item.level);
      if (at > entry.lastActivity) entry.lastActivity = at;
      map.set(key, entry);
    };
    sessions.forEach((s) => touch(s, s.updatedAt, false));
    results.forEach((r) => touch(r, r.completedAt, true));
    return [...map.values()]
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
      .slice(0, limit)
      .map(({ completed, ...rest }) => ({
        ...rest,
        levelsCompleted: completed.size,
        progress: completed.size / QUIZ.levelCount,
      }));
  }, [results, sessions, limit]);
}
