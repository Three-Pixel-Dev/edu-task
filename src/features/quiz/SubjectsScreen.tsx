import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, EmptyState, ErrorState, Icon, IconButton, LoadingState, Screen, ScreenHeader, SubjectCard, toIconName } from '@/components';
import { QUIZ } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useQuizHistory, useSubjects } from '@/hooks';
import { colors, fonts, radius, spacing, touch } from '@/theme';
import type { Subject } from '@/types';
import { levelProgressFor } from '@/utils/quiz';

export function SubjectsScreen() {
  const { fieldId = '' } = useLocalSearchParams<{ fieldId: string }>();
  const { results, sessions } = useQuizHistory();
  const [query, setQuery] = useState('');

  const data = useSubjects(fieldId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.data?.subjects ?? []).filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [data.data, query]);

  const statusFor = (subject: Subject) => {
    const levels = levelProgressFor(subject.id, results, sessions);
    const current = levels.find((l) => l.status === 'current');
    const completed = levels.filter((l) => l.status === 'completed').length;
    const label = current
      ? `Level ${current.level} in progress`
      : completed
        ? `${completed} of ${QUIZ.levelCount} levels done`
        : 'Not started';
    return { label, progress: completed / QUIZ.levelCount };
  };

  const field = data.data?.field;

  return (
    <Screen>
      <ScreenHeader
        back
        backLabel="Back to fields"
        title={field?.name ?? 'Subjects'}
        subtitle="Choose a subject to start a quiz."
        leading={
          field ? (
            <View style={styles.fieldIcon}>
              <Icon name={toIconName(field.icon)} size={22} color="primary" />
            </View>
          ) : null
        }
      />

      {data.status === 'loading' ? (
        <LoadingState rows={5} label="Loading subjects" />
      ) : data.status === 'error' ? (
        <ErrorState title="Couldn’t load subjects" message={data.error ?? undefined} onRetry={data.reload} />
      ) : (
        <>
          <View style={styles.search}>
            <Icon name="search" size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or code"
              placeholderTextColor={colors.textDisabled}
              accessibilityLabel="Search subjects"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              maxFontSizeMultiplier={1.4}
              style={styles.searchInput}
            />
            {query ? <IconButton icon="x" variant="plain" accessibilityLabel="Clear search" onPress={() => setQuery('')} /> : null}
          </View>

          <AppText variant="caption" color="textSecondary">
            {`${filtered.length} ${filtered.length === 1 ? 'subject' : 'subjects'}`}
          </AppText>

          {data.data?.subjects.length === 0 ? (
            <EmptyState icon="book-open" title="No subjects yet" message="Subjects for this field haven’t been added to the database yet." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No subjects match your search."
              message="Try a subject name or a code like CEIT-4031."
              actionLabel="Clear search"
              actionIcon="x"
              onAction={() => setQuery('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((subject) => {
                const status = statusFor(subject);
                return (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    status={status.label}
                    progress={status.progress}
                    onPress={() => router.push(routes.quizLevels(subject.id))}
                  />
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.min + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingLeft: spacing.md + 2,
    paddingRight: spacing.xs,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
  list: { gap: spacing.sm + 2 },
});
