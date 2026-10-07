import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import type { Subject } from '@/types';
import { AppText, Card, CodeChip, Icon, ProgressBar } from '../ui';

interface SubjectCardProps {
  subject: Subject;
  /** e.g. "Level 4 of 15" or "Not started" */
  status: string;
  /** 0–1, levels completed */
  progress?: number;
  onPress: () => void;
}

/** Subject name first, code secondary (client requirement). */
export function SubjectCard({ subject, status, progress, onPress }: SubjectCardProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${subject.name}, ${subject.code}, ${status}`}
      accessibilityHint="Choose a question level"
      style={styles.card}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong">{subject.name}</AppText>
        <View style={styles.meta}>
          <CodeChip code={subject.code} />
          <AppText variant="caption" color="textSecondary">
            {status}
          </AppText>
        </View>
        {progress !== undefined && progress > 0 ? (
          <View style={styles.progress}>
            <ProgressBar value={progress} height={4} />
          </View>
        ) : null}
      </View>
      <Icon name="chevron-right" size={20} color="textDisabled" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 76 },
  text: { flex: 1, gap: spacing.xs + 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  progress: { width: '55%', marginTop: spacing.xxs },
});
