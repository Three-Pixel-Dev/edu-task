import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks';
import { colors, layout, radius, spacing } from '@/theme';
import { AuthHero } from './AuthHero';

/**
 * Hero on top, white sheet with the form underneath. Scrolls with the keyboard open.
 *
 * On Android the KeyboardAvoidingView behavior is omitted because `adjustResize`
 * already resizes the window — using it would double-count the offset and also
 * triggers a full re-render from useWindowDimensions on every keyboard open/close,
 * which can cause TextInput focus to jump.
 */
export function AuthLayout({ children, compactHero }: PropsWithChildren<{ compactHero?: boolean }>) {
  const insets = useSafeAreaInsets();
  const { gutter, isSmall } = useResponsive();

  const form = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      removeClippedSubviews={false}
    >
      <View style={{ paddingTop: insets.top, backgroundColor: colors.primarySurface }}>
        <AuthHero compact={compactHero || isSmall} />
      </View>
      <View style={[styles.sheet, { paddingHorizontal: gutter + spacing.xs }]}>
        <View style={styles.column}>{children}</View>
      </View>
    </ScrollView>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {form}
      </KeyboardAvoidingView>
    );
  }

  // Android: no KeyboardAvoidingView — the window resizes via softInputMode adjustResize.
  return <View style={styles.flex}>{form}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.card },
  content: { flexGrow: 1 },
  sheet: {
    flex: 1,
    marginTop: -spacing.xxl,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.xxl + spacing.xs,
  },
  column: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.lg },
});

