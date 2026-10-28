import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  CodeChip,
  ErrorState,
  Icon,
  ProgressBar,
  Screen,
  Skeleton,
} from '@/components';
import { QUIZ_TYPES } from '@/constants/app';
import { routes } from '@/constants/routes';
import {
  useActiveSession,
  useProfile,
  useQuizHistory,
  useQuizStats,
  useRecentSubjects,
  useSubjectCatalog,
  useTaskActions,
  useTasks,
  useTaskSections,
} from '@/hooks';
import { colors, fonts, radius, spacing } from '@/theme';
import type { Task, TaskUrgency } from '@/types';
import { dueLabel, greetingFor, taskUrgency } from '@/utils/date';
import { firstNameOf } from '@/utils/format';

const urgencyColors: Record<TaskUrgency, { ring: string; bg: string; fg: 'errorText' | 'warningText' | 'textSubtle' | 'successText' }> = {
  overdue: { ring: colors.error, bg: colors.errorSurfaceStrong, fg: 'errorText' },
  dueSoon: { ring: colors.warning, bg: colors.warningSurfaceStrong, fg: 'warningText' },
  upcoming: { ring: colors.borderStrong, bg: colors.surfaceMuted, fg: 'textSubtle' },
  completed: { ring: colors.success, bg: colors.successSurfaceStrong, fg: 'successText' },
};

