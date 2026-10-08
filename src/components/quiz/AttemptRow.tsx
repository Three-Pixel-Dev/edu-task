import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import type { QuizResult } from '@/types';
import { formatRelativeDay } from '@/utils/date';
import { AppText, Badge, type BadgeTone } from '../ui';

interface AttemptRowProps {
  result: QuizResult;
  onPress: () => void;
  divider?: boolean;
}

export function scoreTone(percentage: number): BadgeTone {
  if (percentage >= 80) return 'success';
  if (percentage >= 60) return 'neutral';
  return 'warning';
}

/** One quiz attempt: subject, code, level, date, score and percentage. */
export function AttemptRow({ result, onPress, divider }: AttemptRowProps) {
  const when = formatRelativeDay(result.completedAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${result.subjectName}, level ${result.level}, scored ${result.score} out of ${result.totalQuestions}, ${result.percentage} percent, ${when}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {result.subjectName}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {`${result.subjectCode ? `${result.subjectCode} · ` : ''}Level ${result.level} · ${when}`}
        </AppText>
      </View>
      <View style={styles.score}>
        <AppText variant="bodyStrong">{`${result.score}/${result.totalQuestions}`}</AppText>
        <Badge label={`${result.percentage}%`} tone={scoreTone(result.percentage)} />
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
