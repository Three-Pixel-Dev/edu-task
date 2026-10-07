import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { quizResultService, quizSessionService } from '@/services/quiz';
import { messageOf } from '@/services/storage';
import type { AsyncStatus, QuizResult, QuizSession } from '@/types';
import { AuthContext } from './AuthProvider';

export interface QuizContextValue {
  results: QuizResult[];
  sessions: QuizSession[];
  status: AsyncStatus;
  error: string | null;
  reload(): Promise<void>;
  saveSession(session: QuizSession): void;
  discardSession(quizId: string): void;
  submitResult(result: QuizResult): Promise<void>;
}

export const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: PropsWithChildren) {
  const userId = useContext(AuthContext)?.user?.id ?? null;
  const [results, setResults] = useState<QuizResult[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [status, setStatus] = useState<AsyncStatus>(userId ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const sessionsRef = useRef<QuizSession[]>([]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    try {
      const [loadedResults, loadedSessions] = await Promise.all([quizResultService.list(userId), quizSessionService.list(userId)]);
      setResults([...loadedResults].sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
      sessionsRef.current = loadedSessions;
      setSessions(loadedSessions);
      setStatus('success');
    } catch (e) {
      setError(messageOf(e, 'We couldn’t load your quiz history. Check your connection and try again.'));
      setStatus('error');
    }
  }, [userId]);

  // Reset synchronously when the signed-in user changes.
  const [loadedFor, setLoadedFor] = useState(userId);
  if (loadedFor !== userId) {
    setLoadedFor(userId);
    setResults([]);
    setSessions([]);
    setError(null);
    setStatus(userId ? 'loading' : 'idle');
  }

  // Initial load for the signed-in user. setState only runs in the async callbacks.
  useEffect(() => {
    sessionsRef.current = [];
    if (!userId) return;
    let cancelled = false;
    Promise.all([quizResultService.list(userId), quizSessionService.list(userId)]).then(
      ([loadedResults, loadedSessions]) => {
        if (cancelled) return;
        setResults([...loadedResults].sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
        sessionsRef.current = loadedSessions;
        setSessions(loadedSessions);
        setStatus('success');
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(messageOf(e, 'We couldn’t load your quiz history. Check your connection and try again.'));
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    await fetchAll();
  }, [fetchAll]);

  const persistSessions = useCallback(
    (next: QuizSession[]) => {
      sessionsRef.current = next;
      setSessions(next);
      if (userId) void quizSessionService.saveAll(userId, next);
    },
    [userId],
  );

  const saveSession = useCallback(
    (session: QuizSession) => {
      const others = sessionsRef.current.filter((s) => s.quizId !== session.quizId);
      persistSessions([session, ...others]);
    },
    [persistSessions],
  );

  const discardSession = useCallback(
    (quizId: string) => persistSessions(sessionsRef.current.filter((s) => s.quizId !== quizId)),
    [persistSessions],
  );

  const submitResult = useCallback(
    async (result: QuizResult) => {
      await quizResultService.save(result);
      setResults((prev) => [result, ...prev]);
      discardSession(`${result.subjectId}:L${result.level}`);
    },
    [discardSession],
  );

  const value = useMemo(
    () => ({ results, sessions, status, error, reload, saveSession, discardSession, submitResult }),
    [results, sessions, status, error, reload, saveSession, discardSession, submitResult],
  );
  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}
