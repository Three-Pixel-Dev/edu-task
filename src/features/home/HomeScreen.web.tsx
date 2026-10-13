import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AttemptRow,
  Avatar,
  Button,
  Card,
  CodeChip,
  ContinueQuizCard,
  ErrorState,
  Icon,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatTile,
  TaskCard,
  type IconName,
} from '@/components';
import { QUIZ } from '@/constants/app';
import { routes } from '@/constants/routes';
import {
  useActiveSession,
  useProfile,
  useQuizHistory,
  useRecentSubjects,
  useSubjectCatalog,
  useTaskActions,
  useTasks,
  useTaskSections,
} from '@/hooks';
import { messageOf } from '@/services/errors';
import { colors, radius, spacing } from '@/theme';
import { firstNameOf, pluralise } from '@/utils/format';

/** Desktop home: two-column dashboard. Mobile keeps `HomeScreen.tsx`. */
export function HomeScreen() {
  const { displayName, status: profileStatus } = useProfile();
  const quiz = useQuizHistory();
  const tasks = useTasks();
  const active = useActiveSession();
  const recentSubjects = useRecentSubjects(3);
  const { groups, counts } = useTaskSections();
  const catalog = useSubjectCatalog();
  const { completeTask } = useTaskActions();

  const quizLoading = quiz.status === 'loading';
  const tasksLoading = tasks.status === 'loading';
  const upcoming = [...groups.today, ...groups.upcoming].slice(0, 4);
  const firstName = displayName ? firstNameOf(displayName) : '';

  return (
    <Screen inTabs>
      <View style={styles.header}>
        <View style={styles.flex}>
          {profileStatus === 'loading' && !firstName ? (
            <Skeleton width={200} height={32} />
          ) : (
            <AppText variant="title" accessibilityRole="header">{`Hi, ${firstName || 'there'}`}</AppText>
          )}
          <AppText variant="body" color="textSecondary">
            Ready to test your knowledge?
          </AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate(routes.profileTab)}>
          <Avatar name={displayName || '?'} size={48} />
        </Pressable>
      </View>

      <View style={styles.columns}>
        <View style={styles.mainCol}>
          {quizLoading ? (
            <Skeleton height={180} rounded={radius.xxl} />
          ) : active ? (
            <ContinueQuizCard session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level))} />
          ) : (
            <Card tone="brand" style={styles.startCard}>
              <AppText variant="overline" color="onPrimaryMuted">
                Start learning
              </AppText>
              <AppText variant="heading" color="onPrimary">
                Pick a field and take a 10-question quiz.
              </AppText>
              <Button title="Browse subjects" variant="inverse" size="md" rightIcon="arrow-right" onPress={() => router.push(routes.quizFields)} />
            </Card>
          )}

          <View style={styles.section}>
            <SectionHeader title="Quick access" />
            <View style={styles.quickRow}>
              <QuickTile icon="help-circle" title="Quiz" subtitle="Field → subject → level" tint={colors.primarySurface} iconColor="primary" onPress={() => router.navigate(routes.quizTab)} />
              <QuickTile
                icon="check-square"
                title="Tasks"
                subtitle={tasksLoading ? 'Loading…' : pluralise(counts.active, 'active task')}
                tint={colors.accentSurface}
                iconColor="accent"
                onPress={() => router.navigate(routes.tasksTab)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Task summary" actionLabel="View all" onAction={() => router.navigate(routes.tasksTab)} />
            {tasksLoading ? (
              <Skeleton height={84} rounded={radius.xxl} />
            ) : tasks.status === 'error' ? (
              <Card>
                <ErrorState title="Couldn’t load your tasks" message={tasks.error ?? undefined} onRetry={tasks.retry} />
              </Card>
            ) : (
              <StatGroup>
                <StatTile label="Due today" value={counts.dueToday} dot={colors.warning} onPress={() => router.navigate(routes.tasksTab)} />
                <StatTile label="Upcoming" value={counts.upcoming} dot={colors.primary} onPress={() => router.navigate(routes.tasksTab)} />
                <StatTile label="Completed" value={counts.completed} dot={colors.success} onPress={() => router.navigate(routes.tasksTab)} />
              </StatGroup>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Upcoming tasks" actionLabel="Add task" onAction={() => router.push(routes.taskCreate)} />
            {tasksLoading ? (
              <Skeleton height={96} rounded={radius.xxl} />
            ) : upcoming.length === 0 ? (
              <EmptyNote icon="clipboard" text={counts.total === 0 ? 'You don’t have any tasks yet.' : 'Nothing due — you’re all caught up.'} actionLabel={counts.total === 0 ? 'Add your first task' : undefined} onAction={() => router.push(routes.taskCreate)} />
            ) : (
              <View style={styles.list}>
                {upcoming.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subjectName={catalog.subjectById.get(task.subjectId)?.name}
                    onPress={() => router.push(routes.taskDetail(task.id))}
                    onToggle={() => void completeTask(task.id, task.status !== 'completed').catch((e: unknown) => Alert.alert('Couldn’t update the task', messageOf(e)))}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.sideCol}>
          <View style={styles.section}>
            <SectionHeader title="Recent subjects" actionLabel="Browse" onAction={() => router.push(routes.quizFields)} />
            {quizLoading ? (
              <Skeleton height={140} rounded={radius.xxl} />
            ) : recentSubjects.length === 0 ? (
              <EmptyNote icon="book-open" text="Subjects you practise will show up here." />
            ) : (
              <Card padded={false} style={styles.listCard}>
                {recentSubjects.map((item, i) => (
                  <Pressable
                    key={item.subjectId}
                    accessibilityRole="button"
                    onPress={() => router.push(routes.quizLevels(item.subjectId))}
                    style={({ pressed }) => [styles.subjectRow, i > 0 && styles.divider, pressed && styles.pressed]}
                  >
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {item.subjectName}
                      </AppText>
                      <View style={styles.subjectMeta}>
                        {item.subjectCode ? <CodeChip code={item.subjectCode} /> : null}
                        <AppText variant="caption" color="textSecondary">{`Level ${item.level} of ${QUIZ.levelCount}`}</AppText>
                      </View>
                    </View>
                    <View style={styles.miniProgress}>
                      <ProgressBar value={item.progress} height={4} />
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Recent quiz attempts" actionLabel={quiz.results.length ? 'See all' : undefined} onAction={() => router.push(routes.quizHistory)} />
            {quizLoading ? (
              <Skeleton height={140} rounded={radius.xxl} />
            ) : quiz.results.length === 0 ? (
              <EmptyNote icon="clock" text="No quiz attempts yet." actionLabel="Start a quiz" onAction={() => router.push(routes.quizFields)} />
            ) : (
              <Card padded={false} style={styles.listCard}>
                {quiz.results.slice(0, 5).map((result, i) => (
                  <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
                ))}
              </Card>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function EmptyNote({ icon, text, actionLabel, onAction }: { icon: IconName; text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card tone="muted" style={styles.empty}>
      <Icon name={icon} size={18} color="textSecondary" />
      <AppText variant="body" color="textSecondary" style={styles.flex}>
        {text}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText variant="label" color="primaryDark">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

function QuickTile({
  icon,
  title,
  subtitle,
  tint,
  iconColor,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  tint: string;
  iconColor: 'primary' | 'accent';
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}, ${subtitle}`} style={styles.quickTile}>
      <View style={[styles.quickIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxxl },
  mainCol: { flex: 1.4, gap: spacing.xxl, minWidth: 0 },
  sideCol: { flex: 1, gap: spacing.xxl, minWidth: 280, maxWidth: 420 },
  section: { gap: spacing.md },
  list: { gap: spacing.sm + 2 },
  startCard: { padding: spacing.xl, gap: spacing.md },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickTile: { flex: 1, gap: spacing.md },
  quickIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  listCard: { overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  miniProgress: { width: 48 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
