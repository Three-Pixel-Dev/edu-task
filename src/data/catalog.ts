import type { Question, Subject, SubjectField } from '@/types';
import { subjectFields } from './fields';
import { allQuestions, fieldQuestionBanks, subjectQuestionBanks } from './questions';
import { subjects } from './subjects';

/** Synchronous lookups over the bundled catalogue (fields, subjects, questions). */

const subjectById = new Map(subjects.map((s) => [s.id, s]));
const fieldById = new Map(subjectFields.map((f) => [f.id, f]));
const questionById = new Map(allQuestions.map((q) => [q.id, q]));

export const findSubject = (id: string): Subject | undefined => subjectById.get(id);
export const findField = (id: string): SubjectField | undefined => fieldById.get(id);
export const findQuestion = (id: string): Question | undefined => questionById.get(id);

export const subjectsInField = (fieldId: string) => subjects.filter((s) => s.fieldId === fieldId);

export const subjectCountByField = (fieldId: string) => subjectsInField(fieldId).length;

/** Subject-specific bank when there is one, otherwise the field's shared bank. */
export function questionBankFor(subject: Subject): Question[] {
  const own = subjectQuestionBanks[subject.id];
  if (own && own.length) return own;
  return fieldQuestionBanks[subject.fieldId] ?? [];
}

export function questionsByIds(ids: string[]): Question[] {
  return ids.map((id) => questionById.get(id)).filter((q): q is Question => Boolean(q));
}
