import type { Persistence } from 'firebase/auth';

/**
 * Firebase Auth's React Native build exports getReactNativePersistence, but
 * the public `firebase/auth` typings only describe the web build. This
 * augmentation exposes the RN helper to TypeScript.
 */
declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
