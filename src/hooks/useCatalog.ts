import { useCallback, useMemo, useState } from 'react';
import { getAllSubjects, getSubject, getSubjectField, getSubjectFields, getSubjects } from '@/services/subjects';
import type { Subject, SubjectField } from '@/types';
import { useAsync } from './useAsync';

/** subjectFields from Firestore, in order. */
export function useSubjectFields() {
  return useAsync(() => getSubjectFields(), [], 'We couldn’t load the subject fields.');
}

/** One field plus its active subjects. */
export function useSubjects(fieldId: string) {
  return useAsync(
    async () => {
      const [field, subjects] = await Promise.all([getSubjectField(fieldId), getSubjects(fieldId)]);
      return { field, subjects };
    },
    [fieldId],
    'We couldn’t load these subjects.',
  );
}

export function useSubject(subjectId: string) {
  return useAsync(() => getSubject(subjectId), [subjectId], 'We couldn’t load this subject.');
}

// ── Whole catalogue (fields + subjects), cached for the app session ──────
interface Catalog {
  fields: SubjectField[];
  subjects: Subject[];
}

let catalogPromise: Promise<Catalog> | null = null;

function loadCatalog(force: boolean): Promise<Catalog> {
  if (!catalogPromise || force) {
    catalogPromise = Promise.all([getSubjectFields(), getAllSubjects()]).then(
      ([fields, subjects]) => ({ fields, subjects }),
      (error: unknown) => {
        catalogPromise = null; // let the next caller retry
        throw error;
      },
    );
  }
  return catalogPromise;
}

/**
 * All fields and active subjects — for the task subject picker, subject names
 * on task cards and subject counts on field cards. Loaded once per app session
 * (the catalogue changes rarely); `reload` fetches it again.
 */
export function useSubjectCatalog() {
  const [force, setForce] = useState(0);
  const result = useAsync(() => loadCatalog(force > 0), [force], 'We couldn’t load the subject list.');
  const reload = useCallback(() => setForce((n) => n + 1), []);

  const lookups = useMemo(() => {
    const subjects = result.data?.subjects ?? [];
    const fields = result.data?.fields ?? [];
    const countByField = new Map<string, number>();
    subjects.forEach((s) => countByField.set(s.fieldId, (countByField.get(s.fieldId) ?? 0) + 1));
    return {
      subjects,
      fields,
      subjectById: new Map(subjects.map((s) => [s.id, s])),
      fieldById: new Map(fields.map((f) => [f.id, f])),
      countByField,
    };
  }, [result.data]);

  return { status: result.status, error: result.error, reload, ...lookups };
}
