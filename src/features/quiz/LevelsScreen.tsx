import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, CodeChip, ErrorState, LevelCard, LoadingState, QuizTypeBadge, Screen, ScreenHeader } from '@/components';
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useLevelProgress, useQuizHistory, useQuizType, useResponsive, useSubject } from '@/hooks';
import { colors, spacing } from '@/theme';
import type { LevelProgress } from '@/types';
import { padLevel } from '@/utils/quiz';

const GRID_GAP = spacing.md;

/** Default selection: the level in progress, else the first not yet completed. */
function defaultLevel(levels: LevelProgress[]) {
  return (levels.find((l) => l.status === 'current') ?? levels.find((l) => l.status !== 'completed') ?? levels[0])?.level ?? 1;
}

export function LevelsScreen() {
  const { subjectId = '' } = useLocalSearchParams<{ subjectId: string }>();
  const type = useQuizType();
  const subject = useSubject(subjectId);
  const history = useQuizHistory();
  const levels = useLevelProgress(subjectId, type);
  const { levelColumns } = useResponsive();
  const [gridWidth, setGridWidth] = useState(0);
  const [userPick, setPicked] = useState<number | null>(null);
  const picked = userPick ?? (levels.length ? defaultLevel(levels) : null);

  const selected = useMemo(() => levels.find((l) => l.level === picked), [levels, picked]);
  const completedCount = levels.filter((l) => l.status === 'completed').length;
  const cardWidth = gridWidth ? Math.floor((gridWidth - GRID_GAP * (levelColumns - 1)) / levelColumns) : 0;

  const start = () => {
    if (!subject.data || !selected) return;
    // Resume an in-progress level; otherwise start a fresh attempt.
    router.push(routes.quizQuestions(subject.data.id, selected.level, selected.status !== 'current', type));
  };

  const cta = !selected
    ? 'Choose a level'
    : selected.status === 'current'
      ? `Continue level ${padLevel(selected.level)}`
      : selected.status === 'completed'
        ? `Retake level ${padLevel(selected.level)}`
        : `Start level ${padLevel(selected.level)}`;

  return (
    <Screen
      footer={
        subject.data ? (
          <>
            <AppText variant="caption" color="textSecondary" align="center">
              {`${QUIZ.questionsPerQuiz} questions · ${QUIZ_TYPES[type].format} · ${QUIZ.durationSeconds / 60} min`}
            </AppText>
            <Button title={cta} rightIcon="arrow-right" onPress={start} disabled={!selected} />
          </>
        ) : null
      }
    >
      {subject.status === 'loading' || history.status === 'loading' ? (
        <LoadingState rows={4} label="Loading levels" />
      ) : subject.status === 'error' || !subject.data ? (
        <>
          <ScreenHeader back />
          <ErrorState title="Couldn’t load this subject" message={subject.error ?? undefined} onRetry={subject.reload} />
        </>
      ) : (
        <>
          <ScreenHeader back backLabel="Back to subjects" />
          <View style={styles.subject}>
            <QuizTypeBadge type={type} />
            <AppText variant="bodyStrong">{subject.data.name}</AppText>
            <CodeChip code={subject.data.code} />
          </View>
          <View style={styles.titleBlock}>
            <AppText variant="title" accessibilityRole="header">
              Choose question level
            </AppText>
            <AppText variant="body" color="textSecondary">
              {`${completedCount} of ${QUIZ.levelCount} levels completed`}
            </AppText>
          </View>

          <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <LegendItem label="Completed" swatch={{ backgroundColor: colors.successSurfaceStrong, borderColor: colors.success }} />
            <LegendItem label="In progress" swatch={{ backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }} />
            <LegendItem label="Available" swatch={{ backgroundColor: colors.card, borderColor: colors.borderStrong }} />
          </View>

          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Question level"
            style={styles.grid}
            onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          >
            {cardWidth > 0
              ? levels.map((progress) => (
                  <LevelCard
                    key={progress.level}
                    progress={progress}
                    width={cardWidth}
                    selected={progress.level === picked}
                    onPress={() => setPicked(progress.level)}
                  />
                ))
              : null}
          </View>
        </>
      )}
    </Screen>
  );
}

function LegendItem({ label, swatch }: { label: string; swatch: object }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <AppText variant="caption" color="textSubtle">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  subject: { gap: spacing.xs, alignItems: 'flex-start' },
  titleBlock: { gap: spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  swatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, minHeight: 72 * 5 },
});
