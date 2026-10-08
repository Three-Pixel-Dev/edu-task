import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AUTH } from '@/constants/app';
import type { UserProfile } from '@/types';
import { dataOf, str, toIso } from './converters';
import { toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

const userRef = (uid: string) => doc(getFirebase().db, COLLECTIONS.users, uid);

/**
 * While register() is creating the profile, the auth listener also fires.
 * This promise lets ensureUserProfile() wait instead of racing to create the
 * same document (the second create would be rejected by the rules).
 */
let profileCreation: Promise<void> | null = null;

export function trackProfileCreation(work: Promise<void>) {
  // Swallow here: register() reports its own errors, and ensureUserProfile()
  // re-checks the document afterwards either way.
  profileCreation = work
    .catch(() => undefined)
    .finally(() => {
      profileCreation = null;
    });
  return profileCreation;
}

/** Creates users/{uid}. Only uid, displayName, email and timestamps — never passwords. */
export async function createUserProfile(uid: string, displayName: string, email: string): Promise<void> {
  await withTimeout(
    setDoc(userRef(uid), {
      uid,
      displayName: displayName.trim().slice(0, AUTH.displayNameMaxLength),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    'write',
  );
}

/**
 * Makes sure a signed-in user has a profile document — covers accounts whose
 * profile write failed during registration (e.g. lost connection).
 */
export async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  if (profileCreation) await profileCreation;
  const snap = await withTimeout(getDoc(userRef(user.uid)), 'read');
  if (snap.exists()) return;
  const fallbackName = user.displayName ?? user.email?.split('@')[0] ?? 'Student';
  await createUserProfile(user.uid, fallbackName, user.email ?? '');
}

function toProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    displayName: str(data.displayName, 'Student'),
    email: str(data.email),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await withTimeout(getDoc(userRef(uid)), 'read');
  return snap.exists() ? toProfile(uid, dataOf(snap)) : null;
}

/** Live profile updates. `onNext(null)` means the document doesn't exist yet. */
export function subscribeToUserProfile(uid: string, onNext: (profile: UserProfile | null) => void, onError: (message: string) => void) {
  return onSnapshot(
    userRef(uid),
    (snap) => onNext(snap.exists() ? toProfile(uid, dataOf(snap)) : null),
    (error) => onError(toAppError(error, 'We couldn’t load your profile.').message),
  );
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  try {
    await withTimeout(updateDoc(userRef(uid), { displayName: displayName.trim().slice(0, AUTH.displayNameMaxLength), updatedAt: serverTimestamp() }), 'write');
  } catch (error) {
    throw toAppError(error, 'We couldn’t update your name.');
  }
}
