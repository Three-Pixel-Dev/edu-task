import { StyleSheet, View } from 'react-native';
import { QUIZ } from '@/constants/app';
import { colors, radius, spacing } from '@/theme';
import { formatClock } from '@/utils/quiz';
import { AppText, Icon } from '../ui';

/** Visible but quiet; turns amber in the last two minutes. */
export function QuizTimer({ seconds }: { seconds: number }) {
  const low = seconds <= QUIZ.lowTimeSeconds;
  const minutes = Math.floor(seconds / 60);
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${minutes} minutes ${seconds % 60} seconds left`}
      style={[styles.pill, low ? styles.low : styles.normal]}
    >
      <Icon name="clock" size={15} color={low ? 'warningText' : 'textBody'} />
      <AppText variant="code" color={low ? 'warningText' : 'text'} style={styles.text}>
        {formatClock(seconds)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, borderWidth: 1 },
  normal: { backgroundColor: colors.card, borderColor: colors.border },
  low: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  text: { fontSize: 15, lineHeight: 20 },
});
