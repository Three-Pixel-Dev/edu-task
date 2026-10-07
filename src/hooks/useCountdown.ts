import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Counts down once per second while `running`. Time spent with the app in the
 * background is subtracted when it returns to the foreground, so the timer
 * stays honest without background tasks. Resets when `initialSeconds` changes.
 */
export function useCountdown(initialSeconds: number, running: boolean) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [baseline, setBaseline] = useState(initialSeconds);
  const backgroundedAt = useRef<number | null>(null);

  // Adjust state when the starting value changes (e.g. a resumed session loads).
  if (baseline !== initialSeconds) {
    setBaseline(initialSeconds);
    setRemaining(initialSeconds);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        backgroundedAt.current = Date.now();
      } else if (backgroundedAt.current) {
        const away = Math.floor((Date.now() - backgroundedAt.current) / 1000);
        backgroundedAt.current = null;
        setRemaining((s) => Math.max(0, s - away));
      }
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [running]);

  return remaining;
}
