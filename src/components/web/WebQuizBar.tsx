import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { routes } from '@/constants/routes';
import { colors, spacing } from '@/theme';

/** Compact standalone header used by quiz play and result boards. */
export function WebQuizBar() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ level?: string; type?: string }>();
  const result = pathname.includes('/quiz/result');
  const isQuiz = params.type === 'trueFalse';

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <Logo size={32} />
        <AppText variant="bodyStrong">EduTask</AppText>
        <View style={styles.divider} />
        <AppText variant="label" color="textSecondary">
          {result ? 'Result' : `${isQuiz ? 'Quiz' : 'Multiple choice'} · Level ${params.level ?? ''}`}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => (result ? router.dismissTo(routes.home) : router.back())}
        style={styles.action}
      >
        <Icon name={result ? 'arrow-left' : 'x'} size={17} color="textBody" />
        <AppText variant="label">{result ? 'Back to Home' : isQuiz ? 'Exit quiz' : 'Exit set'}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 64,
    paddingHorizontal: 32,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 6 },
  action: {
    height: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
