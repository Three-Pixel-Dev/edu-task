import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import {
  AnswerFeedback,
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
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

export function QuestionsScreen() {
  const params = useLocalSearchParams<{ subjectId: string; level: string; restart?: string }>();
  const level = Number(params.level ?? 1);
  const quiz = useQuizSession(params.subjectId ?? '', level, params.restart === '1');
  const scrollRef = useRef<ScrollView>(null);
  const { question, subject, actions, screen } = quiz;
  const inProgress = screen.kind === 'ready' && !quiz.resultId;

  // Once the result is saved (by Submit or when time runs out), show it.
  useEffect(() => {
    if (quiz.resultId) router.replace(routes.quizResult(quiz.resultId, quiz.remaining === 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.resultId]);

  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace(routes.quizTab)), []);

  const confirmExit = useCallback(() => {
    if (!inProgress) return leave();
    Alert.alert('Leave this quiz?', `Your progress is saved. You can continue from question ${quiz.index + 1} later.`, [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave quiz', onPress: leave },
    ]);
  }, [inProgress, quiz.index, leave]);

  // Android hardware back → same confirmation (iOS swipe-back is disabled for this screen).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!inProgress) return false;
        confirmExit();
        return true;
      });
      return () => sub.remove();
    }, [confirmExit, inProgress]),
  );

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
        <AppText variant="label" color="textSecondary" align="center">
          Loading questions…
        </AppText>
        <LoadingState rows={5} label="Loading questions" />
      </Screen>
    );
  }

  if (screen.kind === 'error') {
    return (
      <Screen>
        <ScreenHeader back backIcon="x" backLabel="Close quiz" />
        <ErrorState title="Couldn’t load this quiz" message={screen.message} onRetry={quiz.retryLoad} />
      </Screen>
    );
  }

  if (screen.kind === 'notEnough') {
    return (
      <Screen>
        <ScreenHeader back backIcon="x" backLabel="Close" />
        <EmptyState
          icon="inbox"
          title="Not enough questions are available for this level yet."
          message={`${screen.subject.name} · Level ${level} has ${pluralise(screen.available, 'question')}. A quiz needs ${screen.required}, so it can’t start yet. Try another level, or ask your lecturer to add more questions.`}
          actionLabel="Choose another level"
          actionIcon="arrow-left"
          onAction={leave}
        />
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
    <Screen
      scrollRef={scrollRef}
      gap={spacing.xl}
      footer={
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
            style={styles.prev}
            fullWidth={false}
          />
          <Button
            title={quiz.submitting ? 'Submitting…' : primaryLabel[quiz.primaryAction]}
            rightIcon={quiz.primaryAction === 'submit' ? 'check' : quiz.primaryAction === 'choose' ? undefined : 'arrow-right'}
            onPress={onPrimary}
            disabled={quiz.primaryAction === 'choose' || Boolean(quiz.resultId)}
            loading={quiz.submitting}
            style={styles.primary}
            fullWidth={false}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <IconButton icon="x" accessibilityLabel="Exit quiz" onPress={confirmExit} />
        <View style={styles.headerText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {subject.name}
          </AppText>
          <AppText variant="code" color="textSecondary">{`${subject.code} · Level ${level}`}</AppText>
        </View>
        <QuizTimer seconds={quiz.remaining} />
      </View>

      <View style={styles.progress}>
        <View style={styles.progressLabels}>
          <AppText variant="label" accessibilityRole="header">
            {`Question ${quiz.index + 1} `}
            <AppText variant="label" color="textSecondary">{`/ ${quiz.total}`}</AppText>
          </AppText>
          <AppText variant="caption" color="textSecondary">{`${percent}%`}</AppText>
        </View>
        <SegmentedProgress total={quiz.total} current={quiz.index} accessibilityLabel={`Question ${quiz.index + 1} of ${quiz.total}`} />
      </View>

      <Card style={styles.questionCard}>
        <Badge label="Multiple choice · choose one" tone="primary" />
        <AppText variant="heading" style={styles.prompt}>
          {question.question}
        </AppText>
      </Card>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  progress: { gap: spacing.sm + 2 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  questionCard: { gap: spacing.md, padding: spacing.lg + 2 },
  prompt: { fontSize: 20, lineHeight: 28 },
  options: { gap: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.md },
  prev: { flex: 1, paddingHorizontal: spacing.md },
  primary: { flex: 1.6, paddingHorizontal: spacing.md },
});
