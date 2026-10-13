import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import * as authService from '@/services/auth';
import { messageOf } from '@/services/errors';
import { ensureUserProfile, subscribeToUserProfile } from '@/services/users';
import type { Credentials, RegisterInput, UserProfile } from '@/types';

/** `checking` = waiting for Firebase to restore the session (splash stays visible). */
export type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

export interface AuthContextValue {
  status: AuthStatus;
  /** Firebase Auth user — the UID here is the only identity the app trusts. */
  user: FirebaseUser | null;
  profile: UserProfile | null;
  profileStatus: 'loading' | 'ready' | 'error';
  profileError: string | null;
  register(input: RegisterInput): Promise<void>;
  login(credentials: Credentials): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<AuthContextValue['profileStatus']>('loading');
  const [profileError, setProfileError] = useState<string | null>(null);

  // Firebase restores the persisted session, then reports every sign-in/out.
  useEffect(
    () =>
      authService.onAuthChange((next) => {
        setUser(next);
        setStatus(next ? 'signedIn' : 'signedOut');
        setProfile(null);
        setProfileError(null);
        setProfileStatus('loading');
      }),
    [],
  );

  // Live profile document for the signed-in user (created if it's missing).
  const uid = user?.uid;
  useEffect(() => {
    if (!user || !uid) return;
    let cancelled = false;
    ensureUserProfile(user).catch((e: unknown) => {
      if (!cancelled) {
        setProfileError(messageOf(e, 'We couldn’t set up your profile.'));
        setProfileStatus('error');
      }
    });
    const unsubscribe = subscribeToUserProfile(
      uid,
      (next) => {
        if (cancelled || !next) return; // null = not created yet; ensureUserProfile is on it
        setProfile(next);
        setProfileStatus('ready');
        setProfileError(null);
      },
      (message) => {
        if (cancelled) return;
        setProfileError(message);
        setProfileStatus('error');
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // Re-run only when the account changes, not when the User object refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const register = useCallback(async (input: RegisterInput) => {
    await authService.register(input);
  }, []);
  const login = useCallback(async (credentials: Credentials) => {
    await authService.login(credentials);
  }, []);
  const logout = useCallback(() => authService.logout(), []);
  const resetPassword = useCallback((email: string) => authService.resetPassword(email), []);

  const value = useMemo(
    () => ({ status, user, profile, profileStatus, profileError, register, login, logout, resetPassword }),
    [status, user, profile, profileStatus, profileError, register, login, logout, resetPassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
