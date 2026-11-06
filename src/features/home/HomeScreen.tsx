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
  IconButton,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatTile,
  TaskCard,
  type IconName,
} from '@/components';
import { QUIZ, QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import {
  useActiveSession,
  useNotifications,
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

export function HomeScreen() {
  const { displayName, status: profileStatus } = useProfile();
  const quiz = useQuizHistory();
  const tasks = useTasks();
  const { unreadCount } = useNotifications();
  const active = useActiveSession();
  const recentSubjects = useRecentSubjects(3);
  const { groups, counts } = useTaskSections();
  const catalog = useSubjectCatalog();
  const { completeTask } = useTaskActions();

  const quizLoading = quiz.status === 'loading';
  const tasksLoading = tasks.status === 'loading';
  const upcoming = [...groups.today, ...groups.upcoming].slice(0, 3);
  const firstName = displayName ? firstNameOf(displayName) : '';

  return (
    <Screen inTabs>
      <View style={styles.header}>
        <View style={styles.flex}>
          {profileStatus === 'loading' && !firstName ? (
            <Skeleton width={160} height={28} />
          ) : (
            <AppText variant="title" accessibilityRole="header">{`Hi, ${firstName || 'there'} 👋`}</AppText>
          )}
          <AppText variant="body" color="textSecondary">
            Ready to test your knowledge?
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="bell"
            accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            badge={unreadCount > 0}
            onPress={() => router.push(routes.notifications)}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate(routes.profileTab)} hitSlop={6}>
            <Avatar name={displayName || '?'} size={44} />
          </Pressable>
        </View>
      </View>

      {quizLoading ? (
        <Skeleton height={200} rounded={radius.xxl} />
      ) : active ? (
        <ContinueQuizCard session={active} onContinue={() => router.push(routes.quizQuestions(active.subjectId, active.level, false, active.quizType))} />
      ) : (
        <Card tone="brand" style={styles.startCard}>
          <AppText variant="overline" color="onPrimaryMuted">
            Start learning
          </AppText>
          <AppText variant="heading" color="onPrimary">
            Pick a subject and practise with 10 questions.
          </AppText>
          <Button title="Browse subjects" variant="inverse" size="md" rightIcon="arrow-right" onPress={() => router.push(routes.quizFields())} />
        </Card>
      )}

      <View style={styles.section}>
        <SectionHeader title="Quick access" />
        <View style={styles.quickRow}>
          <QuickTile icon="list" title="Multiple choice" subtitle="A–D questions" tint={colors.primarySurface} iconColor="primary" onPress={() => router.navigate(routes.quizTab)} />
          <QuickTile icon="toggle-right" title="Quiz" subtitle="True or false" tint={colors.accentSurface} iconColor="accent" onPress={() => router.navigate(routes.trueFalseTab)} />
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
          <>
            <StatGroup>
              <StatTile label="Due today" value={counts.dueToday} dot={colors.warning} onPress={() => router.navigate(routes.tasksTab)} />
              <StatTile label="Upcoming" value={counts.upcoming} dot={colors.primary} onPress={() => router.navigate(routes.tasksTab)} />
              <StatTile label="Completed" value={counts.completed} dot={colors.success} onPress={() => router.navigate(routes.tasksTab)} />
            </StatGroup>
            {counts.overdue > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${pluralise(counts.overdue, 'overdue task')}. Open tasks`}
                onPress={() => router.navigate(routes.tasksTab)}
                style={styles.overdue}
              >
                <Icon name="alert-circle" size={16} color="errorText" />
                <AppText variant="label" color="errorText" style={styles.flex}>
                  {`${pluralise(counts.overdue, 'task')} overdue`}
                </AppText>
                <Icon name="chevron-right" size={16} color="errorText" />
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Upcoming tasks" actionLabel="Add task" onAction={() => router.push(routes.taskCreate)} />
        {tasksLoading ? (
          <Skeleton height={96} rounded={radius.xxl} />
        ) : tasks.status === 'error' ? null : upcoming.length === 0 ? (
          <EmptyNote
            icon="clipboard"
            text={counts.total === 0 ? 'You don’t have any tasks yet.' : 'Nothing due — you’re all caught up.'}
            actionLabel={counts.total === 0 ? 'Add your first task' : undefined}
            onAction={() => router.push(routes.taskCreate)}
          />
        ) : (
          <View style={styles.list}>
            {upcoming.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subjectName={catalog.subjectById.get(task.subjectId)?.name}
                onPress={() => router.push(routes.taskDetail(task.id))}
                onToggle={() =>
                  void completeTask(task.id, task.status !== 'completed').catch((e: unknown) => Alert.alert('Couldn’t update the task', messageOf(e)))
                }
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent subjects" actionLabel="Browse" onAction={() => router.push(routes.quizFields())} />
        {quizLoading ? (
          <Skeleton height={140} rounded={radius.xxl} />
        ) : quiz.status === 'error' ? (
          <Card>
            <ErrorState title="Couldn’t load your quiz history" message={quiz.error ?? undefined} onRetry={quiz.retry} />
          </Card>
        ) : recentSubjects.length === 0 ? (
          <EmptyNote icon="book-open" text="Subjects you practise will show up here." />
        ) : (
          <Card padded={false} style={styles.listCard}>
            {recentSubjects.map((item, i) => (
              <Pressable
                key={`${item.quizType}:${item.subjectId}`}
                accessibilityRole="button"
                accessibilityLabel={`${QUIZ_TYPES[item.quizType].label}, ${item.subjectName}, ${item.subjectCode}, level ${item.level} of ${QUIZ.levelCount}`}
                onPress={() => router.push(routes.quizLevels(item.subjectId, item.quizType))}
                style={({ pressed }) => [styles.subjectRow, i > 0 && styles.divider, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.subjectName}
                  </AppText>
                  <View style={styles.subjectMeta}>
                    {item.subjectCode ? <CodeChip code={item.subjectCode} /> : null}
                    <AppText variant="caption" color="textSecondary">{`${QUIZ_TYPES[item.quizType].label} · Level ${item.level} of ${QUIZ.levelCount}`}</AppText>
                  </View>
                </View>
                <View style={styles.miniProgress}>
                  <ProgressBar value={item.progress} height={4} />
                </View>
                <Icon name="chevron-right" size={18} color="textDisabled" />
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent attempts" actionLabel={quiz.results.length ? 'See all' : undefined} onAction={() => router.push(routes.quizHistory)} />
        {quizLoading ? (
          <Skeleton height={140} rounded={radius.xxl} />
        ) : quiz.status === 'error' ? null : quiz.results.length === 0 ? (
          <EmptyNote icon="clock" text="No attempts yet." actionLabel="Start practising" onAction={() => router.push(routes.quizFields())} />
        ) : (
          <Card padded={false} style={styles.listCard}>
            {quiz.results.slice(0, 3).map((result, i) => (
              <AttemptRow key={result.id} result={result} divider={i > 0} onPress={() => router.push(routes.quizResult(result.id))} />
            ))}
          </Card>
        )}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { gap: spacing.md },
  list: { gap: spacing.sm + 2 },
  startCard: { padding: spacing.lg + 2, gap: spacing.md },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickTile: { flexGrow: 1, flexBasis: '45%', gap: spacing.md },
  quickIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  listCard: { overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  miniProgress: { width: 44 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
});
