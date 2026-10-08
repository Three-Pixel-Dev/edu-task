import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { AttemptRow, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components';
import { routes } from '@/constants/routes';
import { useQuizHistory, useQuizStats } from '@/hooks';
import { pluralise } from '@/utils/format';

/** Full quiz history: quizResults where userId == uid, newest first. */
export function QuizHistoryScreen() {
  const { results, status, error, retry } = useQuizHistory();
  const stats = useQuizStats();

  return (
    <Screen>
      <ScreenHeader
        back
        title="Quiz history"
        subtitle={status === 'success' && results.length ? `${pluralise(stats.attempts, 'attempt')} · ${stats.average}% average` : undefined}
      />
      {status === 'loading' ? (
        <LoadingState rows={6} label="Loading quiz history" />
      ) : status === 'error' ? (
        <ErrorState title="Couldn’t load your quiz history" message={error ?? undefined} onRetry={retry} />
      ) : results.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No quiz attempts yet."
          message="Finish your first quiz and your scores will show up here."
          actionLabel="Start a quiz"
          actionIcon="play"
          onAction={() => router.push(routes.quizFields)}
        />
      ) : (
        <Card padded={false} style={styles.list}>
          {results.map((result, i) => (
            <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { overflow: 'hidden' } });
