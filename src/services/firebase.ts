import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
// getReactNativePersistence exists in Firebase's React Native build (which Metro
// resolves), but not in the public typings — see src/types/firebase-auth.d.ts.
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase is optional during development.
 *
 * Add the values below to a `.env` file (see `.env.example`). Expo inlines
 * EXPO_PUBLIC_* variables at build time. If any required value is missing the
 * app runs entirely on local mock data, so it still works in Expo Go with no
 * setup. Never commit real keys.
 */
const config: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

/** Firestore collection names — one place to change them. */
export const COLLECTIONS = {
  users: 'users',
  subjectFields: 'subjectFields',
  subjects: 'subjects',
  quizzes: 'quizzes',
  questions: 'questions',
  quizResults: 'quizResults',
  tasks: 'tasks',
} as const;

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;

/** Lazily initialises Firebase. Only call when `isFirebaseConfigured` is true. */
export function getFirebase(): FirebaseServices {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to .env.');
  }
  if (services) return services;

  const alreadyInitialised = getApps().length > 0;
  const app = alreadyInitialised ? getApp() : initializeApp(config);
  // initializeAuth may only be called once per app (Fast Refresh re-runs modules).
  const auth = alreadyInitialised
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  const db = getFirestore(app);

  services = { app, auth, db };
  return services;
}
