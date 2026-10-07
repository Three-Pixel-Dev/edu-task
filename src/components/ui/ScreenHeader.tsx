import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import type { IconName } from './Icon';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Shows a back (or close) button that pops the navigation stack. */
  back?: boolean;
  backIcon?: Extract<IconName, 'chevron-left' | 'x'>;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Large title for top-level tab screens. */
  large?: boolean;
  leading?: ReactNode;
}

export function ScreenHeader({ title, subtitle, back, backIcon = 'chevron-left', backLabel = 'Go back', onBack, right, large, leading }: ScreenHeaderProps) {
  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.wrapper}>
      {back ? (
        <View style={styles.toolbar}>
          <IconButton icon={backIcon} accessibilityLabel={backLabel} onPress={handleBack} />
          {right}
        </View>
      ) : null}
      {title ? (
        <View style={styles.titleRow}>
          {leading}
          <View style={styles.titleText}>
            <AppText variant={large ? 'display' : 'title'} accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="body" color="textSecondary">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {!back ? right : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleText: { flex: 1, gap: spacing.xs },
});