/** Pixel-aligned implementation of the 1440px Home board in the web mock. */
export function WebHomeScreen() {
  const { displayName } = useProfile();
  const quiz = useQuizHistory();
  const quizStats = useQuizStats();
  const mcStats = useQuizStats('multipleChoice');
  const tfStats = useQuizStats('trueFalse');
  const active = useActiveSession();
  const recentSubjects = useRecentSubjects(3);
  const tasks = useTasks();
  const { completeTask } = useTaskActions();
  const { groups, counts } = useTaskSections();
  const catalog = useSubjectCatalog();
  const recentTasks = [...groups.today, ...groups.upcoming].slice(0, 4);
  const firstName = firstNameOf(displayName || 'there');
  const activeSubject = active ? catalog.subjectById.get(active.subjectId) : undefined;
  const activeField = activeSubject ? catalog.fieldById.get(activeSubject.fieldId) : undefined;

  return (
    <Screen inTabs gap={28}>
      <View>
        <AppText style={styles.pageTitle}>{`${greetingFor()}, ${firstName} 👋`}</AppText>
        <AppText style={styles.pageSubtitle}>Ready to test your knowledge?</AppText>
      </View>

      <View style={styles.split}>
        {quiz.status === 'loading' ? (
          <View style={styles.continueCard}><Skeleton height={224} rounded={radius.xxl} /></View>
        ) : active ? (
          <Card tone="brand" style={styles.continueCard}>
            <View style={styles.continueTop}>
              <AppText variant="overline" color="onPrimaryMuted">{`Continue · ${QUIZ_TYPES[active.quizType].label}`}</AppText>
              <View style={styles.levelPill}>
                <AppText variant="captionStrong" color="onPrimary">{`Level ${active.level}`}</AppText>
              </View>
            </View>
            <View style={styles.continueInfo}>
              <AppText style={styles.continueTitle} color="onPrimary">{active.subjectName}</AppText>
              <View style={styles.continueMeta}>
                <AppText variant="code" color="onPrimaryMuted">{active.subjectCode}</AppText>
                {activeField ? <AppText variant="caption" color="onPrimaryMuted">{`· ${activeField.name}`}</AppText> : null}
              </View>
            </View>
            <View style={styles.continueBottom}>
              <View style={styles.progressBlock}>
                <View style={styles.progressLabels}>
                  <AppText variant="label" color="onPrimaryMuted">{`Question ${active.currentIndex + 1} / 10`}</AppText>
                  <AppText variant="label" color="onPrimaryMuted">{`${Math.round(((active.currentIndex + 1) / 10) * 100)}%`}</AppText>
                </View>
                <ProgressBar value={(active.currentIndex + 1) / 10} height={8} color={colors.onPrimary} trackColor={colors.onPrimaryTrack} />
              </View>
              <Button
                title="Continue"
                variant="inverse"
                rightIcon="arrow-right"
                fullWidth={false}
                onPress={() => router.push(routes.quizQuestions(active.subjectId, active.level, false, active.quizType))}
              />
            </View>
          </Card>
        ) : (
          <Card tone="brand" style={styles.continueCard}>
            <AppText variant="overline" color="onPrimaryMuted">Start learning</AppText>
            <AppText style={styles.continueTitle} color="onPrimary">Pick a subject and practise with 10 questions.</AppText>
            <Button title="Browse subjects" variant="inverse" rightIcon="arrow-right" fullWidth={false} onPress={() => router.push(routes.quizFields())} />
          </Card>
        )}

        <View style={styles.summary}>
          <AppText style={styles.sectionHeading}>Academic summary</AppText>
          <View style={styles.summaryGrid}>
            <SummaryTile label="Tasks due today" value={counts.dueToday} dot={colors.warning} onPress={() => router.navigate(routes.tasksTab)} />
            <SummaryTile label="Upcoming tasks" value={counts.upcoming} dot={colors.primary} onPress={() => router.navigate(routes.tasksTab)} />
            <SummaryTile label="Completed tasks" value={counts.completed} dot={colors.success} onPress={() => router.navigate(routes.tasksTab)} />
            <SummaryTile label="Multiple choice attempts" value={mcStats.attempts} dot={colors.primary} onPress={() => router.navigate(routes.quizTab)} />
            <SummaryTile label="Quiz attempts" value={tfStats.attempts} dot={colors.accent} onPress={() => router.navigate(routes.trueFalseTab)} />
            <SummaryTile label="Average score %" value={quizStats.average} dot={colors.success} onPress={() => router.push(routes.quizHistory)} />
          </View>
        </View>
      </View>

      <View style={styles.split}>
        <Card padded={false} style={styles.listPanel}>
          <View style={styles.panelHeader}>
            <AppText style={styles.sectionHeading}>Recent subjects</AppText>
            <Pressable onPress={() => router.push(routes.quizFields())} style={styles.panelLink}>
              <AppText variant="label" color="primaryDark">Browse subjects</AppText>
            </Pressable>
          </View>
          {quiz.status === 'error' ? (
            <ErrorState title="Couldn’t load subjects" message={quiz.error ?? undefined} onRetry={quiz.retry} />
          ) : recentSubjects.length ? (
            recentSubjects.map((subject) => (
              <Card
                key={`${subject.quizType}:${subject.subjectId}`}
                padded={false}
                onPress={() => router.push(routes.quizLevels(subject.subjectId, subject.quizType))}
                style={[styles.subjectRow, styles.rowBorder]}
              >
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{subject.subjectName}</AppText>
                  <View style={styles.subjectMeta}>
                    <CodeChip code={subject.subjectCode} />
                    <AppText variant="caption" color="textSecondary">{`${QUIZ_TYPES[subject.quizType].label} · Level ${subject.level} of 15`}</AppText>
                  </View>
                </View>
                <View style={styles.subjectProgress}><ProgressBar value={subject.progress} height={6} /></View>
                <Icon name="chevron-right" size={18} color="textDisabled" />
              </Card>
            ))
          ) : (
            <View style={styles.empty}><AppText color="textSecondary">Subjects you practise will show up here.</AppText></View>
          )}
        </Card>

        <Card padded={false} style={styles.listPanel}>
          <View style={styles.panelHeader}>
            <AppText style={styles.sectionHeading}>Recent tasks</AppText>
            <Pressable onPress={() => router.navigate(routes.tasksTab)} style={styles.panelLink}>
              <AppText variant="label" color="primaryDark">View all tasks</AppText>
            </Pressable>
          </View>
          {tasks.status === 'error' ? (
            <ErrorState title="Couldn’t load tasks" message={tasks.error ?? undefined} onRetry={tasks.retry} />
          ) : recentTasks.length ? (
            <View>
              {recentTasks.map((task) => (
                <RecentTaskRow
                  key={task.id}
                  task={task}
                  subjectName={catalog.subjectById.get(task.subjectId)?.name}
                  divider
                  onPress={() => router.push(routes.taskDetail(task.id))}
                  onToggle={() => void completeTask(task.id, task.status !== 'completed')}
                />
              ))}
            </View>
          ) : (
            <View style={styles.empty}><AppText color="textSecondary">No upcoming tasks.</AppText></View>
          )}
        </Card>
      </View>
    </Screen>
  );
}

