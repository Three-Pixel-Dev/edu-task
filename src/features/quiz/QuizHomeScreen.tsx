import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
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
import { findSubject } from '@/data';
import { useActiveSession, useQuiz, useQuizStats } from '@/hooks';
import { colors, radius, spacing } from '@/theme';

const RECENT_LIMIT = 5;

export function QuizHomeScreen() {
  const { results, status, error, reload } = useQuiz();
  const stats = useQuizStats();
  const active = useActiveSession();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const initialLoading = status === 'loading' && results.length === 0;

  return (
    <Screen inTabs refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <ScreenHeader large title="IT Quiz" subtitle="Test and improve your CEIT knowledge." />

      {status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={reload} />
      ) : (
        <>
          <StatGroup>
            <StatTile label="Quizzes taken" value={initialLoading ? '–' : stats.attempts} />
            <StatTile label="Average score" value={initialLoading ? '–' : `${stats.average}%`} valueColor="primaryDark" />
            <StatTile label="Levels done" value={initialLoading ? '–' : stats.levelsCompleted} />
          </StatGroup>

          {active ? (
            <ContinueQuizCard
              variant="card"
              subject={active.subject}
              session={active.session}
              onContinue={() => router.push(routes.quizQuestions(active.subject.id, active.session.level))}
            />
          ) : null}

          <Card style={styles.start}>
            <SectionHeader title="Start a new quiz" />
            <AppText variant="body" color="textSecondary">
              {`Every quiz has ${QUIZ.questionsPerQuiz} multiple-choice questions.`}
            </AppText>
            <View style={styles.steps} accessible accessibilityLabel="Three steps: choose a field, pick a subject, select a level from 1 to 15">
              {['Field', 'Subject', 'Level 1–15'].map((label, i) => (
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
            <SectionHeader title="Recent activity" meta={results.length ? String(results.length) : undefined} />
            {initialLoading ? (
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
                {results.slice(0, RECENT_LIMIT).map((result, i) => {
                  const subject = findSubject(result.subjectId);
                  if (!subject) return null;
                  return (
                    <AttemptRow
                      key={result.id}
                      result={result}
                      subject={subject}
                      divider={i > 0}
                      onPress={() => router.push(routes.quizResult(result.id))}
                    />
                  );
                })}
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
