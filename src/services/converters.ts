import { Timestamp, type DocumentData, type DocumentSnapshot, type QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Helpers that turn raw Firestore data into the app's typed models.
 * Documents are read defensively: content written by an admin (or an older
 * app version) may be missing fields, so every reader validates types.
 */

type Snapshot = QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>;

/** Server timestamps are null in local snapshots until confirmed — estimate them. */
export const dataOf = (snap: Snapshot): DocumentData => snap.data({ serverTimestamps: 'estimate' }) ?? {};

export function toIso(value: unknown, fallback = new Date(0).toISOString()): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return fallback;
}

export const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
export const num = (value: unknown, fallback = 0): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
export const bool = (value: unknown, fallback = false): boolean => (typeof value === 'boolean' ? value : fallback);
export const strArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
