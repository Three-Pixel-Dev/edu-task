import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks';
import { colors, layout, radius, spacing } from '@/theme';
import { AuthHero } from './AuthHero';

/** Hero on top, white sheet with the form underneath. Scrolls with the keyboard open. */
export function AuthLayout({ children, compactHero }: PropsWithChildren<{ compactHero?: boolean }>) {
  const insets = useSafeAreaInsets();
  const { gutter, isSmall } = useResponsive();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ paddingTop: insets.top, backgroundColor: colors.primarySurface }}>
          <AuthHero compact={compactHero || isSmall} />
        </View>
        <View style={[styles.sheet, { paddingHorizontal: gutter + spacing.xs }]}>
          <View style={styles.column}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
