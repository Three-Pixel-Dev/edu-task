import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing, touch, type ColorToken } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dangerSolid' | 'inverse';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

type VariantStyle = { bg: string; pressedBg: string; border: string; text: ColorToken };

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.primary, pressedBg: colors.primaryDark, border: colors.primary, text: 'onPrimary' },
  secondary: { bg: colors.card, pressedBg: colors.surfaceMuted, border: colors.borderStrong, text: 'text' },
  outline: { bg: colors.card, pressedBg: colors.primarySurface, border: colors.primary, text: 'primaryDark' },
  ghost: { bg: 'transparent', pressedBg: colors.surfaceMuted, border: 'transparent', text: 'primaryDark' },
  danger: { bg: colors.card, pressedBg: colors.errorSurface, border: colors.errorBorder, text: 'errorText' },
  dangerSolid: { bg: colors.error, pressedBg: colors.errorText, border: colors.error, text: 'onPrimary' },
  inverse: { bg: colors.card, pressedBg: colors.primarySurface, border: colors.card, text: 'primaryDark' },
};

const disabledStyle: VariantStyle = { bg: colors.border, pressedBg: colors.border, border: colors.border, text: 'textSecondary' };

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  const v = disabled ? disabledStyle : variants[variant];
  const height = size === 'lg' ? touch.button : touch.min + 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: pressed ? v.pressedBg : v.bg,
          borderColor: v.border,
          borderWidth: variant === 'outline' ? 1.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: loading ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.text]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Icon name={leftIcon} size={18} color={v.text} /> : null}
          <AppText style={[styles.label, size === 'md' && styles.labelMd]} color={v.text} numberOfLines={1}>
            {title}
          </AppText>
          {rightIcon ? <Icon name={rightIcon} size={18} color={v.text} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  labelMd: { fontSize: 15 },
});
