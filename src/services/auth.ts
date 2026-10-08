import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import type { Credentials, RegisterInput } from '@/types';
import { toAppError } from './errors';
import { getFirebase } from './firebase';
import { createUserProfile, trackProfileCreation } from './users';

/**
 * Firebase Authentication wrapper. Passwords go straight to Firebase Auth and
 * are never stored anywhere else. The Auth UID is the only identity source.
 */

export async function register({ displayName, email, password }: RegisterInput): Promise<FirebaseUser> {
  const { auth } = getFirebase();
  let resolveCreation: () => void = () => undefined;
  let rejectCreation: (e: unknown) => void = () => undefined;
  // Registered before the account exists so the auth listener waits for it.
  void trackProfileCreation(
    new Promise<void>((resolve, reject) => {
      resolveCreation = resolve;
      rejectCreation = reject;
    }),
  );
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await createUserProfile(credential.user.uid, displayName, credential.user.email ?? email);
    resolveCreation();
    return credential.user;
  } catch (error) {
    rejectCreation(error);
    throw toAppError(error, 'We couldn’t create your account. Please try again.');
  }
}

export async function login({ email, password }: Credentials): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(getFirebase().auth, email.trim(), password);
    return credential.user;
  } catch (error) {
    throw toAppError(error, 'We couldn’t log you in. Please try again.');
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(getFirebase().auth);
  } catch (error) {
    throw toAppError(error, 'We couldn’t log you out. Please try again.');
  }
}

export function getCurrentUser(): FirebaseUser | null {
  return getFirebase().auth.currentUser;
}

/** Fires once with the restored session (or null), then on every sign-in/out. */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(getFirebase().auth, callback);
}

/** Sends a reset email. Doesn't reveal whether an account exists for the email. */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebase().auth, email.trim());
  } catch (error) {
    const appError = toAppError(error);
    if (appError.code === 'auth/user-not-found') return;
    throw appError;
  }
}

/** The signed-in UID — throws if nobody is signed in. Use this, never a UID from the UI. */
export function requireUid(): string {
  const uid = getFirebase().auth.currentUser?.uid;
  if (!uid) throw toAppError({ code: 'unauthenticated' });
  return uid;
}
