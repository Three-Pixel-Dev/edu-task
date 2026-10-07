import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

type CardTone = 'default' | 'primary' | 'muted' | 'brand';

interface CardProps extends AccessibilityProps {
  tone?: CardTone;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const tones: Record<CardTone, ViewStyle> = {
  default: { backgroundColor: colors.card, borderColor: colors.border },
  primary: { backgroundColor: colors.card, borderColor: colors.primaryBorder },
  muted: { backgroundColor: colors.background, borderColor: colors.divider },
  brand: { backgroundColor: colors.primary, borderColor: colors.primary },
};

/** Rounded surface with a hairline border. Pressable when `onPress` is set. */
export function Card({ tone = 'default', padded = true, onPress, style, children, ...a11y }: PropsWithChildren<CardProps>) {
  const base = [styles.card, tones[tone], tone !== 'brand' && shadows.card, padded && styles.padded, style];
  if (!onPress) {
    return (
      <View style={base} {...a11y}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, pressed && (tone === 'brand' ? styles.pressedBrand : styles.pressed)]}
      {...a11y}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, borderWidth: 1 },
  padded: { padding: spacing.lg },
  pressed: { backgroundColor: colors.background, borderColor: colors.primaryMuted },
  pressedBrand: { backgroundColor: colors.primaryDark },
});
