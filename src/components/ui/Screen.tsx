import type { PropsWithChildren, ReactElement, ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, layout, spacing } from '@/theme';

interface ScreenProps {
  /** Wrap content in a ScrollView (default). Set false for fixed layouts. */
  scroll?: boolean;
  /** Sticky bottom area (primary actions) — sits above the home indicator. */
  footer?: ReactNode;
  /** Set when the screen is inside the tab navigator (tab bar handles the bottom inset). */
  inTabs?: boolean;
  /** Avoid the keyboard (forms). */
  keyboard?: boolean;
  gap?: number;
  background?: string;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Access the ScrollView, e.g. to scroll feedback into view. */
  scrollRef?: Ref<ScrollView>;
}

/**
 * Base layout for every screen: safe areas, responsive gutters, a centred
 * max-width column on tablets, optional scroll, keyboard avoidance and a
 * sticky footer for one-handed primary actions.
 */
export function Screen({
  scroll = true,
  footer,
  inTabs = false,
  keyboard = false,
  gap = spacing.xxl,
  background = colors.background,
  refreshControl,
  contentStyle,
  scrollRef,
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const bottomPad = footer || inTabs ? spacing.xxl : insets.bottom + spacing.xxl;

  const column = [styles.column, { paddingHorizontal: gutter, gap }, contentStyle];

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md, paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingTop: insets.top + spacing.md, paddingBottom: footer ? 0 : bottomPad }]}>
      <View style={[column, styles.flex]}>{children}</View>
    </View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor: background }]}>
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg), paddingHorizontal: gutter }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );

  if (!keyboard) return content;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  column: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  footer: {
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerInner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.md },
});
