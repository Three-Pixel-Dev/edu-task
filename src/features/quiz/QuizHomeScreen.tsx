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
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useActiveSession, useQuizHistoryFor, useQuizStats } from '@/hooks';
import { colors, radius, spacing } from '@/theme';
import type { QuizType } from '@/types';

const RECENT_LIMIT = 5;

/** Hub for one practice type: the "Multiple choice" tab or the "Quiz" (True / False) tab. */
export function QuizHomeScreen({ type = 'multipleChoice' }: { type?: QuizType }) {
  const meta = QUIZ_TYPES[type];
  const isQuiz = type === 'trueFalse';
  const { results, status, error, retry } = useQuizHistoryFor(type);
  const stats = useQuizStats(type);
  const active = useActiveSession(type);
  const loading = status === 'loading';
  const browse = () => router.push(routes.quizFields(type));

  return (
    <Screen inTabs>
      <ScreenHeader
        large
        title={meta.title}
        subtitle={isQuiz ? 'True or false — quick checks of your CEIT knowledge.' : 'Four options, one answer — test your CEIT knowledge.'}
      />

      {status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={retry} />
      ) : (
        <>
          <StatGroup>
            <StatTile label={isQuiz ? 'Quizzes taken' : 'Sets taken'} value={loading ? '–' : stats.attempts} />
            <StatTile label="Average score" value={loading ? '–' : `${stats.average}%`} valueColor="primaryDark" />
            <StatTile label="Levels done" value={loading ? '–' : stats.levelsCompleted} />
          </StatGroup>

          {active ? (
            <ContinueQuizCard variant="card" session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level, false, type))} />
          ) : null}

          <Card style={styles.start}>
            <SectionHeader title={isQuiz ? 'Start a new quiz' : 'Start multiple choice'} />
            <AppText variant="body" color="textSecondary">
              {isQuiz
                ? `Every quiz has ${QUIZ.questionsPerQuiz} true-or-false statements.`
                : `Every set has ${QUIZ.questionsPerQuiz} multiple-choice questions (A–D).`}
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
            <Button title="Browse subjects" leftIcon="book-open" variant="outline" onPress={browse} />
          </Card>

          <View style={styles.section}>
            <SectionHeader
              title="Recent activity"
              meta={results.length ? String(results.length) : undefined}
              actionLabel={results.length > RECENT_LIMIT ? 'See all' : undefined}
              onAction={() => router.push(routes.quizHistoryFor(type))}
            />
            {loading ? (
              <LoadingState rows={3} label="Loading quiz history" />
            ) : results.length === 0 ? (
              <Card>
                <EmptyState
                  icon="clock"
                  title={isQuiz ? 'No quiz attempts yet.' : 'No multiple choice attempts yet.'}
                  message={`Finish your first ${isQuiz ? 'quiz' : 'set'} and your scores will show up here.`}
                  actionLabel={isQuiz ? 'Start your first quiz' : 'Start your first set'}
                  actionIcon="play"
                  onAction={browse}
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
