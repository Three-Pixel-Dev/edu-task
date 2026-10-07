/**
 * EduTask colour tokens.
 *
 * `palette` holds the brand values from the design brief. Screens and
 * components should use the semantic `colors` map instead of raw hex values.
 *
 * Text-on-tint tokens (successText, warningText, errorText) are darker shades
 * so status copy meets WCAG AA (4.5:1). The brand success / warning / error
 * tones are used for dots, rings, borders and fills.
 */
export const palette = {
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',

  white: '#FFFFFF',

  green600: '#16A34A',
  green700: '#15803D',
  green50: '#F0FDF4',
  green100: '#DCFCE7',
  green200: '#BBF7D0',

  amber500: '#F59E0B',
  amber800: '#92400E',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',

  red600: '#DC2626',
  red700: '#B91C1C',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',

  violet600: '#7C3AED',
  violet50: '#F5F3FF',
} as const;

export const colors = {
  primary: palette.blue600,
  primaryDark: palette.blue700,
  primarySurface: palette.blue50,
  primarySurfaceStrong: palette.blue100,
  primaryBorder: palette.blue200,
  primaryMuted: palette.blue300,
  onPrimary: palette.white,
  onPrimaryMuted: palette.blue100,
  /** Translucent white layers on the blue brand card. */
  onPrimaryOverlay: 'rgba(255, 255, 255, 0.16)',
  onPrimaryTrack: 'rgba(255, 255, 255, 0.26)',

  background: palette.slate50,
  card: palette.white,
  surfaceMuted: palette.slate100,
  border: palette.slate200,
  borderStrong: palette.slate300,
  divider: palette.slate100,

  text: palette.slate900,
  textSecondary: palette.slate500,
  textBody: palette.slate700,
  textSubtle: palette.slate600,
  textDisabled: palette.slate400,
  icon: palette.slate500,

  success: palette.green600,
  successText: palette.green700,
  successSurface: palette.green50,
  successSurfaceStrong: palette.green100,
  successBorder: palette.green200,

  warning: palette.amber500,
  warningText: palette.amber800,
  warningSurface: palette.amber50,
  warningSurfaceStrong: palette.amber100,
  warningBorder: palette.amber200,

  error: palette.red600,
  errorText: palette.red700,
  errorSurface: palette.red50,
  errorSurfaceStrong: palette.red100,
  errorBorder: palette.red200,

  accent: palette.violet600,
  accentSurface: palette.violet50,

  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: palette.slate900,
} as const;

export type ColorToken = keyof typeof colors;
