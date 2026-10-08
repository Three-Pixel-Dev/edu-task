import { READ_TIMEOUT_MS, WRITE_TIMEOUT_MS } from '@/constants/app';

/** An error whose message is safe to show to students. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code = 'app/error',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const OFFLINE_MESSAGE = 'You appear to be offline. Check your connection and try again.';

const codeOf = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

/**
 * Maps Firebase Auth / Firestore error codes to friendly copy. `fallback`
 * describes what failed ("We couldn’t save this task.").
 */
export function toAppError(error: unknown, fallback = 'Something went wrong. Please try again.'): AppError {
  if (error instanceof AppError) return error;
  const code = codeOf(error);
  switch (code) {
    // ── Auth ──
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return new AppError('That email and password don’t match. Check them and try again.', code);
    case 'auth/invalid-email':
      return new AppError('That doesn’t look like a valid email address.', code);
    case 'auth/email-already-in-use':
      return new AppError('An account with this email already exists. Try logging in instead.', code);
    case 'auth/weak-password':
      return new AppError('Choose a stronger password (at least 8 characters).', code);
    case 'auth/user-disabled':
      return new AppError('This account has been disabled. Contact your administrator.', code);
    case 'auth/too-many-requests':
      return new AppError('Too many attempts. Wait a moment and try again.', code);
    case 'auth/network-request-failed':
      return new AppError(OFFLINE_MESSAGE, code);
    case 'auth/operation-not-allowed':
      return new AppError('Email/password sign-in isn’t enabled for this Firebase project yet.', code);

    // ── Firestore ──
    case 'permission-denied':
      return new AppError('You don’t have permission to do that. If this keeps happening, check that the Firestore rules are deployed.', code);
    case 'unavailable':
    case 'deadline-exceeded':
      return new AppError(OFFLINE_MESSAGE, code);
    case 'failed-precondition':
      // Usually a missing composite index (see firestore.indexes.json).
      return new AppError(`${fallback} The database is missing a required index — deploy firestore.indexes.json.`, code);
    case 'not-found':
      return new AppError('This item no longer exists.', code);
    case 'unauthenticated':
      return new AppError('Your session has expired. Please log in again.', code);
    case 'resource-exhausted':
      return new AppError('The database is busy right now. Please try again shortly.', code);
    default:
      if (__DEV__ && code) console.warn('[EduTask] Unmapped Firebase error', code, error);
      return new AppError(fallback, code || 'app/unknown');
  }
}

export const messageOf = (error: unknown, fallback?: string) => toAppError(error, fallback).message;

/**
 * Rejects if `promise` doesn't settle in time. With Firestore's memory cache a
 * write made while offline never resolves until the server confirms it, so
 * this is how we avoid an endless spinner — and avoid claiming success.
 */
export function withTimeout<T>(promise: Promise<T>, kind: 'read' | 'write', message?: string): Promise<T> {
  const ms = kind === 'write' ? WRITE_TIMEOUT_MS : READ_TIMEOUT_MS;
  const text =
    message ??
    (kind === 'write'
      ? 'We couldn’t reach the server, so this hasn’t been confirmed as saved. Check your connection and try again.'
      : 'Loading is taking too long. Check your connection and try again.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AppError(text, 'app/timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
