import type { QuizType } from '@/types';

/** Only True / False needs the param; Multiple choice keeps the original URLs. */
const typeParam = (type: QuizType = 'multipleChoice') => (type === 'trueFalse' ? { type } : {});

/**
 * Typed route builders. Screens navigate through these helpers so path and
 * param names live in one place.
 */
export const routes = {
  login: '/login',
  register: '/register',
  home: '/',
  quizTab: '/quiz',
  /** Quiz (True / False) tab. */
  trueFalseTab: '/true-false',
  quizTypeTab: (type: QuizType = 'multipleChoice') => (type === 'trueFalse' ? '/true-false' : '/quiz'),
  tasksTab: '/tasks',
  profileTab: '/profile',

  quizFields: (type: QuizType = 'multipleChoice') => ({ pathname: '/quiz/fields', params: typeParam(type) }) as const,
  quizSubjects: (fieldId: string, type: QuizType = 'multipleChoice') =>
    ({ pathname: '/quiz/subjects', params: { fieldId, ...typeParam(type) } }) as const,
  quizLevels: (subjectId: string, type: QuizType = 'multipleChoice') =>
    ({ pathname: '/quiz/levels', params: { subjectId, ...typeParam(type) } }) as const,
  quizQuestions: (subjectId: string, level: number, restart = false, type: QuizType = 'multipleChoice') =>
    ({
      pathname: '/quiz/questions',
      params: { subjectId, level: String(level), ...(restart ? { restart: '1' } : {}), ...typeParam(type) },
    }) as const,
  quizHistory: '/quiz/history',
  /** History opened on one type's filter. */
  quizHistoryFor: (type: QuizType) => ({ pathname: '/quiz/history', params: { filter: type } }) as const,
  quizResult: (resultId: string, timeUp = false) =>
    ({ pathname: '/quiz/result', params: { resultId, ...(timeUp ? { timeUp: '1' } : {}) } }) as const,

  taskCreate: '/tasks/create',
  taskDetail: (id: string) => ({ pathname: '/tasks/[id]', params: { id } }) as const,
  taskEdit: (id: string) => ({ pathname: '/tasks/edit', params: { id } }) as const,
} as const;