function SummaryTile({ label, value, dot, onPress }: { label: string; value: number; dot: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.summaryTile, pressed && styles.pressed]}>
      <View style={styles.summaryLabel}>
        <View style={[styles.summaryDot, { backgroundColor: dot }]} />
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>{label}</AppText>
      </View>
      <AppText style={styles.summaryValue}>{value}</AppText>
    </Pressable>
  );
}

function RecentTaskRow({ task, subjectName, divider, onPress, onToggle }: { task: Task; subjectName?: string; divider: boolean; onPress: () => void; onToggle: () => void }) {
  const urgency = taskUrgency(task);
  const tone = urgencyColors[urgency];
  const done = task.status === 'completed';
  return (
    <View style={[styles.taskRow, divider && styles.rowBorder]}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={onToggle} style={styles.taskCheck}>
        <View style={[styles.taskRing, { borderColor: tone.ring }, done && styles.taskDone]}>
          {done ? <Icon name="check" size={11} color="onPrimary" /> : null}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.taskBody}>
        <AppText variant="bodyStrong" numberOfLines={1} style={done && styles.taskStrike}>{task.title}</AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>{subjectName ?? ' '}</AppText>
      </Pressable>
      <View style={[styles.duePill, { backgroundColor: tone.bg }]}>
        <AppText variant="tiny" color={tone.fg} numberOfLines={1}>{dueLabel(task)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  pageSubtitle: { marginTop: 6, fontSize: 16, color: colors.textSecondary },
  split: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'stretch' },
  continueCard: { flex: 1.45, minWidth: 0, minHeight: 224, padding: 28, gap: spacing.xl },
  continueTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  levelPill: { paddingVertical: 5, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.onPrimaryOverlay },
  continueInfo: { gap: 6 },
  continueMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  continueTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  continueBottom: { marginTop: 'auto', flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxl },
  progressBlock: { flex: 1, gap: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  summary: { flex: 1, minWidth: 0, gap: spacing.md },
  sectionHeading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  summaryGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryTile: { width: '30%', flexGrow: 1, minWidth: 150, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.card, padding: spacing.lg, gap: 10 },
  pressed: { opacity: 0.75 },
  summaryLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryValue: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  listPanel: { flex: 1, minWidth: 0, overflow: 'hidden' },
  panelHeader: { minHeight: 58, paddingHorizontal: spacing.xl, paddingTop: 18, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelLink: { minHeight: 32, justifyContent: 'center' },
  subjectRow: { minHeight: 75, paddingHorizontal: spacing.xl, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: 0, borderWidth: 0 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowText: { flex: 1, minWidth: 0 },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  subjectProgress: { width: 96 },
  taskRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: spacing.xl },
  taskCheck: { width: 20, height: 28, alignItems: 'center', justifyContent: 'center' },
  taskRing: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskDone: { backgroundColor: colors.success, borderColor: colors.success },
  taskBody: { flex: 1, minWidth: 0, gap: 3 },
  taskStrike: { textDecorationLine: 'line-through', color: colors.textSecondary },
  duePill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  empty: { padding: spacing.xl },
});
