import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface ToastMessage {
  id: number;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Local toast state for a screen: `show()` replaces any visible toast. */
export function useToast(durationMs = 4000) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => setToast(null), []);
  const show = useCallback(
    (message: Omit<ToastMessage, 'id'>) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ ...message, id: Date.now() });
      timer.current = setTimeout(hide, durationMs);
    },
    [durationMs, hide],
  );
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { toast, show, hide };
}

/** Subtle success snackbar, positioned by the parent (bottom of the screen). */
export function Toast({ toast, onHide, bottom }: { toast: ToastMessage | null; onHide: () => void; bottom: number }) {
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, { toValue: toast ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [toast, anim]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
    >
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.icon}>
          <Icon name="check" size={13} color="onPrimary" />
        </View>
        <AppText variant="label" color="onPrimary" style={styles.text} numberOfLines={2}>
          {toast.text}
        </AppText>
        {toast.actionLabel && toast.onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              toast.onAction?.();
              onHide();
            }}
            hitSlop={8}
            style={styles.action}
          >
            <AppText variant="captionStrong" color="onPrimary">
              {toast.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  icon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  action: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.onPrimaryOverlay, justifyContent: 'center' },
});
