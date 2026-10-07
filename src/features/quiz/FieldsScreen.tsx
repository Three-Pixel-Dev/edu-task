import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ErrorState, FieldCard, LoadingState, Screen, ScreenHeader } from '@/components';
import { routes } from '@/constants/routes';
import { subjectCountByField } from '@/data';
import { useAsync } from '@/hooks';
import { quizContent } from '@/services/quiz';
import { spacing } from '@/theme';

export function FieldsScreen() {
  const fields = useAsync(() => quizContent.getFields(), [], 'We couldn’t load the fields. Check your connection and try again.');

  return (
    <Screen>
      <ScreenHeader back backLabel="Back to Quiz" title="Choose a field" subtitle="CEIT subjects are grouped into 7 fields." />
      {fields.status === 'loading' ? (
        <LoadingState rows={7} label="Loading fields" />
      ) : fields.status === 'error' || !fields.data ? (
        <ErrorState title="Couldn’t load fields" message={fields.error ?? undefined} onRetry={fields.reload} />
      ) : (
        <View style={styles.list}>
          {fields.data.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              subjectCount={subjectCountByField(field.id)}
              onPress={() => router.push(routes.quizSubjects(field.id))}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm + 2 } });
