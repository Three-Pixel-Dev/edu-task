import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { QUIZ } from '@/constants/app';
import { quizContent } from '@/services/quiz';
import { messageOf } from '@/services/storage';
import type { AsyncStatus, Question, QuizResult, Subject } from '@/types';
import { createId, nowIso } from '@/utils/format';
import { gradeAnswers, quizIdFor, summarise } from '@/utils/quiz';
import { useCurrentUser } from './useAuth';
import { useCountdown } from './useCountdown';
import { useQuiz } from './useQuiz';

export type PrimaryAction = 'choose' | 'check' | 'next' | 'submit';

interface Loaded {
  subject: Subject;
  questions: Question[];
  startedAt: string;
  initialRemaining: number;
}

/**
 * All quiz-taking logic for the question screen: loading or resuming a
 * session, selection, check → feedback → next, the timer, autosave and
 * submission. The screen only renders what this hook returns.
 */
export function useQuizSession(subjectId: string, level: number, restart: boolean) {
  const user = useCurrentUser();
  const { sessions, saveSession, discardSession, submitResult } = useQuiz();
  const quizId = quizIdFor(subjectId, level);

  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Loads a fresh quiz, or resumes the saved session for this subject + level.
  const load = useEffectEvent(async () => {
    try {
      const subject = await quizContent.getSubject(subjectId);
      const saved = restart ? undefined : sessions.find((s) => s.quizId === quizId);
      if (saved) {
        setLoaded({ subject, questions: quizContent.getQuestions(saved.questionIds), startedAt: saved.startedAt, initialRemaining: saved.remainingSeconds });
        setSelections(saved.selections);
        setChecked(saved.checked);
        setIndex(Math.min(saved.currentIndex, saved.questionIds.length - 1));
      } else {
        if (restart) discardSession(quizId);
        const { quiz, questions } = await quizContent.getQuiz(subjectId, level);
        setLoaded({ subject, questions, startedAt: nowIso(), initialRemaining: quiz.durationSeconds });
        setSelections({});
        setChecked([]);
        setIndex(0);
      }
      setStatus('success');
    } catch (e) {
      setError(messageOf(e, 'We couldn’t load this quiz. Check your connection and try again.'));
      setStatus('error');
    }
  });

  useEffect(() => {
    // State is only set after the first await inside `load`, so this does not cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [subjectId, level, restart, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const questions = useMemo(() => loaded?.questions ?? [], [loaded]);
  const question = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const selection = question ? selections[question.id] : undefined;
  const isChecked = question ? checked.includes(question.id) : false;
  const isCorrect = Boolean(question && isChecked && selection === question.correctOptionId);

  const running = status === 'success' && !resultId;
  const remaining = useCountdown(loaded?.initialRemaining ?? QUIZ.durationSeconds, running);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  /** Changes every 10 s so the remaining time is also autosaved periodically. */
  const saveTick = Math.floor(remaining / 10);

  // Autosave so the student can leave and "Continue quiz" later.
  useEffect(() => {
    if (!loaded || resultId) return;
    saveSession({
      quizId,
      subjectId,
      level,
      questionIds: loaded.questions.map((q) => q.id),
      selections,
      checked,
      currentIndex: index,
      remainingSeconds: remainingRef.current,
      startedAt: loaded.startedAt,
      updatedAt: nowIso(),
    });
  }, [loaded, selections, checked, index, quizId, subjectId, level, resultId, saveSession, saveTick]);

  const submit = useCallback(async () => {
    if (!loaded || submitting || resultId) return;
    setSubmitting(true);
    try {
      const answers = gradeAnswers(loaded.questions, selections);
      const summary = summarise(answers);
      const result: QuizResult = {
        id: createId('res'),
        userId: user.id,
        subjectId,
        level,
        score: summary.score,
        totalQuestions: summary.totalQuestions,
        correctAnswers: summary.correctAnswers,
        incorrectAnswers: summary.incorrectAnswers,
        answers,
        // The countdown spans resumes, so time used = full duration − time left.
        durationSeconds: QUIZ.durationSeconds - remainingRef.current,
        completedAt: nowIso(),
      };
      await submitResult(result);
      setResultId(result.id);
    } catch (e) {
      setError(messageOf(e, 'We couldn’t submit your quiz. Your answers are saved — try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [loaded, submitting, resultId, selections, user.id, subjectId, level, submitResult]);

  // Time's up → submit automatically (unanswered questions count as incorrect).
  const onTimeUp = useEffectEvent(() => {
    void submit();
  });
  useEffect(() => {
    // Reacting to an external clock reaching zero is exactly what an effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running && remaining === 0) onTimeUp();
  }, [running, remaining]);

  let primaryAction: PrimaryAction = 'choose';
  if (selection) primaryAction = !isChecked ? 'check' : isLast ? 'submit' : 'next';

  const select = useCallback(
    (optionId: string) => {
      if (!question || isChecked) return;
      setSelections((prev) => ({ ...prev, [question.id]: optionId }));
    },
    [question, isChecked],
  );

  const check = useCallback(() => {
    if (question && selection && !isChecked) setChecked((prev) => [...prev, question.id]);
  }, [question, selection, isChecked]);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const previous = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  return {
    status,
    error,
    retry,
    subject: loaded?.subject,
    questions,
    question,
    index,
    total,
    isLast,
    selection,
    isChecked,
    isCorrect,
    remaining,
    primaryAction,
    submitting,
    resultId,
    actions: { select, check, next, previous, submit },
  };
}
