import { Platform, type ViewStyle } from 'react-native';
import { colors } from './colors';

export { colors, palette } from './colors';
export type { ColorToken } from './colors';
export { spacing, radius, touch, layout } from './spacing';
export { fonts, typography } from './typography';
export type { TypographyVariant } from './typography';

/** Subtle elevation presets — keep shadows light, borders do most of the work. */
export const shadows = {
  none: {},
  card: Platform.select<ViewStyle>({
    ios: { shadowColor: colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    default: { elevation: 1 },
  }),
  raised: Platform.select<ViewStyle>({
    ios: { shadowColor: colors.primary, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    default: { elevation: 4 },
  }),
} as const;
