import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { AppText, Logo } from '@/components';
import { colors, spacing } from '@/theme';

/** Brand header for the auth screens: logo, name and a faint technical grid. */
export function AuthHero({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.hero, compact && styles.compact]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M 28 0 L 0 0 0 28" fill="none" stroke={colors.primarySurfaceStrong} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
      <Logo />
      <View>
        <AppText variant="title" accessibilityRole="header">
          EduTask
        </AppText>
        <AppText variant="label" color="textSubtle">
          CEIT learning & assignments
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge + spacing.xxl,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  compact: { paddingBottom: spacing.huge },
});
