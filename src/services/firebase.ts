import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { authPersistence } from './authPersistence';

/**
 * Firebase configuration comes from Expo public env variables (see .env.example).
 * These are the *web app* config values — they identify the project and are
 * safe to ship in a client app. Access is protected by Firestore security
 * rules, never by keeping these values secret. Never put service-account or
 * Admin SDK credentials in an EXPO_PUBLIC_ variable.
 *
 * Expo only inlines `process.env.EXPO_PUBLIC_*` when written out literally,
 * so each key is listed explicitly.
 */
const env = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} as const;

/** Names of required env variables that are missing — shown on the setup screen. */
export const missingFirebaseConfig = (Object.keys(env) as (keyof typeof env)[]).filter((key) => !env[key]?.trim());

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

/** Firestore collection names — one place to change them. */
export const COLLECTIONS = {
  users: 'users',
  subjectFields: 'subjectFields',
  subjects: 'subjects',
  /** Multiple choice (A–D) questions. */
  questions: 'questions',
  /**
   * Legacy Quiz (True / False) collection — no longer seeded or read by the app.
   * Content ships in src/data/true-false/; kept here only for cleanup scripts.
   */
  trueFalseQuestions: 'trueFalseQuestions',
  quizResults: 'quizResults',
  tasks: 'tasks',
  /** Subcollection under users/{uid} */
  quizSessions: 'quizSessions',
} as const;

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Returns the single Firebase instance, initialising it on first use.
 * Module-level caching means re-renders never re-initialise Firebase, and the
 * getApps() check keeps Fast Refresh (which re-runs modules) safe.
 */
export function getFirebase(): FirebaseServices {
  if (services) return services;
  if (!isFirebaseConfigured) {
    throw new Error(`Firebase is not configured. Missing: ${missingFirebaseConfig.join(', ')}`);
  }

  const alreadyInitialised = getApps().length > 0;
  const app = alreadyInitialised
    ? getApp()
    : initializeApp({
        apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
      } satisfies FirebaseOptions);

  // Platform-specific persistence (AsyncStorage on native, localStorage on web).
  // initializeAuth may only run once per app, hence getAuth after a Fast Refresh.
  const auth = alreadyInitialised ? getAuth(app) : initializeAuth(app, { persistence: authPersistence() });

  // Firestore's persistent (IndexedDB) cache isn't available in React Native,
  // so we use the in-memory cache: listeners still update instantly for local
  // writes, but a write is only "saved" once the server confirms it.
  // Long-polling auto-detection keeps the connection working on RN networks.
  const db = alreadyInitialised
    ? getFirestore(app)
    : initializeFirestore(app, { localCache: memoryLocalCache(), experimentalAutoDetectLongPolling: true });

  services = { app, auth, db };
  return services;
}

/**
 * Firebase Storage is not used yet — EduTask has no file uploads. This accessor
 * exists so assignment attachments can be added later under
 * `users/{uid}/tasks/{taskId}/…` without touching initialisation code.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebase().app);
  return storage;
}
