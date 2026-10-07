import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, type ColorToken } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'accent' | 'onBrand';

const tones: Record<BadgeTone, { bg: string; fg: ColorToken; border?: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: 'textBody' },
  primary: { bg: colors.primarySurface, fg: 'primaryDark' },
  success: { bg: colors.successSurfaceStrong, fg: 'successText' },
  warning: { bg: colors.warningSurfaceStrong, fg: 'warningText' },
  error: { bg: colors.errorSurfaceStrong, fg: 'errorText' },
  accent: { bg: colors.accentSurface, fg: 'accent' },
  onBrand: { bg: colors.onPrimaryOverlay, fg: 'onPrimary' },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  dot?: boolean;
}

export function Badge({ label, tone = 'neutral', icon, dot }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: colors[t.fg] }]} /> : null}
      {icon ? <Icon name={icon} size={13} color={t.fg} /> : null}
      <AppText variant="captionStrong" color={t.fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/** Monospaced subject code chip, e.g. CEIT-4031. */
export function CodeChip({ code, onBrand }: { code: string; onBrand?: boolean }) {
  return (
    <View style={[styles.code, onBrand && styles.codeOnBrand]}>
      <AppText variant="code" color={onBrand ? 'onPrimaryMuted' : 'textBody'} accessibilityLabel={`Subject code ${code}`}>
        {code}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  code: { alignSelf: 'flex-start', backgroundColor: colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  codeOnBrand: { backgroundColor: 'transparent', paddingHorizontal: 0 },
});
