import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '@/services/auth';
import type { Credentials, RegisterInput, User } from '@/types';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login(credentials: Credentials): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');

  useEffect(() => {
    let active = true;
    authService
      .restore()
      .catch(() => null)
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setStatus(restored ? 'signedIn' : 'signedOut');
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const signedIn = await authService.login(credentials);
    setUser(signedIn);
    setStatus('signedIn');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await authService.register(input);
    setUser(created);
    setStatus('signedIn');
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const resetPassword = useCallback((email: string) => authService.resetPassword(email), []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, resetPassword }),
    [status, user, login, register, logout, resetPassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
