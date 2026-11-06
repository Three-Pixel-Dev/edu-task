import type { PropsWithChildren, ReactElement, ReactNode, Ref } from 'react';
import { usePathname } from 'expo-router';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebShell } from '@/components/web/WebShell';
import { WebQuizBar } from '@/components/web/WebQuizBar';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/theme';
import { desktop } from '@/theme/desktop';

interface ScreenProps {
  scroll?: boolean;
  footer?: ReactNode;
  inTabs?: boolean;
  keyboard?: boolean;
  gap?: number;
  background?: string;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: Ref<ScrollViewInstance>;
  /** Optional top-bar title override for the web shell. */
  title?: string;
  /** Skip sidebar chrome (auth-adjacent screens). */
  bare?: boolean;
}

/**
 * Web Screen: desktop max-width column inside the sidebar shell.
 * Mobile keeps `Screen.tsx` untouched.
 */
export function Screen({
  scroll = true,
  footer,
  keyboard = false,
  gap = spacing.xxl,
  background = colors.background,
  refreshControl,
  contentStyle,
  scrollRef,
  title,
  bare = false,
  children,
}: PropsWithChildren<ScreenProps>) {
  const pathname = usePathname();
  const { gutter } = useResponsive();
  const bottomPad = footer ? spacing.xxl : spacing.huge;

  const column = [styles.column, { paddingHorizontal: Math.max(gutter, desktop.gutter), gap }, contentStyle];

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, { paddingTop: desktop.gutter, paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingTop: desktop.gutter, paddingBottom: footer ? 0 : bottomPad }]}>
      <View style={[column, styles.flex]}>{children}</View>
    </View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor: background }]}>
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingHorizontal: gutter }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );

  const framed = keyboard ? <KeyboardAvoidingView style={styles.flex}>{content}</KeyboardAvoidingView> : content;
  if (bare) return framed;
  if (pathname.includes('/quiz/questions') || pathname.includes('/quiz/result')) {
    return (
      <View style={styles.flex}>
        <WebQuizBar />
        {framed}
      </View>
    );
  }
  return <WebShell title={title}>{framed}</WebShell>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  column: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerInner: { width: '100%', maxWidth: 1200, alignSelf: 'center', gap: spacing.md },
});
