import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

interface ProgressBarProps {
  /** 0–1 */
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, height = 6, color = colors.primary, trackColor = colors.border, accessibilityLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
    >
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

interface SegmentedProgressProps {
  total: number;
  /** 0-based index of the current segment. */
  current: number;
  accessibilityLabel?: string;
}

/** One segment per question: done = primary, current = light primary. */
export function SegmentedProgress({ total, current, accessibilityLabel }: SegmentedProgressProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: total, now: current + 1 }}
      style={styles.segments}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < current ? colors.primary : i === current ? colors.primaryMuted : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  segments: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
