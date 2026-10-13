import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AnswerFeedback,
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineAlert,
  LoadingState,
  QuizOption,
  QuizTimer,
  Screen,
  ScreenHeader,
  SegmentedProgress,
  type OptionState,
} from '@/components';
import { routes } from '@/constants/routes';
import { useQuizSession, type PrimaryAction } from '@/hooks';
import { spacing } from '@/theme';
import { pluralise } from '@/utils/format';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const primaryLabel: Record<PrimaryAction, string> = {
  choose: 'Choose an answer',
  check: 'Check answer',
  next: 'Next',
  submit: 'Submit quiz',
};

/** Desktop quiz play: centered question panel inside the web shell. */
export function QuestionsScreen() {
  const params = useLocalSearchParams<{ subjectId: string; level: string; restart?: string }>();
  const level = Number(params.level ?? 1);
  const quiz = useQuizSession(params.subjectId ?? '', level, params.restart === '1');
  const scrollRef = useRef<ScrollView>(null);
  const { question, subject, actions, screen } = quiz;

  useEffect(() => {
    if (quiz.resultId) router.replace(routes.quizResult(quiz.resultId, quiz.remaining === 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.resultId]);

  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace(routes.quizTab)), []);

  const onPrimary = () => {
    switch (quiz.primaryAction) {
      case 'check':
        actions.check();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
        break;
      case 'next':
        actions.next();
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        break;
      case 'submit':
        void actions.submit();
        break;
      default:
        break;
    }
  };

  if (screen.kind === 'loading') {
    return (
      <Screen>
        <View style={styles.panel}>
          <LoadingState rows={5} label="Loading questions" />
        </View>
      </Screen>
    );
  }

  if (screen.kind === 'error') {
    return (
      <Screen>
        <View style={styles.panel}>
          <ScreenHeader back backIcon="x" backLabel="Close quiz" />
          <ErrorState title="Couldn’t load this quiz" message={screen.message} onRetry={quiz.retryLoad} />
        </View>
      </Screen>
    );
  }

  if (screen.kind === 'notEnough') {
    return (
      <Screen>
        <View style={styles.panel}>
          <ScreenHeader back backIcon="x" backLabel="Close" />
          <EmptyState
            icon="inbox"
            title="Not enough questions are available for this level yet."
            message={`${screen.subject.name} · Level ${level} has ${pluralise(screen.available, 'question')}. A quiz needs ${screen.required}, so it can’t start yet.`}
            actionLabel="Choose another level"
            actionIcon="arrow-left"
            onAction={leave}
          />
        </View>
      </Screen>
    );
  }

  if (!question || !subject) return null;

  const optionState = (option: string): OptionState => {
    if (!quiz.isChecked) return quiz.selection === option ? 'selected' : 'idle';
    if (option === question.correctAnswer) return 'correct';
    if (option === quiz.selection) return 'incorrect';
    return 'dimmed';
  };

  const percent = Math.round(((quiz.index + 1) / quiz.total) * 100);

  return (
    <Screen scrollRef={scrollRef} gap={spacing.xl}>
      <View style={styles.panel}>
        <View style={styles.subjectHeading}>
          <AppText style={styles.subjectName}>{subject.name}</AppText>
          <AppText variant="code" color="textSecondary">{subject.code}</AppText>
        </View>

        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <AppText variant="label" accessibilityRole="header">
              {`Question ${quiz.index + 1} `}
              <AppText variant="label" color="textSecondary">{`/ ${quiz.total}`}</AppText>
            </AppText>
            <QuizTimer seconds={quiz.remaining} />
          </View>
          <View style={styles.segmentRow}>
            <View style={styles.segmented}>
              <SegmentedProgress total={quiz.total} current={quiz.index} accessibilityLabel={`Question ${quiz.index + 1} of ${quiz.total}`} />
            </View>
            <AppText variant="captionStrong" color="textSecondary">{`${percent}%`}</AppText>
          </View>
        </View>

        <Card style={styles.questionCard}>
          <Badge label="Multiple choice · choose one answer" tone="primary" />
          <AppText variant="heading" style={styles.prompt}>
            {question.question}
          </AppText>
          <View accessibilityRole="radiogroup" accessibilityLabel="Answers" style={styles.options}>
            {question.options.map((option, i) => (
              <QuizOption
                key={option}
                letter={LETTERS[i] ?? String(i + 1)}
                text={option}
                state={optionState(option)}
                locked={quiz.isChecked || quiz.submitting}
                onPress={() => actions.select(option)}
              />
            ))}
          </View>
          {quiz.isChecked ? <AnswerFeedback correct={quiz.isCorrect} correctAnswer={question.correctAnswer} explanation={question.explanation} /> : null}
          {quiz.submitError ? <InlineAlert message={quiz.submitError} /> : null}
        </Card>

        <View style={styles.footer}>
          <Button
            title="Previous"
            variant="secondary"
            leftIcon="chevron-left"
            onPress={() => {
              actions.previous();
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }}
            disabled={quiz.index === 0 || quiz.submitting}
            fullWidth={false}
          />
          <Button
            title={quiz.submitting ? 'Submitting…' : primaryLabel[quiz.primaryAction]}
            rightIcon={quiz.primaryAction === 'submit' ? 'check' : quiz.primaryAction === 'choose' ? undefined : 'arrow-right'}
            onPress={onPrimary}
            disabled={quiz.primaryAction === 'choose' || Boolean(quiz.resultId)}
            loading={quiz.submitting}
            fullWidth={false}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { width: '100%', maxWidth: 712, alignSelf: 'center', gap: 22 },
  subjectHeading: { alignItems: 'center', gap: spacing.xs },
  subjectName: { fontSize: 20, lineHeight: 28 },
  progress: { gap: spacing.sm + 2 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segmented: { flex: 1 },
  questionCard: { gap: spacing.xl, padding: 28 },
  prompt: { fontSize: 24, lineHeight: 32 },
  options: { gap: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
