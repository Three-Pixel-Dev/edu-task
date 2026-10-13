import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, CodeChip, EmptyState, ErrorState, InlineAlert, LoadingState, Screen, urgencyTone } from '@/components';
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

  if (!task) {
    return (
      <Screen contentStyle={styles.content}>
        {status === 'loading' ? <LoadingState rows={3} label="Loading task" /> : status === 'error' ? <ErrorState title="Couldn’t load this task" message={error ?? undefined} /> : <EmptyState icon="inbox" title="Task not found" message="It may have been deleted on another device." actionLabel="Back to My Tasks" onAction={() => router.back()} />}
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
    } catch (cause) {
      Alert.alert('Couldn’t update the task', messageOf(cause));
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
          } catch (cause) {
            setBusy(null);
            Alert.alert('Couldn’t delete the task', messageOf(cause));
          }
        },
      },
    ]);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.backRow}>
        <Button title="Back to tasks" variant="ghost" leftIcon="arrow-left" fullWidth={false} onPress={() => router.back()} />
      </View>
      {justCompleted && done ? <InlineAlert tone="success" message="Nice work — task marked as completed." /> : null}
      {task.hasPendingWrites ? <InlineAlert message="This change hasn’t reached the server yet. It will sync when you’re back online." /> : null}
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Badge label={done ? 'Completed' : dueLabel(task)} tone={urgencyTone[urgency]} dot />
          <AppText style={[styles.title, done && styles.strike]}>{task.title}</AppText>
          <AppText color="textSecondary">{subject?.name ?? 'Subject'}</AppText>
        </View>
        <Button title="Edit task" variant="secondary" leftIcon="edit-2" fullWidth={false} onPress={() => router.push(routes.taskEdit(task.id))} />
      </View>

      <View style={styles.split}>
        <View style={styles.main}>
          <Card style={styles.card}>
            <AppText variant="subheading">Description</AppText>
            <AppText color={task.description ? 'textBody' : 'textDisabled'}>{task.description || 'No description added.'}</AppText>
          </Card>
          <Card style={styles.card}>
            <AppText variant="subheading">Task details</AppText>
            <Detail label="Subject"><View style={styles.subject}><AppText variant="bodyMedium">{subject?.name ?? 'Subject not found'}</AppText>{subject ? <CodeChip code={subject.code} /> : null}</View></Detail>
            <Detail label="Deadline"><AppText variant="bodyMedium">{`${formatLongDate(task.dueDate)} · ${formatTime(task.dueDate)}`}</AppText></Detail>
            <Detail label="Priority"><AppText variant="bodyMedium">{priorityLabel[task.priority]}</AppText></Detail>
            <Detail label="Status"><AppText variant="bodyMedium">{done ? `Completed ${task.completedAt ? formatShortDate(task.completedAt) : ''}` : 'In progress'}</AppText></Detail>
          </Card>
        </View>
        <Card style={styles.actions}>
          <AppText variant="subheading">Actions</AppText>
          <Button title={done ? 'Mark as not done' : 'Mark as completed'} leftIcon={done ? 'rotate-ccw' : 'check'} variant={done ? 'secondary' : 'primary'} loading={busy === 'complete'} onPress={toggleComplete} />
          <Button title="Edit task" variant="secondary" leftIcon="edit-2" onPress={() => router.push(routes.taskEdit(task.id))} />
          <Button title="Delete task" variant="danger" leftIcon="trash-2" loading={busy === 'delete'} onPress={confirmDelete} />
          <AppText variant="caption" color="textSecondary">{`Added ${formatShortDate(task.createdAt)} · Updated ${formatShortDate(task.updatedAt)}`}</AppText>
        </Card>
      </View>
    </Screen>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.detail}><AppText variant="label" color="textSecondary" style={styles.detailLabel}>{label}</AppText><View style={styles.detailValue}>{children}</View></View>;
}

const styles = StyleSheet.create({
  content: { maxWidth: 1080 },
  backRow: { alignItems: 'flex-start' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.xl },
  headingText: { flex: 1, gap: spacing.sm },
  title: { fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  strike: { textDecorationLine: 'line-through', color: colors.textSecondary },
  split: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxl },
  main: { flex: 1, gap: spacing.lg, minWidth: 0 },
  card: { gap: spacing.lg, padding: spacing.xxl },
  actions: { flexBasis: 300, gap: spacing.md, padding: spacing.xl },
  detail: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  detailLabel: { width: 88 },
  detailValue: { flex: 1 },
  subject: { gap: spacing.xs },
});
