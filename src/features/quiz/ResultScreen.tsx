import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  CodeChip,
  ErrorState,
  Icon,
  InlineAlert,
  LoadingState,
  QuizTypeBadge,
  ScoreRing,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatGroup,
  StatTile,
} from '@/components';
import { QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useAsync, useProfile, useQuizHistory, useUid } from '@/hooks';
import { getQuizResult } from '@/services/quizResults';
import { colors, radius, spacing } from '@/theme';
import type { QuizResult } from '@/types';
import { formatLongDate } from '@/utils/date';
import { firstNameOf } from '@/utils/format';
import { formatClock, scoreMessage } from '@/utils/quiz';

export function ResultScreen() {
  const { resultId = '', timeUp } = useLocalSearchParams<{ resultId: string; timeUp?: string }>();
  const uid = useUid();
  const { results } = useQuizHistory();
  const fromListener = useMemo(() => results.find((r) => r.id === resultId), [results, resultId]);
  // Opened from a link or before the listener has caught up → read it directly.
  const fetched = useAsync(() => (fromListener ? Promise.resolve(fromListener) : getQuizResult(uid, resultId)), [resultId, Boolean(fromListener)]);
  const result = fromListener ?? fetched.data;
  const backToQuiz = () => router.dismissTo(routes.quizTypeTab(result?.quizType));

  if (!result) {
    return (
      <Screen>
        <ScreenHeader back backIcon="x" backLabel="Close" onBack={backToQuiz} />
        {fetched.status === 'error' ? (
          <ErrorState title="Couldn’t load this result" message={fetched.error ?? undefined} onRetry={fetched.reload} />
        ) : (
          <LoadingState rows={3} label="Loading result" />
        )}
      </Screen>
    );
  }

  return <ResultView result={result} timeUp={timeUp === '1'} onBack={backToQuiz} />;
}

function ResultView({ result, timeUp, onBack }: { result: QuizResult; timeUp: boolean; onBack: () => void }) {
  const { displayName } = useProfile();
  const [showReview, setShowReview] = useState(false);
  const message = scoreMessage(result.percentage, firstNameOf(displayName || 'there'));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            title="Try again"
            variant="secondary"
            leftIcon="rotate-ccw"
            fullWidth={false}
            style={styles.flex}
            onPress={() => router.replace(routes.quizQuestions(result.subjectId, result.level, true, result.quizType))}
          />
          <Button title="Done" accessibilityLabel={`Back to ${QUIZ_TYPES[result.quizType].label}`} fullWidth={false} style={styles.flex} onPress={onBack} />
        </View>
      }
    >
      <View style={styles.hero}>
        <AppText variant="title" align="center" accessibilityRole="header">
          {`${QUIZ_TYPES[result.quizType].label} completed 🎉`}
        </AppText>
        <ScoreRing score={result.correctAnswers} total={result.totalQuestions} />
        <View style={styles.message}>
          <AppText variant="subheading" align="center">
            {message.title}
          </AppText>
          <AppText variant="body" color="textSecondary" align="center">
            {message.body}
          </AppText>
        </View>
      </View>

      {timeUp ? <InlineAlert message="Time’s up — unanswered questions were marked incorrect." /> : null}

      <StatGroup>
        <StatTile label="Correct" value={result.correctAnswers} dot={colors.success} valueColor="successText" />
        <StatTile label="Incorrect" value={result.incorrectAnswers} dot={colors.error} valueColor="errorText" />
        <StatTile label="Total" value={result.totalQuestions} />
      </StatGroup>

      <Card style={styles.details}>
        <View style={styles.detailsTop}>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{result.subjectName}</AppText>
            {result.subjectCode ? <CodeChip code={result.subjectCode} /> : null}
          </View>
          <View style={styles.badges}>
            <QuizTypeBadge type={result.quizType} withIcon={false} />
            <Badge label={`Level ${result.level}`} tone="primary" />
          </View>
        </View>
        <View style={styles.detailsRow}>
          <Detail icon="percent" label="Score" value={`${result.score} / ${result.totalQuestions} · ${result.percentage}%`} />
          <Detail icon="clock" label="Time taken" value={formatClock(result.durationSeconds)} />
          <Detail icon="calendar" label="Completed" value={formatLongDate(result.completedAt)} />
        </View>
      </Card>

      {result.answers.length ? (
        <View style={styles.section}>
          <SectionHeader title="Question review" actionLabel={showReview ? 'Hide answers' : 'Show answers'} onAction={() => setShowReview((v) => !v)} />
          <View style={styles.marks}>
            {result.answers.map((answer, i) => (
              <View
                key={answer.questionId || i}
                accessible
                accessibilityLabel={`Question ${i + 1}: ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                style={[styles.mark, { backgroundColor: answer.isCorrect ? colors.successSurfaceStrong : colors.errorSurfaceStrong }]}
              >
                <AppText variant="captionStrong" color={answer.isCorrect ? 'successText' : 'errorText'}>
                  {i + 1}
                </AppText>
              </View>
            ))}
          </View>
          {showReview ? (
            <Card padded={false} style={styles.review}>
              {result.answers.map((answer, i) => (
                <View key={answer.questionId || i} style={[styles.reviewRow, i > 0 && styles.divider]}>
                  <Icon name={answer.isCorrect ? 'check-circle' : 'x-circle'} size={18} color={answer.isCorrect ? 'success' : 'error'} />
                  <View style={styles.flex}>
                    <AppText variant="label">{`${i + 1}. ${answer.question}`}</AppText>
                    <AppText variant="caption" color={answer.isCorrect ? 'successText' : 'errorText'}>
                      {`Your answer: ${answer.selectedAnswer || 'No answer'}`}
                    </AppText>
                    {!answer.isCorrect ? <AppText variant="caption" color="textBody">{`Correct answer: ${answer.correctAnswer}`}</AppText> : null}
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.dismissTo(routes.quizLevels(result.subjectId, result.quizType))} style={styles.levelsLink}>
        <AppText variant="label" color="primaryDark">
          Choose another level
        </AppText>
      </Pressable>
    </Screen>
  );
}

function Detail({ icon, label, value }: { icon: 'clock' | 'calendar' | 'percent'; label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Icon name={icon} size={16} />
      <View>
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="label">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.xs },
  footer: { flexDirection: 'row', gap: spacing.md },
  badges: { alignItems: 'flex-end', gap: spacing.xs },
  hero: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
  message: { gap: spacing.xs, maxWidth: 340 },
  details: { gap: spacing.lg },
  detailsTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { gap: spacing.md },
  marks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mark: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  review: { overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  levelsLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
