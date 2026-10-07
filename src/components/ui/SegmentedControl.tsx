import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing, touch } from '@/theme';
import { AppText } from './AppText';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Small coloured dot before the label (e.g. priority). */
  dot?: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Radio group styled as a segmented control (filters, priority picker). */
export function SegmentedControl<T extends string>({ segments, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={segment.label}
            onPress={() => onChange(segment.value)}
            style={[styles.segment, selected && styles.selected]}
          >
            {segment.dot ? <View style={[styles.dot, { backgroundColor: segment.dot }]} /> : null}
            <AppText variant={selected ? 'captionStrong' : 'caption'} color={selected ? 'text' : 'textSubtle'} numberOfLines={1} style={styles.label}>
              {segment.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: touch.min - 4,
    borderRadius: radius.md - 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  selected: { backgroundColor: colors.card, ...shadows.card },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14 },
});
