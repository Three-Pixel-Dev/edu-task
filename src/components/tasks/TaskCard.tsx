import { Pressable, StyleSheet, View } from 'react-native';
import { findSubject } from '@/data';
import { colors, radius, spacing } from '@/theme';
import type { Task, TaskUrgency } from '@/types';
import { dueLabel, taskUrgency } from '@/utils/date';
import { priorityLabel } from '@/utils/format';
import { AppText, Badge, Icon, type BadgeTone } from '../ui';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
}

export const urgencyTone: Record<TaskUrgency, BadgeTone> = {
  overdue: 'error',
  dueSoon: 'warning',
  upcoming: 'neutral',
  completed: 'success',
};

const ringColor: Record<TaskUrgency, string> = {
  overdue: colors.error,
  dueSoon: colors.warning,
  upcoming: colors.borderStrong,
  completed: colors.success,
};

export const priorityFlag = { high: colors.error, medium: colors.warning, low: colors.textDisabled } as const;

export function TaskCard({ task, onPress, onToggle }: TaskCardProps) {
  const urgency = taskUrgency(task);
  const done = task.status === 'completed';
  const subject = findSubject(task.subjectId);
  const due = dueLabel(task);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as completed`}
        onPress={onToggle}
        hitSlop={6}
        style={styles.check}
      >
        {done ? (
          <View style={[styles.circle, styles.circleDone]}>
            <Icon name="check" size={14} color="onPrimary" />
          </View>
        ) : (
          <View style={[styles.circle, { borderColor: ringColor[urgency] }]} />
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${task.title}, ${subject?.name ?? ''}, ${due}, ${priorityLabel[task.priority]} priority`}
        accessibilityHint="Opens task details"
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <AppText variant="bodyStrong" color={done ? 'textSecondary' : 'text'} style={done && styles.strike} numberOfLines={2}>
          {task.title}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {subject?.name ?? 'Unknown subject'}
        </AppText>
        <View style={styles.meta}>
          <Badge label={due} tone={urgencyTone[urgency]} icon="calendar" />
          {!done ? (
            <View style={styles.priority}>
              <Icon name="flag" size={13} tint={priorityFlag[task.priority]} />
              <AppText variant="caption" color="textSubtle">
                {priorityLabel[task.priority]}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Icon name="chevron-right" size={18} color="textDisabled" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.md + 2,
    overflow: 'hidden',
  },
  check: { width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: colors.success, borderColor: colors.success },
  body: { flex: 1, paddingVertical: spacing.md + 2, paddingRight: spacing.sm, gap: 3 },
  pressed: { opacity: 0.7 },
  strike: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm + 2, marginTop: spacing.xs + 2 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
