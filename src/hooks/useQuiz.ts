import { useContext, useMemo } from 'react';
import { QUIZ } from '@/constants/app';
import { findSubject } from '@/data';
import { QuizContext } from '@/store/QuizProvider';
import type { Subject } from '@/types';
import { levelProgressFor, percentageOf } from '@/utils/quiz';

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used inside <QuizProvider>');
  return ctx;
}

/** Most recently touched unfinished quiz, for the "Continue quiz" cards. */
export function useActiveSession() {
  const { sessions } = useQuiz();
  return useMemo(() => {
    const latest = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (!latest) return null;
    const subject = findSubject(latest.subjectId);
    return subject ? { session: latest, subject } : null;
  }, [sessions]);
}

export function useQuizStats() {
  const { results } = useQuiz();
  return useMemo(() => {
    const attempts = results.length;
    const average = attempts ? Math.round(results.reduce((sum, r) => sum + percentageOf(r), 0) / attempts) : 0;
    const levelsCompleted = new Set(results.map((r) => `${r.subjectId}:${r.level}`)).size;
    return { attempts, average, levelsCompleted };
  }, [results]);
}

export function useLevelProgress(subject: Subject | undefined) {
  const { results, sessions } = useQuiz();
  return useMemo(
    () => (subject ? levelProgressFor(subject.id, subject.levelCount, results, sessions) : []),
    [subject, results, sessions],
  );
}

export interface RecentSubject {
  subject: Subject;
  /** Highest level touched (completed or in progress). */
  level: number;
  levelsCompleted: number;
  lastActivity: string;
}

/** Subjects the student practised most recently, newest first. */
export function useRecentSubjects(limit = 3) {
  const { results, sessions } = useQuiz();
  return useMemo(() => {
    const map = new Map<string, RecentSubject>();
    const touch = (subjectId: string, level: number, at: string, completed: boolean) => {
      const subject = findSubject(subjectId);
      if (!subject) return;
      const existing = map.get(subjectId);
      const completedLevels = completed ? 1 : 0;
      if (!existing) {
        map.set(subjectId, { subject, level, levelsCompleted: completedLevels, lastActivity: at });
        return;
      }
      existing.level = Math.max(existing.level, level);
      existing.levelsCompleted += completedLevels;
      if (at > existing.lastActivity) existing.lastActivity = at;
    };
    sessions.forEach((s) => touch(s.subjectId, s.level, s.updatedAt, false));
    const seen = new Set<string>();
    results.forEach((r) => {
      const key = `${r.subjectId}:${r.level}`;
      touch(r.subjectId, r.level, r.completedAt, !seen.has(key));
      seen.add(key);
    });
    return [...map.values()]
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
      .slice(0, limit)
      .map((r) => ({ ...r, progress: Math.min(1, r.levelsCompleted / QUIZ.levelCount) }));
  }, [results, sessions, limit]);
}
