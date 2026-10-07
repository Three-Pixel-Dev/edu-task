import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_LATENCY_MS } from '@/constants/app';

/** Small typed wrapper around AsyncStorage (JSON values). */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
  async removeByPrefix(prefix: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const matching = keys.filter((k) => k.startsWith(prefix));
    if (matching.length) await AsyncStorage.multiRemove(matching);
  },
};

export const userKey = (base: string, userId: string) => `${base}:${userId}`;

/** Simulated network delay for mock services so loading states are exercised. */
export const mockDelay = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Error with a message that is safe to show to students. */
export class AppError extends Error {
  constructor(message: string, readonly code = 'app/error') {
    super(message);
    this.name = 'AppError';
  }
}

export const messageOf = (error: unknown, fallback = 'Something went wrong. Please try again.') =>
  error instanceof AppError ? error.message : fallback;
