import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import {
  AnswerFeedback,
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  InlineAlert,
  LoadingState,
  QuizOption,
  QuizTimer,
  Screen,
  SegmentedProgress,
  type OptionState,
} from '@/components';
import { routes } from '@/constants/routes';
import { useQuizSession, type PrimaryAction } from '@/hooks';
import { spacing } from '@/theme';

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
  const { question, subject, actions } = quiz;

  // Navigate to the result once submitted (manually or when time runs out).
  useEffect(() => {
    if (quiz.resultId) router.replace(routes.quizResult(quiz.resultId, quiz.remaining === 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.resultId]);

  const confirmExit = useCallback(() => {
    Alert.alert('Leave this quiz?', `Your answers are saved. You can continue from question ${quiz.index + 1} later.`, [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave quiz', onPress: () => (router.canGoBack() ? router.back() : router.replace(routes.quizTab)) },
    ]);
  }, [quiz.index]);

  // Android hardware back → same confirmation (iOS swipe-back is disabled for this screen).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (quiz.status !== 'success') return false;
        confirmExit();
        return true;
      });
      return () => sub.remove();
    }, [confirmExit, quiz.status]),
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

  if (quiz.status === 'loading') {
    return (
      <Screen>
        <LoadingState rows={5} label="Loading quiz" />
      </Screen>
    );
  }

  if (quiz.status === 'error' || !question || !subject) {
    return (
      <Screen>
        <IconButton icon="x" accessibilityLabel="Close quiz" onPress={() => router.back()} />
        <ErrorState title="Couldn’t load this quiz" message={quiz.error ?? undefined} onRetry={quiz.retry} />
      </Screen>
    );
  }

  const optionState = (optionId: string): OptionState => {
    if (!quiz.isChecked) return quiz.selection === optionId ? 'selected' : 'idle';
    if (optionId === question.correctOptionId) return 'correct';
    if (optionId === quiz.selection) return 'incorrect';
    return 'dimmed';
  };

  const correctText = question.options.find((o) => o.id === question.correctOptionId)?.text ?? '';
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
            disabled={quiz.index === 0}
            style={styles.prev}
            fullWidth={false}
          />
          <Button
            title={primaryLabel[quiz.primaryAction]}
            rightIcon={quiz.primaryAction === 'submit' ? 'check' : quiz.primaryAction === 'choose' ? undefined : 'arrow-right'}
            onPress={onPrimary}
            disabled={quiz.primaryAction === 'choose'}
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
          {question.prompt}
        </AppText>
      </Card>

      <View accessibilityRole="radiogroup" accessibilityLabel="Answers" style={styles.options}>
        {question.options.map((option, i) => (
          <QuizOption
            key={option.id}
            letter={LETTERS[i] ?? String(i + 1)}
            text={option.text}
            state={optionState(option.id)}
            locked={quiz.isChecked}
            onPress={() => actions.select(option.id)}
          />
        ))}
      </View>

      {quiz.isChecked ? <AnswerFeedback correct={quiz.isCorrect} correctAnswer={correctText} explanation={question.explanation} /> : null}
      {quiz.error ? <InlineAlert message={quiz.error} /> : null}
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
