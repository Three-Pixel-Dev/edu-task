import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  CodeChip,
  EmptyState,
  Icon,
  ErrorState,
  InlineAlert,
  ListGroup,
  LoadingState,
  Screen,
  ScreenHeader,
  urgencyTone,
  priorityFlag,
  type IconName,
} from '@/components';
import { routes } from '@/constants/routes';
import { useSubjectCatalog, useTask, useTaskActions } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, spacing } from '@/theme';
import { dueLabel, formatLongDate, formatShortDate, formatTime, taskUrgency } from '@/utils/date';
import { priorityLabel } from '@/utils/format';

export function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { task, status, error } = useTask(id);
  const { completeTask, deleteTask } = useTaskActions();
  const catalog = useSubjectCatalog();
  const [busy, setBusy] = useState<'complete' | 'delete' | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  if (!task && status === 'loading') {
    return (
      <Screen>
        <ScreenHeader back backLabel="Back to tasks" />
        <LoadingState rows={3} label="Loading task" />
      </Screen>
    );
  }

  if (!task && status === 'error') {
    return (
      <Screen>
        <ScreenHeader back backLabel="Back to tasks" />
        <ErrorState title="Couldn’t load this task" message={error ?? undefined} />
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <ScreenHeader back backLabel="Back to tasks" />
        <EmptyState
          icon="inbox"
          title="Task not found"
          message="It may have been deleted on another device."
          actionLabel="Back to My Tasks"
          actionIcon="arrow-left"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const subject = catalog.subjectById.get(task.subjectId);
  const done = task.status === 'completed';
  const urgency = taskUrgency(task);

  const toggleComplete = async () => {
    setBusy('complete');
    try {
      await completeTask(task.id, !done);
      setJustCompleted(!done);
    } catch (e) {
      Alert.alert('Couldn’t update the task', messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this task?', `“${task.title}” will be removed from your list. This can’t be undone.`, [
      { text: 'Keep task', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await deleteTask(task.id);
            router.back();
          } catch (e) {
            setBusy(null);
            Alert.alert('Couldn’t delete the task', messageOf(e));
          }
        },
      },
    ]);
  };

  return (
    <Screen
      footer={
        <>
          <Button
            title={done ? 'Mark as not done' : 'Mark as completed'}
            leftIcon={done ? 'rotate-ccw' : 'check'}
            variant={done ? 'secondary' : 'primary'}
            loading={busy === 'complete'}
            onPress={toggleComplete}
          />
          <View style={styles.row}>
            <Button title="Edit" variant="secondary" leftIcon="edit-2" size="md" fullWidth={false} style={styles.flex} onPress={() => router.push(routes.taskEdit(task.id))} />
            <Button title="Delete" variant="danger" leftIcon="trash-2" size="md" fullWidth={false} style={styles.flex} loading={busy === 'delete'} onPress={confirmDelete} />
          </View>
        </>
      }
    >
      <ScreenHeader back backLabel="Back to tasks" />

      {justCompleted && done ? <InlineAlert tone="success" message="Nice work — task marked as completed." /> : null}
      {task.hasPendingWrites ? <InlineAlert message="This change hasn’t reached the server yet. It will sync when you’re back online." /> : null}

      <View style={styles.titleBlock}>
        <Badge label={done ? 'Completed' : dueLabel(task)} tone={urgencyTone[urgency]} dot />
        <AppText variant="title" accessibilityRole="header" style={done && styles.strike}>
          {task.title}
        </AppText>
      </View>

      <Card style={styles.description}>
        <AppText variant="overline" color="textSecondary">
          Description
        </AppText>
        <AppText variant="body" color={task.description ? 'textBody' : 'textDisabled'}>
          {task.description || 'No description added.'}
        </AppText>
      </Card>

      <ListGroup>
        <InfoRow icon="book-open" label="Subject">
          <AppText variant="bodyMedium">{subject?.name ?? (catalog.status === 'loading' ? 'Loading…' : 'Subject not found')}</AppText>
          {subject ? <CodeChip code={subject.code} /> : null}
        </InfoRow>
        <InfoRow icon="calendar" label="Deadline" divider>
          <AppText variant="bodyMedium">{formatLongDate(task.dueDate)}</AppText>
          <AppText variant="caption" color="textSecondary">
            {formatTime(task.dueDate)}
          </AppText>
        </InfoRow>
        <InfoRow icon="flag" label="Priority" divider iconTint={priorityFlag[task.priority]}>
          <AppText variant="bodyMedium">{priorityLabel[task.priority]}</AppText>
        </InfoRow>
        <InfoRow icon={done ? 'check-circle' : 'circle'} label="Status" divider iconTint={done ? colors.success : undefined}>
          <AppText variant="bodyMedium">{done ? `Completed ${task.completedAt ? formatShortDate(task.completedAt) : ''}` : 'In progress'}</AppText>
        </InfoRow>
      </ListGroup>

      <AppText variant="caption" color="textSecondary" align="center">
        {`Added ${formatShortDate(task.createdAt)} · Last updated ${formatShortDate(task.updatedAt)}`}
      </AppText>
    </Screen>
  );
}

function InfoRow({ icon, label, divider, iconTint, children }: { icon: IconName; label: string; divider?: boolean; iconTint?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.info, divider && styles.divider]} accessible>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={17} tint={iconTint} />
      </View>
      <AppText variant="label" color="textSecondary" style={styles.infoLabel}>
        {label}
      </AppText>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  titleBlock: { gap: spacing.md },
  strike: { textDecorationLine: 'line-through', color: colors.textSecondary },
  description: { gap: spacing.sm },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  infoIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { width: 72, paddingTop: 6 },
  infoValue: { flex: 1, gap: spacing.xs, paddingTop: 4 },
});
