import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, radius, spacing, touch, type ColorToken } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  trailing?: ReactNode;
  value?: string;
  onPress?: () => void;
  titleColor?: ColorToken;
  showChevron?: boolean;
  divider?: boolean;
}

/** Settings-style row. Group several inside a <ListGroup>. */
export function ListRow({ title, subtitle, icon, trailing, value, onPress, titleColor = 'text', showChevron = Boolean(onPress), divider }: ListRowProps) {
  const body = (
    <>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={titleColor === 'text' ? 'textBody' : titleColor} />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText variant="bodyMedium" color={titleColor}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" color="textSecondary">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {showChevron ? <Icon name="chevron-right" size={18} color="textDisabled" /> : null}
    </>
  );
  const rowStyle = [styles.row, divider && styles.divider];
  if (!onPress) return <View style={rowStyle}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

export function SwitchRow({ title, subtitle, value, onValueChange, divider }: { title: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.card}
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
  );
}

export function ListGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { minHeight: touch.button + 4, flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
