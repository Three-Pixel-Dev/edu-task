import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  TaskCard,
  Toast,
  useToast,
} from '@/components';
import { routes } from '@/constants/routes';
import { useSubjectCatalog, useTaskActions, useTasks, useTaskSections } from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, spacing } from '@/theme';
import type { Task, TaskSection } from '@/types';
import { pluralise } from '@/utils/format';

type Filter = 'all' | TaskSection;
const COMPLETED_PREVIEW = 5;
const sectionTitle: Record<TaskSection, string> = { today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };

/** Desktop tasks list inside the web shell. */
export function TasksScreen() {
  const { tasks, status, error, retry } = useTasks();
  const { completeTask } = useTaskActions();
  const catalog = useSubjectCatalog();
  const { groups, counts } = useTaskSections();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const { toast, show, hide } = useToast();

  const toggle = async (task: Task) => {
    const completing = task.status !== 'completed';
    try {
      await completeTask(task.id, completing);
      if (completing) {
        show({
          text: `“${task.title}” completed`,
          actionLabel: 'Undo',
          onAction: () => void completeTask(task.id, false).catch((e: unknown) => Alert.alert('Couldn’t undo', messageOf(e))),
        });
      }
    } catch (e) {
      Alert.alert('Couldn’t update the task', messageOf(e));
    }
  };

  const visible: TaskSection[] = filter === 'all' ? ['today', 'upcoming', 'completed'] : [filter];
  const subtitle = counts.total === 0 ? 'Plan your assignments and deadlines.' : `${counts.active} active${counts.overdue ? ` · ${counts.overdue} overdue` : ''}`;

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <LoadingState rows={5} label="Loading tasks" />;
  } else if (status === 'error') {
    body = <ErrorState title="Couldn’t load your tasks" message={error ?? undefined} onRetry={retry} />;
  } else if (tasks.length === 0) {
    body = (
      <EmptyState
        icon="clipboard"
        title="You don’t have any tasks yet."
        message="Add your assignments and deadlines so you always know what’s due next."
        actionLabel="Add your first task"
        onAction={() => router.push(routes.taskCreate)}
      />
    );
  } else {
    body = (
      <>
        <View style={styles.summary}>
          <SummaryCard label="Due today" value={counts.dueToday} dot={colors.primary} />
          <SummaryCard label="Overdue" value={counts.overdue} dot={colors.error} color="errorText" />
          <SummaryCard label="Upcoming" value={counts.upcoming} dot={colors.warning} />
          <SummaryCard label="Completed" value={counts.completed} dot={colors.success} color="successText" />
        </View>
        <SegmentedControl<Filter>
          accessibilityLabel="Filter tasks"
          value={filter}
          onChange={setFilter}
          segments={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Done' },
          ]}
        />
        <View style={styles.columns}>
          {visible.map((section) => {
            const items = groups[section];
            const limited = section === 'completed' && filter === 'all' && !showAllCompleted ? items.slice(0, COMPLETED_PREVIEW) : items;
            return (
              <View key={section} style={styles.section}>
                <SectionHeader overline title={sectionTitle[section]} meta={String(items.length)} />
                {items.length === 0 ? (
                  <AppText variant="body" color="textSecondary" style={styles.sectionEmpty}>
                    {section === 'today' ? 'Nothing due today. Nice work!' : section === 'upcoming' ? 'No upcoming deadlines.' : 'No completed tasks yet.'}
                  </AppText>
                ) : (
                  limited.map((task) => (
                    <TaskCard key={task.id} task={task} subjectName={catalog.subjectById.get(task.subjectId)?.name} onPress={() => router.push(routes.taskDetail(task.id))} onToggle={() => void toggle(task)} />
                  ))
                )}
                {limited.length < items.length ? (
                  <Pressable accessibilityRole="button" onPress={() => setShowAllCompleted(true)} style={styles.more}>
                    <AppText variant="label" color="primaryDark">
                      {`Show all ${pluralise(items.length, 'completed task')}`}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </>
    );
  }

  return (
    <View style={styles.flex}>
      <Screen inTabs>
        <ScreenHeader large title="My Tasks" subtitle={subtitle} right={<Button title="Add task" leftIcon="plus" fullWidth={false} onPress={() => router.push(routes.taskCreate)} />} />
        {body}
      </Screen>
      <Toast toast={toast} onHide={hide} bottom={spacing.lg} />
    </View>
  );
}

function SummaryCard({ label, value, dot, color = 'text' }: { label: string; value: number; dot: string; color?: 'text' | 'errorText' | 'successText' }) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryLabel}><View style={[styles.dot, { backgroundColor: dot }]} /><AppText variant="caption" color="textSecondary">{label}</AppText></View>
      <AppText style={styles.summaryValue} color={color}>{value}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { flexDirection: 'row', gap: spacing.lg },
  summaryCard: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: 18, gap: 6 },
  summaryLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  summaryValue: { fontSize: 28, lineHeight: 34 },
  columns: { gap: spacing.xxl },
  section: { gap: spacing.sm + 2, maxWidth: 800 },
  sectionEmpty: { paddingVertical: spacing.sm },
  more: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
