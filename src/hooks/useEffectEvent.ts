import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * Stand-in for React 19.2's `useEffectEvent` (Expo SDK 54 ships React 19.1).
 * Returns a stable function that always calls the latest `fn`; only call it
 * from effects or event handlers, never during render.
 */
export function useEffectEvent<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R {
  const ref = useRef(fn);
  useInsertionEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}
