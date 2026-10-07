import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, touch } from '@/theme';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** Shows a small red dot (e.g. unread notifications). */
  badge?: boolean;
  variant?: 'outlined' | 'plain' | 'primary';
}

export function IconButton({ icon, accessibilityLabel, onPress, badge, variant = 'outlined' }: IconButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === 'outlined' && styles.outlined,
        primary && styles.primary,
        pressed && { backgroundColor: primary ? colors.primaryDark : colors.surfaceMuted },
      ]}
    >
      <Icon name={icon} size={primary ? 22 : 20} color={primary ? 'onPrimary' : 'text'} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  primary: { backgroundColor: colors.primary, width: 48, height: 48, borderRadius: radius.xl },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.card,
  },
});
