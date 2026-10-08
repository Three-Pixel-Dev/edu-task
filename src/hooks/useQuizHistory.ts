import { useContext, useMemo } from 'react';
import { QUIZ } from '@/constants/app';
import { QuizContext } from '@/providers/QuizProvider';
import { levelProgressFor } from '@/utils/quiz';

/** Real-time quiz history + unfinished sessions (from QuizProvider). */
export function useQuizHistory() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuizHistory must be used inside <QuizProvider>');
  return ctx;
}

/** Most recently touched unfinished quiz — powers the "Continue quiz" cards. */
export function useActiveSession() {
  const { sessions } = useQuizHistory();
  return useMemo(() => [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null, [sessions]);
}

export function useQuizStats() {
  const { results } = useQuizHistory();
  return useMemo(() => {
    const attempts = results.length;
    const average = attempts ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / attempts) : 0;
    const levelsCompleted = new Set(results.map((r) => `${r.subjectId}:${r.level}`)).size;
    const best = attempts ? Math.max(...results.map((r) => r.percentage)) : 0;
    return { attempts, average, levelsCompleted, best };
  }, [results]);
}

export function useLevelProgress(subjectId: string) {
  const { results, sessions } = useQuizHistory();
  return useMemo(() => levelProgressFor(subjectId, results, sessions), [subjectId, results, sessions]);
}

export interface RecentSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  /** Highest level touched (completed or in progress). */
  level: number;
  levelsCompleted: number;
  progress: number;
  lastActivity: string;
}

/** Subjects practised most recently (from results and sessions), newest first. */
export function useRecentSubjects(limit = 3) {
  const { results, sessions } = useQuizHistory();
  return useMemo(() => {
    const map = new Map<string, RecentSubject & { completed: Set<number> }>();
    const touch = (subjectId: string, subjectName: string, subjectCode: string, level: number, at: string, completed: boolean) => {
      const entry =
        map.get(subjectId) ??
        { subjectId, subjectName, subjectCode, level, levelsCompleted: 0, progress: 0, lastActivity: at, completed: new Set<number>() };
      entry.level = Math.max(entry.level, level);
      if (completed) entry.completed.add(level);
      if (at > entry.lastActivity) entry.lastActivity = at;
      map.set(subjectId, entry);
    };
    sessions.forEach((s) => touch(s.subjectId, s.subjectName, s.subjectCode, s.level, s.updatedAt, false));
    results.forEach((r) => touch(r.subjectId, r.subjectName, r.subjectCode, r.level, r.completedAt, true));
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
