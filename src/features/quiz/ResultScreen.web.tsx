import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, CodeChip, ErrorState, LoadingState, ScoreRing, Screen } from '@/components';
import { routes } from '@/constants/routes';
import { useAsync, useProfile, useQuizHistory, useUid } from '@/hooks';
import { getQuizResult } from '@/services/quizResults';
import { colors, fonts, radius, spacing } from '@/theme';
import type { QuizResult } from '@/types';
import { firstNameOf } from '@/utils/format';
import { formatClock, scoreMessage } from '@/utils/quiz';

export function ResultScreen() {
  const { resultId = '', timeUp } = useLocalSearchParams<{ resultId: string; timeUp?: string }>();
  const uid = useUid();
  const { results } = useQuizHistory();
  const fromListener = useMemo(() => results.find((result) => result.id === resultId), [results, resultId]);
  const fetched = useAsync(() => (fromListener ? Promise.resolve(fromListener) : getQuizResult(uid, resultId)), [resultId, Boolean(fromListener)]);
  const result = fromListener ?? fetched.data;
  const close = () => router.dismissTo(routes.quizTab);

  if (!result) {
    return <Screen>{fetched.status === 'error' ? <ErrorState title="Couldn’t load this result" message={fetched.error ?? undefined} onRetry={fetched.reload} /> : <LoadingState rows={3} label="Loading result" />}</Screen>;
  }

  return <ResultView result={result} timeUp={timeUp === '1'} onClose={close} />;
}

function ResultView({ result, timeUp, onClose }: { result: QuizResult; timeUp: boolean; onClose: () => void }) {
  const { displayName } = useProfile();
  const message = scoreMessage(result.percentage, firstNameOf(displayName || 'there'));

  return (
    <Screen gap={spacing.xl}>
      <Card style={styles.scoreCard}>
        <AppText style={styles.title} align="center">Quiz completed 🎉</AppText>
        <ScoreRing score={result.correctAnswers} total={result.totalQuestions} />
        <AppText variant="body" color="textBody" align="center" style={styles.message}>
          {timeUp ? 'Time’s up — unanswered questions were marked incorrect. ' : ''}{message.body}
        </AppText>
        <View style={styles.stats}>
          <Stat label="Correct" value={String(result.correctAnswers)} tone="success" />
          <Stat label="Incorrect" value={String(result.incorrectAnswers)} tone="error" />
          <Stat label="Total" value={String(result.totalQuestions)} />
          <Stat label="Time taken" value={formatClock(result.durationSeconds)} mono />
        </View>
      </Card>

      <Card style={styles.detailsCard}>
        <View style={styles.detailsTop}>
          <View style={styles.subject}>
            <AppText variant="subheading">{result.subjectName}</AppText>
            <View style={styles.subjectMeta}><CodeChip code={result.subjectCode} /><AppText color="textSecondary">{`· Level ${result.level}`}</AppText></View>
          </View>
          <Badge label="Level completed" tone="success" />
        </View>
        {result.answers.length ? (
          <View>
            <AppText variant="caption" color="textSecondary" style={styles.reviewLabel}>Question review</AppText>
            <View style={styles.marks}>
              {result.answers.map((answer, index) => (
                <View key={answer.questionId || index} accessibilityLabel={`Question ${index + 1}: ${answer.isCorrect ? 'correct' : 'incorrect'}`} style={[styles.mark, answer.isCorrect ? styles.markCorrect : styles.markWrong]}>
                  <AppText variant="captionStrong" color={answer.isCorrect ? 'successText' : 'errorText'}>{index + 1}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button title="Try again" variant="secondary" leftIcon="rotate-ccw" fullWidth={false} style={styles.action} onPress={() => router.replace(routes.quizQuestions(result.subjectId, result.level, true))} />
        <Button title="Back to Quiz" fullWidth={false} style={styles.action} onPress={onClose} />
      </View>
      <Pressable onPress={() => router.dismissTo(routes.quizLevels(result.subjectId))} style={styles.levelLink}>
        <AppText variant="label" color="primaryDark">Choose another level</AppText>
      </Pressable>
    </Screen>
  );
}

function Stat({ label, value, tone, mono }: { label: string; value: string; tone?: 'success' | 'error'; mono?: boolean }) {
  const box = tone === 'success' ? styles.statSuccess : tone === 'error' ? styles.statError : styles.statNeutral;
  const color = tone === 'success' ? 'successText' : tone === 'error' ? 'errorText' : 'text';
  return (
    <View style={[styles.stat, box]}>
      <AppText variant="caption" color={tone ? color : 'textSecondary'}>{label}</AppText>
      <AppText style={[styles.statValue, mono && styles.mono]} color={color}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreCard: { borderRadius: radius.xxl, paddingVertical: spacing.xxxl, paddingHorizontal: 28, alignItems: 'center', gap: 18 },
  title: { fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  message: { maxWidth: 420 },
  stats: { width: '100%', flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  stat: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: 14 },
  statSuccess: { borderColor: colors.successBorder, backgroundColor: colors.successSurface },
  statError: { borderColor: colors.errorBorder, backgroundColor: colors.errorSurface },
  statNeutral: { borderColor: colors.border, backgroundColor: colors.background },
  statValue: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  mono: { fontFamily: fonts.monoBold, fontSize: 22 },
  detailsCard: { paddingVertical: spacing.xl, paddingHorizontal: 22, gap: spacing.lg },
  detailsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  subject: { flex: 1, gap: 3 },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reviewLabel: { marginBottom: spacing.sm },
  marks: { flexDirection: 'row', gap: 6 },
  mark: { flex: 1, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  markCorrect: { backgroundColor: colors.successSurfaceStrong },
  markWrong: { backgroundColor: colors.errorSurfaceStrong },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  action: { flex: 1, maxWidth: 240 },
  levelLink: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
});
