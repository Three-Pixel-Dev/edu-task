import { useWindowDimensions } from 'react-native';
import { layout, spacing } from '@/theme';

/**
 * Breakpoints for phone sizes (portrait):
 *  small  < 360pt  (iPhone SE 1st gen, small Android)
 *  normal 360–427pt
 *  large  ≥ 428pt  (Pro Max / Plus), and tablets
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isSmall = width < 360;
  const isLarge = width >= 428;
  const isTablet = width >= 600;

  const gutter = isSmall ? spacing.lg : isLarge ? spacing.xxl : spacing.xl;
  const contentWidth = Math.min(width, layout.maxContentWidth);

  return {
    width,
    height,
    fontScale,
    isSmall,
    isLarge,
    isTablet,
    gutter,
    contentWidth,
    /** Level grid: 3 across on phones, 5 on tablets. */
    levelColumns: isTablet ? 5 : 3,
  };
}
