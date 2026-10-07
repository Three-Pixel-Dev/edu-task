import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, type ColorToken } from '@/theme';
import { AppText } from './AppText';

interface StatTileProps {
  label: string;
  value: string | number;
  dot?: string;
  valueColor?: ColorToken;
  onPress?: () => void;
  /** Set automatically by StatGroup on the final tile (no trailing divider). */
  last?: boolean;
}

/** Number + label. Used in summary rows on Home, Quiz, Tasks and Profile. */
export function StatTile({ label, value, dot, valueColor = 'text', onPress, last }: StatTileProps) {
  const tileStyle = [styles.tile, last && styles.lastTile];
  const content = (
    <>
      <AppText variant="number" color={valueColor}>
        {value}
      </AppText>
      <View style={styles.labelRow}>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
        <AppText variant="caption" color="textSecondary" numberOfLines={2} style={styles.label}>
          {label}
        </AppText>
      </View>
    </>
  );
  if (!onPress) {
    return (
      <View style={tileStyle} accessible accessibilityLabel={`${value} ${label}`}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      style={({ pressed }) => [tileStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** A row of StatTiles inside one card, separated by hairlines. */
export function StatGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<StatTileProps>[];
  return <View style={styles.group}>{items.map((child, i) => cloneElement(child, { last: i === items.length - 1 }))}</View>;
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  tile: { flex: 1, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg, gap: spacing.xxs, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  lastTile: { borderRightWidth: 0 },
  pressed: { backgroundColor: colors.background },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flexShrink: 1 },
});
