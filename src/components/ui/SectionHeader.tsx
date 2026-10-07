import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, touch } from '@/theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  /** e.g. a count, shown muted after the title */
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Small uppercase style used for list group headings. */
  overline?: boolean;
}

export function SectionHeader({ title, meta, actionLabel, onAction, overline }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant={overline ? 'overline' : 'subheading'} color={overline ? 'textSecondary' : 'text'} accessibilityRole="header" style={styles.title}>
        {title}
        {meta ? <AppText variant={overline ? 'overline' : 'body'} color="textDisabled">{`  ·  ${meta}`}</AppText> : null}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.action}>
          <AppText variant="label" color="primaryDark">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  title: { flex: 1 },
  action: { minHeight: touch.min - 8, justifyContent: 'center', paddingLeft: spacing.md },
});
