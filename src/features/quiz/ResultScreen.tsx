import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  CodeChip,
  EmptyState,
  Icon,
  InlineAlert,
  ScoreRing,
  Screen,
  SectionHeader,
  StatGroup,
  StatTile,
} from '@/components';
import { routes } from '@/constants/routes';
import { findSubject, findQuestion } from '@/data';
import { useCurrentUser, useQuiz } from '@/hooks';
import { colors, radius, spacing } from '@/theme';
import { formatLongDate } from '@/utils/date';
import { firstNameOf } from '@/utils/format';
import { formatClock, percentageOf, scoreMessage } from '@/utils/quiz';

export function ResultScreen() {
  const { resultId, timeUp } = useLocalSearchParams<{ resultId: string; timeUp?: string }>();
  const user = useCurrentUser();
  const { results } = useQuiz();
  const result = useMemo(() => results.find((r) => r.id === resultId), [results, resultId]);
  const [showReview, setShowReview] = useState(false);

  const backToQuiz = () => router.dismissTo(routes.quizTab);

  if (!result) {
    return (
      <Screen>
        <EmptyState
          icon="file-text"
          title="Result not found"
          message="This quiz result is no longer available."
          actionLabel="Back to Quiz"
          actionIcon="arrow-left"
          onAction={backToQuiz}
        />
      </Screen>
    );
  }

  const subject = findSubject(result.subjectId);
  const pct = percentageOf(result);
  const message = scoreMessage(pct, firstNameOf(user.fullName));

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
            onPress={() => router.replace(routes.quizQuestions(result.subjectId, result.level, true))}
          />
          <Button title="Back to Quiz" fullWidth={false} style={styles.flex} onPress={backToQuiz} />
        </View>
      }
    >
      <View style={styles.hero}>
        <AppText variant="title" align="center" accessibilityRole="header">
          Quiz completed 🎉
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

      {timeUp === '1' ? <InlineAlert message="Time’s up — unanswered questions were marked incorrect." /> : null}

      <StatGroup>
        <StatTile label="Correct" value={result.correctAnswers} dot={colors.success} valueColor="successText" />
        <StatTile label="Incorrect" value={result.incorrectAnswers} dot={colors.error} valueColor="errorText" />
        <StatTile label="Total" value={result.totalQuestions} />
      </StatGroup>

      <Card style={styles.details}>
        <View style={styles.detailsTop}>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{subject?.name ?? 'Subject'}</AppText>
            {subject ? <CodeChip code={subject.code} /> : null}
          </View>
          <Badge label={`Level ${result.level}`} tone="primary" />
        </View>
        <View style={styles.detailsRow}>
          <Detail icon="clock" label="Time taken" value={formatClock(result.durationSeconds)} />
          <Detail icon="calendar" label="Completed" value={formatLongDate(result.completedAt)} />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Question review" actionLabel={showReview ? 'Hide answers' : 'Show answers'} onAction={() => setShowReview((v) => !v)} />
        <View style={styles.marks}>
          {result.answers.map((answer, i) => (
            <View
              key={answer.questionId}
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
            {result.answers.map((answer, i) => {
              const q = findQuestion(answer.questionId);
              if (!q) return null;
              const chosen = q.options.find((o) => o.id === answer.selectedOptionId)?.text ?? 'No answer';
              const correct = q.options.find((o) => o.id === q.correctOptionId)?.text ?? '';
              return (
                <View key={answer.questionId} style={[styles.reviewRow, i > 0 && styles.divider]}>
                  <Icon name={answer.isCorrect ? 'check-circle' : 'x-circle'} size={18} color={answer.isCorrect ? 'success' : 'error'} />
                  <View style={styles.flex}>
                    <AppText variant="label">{`${i + 1}. ${q.prompt}`}</AppText>
                    <AppText variant="caption" color={answer.isCorrect ? 'successText' : 'errorText'}>{`Your answer: ${chosen}`}</AppText>
                    {!answer.isCorrect ? (
                      <AppText variant="caption" color="textBody">{`Correct answer: ${correct}`}</AppText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.dismissTo(routes.quizLevels(result.subjectId))} style={styles.levelsLink}>
        <AppText variant="label" color="primaryDark">
          Choose another level
        </AppText>
      </Pressable>
    </Screen>
  );
}

function Detail({ icon, label, value }: { icon: 'clock' | 'calendar'; label: string; value: string }) {
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
