import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** UID of the signed-in Firebase user. Only use inside the signed-in area. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('useUid used while signed out');
  return user.uid;
}

/** users/{uid} for the signed-in user, with loading / error state. */
export function useProfile() {
  const { profile, profileStatus, profileError, user } = useAuth();
  return {
    profile,
    status: profileStatus,
    error: profileError,
    /** Best available name while the profile document loads. */
    displayName: profile?.displayName ?? user?.displayName ?? '',
    email: profile?.email ?? user?.email ?? '',
  };
}
