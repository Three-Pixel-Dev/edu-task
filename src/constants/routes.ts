/**
 * Typed route builders. Screens navigate through these helpers so path and
 * param names live in one place.
 */
export const routes = {
  login: '/login',
  register: '/register',
  home: '/',
  quizTab: '/quiz',
  tasksTab: '/tasks',
  profileTab: '/profile',

  quizFields: '/quiz/fields',
  quizSubjects: (fieldId: string) => ({ pathname: '/quiz/subjects', params: { fieldId } }) as const,
  quizLevels: (subjectId: string) => ({ pathname: '/quiz/levels', params: { subjectId } }) as const,
  quizQuestions: (subjectId: string, level: number, restart = false) =>
    ({
      pathname: '/quiz/questions',
      params: { subjectId, level: String(level), ...(restart ? { restart: '1' } : {}) },
    }) as const,
  quizHistory: '/quiz/history',
  quizResult: (resultId: string, timeUp = false) =>
    ({ pathname: '/quiz/result', params: { resultId, ...(timeUp ? { timeUp: '1' } : {}) } }) as const,

  taskCreate: '/tasks/create',
  taskDetail: (id: string) => ({ pathname: '/tasks/[id]', params: { id } }) as const,
  taskEdit: (id: string) => ({ pathname: '/tasks/edit', params: { id } }) as const,
} as const;
