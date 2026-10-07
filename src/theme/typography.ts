import type { TextStyle } from 'react-native';

/** Font family names registered in app/_layout.tsx via expo-font. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'GeistMono_500Medium',
  monoBold: 'GeistMono_600SemiBold',
} as const;

/**
 * Text variants. Inter ships separate files per weight, so weight is
 * expressed through fontFamily rather than fontWeight (Android ignores
 * fontWeight on custom fonts).
 */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.7, textTransform: 'uppercase' },
  tiny: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  code: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
  number: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
