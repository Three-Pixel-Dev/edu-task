import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, FieldCard, LoadingState, Screen, ScreenHeader } from '@/components';
import { routes } from '@/constants/routes';
import { QUIZ_TYPES } from '@/constants/app';
import { useQuizType, useSubjectCatalog, useSubjectFields } from '@/hooks';
import { spacing } from '@/theme';

export function FieldsScreen() {
  const type = useQuizType();
  const fields = useSubjectFields();
  const catalog = useSubjectCatalog(); // only for the "N subjects" counts

  return (
    <Screen>
      <ScreenHeader back backLabel={`Back to ${QUIZ_TYPES[type].label}`} title="Choose a field" subtitle={`${QUIZ_TYPES[type].label} · CEIT subjects are grouped into fields.`} />
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
        <View style={styles.list}>
          {fields.data.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              subjectCount={catalog.status === 'success' ? (catalog.countByField.get(field.id) ?? 0) : undefined}
              onPress={() => router.push(routes.quizSubjects(field.id, type))}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm + 2 } });
