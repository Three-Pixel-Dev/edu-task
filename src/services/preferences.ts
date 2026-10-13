import { STORAGE_KEYS } from '@/constants/app';
import { storage, userKey } from './storage';

export interface Preferences {
  deadlineReminders: boolean;
}

const defaults: Preferences = { deadlineReminders: true };

export const preferencesService = {
  async get(userId: string): Promise<Preferences> {
    return { ...defaults, ...(await storage.get<Partial<Preferences>>(userKey(STORAGE_KEYS.preferences, userId))) };
  },
  async set(userId: string, prefs: Preferences) {
    await storage.set(userKey(STORAGE_KEYS.preferences, userId), prefs);
  },
};

/** Clears every locally cached record (mock mode "Reset demo data"). */
export async function resetLocalData() {
  await Promise.all(Object.values(STORAGE_KEYS).map((key) => storage.removeByPrefix(key)));
}
