import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, CodeChip, ErrorState, Icon, LoadingState, QuizTypeBadge, Screen } from '@/components';
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import { useLevelProgress, useQuizHistory, useQuizType, useSubject } from '@/hooks';
import { colors, fonts, radius, spacing } from '@/theme';
import type { LevelProgress } from '@/types';
import { padLevel } from '@/utils/quiz';

function defaultLevel(levels: LevelProgress[]) {
  return (levels.find((level) => level.status === 'current') ?? levels.find((level) => level.status !== 'completed') ?? levels[0])?.level ?? 1;
}

export function LevelsScreen() {
  const { subjectId = '' } = useLocalSearchParams<{ subjectId: string }>();
  const type = useQuizType();
  const subject = useSubject(subjectId);
  const history = useQuizHistory();
  const levels = useLevelProgress(subjectId, type);
  const [picked, setPicked] = useState<number | null>(null);
  const selectedLevel = picked ?? (levels.length ? defaultLevel(levels) : null);
  const selected = useMemo(() => levels.find((level) => level.level === selectedLevel), [levels, selectedLevel]);
  const completed = levels.filter((level) => level.status === 'completed').length;

  const start = () => {
    if (subject.data && selected) router.push(routes.quizQuestions(subject.data.id, selected.level, selected.status !== 'current', type));
  };

  if (subject.status === 'loading' || history.status === 'loading') {
    return <Screen><LoadingState rows={5} label="Loading levels" /></Screen>;
  }
  if (subject.status === 'error' || !subject.data) {
    return <Screen><ErrorState title="Couldn’t load this subject" message={subject.error ?? undefined} onRetry={subject.reload} /></Screen>;
  }

  const cta = selected?.status === 'current' ? `Continue level ${padLevel(selected.level)}` : selected?.status === 'completed' ? `Retake level ${padLevel(selected.level)}` : `Start level ${padLevel(selected?.level ?? 1)}`;

  return (
    <Screen gap={spacing.xxl}>
      <View>
        <AppText style={styles.pageTitle}>Choose question level</AppText>
        <View style={styles.subjectLine}>
          <QuizTypeBadge type={type} />
          <AppText variant="bodyStrong">{subject.data.name}</AppText>
          <CodeChip code={subject.data.code} />
        </View>
      </View>
      <View style={styles.split}>
        <Card style={styles.levelPanel}>
          <View style={styles.levelHeader}>
            <AppText color="textSecondary">
              <AppText variant="bodyStrong">{completed}</AppText>{` of ${QUIZ.levelCount} levels completed`}
            </AppText>
            <View style={styles.legend}>
              <Legend color={colors.successSurfaceStrong} border={colors.successBorder} label="Completed" />
              <Legend color={colors.card} border={colors.primary} label="Current" />
              <Legend color={colors.card} border={colors.borderStrong} label="Available" />
            </View>
          </View>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {levels.map((level) => {
              const active = level.level === selectedLevel;
              const done = level.status === 'completed';
              const current = level.status === 'current';
              return (
                <Pressable
                  key={level.level}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setPicked(level.level)}
                  style={[styles.level, done && styles.levelDone, current && styles.levelCurrent, active && styles.levelActive]}
                >
                  <AppText variant="tiny" color={active ? 'onPrimaryMuted' : 'textSecondary'}>Level</AppText>
                  <AppText style={styles.levelNumber} color={active ? 'onPrimary' : 'text'}>{padLevel(level.level)}</AppText>
                  <AppText variant="tiny" color={active ? 'onPrimaryMuted' : done ? 'successText' : current ? 'primaryDark' : 'textSecondary'}>
                    {done ? `${level.bestScore ?? 0}/10` : current ? `Q${level.currentQuestion ?? 1} of 10` : '10 Qs'}
                  </AppText>
                  {done ? <View style={[styles.tick, active && styles.tickActive]}><Icon name="check" size={12} color={active ? 'primary' : 'onPrimary'} /></View> : null}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.selectedPanel}>
          <View>
            <AppText variant="overline" color="textSecondary">Selected</AppText>
            <AppText style={styles.selectedTitle}>{`Level ${padLevel(selected?.level ?? 1)}`}</AppText>
            <View style={[styles.statusPill, selected?.status === 'completed' ? styles.donePill : styles.currentPill]}>
              <AppText variant="captionStrong" color={selected?.status === 'completed' ? 'successText' : 'primaryDark'}>
                {selected?.status === 'completed' ? 'Completed' : selected?.status === 'current' ? 'In progress' : 'Available'}
              </AppText>
            </View>
          </View>
          <View>
            <Detail label="Questions" value="10" />
            <Detail label="Format" value={QUIZ_TYPES[type].format} />
            <Detail label="Time limit" value="10 min" />
            <Detail label="Best score" value={selected?.bestScore == null ? '—' : `${selected.bestScore}/10`} />
          </View>
          <Button title={cta} rightIcon="arrow-right" onPress={start} disabled={!selected} />
          <Pressable onPress={() => router.back()} style={styles.otherSubject}>
            <AppText variant="label" color="textSubtle">Choose another subject</AppText>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}

function Legend({ color, border, label }: { color: string; border: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: color, borderColor: border }]} /><AppText variant="caption" color="textSubtle">{label}</AppText></View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><AppText variant="label" color="textSecondary">{label}</AppText><AppText variant="label">{value}</AppText></View>;
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  subjectLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  split: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxl },
  levelPanel: { flex: 1, minWidth: 0, padding: spacing.xxl, gap: 18 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, flexWrap: 'wrap' },
  legend: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  level: { position: 'relative', width: '18%', flexGrow: 1, minWidth: 105, height: 92, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, paddingVertical: spacing.md, paddingHorizontal: 14, justifyContent: 'space-between', alignItems: 'flex-start' },
  levelDone: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  levelCurrent: { borderWidth: 2, borderColor: colors.primary },
  levelActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark, borderWidth: 2 },
  levelNumber: { fontFamily: fonts.monoBold, fontSize: 24, lineHeight: 26 },
  tick: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  tickActive: { backgroundColor: colors.card },
  selectedPanel: { flexBasis: 320, padding: spacing.xxl, gap: 18 },
  selectedTitle: { marginTop: 6, fontSize: 24, lineHeight: 32 },
  statusPill: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  donePill: { backgroundColor: colors.successSurfaceStrong },
  currentPill: { backgroundColor: colors.primarySurface },
  detail: { minHeight: 41, borderTopWidth: 1, borderTopColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otherSubject: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
});
