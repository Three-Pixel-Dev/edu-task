import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadows } from '@/theme';

/** EduTask mark: graduation cap on a blue tile (same as the app icon). */
export function Logo({ size = 56 }: { size?: number }) {
  const glyph = size * 0.54;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, borderRadius: size >= 48 ? radius.xxl : radius.lg }]}
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <Path d="M22 10v6" />
        <Path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.raised },
});
