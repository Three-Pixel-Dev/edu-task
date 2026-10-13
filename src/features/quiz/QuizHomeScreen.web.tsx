import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  AttemptRow,
  Button,
  Card,
  ContinueQuizCard,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components';
import { QUIZ } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useActiveSession, useQuizHistory } from '@/hooks';
import { colors, spacing } from '@/theme';

const RECENT_LIMIT = 8;

/** Desktop quiz hub: stats + start panel beside recent activity. */
export function QuizHomeScreen() {
  const { results, status, error, retry } = useQuizHistory();
  const active = useActiveSession();
  const loading = status === 'loading';

  return (
    <Screen inTabs>
      <AppText variant="title" accessibilityRole="header">
        IT Quiz
      </AppText>
      <AppText variant="body" color="textSecondary">
        Test and improve your CEIT knowledge.
      </AppText>

      {status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={retry} />
      ) : (
        <>
          <View style={styles.columns}>
            {active ? (
              <View style={styles.continue}>
                <ContinueQuizCard variant="card" session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level))} />
              </View>
            ) : (
              <Card style={styles.continueEmpty}>
                <View>
                  <AppText variant="overline" color="primaryDark">Ready when you are</AppText>
                  <AppText variant="heading" style={styles.emptyTitle}>Start your next quiz</AppText>
                  <AppText color="textSecondary">Choose a subject and level to begin.</AppText>
                </View>
                <Button title="Start a quiz" rightIcon="arrow-right" onPress={() => router.push(routes.quizFields)} />
              </Card>
            )}
            <Card style={styles.start}>
              <SectionHeader title="Browse subjects" />
              <AppText variant="body" color="textSecondary">
                {`Start a new quiz in three steps. Every quiz has ${QUIZ.questionsPerQuiz} multiple-choice questions.`}
              </AppText>
              <View style={styles.steps}>
                {['Choose one of 7 fields', 'Pick a subject', `Select a level from 1 to ${QUIZ.levelCount}`].map((label, i) => (
                  <View key={label} style={styles.step}>
                    <View style={styles.stepNumber}>
                      <AppText variant="tiny" color="primaryDark">
                        {i + 1}
                      </AppText>
                    </View>
                    <AppText variant="caption" color="textBody">
                      {label}
                    </AppText>
                  </View>
                ))}
              </View>
              <Button title="Browse subjects" variant="secondary" leftIcon="book-open" onPress={() => router.push(routes.quizFields)} />
            </Card>
          </View>
            <Card padded={false} style={styles.recent}>
              <View style={styles.recentHeader}>
              <SectionHeader
                title="Recent quiz attempts"
                meta={results.length ? String(results.length) : undefined}
                actionLabel={results.length > RECENT_LIMIT ? 'See all' : undefined}
                onAction={() => router.push(routes.quizHistory)}
              />
              </View>
              {loading ? (
                <LoadingState rows={4} label="Loading quiz history" />
              ) : results.length === 0 ? (
                <View style={styles.emptyRecent}>
                  <EmptyState
                    icon="clock"
                    title="No quiz attempts yet."
                    message="Finish your first quiz and your scores will show up here."
                    actionLabel="Start your first quiz"
                    actionIcon="play"
                    onAction={() => router.push(routes.quizFields)}
                  />
                </View>
              ) : (
                <View style={styles.list}>
                  {results.slice(0, RECENT_LIMIT).map((result, i) => (
                    <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
                  ))}
                </View>
              )}
            </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.xxl },
  continue: { flex: 1.4, minWidth: 0 },
  continueEmpty: { flex: 1.4, justifyContent: 'space-between', gap: spacing.xl, borderColor: colors.primaryBorder },
  emptyTitle: { marginTop: spacing.xs },
  start: { flex: 1, gap: spacing.md, minWidth: 280, maxWidth: 480 },
  recent: { overflow: 'hidden' },
  recentHeader: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: 14 },
  emptyRecent: { borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: spacing.xxl },
  steps: { gap: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 0,
  },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  list: { overflow: 'hidden' },
});
