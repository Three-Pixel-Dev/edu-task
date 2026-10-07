import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

// ── Skeleton ─────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 14, rounded = radius.sm }: { width?: DimensionValue; height?: number; rounded?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width, height, borderRadius: rounded, backgroundColor: colors.border, opacity }} />;
}

/** Skeleton list of cards — used instead of a blank screen while loading. */
export function LoadingState({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.loading}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width={44} height={44} rounded={radius.lg} />
          <View style={styles.skeletonText}>
            <Skeleton width={`${70 - (i % 3) * 12}%`} height={15} />
            <Skeleton width="38%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Empty / error ────────────────────────────────────────────────────────
interface MessageStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconName;
}

export function EmptyState({ icon, title, message, actionLabel, onAction, actionIcon = 'plus' }: MessageStateProps) {
  return (
    <View style={styles.message}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
        <Icon name={icon} size={30} color="primary" />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="textSecondary" align="center" style={styles.messageBody}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} leftIcon={actionIcon} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Check your internet connection and try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.message} accessibilityLiveRegion="polite">
      <View style={[styles.iconWrap, { backgroundColor: colors.errorSurfaceStrong }]}>
        <Icon name="wifi-off" size={28} color="errorText" />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" align="center" style={styles.messageBody}>
        {message}
      </AppText>
      {onRetry ? <Button title="Try again" leftIcon="rotate-ccw" onPress={onRetry} fullWidth={false} style={styles.action} /> : null}
    </View>
  );
}

/** Compact inline error banner (forms). */
export function InlineAlert({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  const isError = tone === 'error';
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.inline,
        { backgroundColor: isError ? colors.errorSurface : colors.successSurface, borderColor: isError ? colors.errorBorder : colors.successBorder },
      ]}
    >
      <Icon name={isError ? 'alert-circle' : 'check-circle'} size={18} color={isError ? 'error' : 'success'} />
      <AppText variant="label" color={isError ? 'errorText' : 'successText'} style={styles.inlineText}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { gap: spacing.md },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xxl,
  },
  skeletonText: { flex: 1, gap: spacing.sm },
  message: { alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.lg, gap: spacing.md },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  messageBody: { maxWidth: 320 },
  action: { marginTop: spacing.sm, paddingHorizontal: spacing.xxl },
  inline: { flexDirection: 'row', gap: spacing.sm + 2, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, alignItems: 'flex-start' },
  inlineText: { flex: 1 },
});
