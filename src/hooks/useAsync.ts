import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { messageOf } from '@/services/errors';
import type { AsyncStatus } from '@/types';

type Key = string | number | boolean | null | undefined;

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Runs an async loader and exposes loading / error / data plus `reload` for
 * retry buttons. `deps` are primitive values (ids, params); when they change
 * the loader runs again and stale responses are ignored.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: Key[], errorMessage?: string) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = JSON.stringify([...deps, attempt]);

  const load = useEffectEvent(() => loader());

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setSettled({ key, data, error: null });
      },
      (e: unknown) => {
        if (!cancelled) setSettled({ key, data: null, error: messageOf(e, errorMessage) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, errorMessage]);

  const current = settled?.key === key ? settled : null;
  const status: AsyncStatus = !current ? 'loading' : current.error ? 'error' : 'success';
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, data: current?.data ?? null, error: current?.error ?? null, reload };
}
