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
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useActiveSession, useQuizHistoryFor } from '@/hooks';
import { colors, spacing } from '@/theme';
import type { QuizType } from '@/types';

const RECENT_LIMIT = 8;

/** Desktop hub for one practice type: "Multiple choice" or "Quiz" (True / False). */
export function QuizHomeScreen({ type = 'multipleChoice' }: { type?: QuizType }) {
  const isQuiz = type === 'trueFalse';
  const { results, status, error, retry } = useQuizHistoryFor(type);
  const active = useActiveSession(type);
  const loading = status === 'loading';
  const browse = () => router.push(routes.quizFields(type));

  return (
    <Screen inTabs>
      <AppText variant="title" accessibilityRole="header">
        {QUIZ_TYPES[type].title}
      </AppText>
      <AppText variant="body" color="textSecondary">
        {isQuiz ? 'True or false — quick checks of your CEIT knowledge.' : 'Four options, one answer — test your CEIT knowledge.'}
      </AppText>

      {status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={retry} />
      ) : (
        <>
          <View style={styles.columns}>
            {active ? (
              <View style={styles.continue}>
                <ContinueQuizCard variant="card" session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level, false, type))} />
              </View>
            ) : (
              <Card style={styles.continueEmpty}>
                <View>
                  <AppText variant="overline" color="primaryDark">Ready when you are</AppText>
                  <AppText variant="heading" style={styles.emptyTitle}>{isQuiz ? 'Start your next quiz' : 'Start your next set'}</AppText>
                  <AppText color="textSecondary">Choose a subject and level to begin.</AppText>
                </View>
                <Button title={isQuiz ? 'Start a quiz' : 'Start a set'} rightIcon="arrow-right" onPress={browse} />
              </Card>
            )}
            <Card style={styles.start}>
              <SectionHeader title="Browse subjects" />
              <AppText variant="body" color="textSecondary">
                {isQuiz
                  ? `Start a new quiz in three steps. Every quiz has ${QUIZ.questionsPerQuiz} true-or-false statements.`
                  : `Start a new set in three steps. Every set has ${QUIZ.questionsPerQuiz} multiple-choice questions (A–D).`}
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
              <Button title="Browse subjects" variant="secondary" leftIcon="book-open" onPress={browse} />
            </Card>
          </View>
            <Card padded={false} style={styles.recent}>
              <View style={styles.recentHeader}>
              <SectionHeader
                title={isQuiz ? 'Recent quiz attempts' : 'Recent multiple choice attempts'}
                meta={results.length ? String(results.length) : undefined}
                actionLabel={results.length > RECENT_LIMIT ? 'See all' : undefined}
                onAction={() => router.push(routes.quizHistoryFor(type))}
              />
              </View>
              {loading ? (
                <LoadingState rows={4} label="Loading quiz history" />
              ) : results.length === 0 ? (
                <View style={styles.emptyRecent}>
                  <EmptyState
                    icon="clock"
                    title={isQuiz ? 'No quiz attempts yet.' : 'No multiple choice attempts yet.'}
                    message={`Finish your first ${isQuiz ? 'quiz' : 'set'} and your scores will show up here.`}
                    actionLabel={isQuiz ? 'Start your first quiz' : 'Start your first set'}
                    actionIcon="play"
                    onAction={browse}
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
