import { QUIZ } from '@/constants/app';
import type { LevelProgress, Question, QuizAnswer, QuizResult, QuizSession } from '@/types';

/** Returns why a question can't be used, or null if it's valid. */
export function validateQuestion(q: Pick<Question, 'question' | 'options' | 'correctAnswer' | 'level'>): string | null {
  if (!q.question.trim()) return 'question text is empty';
  if (q.options.length < 2) return 'needs at least 2 options';
  if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) return 'options contain duplicates';
  if (!q.options.includes(q.correctAnswer)) return 'correctAnswer is not one of the options';
  if (!Number.isInteger(q.level) || q.level < 1 || q.level > QUIZ.levelCount) return `level must be 1–${QUIZ.levelCount}`;
  return null;
}

/** Fisher–Yates shuffle on a copy — never mutates the input. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

/**
 * Picks `count` questions with no duplicates (by id, and by identical text in
 * case content was entered twice), in random order. Returns null if there
 * aren't enough unique questions — callers must not start a short quiz.
 */
export function selectQuizQuestions(pool: readonly Question[], count: number, random?: () => number): Question[] | null {
  const seenIds = new Set<string>();
  const seenText = new Set<string>();
  const unique = pool.filter((q) => {
    const text = q.question.trim().toLowerCase();
    if (seenIds.has(q.id) || seenText.has(text)) return false;
    seenIds.add(q.id);
    seenText.add(text);
    return true;
  });
  if (unique.length < count) return null;
  return shuffle(unique, random).slice(0, count);
}

/** Grades the student's answers. Unanswered questions count as incorrect. */
export function gradeAnswers(questions: readonly Question[], answers: Record<string, string>): QuizAnswer[] {
  return questions.map((q) => {
    const selectedAnswer = answers[q.id] ?? '';
    return {
      questionId: q.id,
      question: q.question,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: selectedAnswer !== '' && selectedAnswer === q.correctAnswer,
    };
  });
}

export function summarise(answers: readonly QuizAnswer[]) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers: totalQuestions - correctAnswers,
    score: correctAnswers,
    percentage: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
  };
}

/**
 * Level status (deliberately simple — the client only defines levels 1–15,
 * with no unlocking):
 *  - current: there is an unfinished session for the level
 *  - completed: the student has at least one result for the level
 *  - available: everything else
 */
export function levelProgressFor(subjectId: string, results: readonly QuizResult[], sessions: readonly QuizSession[]): LevelProgress[] {
  const best = new Map<number, number>();
  for (const r of results) {
    if (r.subjectId === subjectId) best.set(r.level, Math.max(best.get(r.level) ?? 0, r.score));
  }
  const active = new Map(sessions.filter((s) => s.subjectId === subjectId).map((s) => [s.level, s]));
  return Array.from({ length: QUIZ.levelCount }, (_, i) => {
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
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export function scoreMessage(percentage: number, firstName: string) {
  if (percentage >= 90) return { title: `Outstanding, ${firstName}!`, body: 'You have mastered this level.' };
  if (percentage >= 70) return { title: `Great work, ${firstName}!`, body: 'You passed this level. The next one is ready when you are.' };
  if (percentage >= 50) return { title: 'Nice effort', body: 'Review the questions you missed, then try again.' };
  return { title: 'Keep practising', body: 'Every attempt helps. Review the answers and try once more.' };
}
