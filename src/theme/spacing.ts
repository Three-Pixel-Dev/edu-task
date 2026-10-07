/** 4-pt spacing scale. Use these instead of ad-hoc numbers. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  sheet: 24,
  pill: 999,
} as const;

/** Minimum touch target (Apple HIG 44pt / Material 48dp — we use 44 minimum, 48–52 for primary actions). */
export const touch = {
  min: 44,
  button: 52,
  input: 52,
} as const;

/** Content never grows wider than this on tablets / large phones in landscape. */
export const layout = {
  maxContentWidth: 640,
  tabBarHeight: 60,
} as const;
