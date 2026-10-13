import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, FieldCard, LoadingState, Screen, ScreenHeader } from '@/components';
import { routes } from '@/constants/routes';
import { useSubjectCatalog, useSubjectFields } from '@/hooks';
import { spacing } from '@/theme';

/** Desktop fields: responsive multi-column cards. */
export function FieldsScreen() {
  const fields = useSubjectFields();
  const catalog = useSubjectCatalog();

  return (
    <Screen>
      <ScreenHeader back backLabel="Back to Quiz" title="Choose a field" subtitle="CEIT subjects are grouped into fields." />
      {fields.status === 'loading' ? (
        <LoadingState rows={7} label="Loading fields" />
      ) : fields.status === 'error' || !fields.data ? (
        <ErrorState title="Couldn’t load fields" message={fields.error ?? undefined} onRetry={fields.reload} />
      ) : fields.data.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No fields yet"
          message="The subject fields haven’t been added to the database. Ask your administrator to run the content seed."
        />
      ) : (
        <View style={styles.grid}>
          {fields.data.map((field) => (
            <View key={field.id} style={styles.cell}>
              <FieldCard
                field={field}
                subjectCount={catalog.status === 'success' ? (catalog.countByField.get(field.id) ?? 0) : undefined}
                onPress={() => router.push(routes.quizSubjects(field.id))}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '31%', minWidth: 240, flexGrow: 1 },
});
