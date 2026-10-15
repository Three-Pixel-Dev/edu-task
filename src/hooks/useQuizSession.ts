import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { QUIZ } from '@/constants/app';
import { messageOf } from '@/services/errors';
import { newResultId, saveQuizResult } from '@/services/quizResults';
import { getQuestionsByIds, saveQuizSession, sessionIdFor, startQuiz } from '@/services/quizzes';
import { getSubject } from '@/services/subjects';
import type { Question, QuizSession, QuizType, Subject } from '@/types';
import { nowIso } from '@/utils/format';
import { gradeAnswers, summarise } from '@/utils/quiz';
import { useUid } from './useAuth';
import { useCountdown } from './useCountdown';
import { useQuizHistory } from './useQuizHistory';

export type PrimaryAction = 'choose' | 'check' | 'next' | 'submit';

export type QuizScreenState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'notEnough'; subject: Subject; available: number; required: number }
  | { kind: 'ready' };

interface Loaded {
  subject: Subject;
  questions: Question[];
  resultId: string;
  startedAt: string;
  initialRemaining: number;
}

/**
 * All quiz-taking logic for the question screen:
 * load (or resume) → select 10 unique questions → answer/check/next →
 * autosave progress → grade → save the result once → hand back the result id.
 * The screen only renders what this hook returns.
 */
export function useQuizSession(subjectId: string, level: number, restart: boolean, quizType: QuizType = 'multipleChoice') {
  const uid = useUid();
  const { sessions, status: historyStatus } = useQuizHistory();
  const sessionId = sessionIdFor(subjectId, level, quizType);

  const [screen, setScreen] = useState<QuizScreenState>({ kind: 'loading' });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  /** Guards against double taps before React re-renders. */
  const submitLock = useRef(false);
  const submitAttempts = useRef(0);

  const load = useEffectEvent(async () => {
    try {
      const subject = await getSubject(subjectId);
      const saved: QuizSession | undefined = restart ? undefined : sessions.find((s) => s.id === sessionId);

      if (saved) {
        const questions = await getQuestionsByIds(saved.questionIds, quizType);
        if (questions && saved.resultId) {
          setLoaded({ subject, questions, resultId: saved.resultId, startedAt: saved.startedAt, initialRemaining: saved.remainingSeconds });
          setAnswers(saved.answers);
          setChecked(saved.checked);
          setIndex(Math.min(saved.currentIndex, questions.length - 1));
          setScreen({ kind: 'ready' });
          return;
        }
        // Questions changed since the session was saved — start a fresh quiz instead.
      }

      const start = await startQuiz(subjectId, level, quizType);
      if (start.kind === 'notEnough') {
        setScreen({ kind: 'notEnough', subject, available: start.available, required: start.required });
        return;
      }
      setLoaded({ subject, questions: start.questions, resultId: newResultId(), startedAt: nowIso(), initialRemaining: QUIZ.durationSeconds });
      setAnswers({});
      setChecked([]);
      setIndex(0);
      setScreen({ kind: 'ready' });
    } catch (error) {
      setScreen({ kind: 'error', message: messageOf(error, 'We couldn’t load this quiz.') });
    }
  });

  // Wait for the sessions listener so a saved quiz is resumed, not restarted.
  const historyReady = historyStatus !== 'loading';
  useEffect(() => {
    // State is only set after the first await inside `load`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (historyReady) void load();
  }, [historyReady, subjectId, level, restart, attempt, quizType]);

  const retryLoad = useCallback(() => {
    setScreen({ kind: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const questions = useMemo(() => loaded?.questions ?? [], [loaded]);
  const question = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const selection = question ? answers[question.id] : undefined;
  const isChecked = question ? checked.includes(question.id) : false;
  const isCorrect = Boolean(question && isChecked && selection === question.correctAnswer);

  const running = screen.kind === 'ready' && !resultId;
  const remaining = useCountdown(loaded?.initialRemaining ?? QUIZ.durationSeconds, running);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);
  /** Changes every 15 s so the remaining time is saved periodically too. */
  const saveTick = Math.floor(remaining / 15);

  // Autosave progress to users/{uid}/quizSessions so "Continue quiz" works.
  useEffect(() => {
    if (!loaded || resultId || submitLock.current) return;
    void saveQuizSession(uid, {
      id: sessionId,
      quizType,
      subjectId,
      subjectName: loaded.subject.name,
      subjectCode: loaded.subject.code,
      level,
      questionIds: loaded.questions.map((q) => q.id),
      answers,
      checked,
      currentIndex: index,
      remainingSeconds: remainingRef.current,
      resultId: loaded.resultId,
      startedAt: loaded.startedAt,
    });
  }, [loaded, answers, checked, index, uid, sessionId, subjectId, level, resultId, saveTick, quizType]);

  const submit = useCallback(async () => {
    if (!loaded || submitLock.current || resultId) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const graded = gradeAnswers(loaded.questions, answers);
      const summary = summarise(graded);
      await saveQuizResult(
        uid,
        {
          id: loaded.resultId,
          quizType,
          subjectId,
          subjectName: loaded.subject.name,
          subjectCode: loaded.subject.code,
          level,
          ...summary,
          durationSeconds: Math.max(0, QUIZ.durationSeconds - remainingRef.current),
          answers: graded,
        },
        sessionId,
        submitAttempts.current > 0,
      );
      setResultId(loaded.resultId); // success: further submits are blocked for good
    } catch (error) {
      submitLock.current = false;
      setSubmitError(messageOf(error, 'We couldn’t submit your quiz. Your answers are kept — try again.'));
    } finally {
      submitAttempts.current += 1;
      setSubmitting(false);
    }
  }, [loaded, resultId, answers, uid, subjectId, level, sessionId, quizType]);

  // Time's up → submit automatically (unanswered questions count as incorrect).
  const onTimeUp = useEffectEvent(() => {
    void submit();
  });
  useEffect(() => {
    // Reacting to the countdown reaching zero.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running && remaining === 0) onTimeUp();
  }, [running, remaining]);

  let primaryAction: PrimaryAction = 'choose';
  if (selection) primaryAction = !isChecked ? 'check' : isLast ? 'submit' : 'next';
  // Out of time: the only thing left to do is submit (e.g. retry after a failed auto-submit).
  if (remaining === 0 && !resultId) primaryAction = 'submit';

  const select = useCallback(
    (option: string) => {
      if (!question || isChecked || submitting) return;
      setAnswers((prev) => ({ ...prev, [question.id]: option }));
    },
    [question, isChecked, submitting],
  );
  const check = useCallback(() => {
    if (question && selection && !isChecked) setChecked((prev) => [...prev, question.id]);
  }, [question, selection, isChecked]);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const previous = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  return {
    quizType,
    screen,
    retryLoad,
    subject: loaded?.subject,
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
    submitError,
    resultId,
    actions: { select, check, next, previous, submit },
  };
}
