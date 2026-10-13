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
  ScreenHeader,
  SectionHeader,
  StatGroup,
  StatTile,
} from '@/components';
import { QUIZ } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useActiveSession, useQuizHistory, useQuizStats } from '@/hooks';
import { colors, radius, spacing } from '@/theme';

const RECENT_LIMIT = 5;

export function QuizHomeScreen() {
  const { results, status, error, retry } = useQuizHistory();
  const stats = useQuizStats();
  const active = useActiveSession();
  const loading = status === 'loading';

  return (
    <Screen inTabs>
      <ScreenHeader large title="IT Quiz" subtitle="Test and improve your CEIT knowledge." />

      {status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={retry} />
      ) : (
        <>
          <StatGroup>
            <StatTile label="Quizzes taken" value={loading ? '–' : stats.attempts} />
            <StatTile label="Average score" value={loading ? '–' : `${stats.average}%`} valueColor="primaryDark" />
            <StatTile label="Levels done" value={loading ? '–' : stats.levelsCompleted} />
          </StatGroup>

          {active ? (
            <ContinueQuizCard variant="card" session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level))} />
          ) : null}

          <Card style={styles.start}>
            <SectionHeader title="Start a new quiz" />
            <AppText variant="body" color="textSecondary">
              {`Every quiz has ${QUIZ.questionsPerQuiz} multiple-choice questions.`}
            </AppText>
            <View style={styles.steps} accessible accessibilityLabel={`Three steps: choose a field, pick a subject, select a level from 1 to ${QUIZ.levelCount}`}>
              {['Field', 'Subject', `Level 1–${QUIZ.levelCount}`].map((label, i) => (
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
            <Button title="Browse subjects" leftIcon="book-open" variant="outline" onPress={() => router.push(routes.quizFields)} />
          </Card>

          <View style={styles.section}>
            <SectionHeader
              title="Recent activity"
              meta={results.length ? String(results.length) : undefined}
              actionLabel={results.length > RECENT_LIMIT ? 'See all' : undefined}
              onAction={() => router.push(routes.quizHistory)}
            />
            {loading ? (
              <LoadingState rows={3} label="Loading quiz history" />
            ) : results.length === 0 ? (
              <Card>
                <EmptyState
                  icon="clock"
                  title="No quiz attempts yet."
                  message="Finish your first quiz and your scores will show up here."
                  actionLabel="Start your first quiz"
                  actionIcon="play"
                  onAction={() => router.push(routes.quizFields)}
                />
              </Card>
            ) : (
              <Card padded={false} style={styles.list}>
                {results.slice(0, RECENT_LIMIT).map((result, i) => (
                  <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
                ))}
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  start: { gap: spacing.md },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  stepNumber: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primarySurfaceStrong, alignItems: 'center', justifyContent: 'center' },
  list: { overflow: 'hidden' },
});
