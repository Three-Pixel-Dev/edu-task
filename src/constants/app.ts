export const APP_NAME = 'EduTask';

export const QUIZ = {
  /** Client requirement: every quiz has exactly 10 questions. */
  questionsPerQuiz: 10,
  /** Client requirement: levels 1–15 for every subject. */
  levelCount: 15,
  durationSeconds: 10 * 60,
  /** The timer turns amber below this many seconds. */
  lowTimeSeconds: 2 * 60,
} as const;

export const TASKS = {
  /** A pending task due within this many hours counts as "due soon". */
  dueSoonHours: 24,
  titleMaxLength: 80,
  descriptionMaxLength: 500,
} as const;

export const AUTH = {
  passwordMinLength: 8,
  displayNameMaxLength: 60,
} as const;

/** How long to wait for the server to confirm a write before telling the user. */
export const WRITE_TIMEOUT_MS = 15_000;
/** How long to wait for a read before showing a connection error. */
export const READ_TIMEOUT_MS = 20_000;

/**
 * The two practice types. `label` is what students see: the original A–D quiz
 * is called "Multiple choice", and the True / False set is called "Quiz".
 */
export const QUIZ_TYPES = {
  multipleChoice: {
    label: 'Multiple choice',
    title: 'Multiple choice',
    description: 'Four options, one correct answer.',
    format: 'Multiple choice · A–D',
    answerHint: 'Multiple choice · choose one answer',
    icon: 'list',
    sessionPrefix: '',
  },
  trueFalse: {
    label: 'Quiz',
    title: 'Quiz',
    description: 'Decide if each statement is true or false.',
    format: 'True or false',
    answerHint: 'True or false · choose one',
    icon: 'toggle-right',
    sessionPrefix: 'TF__',
  },
} as const;

export const TRUE_FALSE_OPTIONS = ['True', 'False'] as const;
