import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import type { TaskPriority } from '@/types';
import { priorityLabel } from '@/utils/format';
import { AppText, SegmentedControl } from '../ui';
import { priorityFlag } from './TaskCard';

const segments = (['low', 'medium', 'high'] as const).map((value) => ({ value, label: priorityLabel[value], dot: priorityFlag[value] }));

export function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textBody">
        Priority
      </AppText>
      <SegmentedControl segments={segments} value={value} onChange={onChange} accessibilityLabel="Priority" />
    </View>
  );
}

const styles = StyleSheet.create({ wrapper: { gap: spacing.sm } });
