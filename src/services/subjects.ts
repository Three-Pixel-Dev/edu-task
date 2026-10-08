import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { Subject, SubjectField } from '@/types';
import { bool, dataOf, num, str } from './converters';
import { AppError, toAppError, withTimeout } from './errors';
import { COLLECTIONS, getFirebase } from './firebase';

/**
 * Read-only access to the academic catalogue (subjectFields, subjects).
 * Content is managed with the admin seed tool (tools/firestore-seed); the
 * security rules make these collections read-only for students.
 */

const byOrder = <T extends { order: number; name: string }>(a: T, b: T) => a.order - b.order || a.name.localeCompare(b.name);

function toField(id: string, data: Record<string, unknown>): SubjectField {
  return { id, name: str(data.name, id), description: str(data.description), icon: str(data.icon, 'book-open'), order: num(data.order, 999) };
}

function toSubject(id: string, data: Record<string, unknown>): Subject {
  return {
    id,
    fieldId: str(data.fieldId),
    code: str(data.code),
    name: str(data.name, id),
    description: str(data.description),
    order: num(data.order, 999),
    isActive: bool(data.isActive, true),
  };
}

export async function getSubjectFields(): Promise<SubjectField[]> {
  try {
    const { db } = getFirebase();
    const snap = await withTimeout(getDocs(query(collection(db, COLLECTIONS.subjectFields), orderBy('order'))), 'read');
    return snap.docs.map((d) => toField(d.id, dataOf(d))).sort(byOrder);
  } catch (error) {
    throw toAppError(error, 'We couldn’t load the subject fields.');
  }
}

export async function getSubjectField(fieldId: string): Promise<SubjectField> {
  try {
    const snap = await withTimeout(getDoc(doc(getFirebase().db, COLLECTIONS.subjectFields, fieldId)), 'read');
    if (!snap.exists()) throw new AppError('This field doesn’t exist.', 'not-found');
    return toField(snap.id, dataOf(snap));
  } catch (error) {
    throw toAppError(error, 'We couldn’t load this field.');
  }
}

/** Active subjects in a field, in display order. */
export async function getSubjects(fieldId: string): Promise<Subject[]> {
  try {
    const { db } = getFirebase();
    const snap = await withTimeout(
      getDocs(query(collection(db, COLLECTIONS.subjects), where('fieldId', '==', fieldId), where('isActive', '==', true))),
      'read',
    );
    return snap.docs.map((d) => toSubject(d.id, dataOf(d))).sort(byOrder);
  } catch (error) {
    throw toAppError(error, 'We couldn’t load the subjects.');
  }
}

export async function getSubject(subjectId: string): Promise<Subject> {
  try {
    const snap = await withTimeout(getDoc(doc(getFirebase().db, COLLECTIONS.subjects, subjectId)), 'read');
    if (!snap.exists()) throw new AppError('This subject doesn’t exist.', 'not-found');
    return toSubject(snap.id, dataOf(snap));
  } catch (error) {
    throw toAppError(error, 'We couldn’t load this subject.');
  }
}

/** Every active subject — used for the task subject picker and name lookups. */
export async function getAllSubjects(): Promise<Subject[]> {
  try {
    const { db } = getFirebase();
    const snap = await withTimeout(getDocs(query(collection(db, COLLECTIONS.subjects), where('isActive', '==', true))), 'read');
    return snap.docs.map((d) => toSubject(d.id, dataOf(d))).sort(byOrder);
  } catch (error) {
    throw toAppError(error, 'We couldn’t load the subjects.');
  }
}
