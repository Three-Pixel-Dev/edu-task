import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { subscribeToQuizHistory } from '@/services/quizResults';
import { subscribeToQuizSessions } from '@/services/quizzes';
import type { AsyncStatus, QuizResult, QuizSession } from '@/types';
import { AuthContext } from './AuthProvider';

export interface QuizContextValue {
  /** quizResults where userId == uid, newest first. */
  results: QuizResult[];
  /** Unfinished quizzes (users/{uid}/quizSessions). */
  sessions: QuizSession[];
  status: AsyncStatus;
  error: string | null;
  retry(): void;
}

export const QuizContext = createContext<QuizContextValue | null>(null);

interface Slice<T> {
  key: string;
  items: T[];
  error: string | null;
}

/** Real-time quiz history + unfinished sessions for the signed-in user. */
export function QuizProvider({ children }: PropsWithChildren) {
  const uid = useContext(AuthContext)?.user?.uid ?? null;
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Slice<QuizResult> | null>(null);
  const [sessions, setSessions] = useState<Slice<QuizSession> | null>(null);
  const key = `${uid}:${attempt}`;

  useEffect(() => {
    if (!uid) return;
    const stopResults = subscribeToQuizHistory(
      uid,
      (items) => setResults({ key, items, error: null }),
      (error) => setResults({ key, items: [], error }),
    );
    const stopSessions = subscribeToQuizSessions(
      uid,
      (items) => setSessions({ key, items, error: null }),
      (error) => setSessions({ key, items: [], error }),
    );
    return () => {
      stopResults();
      stopSessions();
    };
  }, [uid, key]);

  const value = useMemo<QuizContextValue>(() => {
    const r = results?.key === key ? results : null;
    const s = sessions?.key === key ? sessions : null;
    const error = r?.error ?? s?.error ?? null;
    return {
      results: r?.items ?? [],
      sessions: s?.items ?? [],
      status: error ? 'error' : r && s ? 'success' : 'loading',
      error,
      retry: () => setAttempt((n) => n + 1),
    };
  }, [results, sessions, key]);

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}
