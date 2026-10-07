import { QUIZ } from '@/constants/app';
import type { LevelProgress, Question, Quiz, QuizAnswer, QuizResult, QuizSession, Subject } from '@/types';

export const quizIdFor = (subjectId: string, level: number) => `${subjectId}:L${level}`;

/**
 * Picks QUIZ.questionsPerQuiz questions for a subject level.
 * Deterministic: each level starts at a different offset in the bank, so
 * levels feel different while results stay reproducible in mock mode.
 */
export function buildQuiz(subject: Subject, level: number, bankQuestions: Question[]): Quiz {
  const count = Math.min(QUIZ.questionsPerQuiz, bankQuestions.length);
  const offset = bankQuestions.length ? ((level - 1) * 7) % bankQuestions.length : 0;
  const questionIds: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const question = bankQuestions[(offset + i) % bankQuestions.length];
    if (question) questionIds.push(question.id);
  }
  return {
    id: quizIdFor(subject.id, level),
    subjectId: subject.id,
    level,
    questionIds,
    durationSeconds: QUIZ.durationSeconds,
  };
}

export function gradeAnswers(questions: Question[], selections: Record<string, string>): QuizAnswer[] {
  return questions.map((question) => {
    const selectedOptionId = selections[question.id] ?? '';
    return {
      questionId: question.id,
      selectedOptionId,
      isCorrect: selectedOptionId === question.correctOptionId,
    };
  });
}

export function summarise(answers: QuizAnswer[]) {
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  return {
    correctAnswers,
    incorrectAnswers: totalQuestions - correctAnswers,
    totalQuestions,
    score: correctAnswers,
    percentage: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
  };
}

export const percentageOf = (result: Pick<QuizResult, 'correctAnswers' | 'totalQuestions'>) =>
  result.totalQuestions ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0;

/**
 * Level status rules (kept deliberately simple — the client only defines
 * levels 1–15, no unlocking):
 *  - completed: the student has at least one result for the level
 *  - current: there is an unfinished session for the level
 *  - available: everything else
 */
export function levelProgressFor(
  subjectId: string,
  levelCount: number,
  results: QuizResult[],
  sessions: QuizSession[],
): LevelProgress[] {
  const best = new Map<number, number>();
  for (const r of results) {
    if (r.subjectId !== subjectId) continue;
    best.set(r.level, Math.max(best.get(r.level) ?? 0, r.score));
  }
  const active = new Map(sessions.filter((s) => s.subjectId === subjectId).map((s) => [s.level, s]));

  return Array.from({ length: levelCount }, (_, i) => {
    const level = i + 1;
    const session = active.get(level);
    if (session) return { level, status: 'current', currentQuestion: session.currentIndex + 1, bestScore: best.get(level) };
    if (best.has(level)) return { level, status: 'completed', bestScore: best.get(level) };
    return { level, status: 'available' };
  });
}

export const padLevel = (level: number) => String(level).padStart(2, '0');

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function scoreMessage(percentage: number, firstName: string) {
  if (percentage >= 90) return { title: `Outstanding, ${firstName}!`, body: 'You have mastered this level.' };
  if (percentage >= 70) return { title: `Great work, ${firstName}!`, body: 'You passed this level. The next one is ready when you are.' };
  if (percentage >= 50) return { title: 'Nice effort', body: 'Review the questions you missed, then try again.' };
  return { title: 'Keep practising', body: 'Every attempt helps. Review the answers and try once more.' };
}
