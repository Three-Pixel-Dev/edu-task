import { useWindowDimensions } from 'react-native';
import { desktop } from '@/theme/desktop';
import { spacing } from '@/theme';

/**
 * Web / desktop breakpoints. Mobile keeps `useResponsive.ts`.
 * Desktop shell is used at ≥ 1024px; narrower web windows still get wide gutters.
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 600 && width < 1024;
  const isSmall = width < 360;
  const isLarge = width >= 428;

  const gutter = isDesktop ? desktop.gutter : isSmall ? spacing.lg : isLarge ? spacing.xxl : spacing.xl;
  const contentWidth = Math.min(width - (isDesktop ? desktop.sidebarWidth : 0), desktop.maxContentWidth);

  return {
    width,
    height,
    fontScale,
    isSmall,
    isLarge,
    isTablet,
    isDesktop,
    gutter,
    contentWidth,
    levelColumns: isDesktop ? 5 : isTablet ? 5 : 3,
  };
}
