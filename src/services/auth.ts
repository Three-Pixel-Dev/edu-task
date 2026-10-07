import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { STORAGE_KEYS } from '@/constants/app';
import { mockUsers, type MockUserRecord } from '@/data';
import type { Credentials, RegisterInput, User } from '@/types';
import { createId, nowIso } from '@/utils/format';
import { COLLECTIONS, getFirebase, isFirebaseConfigured } from './firebase';
import { AppError, mockDelay, storage } from './storage';

export interface AuthService {
  /** Restores a persisted session on app start (session persistence). */
  restore(): Promise<User | null>;
  login(credentials: Credentials): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
  /** Sends a reset link (Firebase) — mock mode only simulates it. */
  resetPassword(email: string): Promise<void>;
}

const INVALID_LOGIN = 'That email and password don’t match. Check them and try again.';

// ── Mock implementation (AsyncStorage) ───────────────────────────────────
async function loadMockUsers(): Promise<MockUserRecord[]> {
  const stored = await storage.get<MockUserRecord[]>(STORAGE_KEYS.users);
  if (stored) return stored;
  await storage.set(STORAGE_KEYS.users, mockUsers);
  return mockUsers;
}

const toUser = ({ password: _password, ...user }: MockUserRecord): User => user;

const mockAuth: AuthService = {
  async restore() {
    const userId = await storage.get<string>(STORAGE_KEYS.session);
    if (!userId) return null;
    const users = await loadMockUsers();
    const record = users.find((u) => u.id === userId);
    return record ? toUser(record) : null;
  },

  async login({ email, password }) {
    await mockDelay();
    const users = await loadMockUsers();
    const record = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!record || record.password !== password) throw new AppError(INVALID_LOGIN, 'auth/invalid-credential');
    await storage.set(STORAGE_KEYS.session, record.id);
    return toUser(record);
  },

  async register({ fullName, email, password }) {
    await mockDelay();
    const users = await loadMockUsers();
    const normalised = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalised)) {
      throw new AppError('An account with this email already exists. Try logging in.', 'auth/email-already-in-use');
    }
    const record: MockUserRecord = {
      id: createId('u'),
      fullName: fullName.trim(),
      email: normalised,
      studentId: `${String(new Date().getFullYear()).slice(2)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      program: 'CEIT',
      year: 1,
      createdAt: nowIso(),
      password,
    };
    await storage.set(STORAGE_KEYS.users, [...users, record]);
    await storage.set(STORAGE_KEYS.session, record.id);
    return toUser(record);
  },

  async logout() {
    await storage.remove(STORAGE_KEYS.session);
  },

  async resetPassword() {
    await mockDelay();
  },
};

// ── Firebase implementation ──────────────────────────────────────────────
function friendlyFirebaseError(error: unknown): AppError {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new AppError(INVALID_LOGIN, code);
    case 'auth/email-already-in-use':
      return new AppError('An account with this email already exists. Try logging in.', code);
    case 'auth/weak-password':
      return new AppError('Choose a stronger password (at least 8 characters).', code);
    case 'auth/network-request-failed':
      return new AppError('You appear to be offline. Check your connection and try again.', code);
    case 'auth/too-many-requests':
      return new AppError('Too many attempts. Wait a moment and try again.', code);
    default:
      return new AppError('Something went wrong. Please try again.', code || 'auth/unknown');
  }
}

async function profileFor(fbUser: FirebaseUser): Promise<User> {
  const { db } = getFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.users, fbUser.uid));
  if (snapshot.exists()) return { id: fbUser.uid, ...(snapshot.data() as Omit<User, 'id'>) };
  // Profile document missing (e.g. created in the console) — fall back to auth data.
  return {
    id: fbUser.uid,
    fullName: fbUser.displayName ?? fbUser.email ?? 'Student',
    email: fbUser.email ?? '',
    studentId: '—',
    program: 'CEIT',
    year: 1,
    createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toISOString() : nowIso(),
  };
}

const firebaseAuth: AuthService = {
  restore() {
    const { auth } = getFirebase();
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        unsubscribe();
        if (!fbUser) return resolve(null);
        profileFor(fbUser).then(resolve, () => resolve(null));
      });
    });
  },

  async login({ email, password }) {
    try {
      const { auth } = getFirebase();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return await profileFor(credential.user);
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  async register({ fullName, email, password }) {
    try {
      const { auth, db } = getFirebase();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      const profile: Omit<User, 'id'> = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        studentId: '—',
        program: 'CEIT',
        year: 1,
        createdAt: nowIso(),
      };
      await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), profile);
      return { id: credential.user.uid, ...profile };
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  async logout() {
    await signOut(getFirebase().auth);
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(getFirebase().auth, email.trim());
    } catch (error) {
      // Don't reveal whether an account exists for this email.
      const appError = friendlyFirebaseError(error);
      if (appError.code === 'auth/network-request-failed') throw appError;
    }
  },
};

export const authService: AuthService = isFirebaseConfigured ? firebaseAuth : mockAuth;
