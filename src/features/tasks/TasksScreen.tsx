import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import {
  AppText,
  EmptyState,
  ErrorState,
  IconButton,
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
import { useTasks, useTaskSections } from '@/hooks';
import { messageOf } from '@/services/storage';
import { colors, spacing } from '@/theme';
import type { Task, TaskSection } from '@/types';
import { pluralise } from '@/utils/format';

type Filter = 'all' | TaskSection;

const COMPLETED_PREVIEW = 3;

const sectionTitle: Record<TaskSection, string> = { today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };

export function TasksScreen() {
  const { tasks, status, error, reload, setCompleted } = useTasks();
  const { groups, counts } = useTaskSections();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast, show, hide } = useToast();

  const toggle = async (task: Task) => {
    const completing = task.status !== 'completed';
    try {
      await setCompleted(task.id, completing);
      if (completing) {
        show({ text: `“${task.title}” completed`, actionLabel: 'Undo', onAction: () => void setCompleted(task.id, false) });
      }
    } catch (e) {
      Alert.alert('Couldn’t update the task', messageOf(e));
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const visible: TaskSection[] = filter === 'all' ? ['today', 'upcoming', 'completed'] : [filter];
  const subtitle = counts.total === 0 ? 'Plan your assignments and deadlines.' : `${counts.active} active${counts.overdue ? ` · ${counts.overdue} overdue` : ''}`;

  let body: React.ReactNode;
  if (status === 'loading' && tasks.length === 0) {
    body = <LoadingState rows={5} label="Loading tasks" />;
  } else if (status === 'error') {
    body = <ErrorState title="Couldn’t load your tasks" message={error ?? undefined} onRetry={reload} />;
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
                  <TaskCard key={task.id} task={task} onPress={() => router.push(routes.taskDetail(task.id))} onToggle={() => void toggle(task)} />
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
      </>
    );
  }

  return (
    <View style={styles.flex}>
      <Screen inTabs refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
        <ScreenHeader
          large
          title="My Tasks"
          subtitle={subtitle}
          right={<IconButton icon="plus" variant="primary" accessibilityLabel="Add task" onPress={() => router.push(routes.taskCreate)} />}
        />
        {body}
      </Screen>
      <Toast toast={toast} onHide={hide} bottom={spacing.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.sm + 2 },
  sectionEmpty: { paddingVertical: spacing.sm },
  more: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
