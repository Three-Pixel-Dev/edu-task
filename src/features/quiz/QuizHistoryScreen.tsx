import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { AttemptRow, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, SegmentedControl, type Segment } from '@/components';
import { routes } from '@/constants/routes';
import { useQuizHistoryFor, useQuizStats } from '@/hooks';
import type { QuizType } from '@/types';
import { pluralise } from '@/utils/format';

type Filter = 'all' | QuizType;

const FILTERS: Segment<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'multipleChoice', label: 'Multiple choice' },
  { value: 'trueFalse', label: 'Quiz' },
];

const toFilter = (value: string | undefined): Filter => (value === 'multipleChoice' || value === 'trueFalse' ? value : 'all');

/** Full history: quizResults where userId == uid, newest first, filterable by type. */
export function QuizHistoryScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<Filter>(toFilter(params.filter));
  const type = filter === 'all' ? undefined : filter;
  const { results, status, error, retry } = useQuizHistoryFor(type);
  const stats = useQuizStats(type);

  return (
    <Screen>
      <ScreenHeader
        back
        title="Attempt history"
        subtitle={status === 'success' && results.length ? `${pluralise(stats.attempts, 'attempt')} · ${stats.average}% average` : undefined}
      />
      <SegmentedControl segments={FILTERS} value={filter} onChange={setFilter} accessibilityLabel="Show attempts for" />
      {status === 'loading' ? (
        <LoadingState rows={6} label="Loading attempt history" />
      ) : status === 'error' ? (
        <ErrorState title="Couldn’t load your attempts" message={error ?? undefined} onRetry={retry} />
      ) : results.length === 0 ? (
        <EmptyState
          icon="clock"
          title={filter === 'trueFalse' ? 'No quiz attempts yet.' : filter === 'multipleChoice' ? 'No multiple choice attempts yet.' : 'No attempts yet.'}
          message="Finish your first set and your scores will show up here."
          actionLabel="Start practising"
          actionIcon="play"
          onAction={() => router.push(routes.quizFields(filter === 'trueFalse' ? 'trueFalse' : 'multipleChoice'))}
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
