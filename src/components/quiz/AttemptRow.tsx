import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import type { QuizResult, Subject } from '@/types';
import { formatRelativeDay } from '@/utils/date';
import { percentageOf } from '@/utils/quiz';
import { AppText, Badge, type BadgeTone } from '../ui';

interface AttemptRowProps {
  result: QuizResult;
  subject: Subject;
  onPress: () => void;
  divider?: boolean;
}

export function scoreTone(percentage: number): BadgeTone {
  if (percentage >= 80) return 'success';
  if (percentage >= 60) return 'neutral';
  return 'warning';
}

export function AttemptRow({ result, subject, onPress, divider }: AttemptRowProps) {
  const pct = percentageOf(result);
  const when = formatRelativeDay(result.completedAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subject.name}, level ${result.level}, scored ${result.score} out of ${result.totalQuestions}, ${when}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {subject.name}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {`${subject.code} · Level ${result.level} · ${when}`}
        </AppText>
      </View>
      <View style={styles.score}>
        <AppText variant="bodyStrong">{`${result.score}/${result.totalQuestions}`}</AppText>
        <Badge label={`${pct}%`} tone={scoreTone(pct)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  text: { flex: 1, gap: 3 },
  score: { alignItems: 'flex-end', gap: spacing.xs },
});
